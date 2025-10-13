-- ====================================================================
-- RAG SYSTEM DATABASE SCHEMA
-- Purpose: Vector search for capabilities documents → SBIR matching
-- Date: October 13, 2025
-- ====================================================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create files table (stores uploaded documents)
CREATE TABLE IF NOT EXISTS rag_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'txt', 'docx', 'paste'
    original_text TEXT, -- Full original text
    file_size INTEGER, -- Size in bytes
    page_count INTEGER, -- For PDFs
    uploaded_by TEXT NOT NULL, -- Admin user email
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB, -- Custom tags, customer name, etc.
    status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'error'
    error_message TEXT,
    
    -- Indexes
    CONSTRAINT valid_file_type CHECK (file_type IN ('pdf', 'txt', 'docx', 'paste')),
    CONSTRAINT valid_status CHECK (status IN ('processing', 'ready', 'error'))
);

CREATE INDEX idx_rag_files_uploaded_by ON rag_files(uploaded_by);
CREATE INDEX idx_rag_files_status ON rag_files(status);
CREATE INDEX idx_rag_files_uploaded_at ON rag_files(uploaded_at DESC);
CREATE INDEX idx_rag_files_metadata ON rag_files USING GIN (metadata);

-- Step 3: Create chunks table (text segments for embedding)
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES rag_files(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL, -- Order within the file
    content TEXT NOT NULL,
    token_count INTEGER,
    page_number INTEGER, -- For PDFs
    section_header TEXT, -- If detected
    metadata JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique chunks per file
    UNIQUE(file_id, chunk_index)
);

CREATE INDEX idx_rag_chunks_file_id ON rag_chunks(file_id);
CREATE INDEX idx_rag_chunks_page_number ON rag_chunks(page_number);

-- Step 4: Create embeddings table (vector representations)
CREATE TABLE IF NOT EXISTS rag_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
    embedding vector(1024), -- NV-Embed-v2 uses 1024 dimensions
    model_name TEXT DEFAULT 'nvidia/NV-Embed-v2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one embedding per chunk
    UNIQUE(chunk_id)
);

-- Create HNSW index for fast vector similarity search
-- This is the magic that makes semantic search fast!
CREATE INDEX idx_rag_embeddings_vector ON rag_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Additional index for chunk_id lookups
CREATE INDEX idx_rag_embeddings_chunk_id ON rag_embeddings(chunk_id);

-- Step 5: Create search history table (analytics)
CREATE TABLE IF NOT EXISTS rag_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT,
    query_file_id UUID REFERENCES rag_files(id) ON DELETE SET NULL,
    search_type TEXT NOT NULL, -- 'text', 'document'
    filters JSONB,
    results_count INTEGER,
    top_result_ids UUID[],
    searched_by TEXT NOT NULL,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER,
    
    CONSTRAINT valid_search_type CHECK (search_type IN ('text', 'document'))
);

CREATE INDEX idx_rag_search_history_searched_by ON rag_search_history(searched_by);
CREATE INDEX idx_rag_search_history_searched_at ON rag_search_history(searched_at DESC);

-- Step 6: Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_rag_embeddings(
    query_embedding vector(1024),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 100
)
RETURNS TABLE (
    chunk_id uuid,
    file_id uuid,
    content text,
    similarity float,
    page_number int,
    filename text,
    file_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS chunk_id,
        c.file_id,
        c.content,
        1 - (e.embedding <=> query_embedding) AS similarity,
        c.page_number,
        f.filename,
        f.file_type
    FROM rag_embeddings e
    JOIN rag_chunks c ON e.chunk_id = c.id
    JOIN rag_files f ON c.file_id = f.id
    WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Step 7: Create RLS (Row Level Security) policies for admin access
ALTER TABLE rag_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_search_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "Service role has full access to rag_files" ON rag_files
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to rag_chunks" ON rag_chunks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to rag_embeddings" ON rag_embeddings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to rag_search_history" ON rag_search_history
    FOR ALL USING (auth.role() = 'service_role');

-- Step 8: Create summary stats view
CREATE OR REPLACE VIEW rag_system_stats AS
SELECT 
    (SELECT COUNT(*) FROM rag_files WHERE status = 'ready') as total_files,
    (SELECT COUNT(*) FROM rag_chunks) as total_chunks,
    (SELECT COUNT(*) FROM rag_embeddings) as total_embeddings,
    (SELECT COUNT(*) FROM rag_search_history WHERE searched_at > NOW() - INTERVAL '7 days') as searches_last_7_days,
    (SELECT AVG(response_time_ms) FROM rag_search_history WHERE searched_at > NOW() - INTERVAL '7 days') as avg_response_time_ms;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('rag_files', 'rag_chunks', 'rag_embeddings', 'rag_search_history')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename LIKE 'rag_%'
ORDER BY tablename, indexname;

-- System stats (will be empty initially)
SELECT * FROM rag_system_stats;

