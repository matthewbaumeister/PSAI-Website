-- ============================================
-- Fix Broken Cosponsor Data
-- ============================================
-- 
-- Issue: cosponsors column contains API reference URLs instead of actual data
-- Example: {"url": "https://api.congress.gov/v3/bill/118/..."}
-- 
-- Fix: Set to NULL so they can be properly re-fetched on next import
-- 
-- Run this in Supabase SQL Editor
-- ============================================

-- Show how many bills have broken cosponsor data
SELECT 
  COUNT(*) as bills_with_broken_cosponsors
FROM congressional_bills
WHERE cosponsors IS NOT NULL 
  AND cosponsors::text LIKE '%"url":%';

-- Clear broken cosponsor references (they'll be re-fetched on next import)
UPDATE congressional_bills
SET cosponsors = NULL
WHERE cosponsors IS NOT NULL 
  AND cosponsors::text LIKE '%"url":%';

-- Verify the fix
SELECT 
  COUNT(*) as total_bills,
  COUNT(cosponsors) as bills_with_cosponsor_data,
  COUNT(*) FILTER (WHERE cosponsors IS NOT NULL AND cosponsors::text LIKE '%"url":%') as still_broken
FROM congressional_bills;

-- Show which bills had cosponsors cleared (to verify correct count)
SELECT 
  congress,
  bill_type,
  bill_number,
  title,
  cosponsor_count,
  CASE 
    WHEN cosponsors IS NULL THEN 'Will be re-fetched'
    ELSE 'Has proper data'
  END as status
FROM congressional_bills
WHERE cosponsor_count > 0
ORDER BY congress DESC, bill_type, bill_number
LIMIT 20;

