-- ========================================
-- WHERE ARE THE 30 "OPEN" RECORDS?
-- ========================================

-- 1. Check if ANY "Open" status records exist
SELECT 
  status,
  COUNT(*) as count
FROM sbir_final
GROUP BY status
ORDER BY count DESC;

-- 2. Show records scraped today (should include the 30 from manual scrape)
SELECT 
  cycle_name,
  status,
  COUNT(*) as records,
  MAX(last_scraped) as last_update
FROM sbir_final
WHERE DATE(last_scraped) = CURRENT_DATE
GROUP BY cycle_name, status
ORDER BY records DESC;

-- 3. Find any topics with "Open" or "Active" in any status field
SELECT 
  topic_number,
  cycle_name,
  status,
  open_date,
  close_date,
  last_scraped
FROM sbir_final
WHERE status ILIKE '%open%' 
   OR status ILIKE '%active%'
LIMIT 50;

-- 4. Show the most recent 50 records by last_scraped
SELECT 
  topic_number,
  cycle_name,
  status,
  DATE(last_scraped) as scraped_on,
  close_date
FROM sbir_final
ORDER BY last_scraped DESC NULLS LAST
LIMIT 50;

-- 5. Check if we have records with recent end dates (likely to be "Open")
SELECT 
  COUNT(*) as records_with_future_end_dates,
  MIN(close_date::date) as earliest_future_date,
  MAX(close_date::date) as latest_future_date
FROM sbir_final
WHERE close_date IS NOT NULL 
  AND close_date != ''
  AND close_date::date >= CURRENT_DATE;

-- 6. Show topics with future end dates (these SHOULD be "Open")
SELECT 
  topic_number,
  cycle_name,
  status,
  close_date,
  last_scraped
FROM sbir_final
WHERE close_date IS NOT NULL 
  AND close_date != ''
  AND close_date::date >= CURRENT_DATE
ORDER BY close_date::date
LIMIT 30;

