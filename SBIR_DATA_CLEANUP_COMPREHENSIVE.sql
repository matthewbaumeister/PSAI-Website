-- SBIR Comprehensive Data Cleanup Script
-- Run after SBIR_DATA_QUALITY_CHECK.sql to identify issues
-- This script will clean and standardize all data

-- ============================================
-- STEP 1: DELETE COMPLETELY INVALID RECORDS
-- ============================================

-- Delete records with missing critical fields
DELETE FROM sbir_final
WHERE (topic_number IS NULL OR topic_number = '')
  AND (title IS NULL OR title = '' OR LENGTH(title) < 5)
  AND (description IS NULL OR description = '' OR LENGTH(description) < 20);

-- Log deletion count
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % completely invalid records', deleted_count;
END $$;

-- ============================================
-- STEP 2: CLEAN AND STANDARDIZE TEXT FIELDS
-- ============================================

-- Trim whitespace from all text fields
UPDATE sbir_final SET
    topic_number = TRIM(topic_number),
    title = TRIM(title),
    description = TRIM(description),
    keywords = TRIM(keywords),
    status = TRIM(status),
    component = TRIM(component),
    program_type = TRIM(program_type)
WHERE topic_number IS NOT NULL;

-- Remove extra whitespace within text (multiple spaces -> single space)
UPDATE sbir_final SET
    title = REGEXP_REPLACE(title, '\s+', ' ', 'g'),
    description = REGEXP_REPLACE(description, '\s+', ' ', 'g'),
    keywords = REGEXP_REPLACE(keywords, '\s+', ' ', 'g')
WHERE topic_number IS NOT NULL;

-- ============================================
-- STEP 3: STANDARDIZE STATUS VALUES
-- ============================================

-- Standardize status capitalization
UPDATE sbir_final 
SET status = INITCAP(status)
WHERE status IS NOT NULL AND status NOT IN ('Open', 'Closed', 'Pre-Release', 'Active');

-- Fix common status misspellings
UPDATE sbir_final 
SET status = 'Open'
WHERE LOWER(status) IN ('open', 'active', 'current', 'available');

UPDATE sbir_final 
SET status = 'Closed'
WHERE LOWER(status) IN ('closed', 'expired', 'ended', 'complete', 'completed');

UPDATE sbir_final 
SET status = 'Pre-Release'
WHERE LOWER(status) IN ('pre-release', 'prerelease', 'pre release', 'upcoming', 'pending');

-- ============================================
-- STEP 4: FIX DATE AND TIMESTAMP ISSUES
-- ============================================

-- Regenerate missing timestamp fields from date strings
UPDATE sbir_final
SET open_date_ts = (open_date || ' 00:00:00')::timestamp
WHERE open_date IS NOT NULL 
  AND open_date_ts IS NULL
  AND open_date ~ '^\d{2}/\d{2}/\d{4}$';

UPDATE sbir_final
SET close_date_ts = (close_date || ' 23:59:59')::timestamp
WHERE close_date IS NOT NULL 
  AND close_date_ts IS NULL
  AND close_date ~ '^\d{2}/\d{2}/\d{4}$';

-- Fix swapped dates (open_date after close_date)
UPDATE sbir_final
SET 
    open_date_ts = close_date_ts,
    close_date_ts = open_date_ts,
    open_date = close_date,
    close_date = open_date
WHERE open_date_ts > close_date_ts;

-- ============================================
-- STEP 5: REMOVE DUPLICATE ENTRIES
-- ============================================

-- Keep only the most recent version of duplicate topic_number + cycle_name
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

-- ============================================
-- STEP 6: CLEAN COMPONENT NAMES
-- ============================================

-- Standardize component abbreviations
UPDATE sbir_final SET component = 'Air Force' WHERE component IN ('AF', 'USAF', 'Air Force', 'AIR FORCE');
UPDATE sbir_final SET component = 'Army' WHERE component IN ('Army', 'ARMY', 'US Army');
UPDATE sbir_final SET component = 'Navy' WHERE component IN ('Navy', 'NAVY', 'USN', 'US Navy');
UPDATE sbir_final SET component = 'Space Force' WHERE component IN ('USSF', 'Space Force', 'SPACE FORCE');
UPDATE sbir_final SET component = 'Missile Defense Agency' WHERE component IN ('MDA', 'Missile Defense Agency');
UPDATE sbir_final SET component = 'SOCOM' WHERE component IN ('SOCOM', 'Special Operations Command');
UPDATE sbir_final SET component = 'DLA' WHERE component IN ('DLA', 'Defense Logistics Agency');
UPDATE sbir_final SET component = 'OSD' WHERE component IN ('OSD', 'Office of the Secretary of Defense');

-- ============================================
-- STEP 7: GENERATE KEYWORDS IF MISSING
-- ============================================

-- Extract keywords from title and description for records missing keywords
UPDATE sbir_final
SET keywords = (
    SELECT STRING_AGG(DISTINCT word, ', ')
    FROM (
        SELECT LOWER(REGEXP_REPLACE(word, '[^a-zA-Z0-9-]', '', 'g')) as word
        FROM UNNEST(STRING_TO_ARRAY(title || ' ' || LEFT(description, 500), ' ')) as word
        WHERE LENGTH(word) > 4
          AND word !~* '^(the|and|with|for|that|this|from|have|will|would|could|should|about|their|there|when|where|what|which)$'
    ) words
    WHERE LENGTH(word) > 0
)
WHERE (keywords IS NULL OR keywords = '')
  AND title IS NOT NULL
  AND description IS NOT NULL;

-- ============================================
-- STEP 8: VALIDATE AND LOG RESULTS
-- ============================================

-- Show cleanup summary
SELECT 
    'Cleanup Summary' as report,
    (SELECT COUNT(*) FROM sbir_final) as total_records,
    (SELECT COUNT(*) FROM sbir_final WHERE topic_number IS NOT NULL AND topic_number != '') as valid_topic_numbers,
    (SELECT COUNT(*) FROM sbir_final WHERE title IS NOT NULL AND title != '') as valid_titles,
    (SELECT COUNT(*) FROM sbir_final WHERE description IS NOT NULL AND description != '') as valid_descriptions,
    (SELECT COUNT(*) FROM sbir_final WHERE keywords IS NOT NULL AND keywords != '') as has_keywords,
    (SELECT COUNT(*) FROM sbir_final WHERE status IN ('Open', 'Closed', 'Pre-Release')) as standardized_status,
    (SELECT COUNT(*) FROM sbir_final WHERE open_date_ts < close_date_ts) as valid_date_ranges;

-- Show remaining issues (if any)
SELECT 
    'Remaining Issues' as report_type,
    COUNT(*) as count,
    'Records still missing topic_number' as description
FROM sbir_final
WHERE topic_number IS NULL OR topic_number = ''
UNION ALL
SELECT 
    'Remaining Issues',
    COUNT(*),
    'Records with invalid dates'
FROM sbir_final
WHERE open_date_ts >= close_date_ts
UNION ALL
SELECT 
    'Remaining Issues',
    COUNT(*),
    'Records with non-standard status'
FROM sbir_final
WHERE status NOT IN ('Open', 'Closed', 'Pre-Release', 'Active');

-- Create a view for "clean" records only
CREATE OR REPLACE VIEW sbir_clean AS
SELECT * FROM sbir_final
WHERE topic_number IS NOT NULL 
  AND topic_number != ''
  AND title IS NOT NULL 
  AND title != ''
  AND LENGTH(title) >= 10
  AND description IS NOT NULL
  AND description != ''
  AND status IN ('Open', 'Closed', 'Pre-Release', 'Active')
  AND (open_date_ts IS NULL OR close_date_ts IS NULL OR open_date_ts < close_date_ts);

-- Show final clean record count
SELECT 
    'Final Clean Records' as summary,
    COUNT(*) as count
FROM sbir_clean;

