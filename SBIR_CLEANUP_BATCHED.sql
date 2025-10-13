-- SBIR Data Cleanup - BATCHED VERSION (Avoids Upstream Timeout)
-- Run each section separately in Supabase SQL Editor

-- =============================================
-- CLEANUP 1: Delete invalid records (FAST)
-- =============================================
DELETE FROM sbir_final
WHERE topic_number IS NULL OR topic_number = '';

-- =============================================
-- CLEANUP 2: Delete bad titles (FAST)
-- =============================================
DELETE FROM sbir_final
WHERE title IS NULL OR title = '' OR LENGTH(title) < 5;

-- =============================================
-- CLEANUP 3A: Standardize Air Force component
-- =============================================
UPDATE sbir_final 
SET component = 'Air Force'
WHERE component IN ('AF', 'USAF', 'AIR FORCE')
  AND component != 'Air Force';

-- =============================================
-- CLEANUP 3B: Standardize Army component
-- =============================================
UPDATE sbir_final 
SET component = 'Army'
WHERE component IN ('ARMY', 'US Army')
  AND component != 'Army';

-- =============================================
-- CLEANUP 3C: Standardize Navy component
-- =============================================
UPDATE sbir_final 
SET component = 'Navy'
WHERE component IN ('NAVY', 'USN', 'US Navy')
  AND component != 'Navy';

-- =============================================
-- CLEANUP 3D: Standardize Space Force component
-- =============================================
UPDATE sbir_final 
SET component = 'Space Force'
WHERE component = 'USSF'
  AND component != 'Space Force';

-- =============================================
-- CLEANUP 3E: Standardize MDA component
-- =============================================
UPDATE sbir_final 
SET component = 'Missile Defense Agency'
WHERE component = 'MDA'
  AND component != 'Missile Defense Agency';

-- =============================================
-- CLEANUP 4A: Standardize 'Open' status
-- =============================================
UPDATE sbir_final 
SET status = 'Open'
WHERE LOWER(TRIM(status)) IN ('open', 'active', 'current')
  AND status != 'Open';

-- =============================================
-- CLEANUP 4B: Standardize 'Closed' status
-- =============================================
UPDATE sbir_final 
SET status = 'Closed'
WHERE LOWER(TRIM(status)) IN ('closed', 'expired', 'ended')
  AND status != 'Closed';

-- =============================================
-- CLEANUP 4C: Standardize 'Pre-Release' status
-- =============================================
UPDATE sbir_final 
SET status = 'Pre-Release'
WHERE LOWER(TRIM(status)) IN ('pre-release', 'prerelease', 'pre release')
  AND status != 'Pre-Release';

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
WHERE status = 'Pre-Release'
UNION ALL
SELECT 
    'Air Force Component',
    COUNT(*)
FROM sbir_final
WHERE component = 'Air Force'
UNION ALL
SELECT 
    'Army Component',
    COUNT(*)
FROM sbir_final
WHERE component = 'Army'
UNION ALL
SELECT 
    'Navy Component',
    COUNT(*)
FROM sbir_final
WHERE component = 'Navy';

-- =============================================
-- DONE! Data is now cleaner.
-- Try your search on the website - it should work much better now!
-- =============================================

