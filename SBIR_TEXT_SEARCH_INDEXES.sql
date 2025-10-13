-- Add text search indexes to SBIR database for fast keyword search
-- These GIN indexes will dramatically speed up ILIKE queries

-- Create GIN indexes for pattern matching on text columns
-- GIN (Generalized Inverted Index) is optimized for full-text search

-- Index for title searches
CREATE INDEX IF NOT EXISTS idx_sbir_title_gin 
ON sbir_final USING gin (title gin_trgm_ops);

-- Index for keywords searches  
CREATE INDEX IF NOT EXISTS idx_sbir_keywords_gin 
ON sbir_final USING gin (keywords gin_trgm_ops);

-- Index for topic_number (regular B-tree for exact matches)
CREATE INDEX IF NOT EXISTS idx_sbir_topic_number 
ON sbir_final (topic_number);

-- Index for status (for filtering)
CREATE INDEX IF NOT EXISTS idx_sbir_status 
ON sbir_final (status);

-- Index for component (for filtering)
CREATE INDEX IF NOT EXISTS idx_sbir_component 
ON sbir_final (component);

-- Index for program_type (for filtering)
CREATE INDEX IF NOT EXISTS idx_sbir_program_type 
ON sbir_final (program_type);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_sbir_status_component 
ON sbir_final (status, component);

-- Note: These indexes require the pg_trgm extension
-- The extension should already be enabled, but if not, run:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'sbir_final'
ORDER BY indexname;

