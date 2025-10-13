-- SBIR Data Cleanup - Step by Step (Run each section separately)
-- This version breaks cleanup into small steps to avoid timeouts

-- ============================================
-- STEP 1A: Delete records with no topic_number (run first)
-- ============================================
DELETE FROM sbir_final
WHERE topic_number IS NULL OR topic_number = '';
-- Expected: Removes invalid entries

-- ============================================
-- STEP 1B: Delete records with very short titles
-- ============================================
DELETE FROM sbir_final
WHERE title IS NULL OR title = '' OR LENGTH(title) < 5;
-- Expected: Removes corrupted titles

-- ============================================
-- STEP 2A: Trim topic_number and title (run separately)
-- ============================================
UPDATE sbir_final 
SET topic_number = TRIM(topic_number),
    title = TRIM(title)
WHERE topic_number IS NOT NULL;
-- Expected: Cleans whitespace

-- ============================================
-- STEP 2B: Trim other text fields
-- ============================================
UPDATE sbir_final 
SET description = TRIM(description),
    keywords = TRIM(keywords),
    status = TRIM(status)
WHERE description IS NOT NULL;
-- Expected: Cleans more whitespace

-- ============================================
-- STEP 3: Standardize status values
-- ============================================
UPDATE sbir_final 
SET status = CASE 
    WHEN LOWER(status) IN ('open', 'active', 'current', 'available') THEN 'Open'
    WHEN LOWER(status) IN ('closed', 'expired', 'ended', 'complete', 'completed') THEN 'Closed'
    WHEN LOWER(status) IN ('pre-release', 'prerelease', 'pre release', 'upcoming', 'pending') THEN 'Pre-Release'
    ELSE status
END
WHERE status IS NOT NULL;
-- Expected: Standardizes status field

-- ============================================
-- STEP 4: Fix missing open_date_ts
-- ============================================
UPDATE sbir_final
SET open_date_ts = TO_TIMESTAMP(open_date, 'MM/DD/YYYY')
WHERE open_date IS NOT NULL 
  AND open_date_ts IS NULL
  AND open_date ~ '^\d{2}/\d{2}/\d{4}$';
-- Expected: Regenerates timestamps

-- ============================================
-- STEP 5: Fix missing close_date_ts
-- ============================================
UPDATE sbir_final
SET close_date_ts = TO_TIMESTAMP(close_date || ' 23:59:59', 'MM/DD/YYYY HH24:MI:SS')
WHERE close_date IS NOT NULL 
  AND close_date_ts IS NULL
  AND close_date ~ '^\d{2}/\d{2}/\d{4}$';
-- Expected: Regenerates close timestamps

-- ============================================
-- STEP 6: Show cleanup summary
-- ============================================
SELECT 
    'Total Records' as metric,
    COUNT(*) as count
FROM sbir_final
UNION ALL
SELECT 
    'Has Topic Number',
    COUNT(*)
FROM sbir_final
WHERE topic_number IS NOT NULL AND topic_number != ''
UNION ALL
SELECT 
    'Has Valid Title',
    COUNT(*)
FROM sbir_final
WHERE title IS NOT NULL AND LENGTH(title) >= 10
UNION ALL
SELECT 
    'Standardized Status',
    COUNT(*)
FROM sbir_final
WHERE status IN ('Open', 'Closed', 'Pre-Release', 'Active')
UNION ALL
SELECT 
    'Has Timestamps',
    COUNT(*)
FROM sbir_final
WHERE open_date_ts IS NOT NULL AND close_date_ts IS NOT NULL;

