-- SBIR - Add Search Indexes ONLY (Run this first to fix search timeout)
-- This is the CRITICAL fix for the immediate timeout issue

-- Enable trigram extension for pattern matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index on title (most important for search)
CREATE INDEX IF NOT EXISTS idx_sbir_title_gin 
ON sbir_final USING gin (title gin_trgm_ops);

-- Add GIN index on keywords  
CREATE INDEX IF NOT EXISTS idx_sbir_keywords_gin 
ON sbir_final USING gin (keywords gin_trgm_ops);

-- Add regular B-tree indexes for filters
CREATE INDEX IF NOT EXISTS idx_sbir_status ON sbir_final (status);
CREATE INDEX IF NOT EXISTS idx_sbir_component ON sbir_final (component);
CREATE INDEX IF NOT EXISTS idx_sbir_topic_number ON sbir_final (topic_number);

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'sbir_final'
  AND indexname LIKE 'idx_sbir%'
ORDER BY indexname;

