-- ============================================
-- Clean Congressional Bills Database
-- ============================================
-- Run this in Supabase SQL Editor to clean up test data

-- 1. Delete the incorrect Social Security bill (test data)
DELETE FROM congressional_bills 
WHERE bill_number = 5345 
  AND congress = 119
  AND title LIKE '%Social Security%';

-- 2. Check how many bills remain
SELECT 
  COUNT(*) as total_bills,
  COUNT(*) FILTER (WHERE is_defense_related = true) as defense_bills,
  COUNT(*) FILTER (WHERE is_defense_related = false) as non_defense_bills
FROM congressional_bills;

-- 3. View defense bills by relevance score
SELECT 
  congress,
  bill_type,
  bill_number,
  defense_relevance_score,
  title
FROM congressional_bills 
WHERE is_defense_related = true
ORDER BY defense_relevance_score DESC, congress DESC
LIMIT 20;

-- 4. Check for duplicates (should return 0 rows)
SELECT 
  congress,
  bill_type,
  bill_number,
  COUNT(*) as duplicate_count
FROM congressional_bills
GROUP BY congress, bill_type, bill_number
HAVING COUNT(*) > 1;

-- 5. View import progress by Congress
SELECT 
  congress,
  COUNT(*) as total_bills,
  COUNT(*) FILTER (WHERE is_defense_related = true) as defense_bills,
  MIN(introduced_date) as earliest_bill,
  MAX(introduced_date) as latest_bill
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

-- 6. Check scraping logs
SELECT 
  run_date,
  run_type,
  bills_scraped,
  success,
  duration_seconds,
  error_message
FROM congressional_scraping_logs
ORDER BY run_date DESC
LIMIT 10;

