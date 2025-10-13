-- ==========================================
-- RAG System: Update Embedding Dimensions
-- Change from 1024 (NV-Embed-v2) to 384 (BGE-small-en-v1.5)
-- ==========================================

-- Step 1: Drop existing function that uses old dimension
DROP FUNCTION IF EXISTS search_rag_embeddings(vector(1024), float, int);

-- Step 2: Recreate rag_embeddings table with correct dimension
DROP TABLE IF EXISTS rag_embeddings CASCADE;

CREATE TABLE rag_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
  embedding vector(384) NOT NULL, -- Changed from 1024 to 384
  model_name TEXT DEFAULT 'BAAI/bge-small-en-v1.5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create index for fast vector similarity search
CREATE INDEX idx_rag_embeddings_vector ON rag_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_rag_embeddings_chunk_id ON rag_embeddings(chunk_id);

-- Step 4: Recreate search function with new dimension
CREATE OR REPLACE FUNCTION search_rag_embeddings(
  query_embedding vector(384), -- Changed from 1024 to 384
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  file_id UUID,
  filename TEXT,
  file_type TEXT,
  content TEXT,
  similarity float,
  page_number INT,
  section_header TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    f.id AS file_id,
    f.filename,
    f.file_type,
    c.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    c.page_number,
    c.section_header,
    f.metadata
  FROM rag_embeddings e
  JOIN rag_chunks c ON c.id = e.chunk_id
  JOIN rag_files f ON f.id = c.file_id
  WHERE 1 - (e.embedding <=> query_embedding) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5: Update RLS policies (unchanged)
ALTER TABLE rag_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings"
  ON rag_embeddings FOR SELECT
  USING (
    chunk_id IN (
      SELECT c.id FROM rag_chunks c
      JOIN rag_files f ON f.id = c.file_id
      WHERE f.uploaded_by = current_user
    )
  );

CREATE POLICY "Users can create their own embeddings"
  ON rag_embeddings FOR INSERT
  WITH CHECK (
    chunk_id IN (
      SELECT c.id FROM rag_chunks c
      JOIN rag_files f ON f.id = c.file_id
      WHERE f.uploaded_by = current_user
    )
  );

CREATE POLICY "Users can delete their own embeddings"
  ON rag_embeddings FOR DELETE
  USING (
    chunk_id IN (
      SELECT c.id FROM rag_chunks c
      JOIN rag_files f ON f.id = c.file_id
      WHERE f.uploaded_by = current_user
    )
  );

-- Done! BGE-small-en-v1.5 (384 dimensions) is now configured

