-- ========================================
-- INVESTIGATE: Where are the 30 "Open" topics?
-- ========================================

-- 1. Check what statuses we actually have
SELECT 
  status,
  COUNT(*) as count
FROM sbir_final
GROUP BY status
ORDER BY count DESC;

-- 2. Show the most recent close dates (should include future dates if topics are "open")
SELECT 
  topic_number,
  cycle_name,
  status,
  close_date,
  close_date_proper,
  last_scraped
FROM sbir_final
ORDER BY close_date_proper DESC NULLS LAST
LIMIT 20;

-- 3. Check when records were last scraped (manual vs historical)
SELECT 
  DATE(last_scraped) as scrape_date,
  status,
  COUNT(*) as count,
  MIN(close_date_proper) as earliest_close,
  MAX(close_date_proper) as latest_close
FROM sbir_final
GROUP BY DATE(last_scraped), status
ORDER BY scrape_date DESC, count DESC;

-- 4. Check if any records have close_date_ts but not close_date_proper
SELECT 
  COUNT(*) as total_records,
  COUNT(close_date_ts) as has_close_ts,
  COUNT(close_date_proper) as has_close_proper,
  COUNT(CASE WHEN close_date_ts IS NOT NULL AND close_date_proper IS NULL THEN 1 END) as failed_conversions
FROM sbir_final;

-- 5. Sample some records to see what the data actually looks like
SELECT 
  topic_number,
  status,
  close_date,
  close_date_ts,
  close_date_proper,
  CASE 
    WHEN close_date_proper IS NOT NULL AND close_date_proper >= CURRENT_DATE THEN 'Future'
    WHEN close_date_proper IS NOT NULL AND close_date_proper < CURRENT_DATE THEN 'Past'
    ELSE 'No date'
  END as date_status
FROM sbir_final
ORDER BY last_scraped DESC NULLS LAST
LIMIT 30;

-- 6. Check the actual text format of close_date_ts to see if regex matched
SELECT DISTINCT
  LEFT(close_date_ts::text, 30) as close_date_ts_sample,
  COUNT(*) as count
FROM sbir_final
WHERE close_date_ts IS NOT NULL
GROUP BY LEFT(close_date_ts::text, 30)
ORDER BY count DESC
LIMIT 10;

