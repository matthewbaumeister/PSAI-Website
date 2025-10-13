-- SBIR Quick Fix - Run directly in Supabase SQL Editor
-- Copy-paste each section ONE AT A TIME and click "Run"

-- =============================================
-- SECTION 1: Enable pg_trgm extension (RUN FIRST)
-- =============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Wait for success message, then continue to Section 2

-- =============================================
-- SECTION 2: Add title search index (MOST CRITICAL)
-- =============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_title_gin 
ON sbir_final USING gin (title gin_trgm_ops);

-- This may take 30-60 seconds. Wait for completion.

-- =============================================
-- SECTION 3: Add filter indexes
-- =============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_status 
ON sbir_final (status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_component 
ON sbir_final (component);

-- =============================================
-- SECTION 4: Verify indexes were created
-- =============================================
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'sbir_final' 
  AND indexname LIKE 'idx_sbir%';

-- You should see: idx_sbir_title_gin, idx_sbir_status, idx_sbir_component

-- =============================================
-- DONE! Your search should now be MUCH faster.
-- Test the search on your website.
-- =============================================

