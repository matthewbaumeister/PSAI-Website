-- SBIR Complete Database Fix - Run via Supabase CLI (no timeout)
-- This combines data cleanup + index creation in one script

-- ============================================
-- SET LONGER TIMEOUT
-- ============================================
-- Increase timeout to 10 minutes for long-running operations
SET statement_timeout = '10min';

-- ============================================
-- PART 1: DATA CLEANUP
-- ============================================

BEGIN;

-- Step 1: Delete completely invalid records
DELETE FROM sbir_final
WHERE (topic_number IS NULL OR topic_number = '')
  OR (title IS NULL OR title = '' OR LENGTH(title) < 5);

-- Step 2: Trim all text fields
UPDATE sbir_final 
SET 
    topic_number = TRIM(topic_number),
    title = TRIM(title),
    description = TRIM(description),
    keywords = TRIM(keywords),
    status = TRIM(status),
    component = TRIM(component),
    program_type = TRIM(program_type)
WHERE topic_number IS NOT NULL;

-- Step 3: Remove extra whitespace
UPDATE sbir_final SET
    title = REGEXP_REPLACE(title, '\s+', ' ', 'g'),
    description = REGEXP_REPLACE(description, '\s+', ' ', 'g')
WHERE topic_number IS NOT NULL;

-- Step 4: Standardize status values
UPDATE sbir_final 
SET status = CASE 
    WHEN LOWER(status) IN ('open', 'active', 'current', 'available') THEN 'Open'
    WHEN LOWER(status) IN ('closed', 'expired', 'ended', 'complete', 'completed') THEN 'Closed'
    WHEN LOWER(status) IN ('pre-release', 'prerelease', 'pre release', 'upcoming', 'pending') THEN 'Pre-Release'
    ELSE INITCAP(status)
END
WHERE status IS NOT NULL;

-- Step 5: Fix date timestamps
UPDATE sbir_final
SET open_date_ts = TO_TIMESTAMP(open_date, 'MM/DD/YYYY')
WHERE open_date IS NOT NULL 
  AND open_date_ts IS NULL
  AND open_date ~ '^\d{2}/\d{2}/\d{4}$';

UPDATE sbir_final
SET close_date_ts = TO_TIMESTAMP(close_date || ' 23:59:59', 'MM/DD/YYYY HH24:MI:SS')
WHERE close_date IS NOT NULL 
  AND close_date_ts IS NULL
  AND close_date ~ '^\d{2}/\d{2}/\d{4}$';

-- Step 6: Fix swapped dates
UPDATE sbir_final
SET 
    open_date_ts = close_date_ts,
    close_date_ts = open_date_ts,
    open_date = close_date,
    close_date = open_date
WHERE open_date_ts IS NOT NULL 
  AND close_date_ts IS NOT NULL
  AND open_date_ts > close_date_ts;

-- Step 7: Standardize component names
UPDATE sbir_final SET component = 'Air Force' WHERE component IN ('AF', 'USAF', 'AIR FORCE', 'Air Force');
UPDATE sbir_final SET component = 'Army' WHERE component IN ('Army', 'ARMY', 'US Army');
UPDATE sbir_final SET component = 'Navy' WHERE component IN ('Navy', 'NAVY', 'USN', 'US Navy');
UPDATE sbir_final SET component = 'Space Force' WHERE component IN ('USSF', 'SPACE FORCE', 'Space Force');
UPDATE sbir_final SET component = 'Missile Defense Agency' WHERE component IN ('MDA', 'Missile Defense Agency');
UPDATE sbir_final SET component = 'SOCOM' WHERE component IN ('SOCOM', 'Special Operations Command');
UPDATE sbir_final SET component = 'DLA' WHERE component IN ('DLA', 'Defense Logistics Agency');
UPDATE sbir_final SET component = 'OSD' WHERE component IN ('OSD', 'Office of the Secretary of Defense');

-- Step 8: Remove duplicates (keep most recent)
DELETE FROM sbir_final a
USING (
    SELECT 
        topic_number,
        cycle_name,
        MAX(modified_date) as max_modified,
        MAX(id) as max_id
    FROM sbir_final
    WHERE topic_number IS NOT NULL AND topic_number != ''
    GROUP BY topic_number, cycle_name
    HAVING COUNT(*) > 1
) b
WHERE a.topic_number = b.topic_number
  AND a.cycle_name = b.cycle_name
  AND (a.modified_date < b.max_modified OR (a.modified_date = b.max_modified AND a.id < b.max_id));

-- Step 9: Generate keywords if missing
UPDATE sbir_final
SET keywords = (
    SELECT STRING_AGG(DISTINCT word, ', ')
    FROM (
        SELECT LOWER(REGEXP_REPLACE(word, '[^a-zA-Z0-9-]', '', 'g')) as word
        FROM UNNEST(STRING_TO_ARRAY(title || ' ' || LEFT(description, 300), ' ')) as word
        WHERE LENGTH(word) > 4
          AND word !~* '^(the|and|with|for|that|this|from|have|will|would|could|should|about|their|there|when|where|what|which)$'
        LIMIT 20
    ) words
    WHERE LENGTH(word) > 0
)
WHERE (keywords IS NULL OR keywords = '' OR LENGTH(keywords) < 10)
  AND title IS NOT NULL
  AND description IS NOT NULL;

COMMIT;

-- Show cleanup summary
SELECT 
    'Data Cleanup Complete' as status,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'Open') as open_records,
    COUNT(*) FILTER (WHERE status = 'Closed') as closed_records,
    COUNT(*) FILTER (WHERE status = 'Pre-Release') as prerelease_records
FROM sbir_final;

-- ============================================
-- PART 2: ADD INDEXES
-- ============================================

-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for text search (these are critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_title_gin 
ON sbir_final USING gin (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_keywords_gin 
ON sbir_final USING gin (keywords gin_trgm_ops);

-- Add B-tree indexes for exact match filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_topic_number 
ON sbir_final (topic_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_status 
ON sbir_final (status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_component 
ON sbir_final (component);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_program_type 
ON sbir_final (program_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_modified_date 
ON sbir_final (modified_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_close_date_ts 
ON sbir_final (close_date_ts DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_open_date_ts 
ON sbir_final (open_date_ts DESC NULLS LAST);

-- Composite index for common filter combination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sbir_status_component 
ON sbir_final (status, component);

-- Show index creation summary
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'sbir_final'
  AND indexname LIKE 'idx_sbir%'
ORDER BY indexname;

-- Final summary
SELECT 
    'Database Optimization Complete' as status,
    (SELECT COUNT(*) FROM sbir_final) as total_records,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'sbir_final' AND indexname LIKE 'idx_sbir%') as total_indexes;

