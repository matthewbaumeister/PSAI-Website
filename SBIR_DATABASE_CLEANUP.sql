-- ====================================================================
-- SBIR Database Cleanup Script
-- Purpose: Remove corrupted entries and add proper date sorting
-- Date: October 10, 2025
-- ====================================================================

-- Step 1: Identify and DELETE corrupted entries
-- These are entries without valid topic numbers or with HTML/CSS fragments

BEGIN;

-- Count corrupted entries before deletion
SELECT 
    COUNT(*) as total_corrupted_entries
FROM sbir_final
WHERE 
    topic_number IS NULL 
    OR topic_number = ''
    OR topic_number LIKE '%mso-%'
    OR topic_number LIKE '%style%'
    OR topic_number LIKE '%font%'
    OR topic_number LIKE '%Q3 %'
    OR topic_number LIKE '%li%'
    OR topic_id IS NULL
    OR topic_id = ''
    OR title LIKE '%mso-%'
    OR title LIKE '%stylemargin%'
    OR title LIKE '%font-family%';

-- DELETE corrupted entries
DELETE FROM sbir_final
WHERE 
    topic_number IS NULL 
    OR topic_number = ''
    OR topic_number LIKE '%mso-%'
    OR topic_number LIKE '%style%'
    OR topic_number LIKE '%font%'
    OR topic_number LIKE '%Q3 %'
    OR topic_number LIKE '%li%'
    OR topic_id IS NULL
    OR topic_id = ''
    OR title LIKE '%mso-%'
    OR title LIKE '%stylemargin%'
    OR title LIKE '%font-family%';

-- Step 2: Add timestamp columns for proper date sorting
ALTER TABLE sbir_final 
ADD COLUMN IF NOT EXISTS close_date_ts TIMESTAMP,
ADD COLUMN IF NOT EXISTS open_date_ts TIMESTAMP;

-- Step 3: Populate timestamp columns by parsing MM/DD/YYYY strings
-- Note: MM/DD/YYYY format (American) converts to YYYY-MM-DD for PostgreSQL

UPDATE sbir_final
SET close_date_ts = TO_TIMESTAMP(close_date, 'MM/DD/YYYY')
WHERE close_date IS NOT NULL 
  AND close_date != '' 
  AND close_date != 'N/A'
  AND close_date ~ '^\d{2}/\d{2}/\d{4}$';

UPDATE sbir_final
SET open_date_ts = TO_TIMESTAMP(open_date, 'MM/DD/YYYY')
WHERE open_date IS NOT NULL 
  AND open_date != '' 
  AND open_date != 'N/A'
  AND open_date ~ '^\d{2}/\d{2}/\d{4}$';

-- Step 4: Create indexes for faster sorting
CREATE INDEX IF NOT EXISTS idx_close_date_ts ON sbir_final(close_date_ts DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_open_date_ts ON sbir_final(open_date_ts DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_topic_number ON sbir_final(topic_number);
CREATE INDEX IF NOT EXISTS idx_component ON sbir_final(component);
CREATE INDEX IF NOT EXISTS idx_status ON sbir_final(status);

-- Step 5: Show cleanup summary
SELECT 
    COUNT(*) as total_valid_entries,
    COUNT(CASE WHEN close_date_ts IS NOT NULL THEN 1 END) as entries_with_close_date,
    COUNT(CASE WHEN open_date_ts IS NOT NULL THEN 1 END) as entries_with_open_date,
    MAX(close_date_ts) as most_recent_close_date,
    MIN(close_date_ts) as oldest_close_date
FROM sbir_final;

COMMIT;

-- ====================================================================
-- Verification Queries
-- ====================================================================

-- Check for any remaining invalid entries
SELECT COUNT(*) as remaining_invalid_entries
FROM sbir_final
WHERE topic_number IS NULL OR topic_number = '' OR LENGTH(topic_number) > 20;

-- Show date range
SELECT 
    MIN(close_date_ts) as earliest_close_date,
    MAX(close_date_ts) as latest_close_date,
    COUNT(*) as total_records
FROM sbir_final
WHERE close_date_ts IS NOT NULL;

-- Show topics closing in the future (still open)
SELECT 
    topic_number,
    title,
    status,
    close_date,
    close_date_ts
FROM sbir_final
WHERE close_date_ts > NOW()
ORDER BY close_date_ts ASC
LIMIT 20;

