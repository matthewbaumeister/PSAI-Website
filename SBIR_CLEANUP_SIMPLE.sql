-- SBIR Data Cleanup - Run directly in Supabase SQL Editor
-- Copy-paste each section ONE AT A TIME

-- =============================================
-- STEP 0: Set longer timeout (RUN THIS FIRST)
-- =============================================
-- Set timeout for current session to 10 minutes
SET statement_timeout = '10min';

-- OR increase timeout for postgres role permanently:
-- ALTER ROLE postgres SET statement_timeout = '10min';
-- NOTIFY pgrst, 'reload config';

-- =============================================
-- CLEANUP 1: Delete invalid records (empty topic_number)
-- =============================================
DELETE FROM sbir_final
WHERE topic_number IS NULL OR topic_number = '';

-- Shows how many rows deleted

-- =============================================
-- CLEANUP 2: Delete records with bad titles
-- =============================================
DELETE FROM sbir_final
WHERE title IS NULL OR title = '' OR LENGTH(title) < 5;

-- =============================================
-- CLEANUP 3: Standardize status values
-- =============================================
UPDATE sbir_final 
SET status = CASE 
    WHEN LOWER(TRIM(status)) IN ('open', 'active', 'current') THEN 'Open'
    WHEN LOWER(TRIM(status)) IN ('closed', 'expired', 'ended') THEN 'Closed'
    WHEN LOWER(TRIM(status)) IN ('pre-release', 'prerelease') THEN 'Pre-Release'
    ELSE status
END
WHERE status IS NOT NULL;

-- =============================================
-- CLEANUP 4: Standardize component names
-- =============================================
UPDATE sbir_final 
SET component = CASE 
    WHEN component IN ('AF', 'USAF', 'AIR FORCE') THEN 'Air Force'
    WHEN component IN ('ARMY', 'US Army') THEN 'Army'
    WHEN component IN ('NAVY', 'USN', 'US Navy') THEN 'Navy'
    WHEN component = 'USSF' THEN 'Space Force'
    WHEN component = 'MDA' THEN 'Missile Defense Agency'
    ELSE component
END
WHERE component IS NOT NULL;

-- =============================================
-- CLEANUP 5: Check results
-- =============================================
SELECT 
    'Total Records' as metric,
    COUNT(*) as count
FROM sbir_final
UNION ALL
SELECT 
    'Open Status',
    COUNT(*)
FROM sbir_final
WHERE status = 'Open'
UNION ALL
SELECT 
    'Closed Status',
    COUNT(*)
FROM sbir_final
WHERE status = 'Closed'
UNION ALL
SELECT 
    'Pre-Release Status',
    COUNT(*)
FROM sbir_final
WHERE status = 'Pre-Release';

-- =============================================
-- DONE! Data is now cleaner.
-- =============================================

