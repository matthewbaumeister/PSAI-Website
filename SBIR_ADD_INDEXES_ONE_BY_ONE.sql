-- SBIR - Add Indexes ONE AT A TIME (Run each separately to avoid timeout)
-- Use CONCURRENTLY to avoid table locks

-- ============================================
-- STEP 1: Enable extension (run first)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- STEP 2: Add title index (run separately, wait 30-60 seconds)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_title_gin 
ON sbir_final USING gin (title gin_trgm_ops);

-- ============================================
-- STEP 3: Add keywords index (run separately, wait 30-60 seconds)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_keywords_gin 
ON sbir_final USING gin (keywords gin_trgm_ops);

-- ============================================
-- STEP 4: Add status index (run separately)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_status 
ON sbir_final (status);

-- ============================================
-- STEP 5: Add component index (run separately)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_component 
ON sbir_final (component);

-- ============================================
-- STEP 6: Add topic_number index (run separately)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_topic_number 
ON sbir_final (topic_number);

-- ============================================
-- STEP 7: Verify all indexes were created
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'sbir_final'
  AND indexname LIKE 'idx_sbir%'
ORDER BY indexname;

