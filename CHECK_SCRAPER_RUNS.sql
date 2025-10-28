-- ========================================
-- QUERY TO CHECK SCRAPER RUNS
-- ========================================
-- Use these queries to verify your scraper is running

-- 1. Check all scraper runs (most recent first)
SELECT 
  id,
  run_type,
  trigger_source,
  user_email,
  started_at,
  completed_at,
  duration_seconds,
  status,
  total_topics,
  new_records,
  updated_records,
  error_message
FROM dsip_scraper_runs
ORDER BY started_at DESC
LIMIT 20;

-- 2. Check only automated cron runs
SELECT 
  id,
  trigger_source,
  started_at,
  completed_at,
  duration_seconds,
  status,
  total_topics,
  new_records,
  updated_records
FROM dsip_scraper_runs
WHERE run_type = 'cron'
ORDER BY started_at DESC
LIMIT 10;

-- 3. Check manual runs (from admin UI)
SELECT 
  id,
  user_email,
  started_at,
  completed_at,
  status,
  total_topics,
  new_records,
  updated_records
FROM dsip_scraper_runs
WHERE run_type = 'manual'
ORDER BY started_at DESC
LIMIT 10;

-- 4. Get summary statistics
SELECT 
  run_type,
  trigger_source,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
  AVG(CASE WHEN status = 'completed' THEN duration_seconds END)::INTEGER as avg_duration_seconds,
  SUM(new_records) as total_new_records,
  SUM(updated_records) as total_updated_records
FROM dsip_scraper_runs
GROUP BY run_type, trigger_source
ORDER BY run_type, trigger_source;

-- 5. Check if cron ran today
SELECT 
  id,
  trigger_source,
  started_at AT TIME ZONE 'UTC' as started_at_utc,
  completed_at AT TIME ZONE 'UTC' as completed_at_utc,
  status,
  total_topics,
  new_records,
  updated_records
FROM dsip_scraper_runs
WHERE run_type = 'cron'
  AND started_at >= CURRENT_DATE
ORDER BY started_at DESC;

-- 6. Latest successful run (what the UI displays)
SELECT * FROM get_latest_successful_scraper_run();

