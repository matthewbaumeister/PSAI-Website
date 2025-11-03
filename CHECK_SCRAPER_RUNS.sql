-- =====================================================
-- CHECK SCRAPER RUNS - Monitor All Automated Scrapers
-- =====================================================
-- Quick queries to check scraper status, stats, and history
-- =====================================================

-- ============================================================
-- SECTION 1: Latest Status for All Scrapers
-- ============================================================

SELECT 
  '=== LATEST SCRAPER STATUS ===' as section;

SELECT * FROM latest_scraper_runs
ORDER BY started_at DESC;

-- ============================================================
-- SECTION 2: Today's Runs
-- ============================================================

SELECT 
  '=== TODAY''S SCRAPER RUNS ===' as section;

SELECT * FROM todays_scraper_runs;

-- ============================================================
-- SECTION 3: Statistics (Last 30 Days)
-- ============================================================

SELECT 
  '=== SCRAPER STATISTICS (Last 30 Days) ===' as section;

SELECT 
  scraper_name,
  (get_scraper_statistics(scraper_name)).*
FROM (
  VALUES 
    ('fpds'),
    ('dod-news'),
    ('sam-gov'),
    ('dsip')
) AS scrapers(scraper_name);

-- ============================================================
-- SECTION 4: Recent Runs (Last 7 Days)
-- ============================================================

SELECT 
  '=== RECENT RUNS (Last 7 Days) ===' as section;

SELECT 
  scraper_name,
  run_date,
  started_at,
  duration_seconds,
  status,
  stats->'total' as total_records,
  stats->'new' as new_records,
  stats->'errors' as errors
FROM scraper_runs
WHERE started_at >= NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- ============================================================
-- SECTION 5: Recent Failures
-- ============================================================

SELECT 
  '=== RECENT FAILURES ===' as section;

SELECT * FROM recent_failed_runs;

-- ============================================================
-- SECTION 6: DSIP Scraper Detail
-- ============================================================

SELECT 
  '=== DSIP SCRAPER DETAIL ===' as section;

SELECT 
  run_date,
  started_at,
  completed_at,
  duration_seconds,
  status,
  stats->>'total_active_opportunities' as active_opps,
  stats->>'new_opportunities' as new_opps,
  stats->>'total_processed' as total_processed,
  stats->>'with_full_details' as with_details,
  stats->>'errors' as errors,
  error_message
FROM scraper_runs
WHERE scraper_name = 'dsip'
ORDER BY started_at DESC
LIMIT 10;

-- ============================================================
-- SECTION 7: SAM.gov Scraper Detail (with Rate Limits)
-- ============================================================

SELECT 
  '=== SAM.GOV SCRAPER DETAIL ===' as section;

SELECT 
  run_date,
  started_at,
  duration_seconds,
  status,
  stats->>'total_opportunities' as total_opps,
  stats->>'new_opportunities' as new_opps,
  stats->>'mode' as mode,
  CASE 
    WHEN status = 'rate_limited' THEN '⚠️ Hit daily quota'
    WHEN status = 'success' THEN '✅ Success'
    ELSE '❌ Failed'
  END as status_display,
  error_message
FROM scraper_runs
WHERE scraper_name = 'sam-gov'
ORDER BY started_at DESC
LIMIT 10;

-- ============================================================
-- SECTION 8: FPDS Scraper Detail
-- ============================================================

SELECT 
  '=== FPDS SCRAPER DETAIL ===' as section;

SELECT 
  run_date,
  started_at,
  duration_seconds,
  status,
  stats->>'total_contracts' as total_contracts,
  stats->>'new_contracts' as new_contracts,
  stats->>'updated_contracts' as updated_contracts,
  stats->>'errors' as errors
FROM scraper_runs
WHERE scraper_name = 'fpds'
ORDER BY started_at DESC
LIMIT 10;

-- ============================================================
-- SECTION 9: DoD News Scraper Detail
-- ============================================================

SELECT 
  '=== DOD NEWS SCRAPER DETAIL ===' as section;

SELECT 
  run_date,
  started_at,
  duration_seconds,
  status,
  stats->>'total_contracts' as total_contracts,
  stats->>'new_contracts' as new_contracts,
  stats->>'articles_processed' as articles
FROM scraper_runs
WHERE scraper_name = 'dod-news'
ORDER BY started_at DESC
LIMIT 10;

-- ============================================================
-- SECTION 10: Success Rate by Scraper
-- ============================================================

SELECT 
  '=== SUCCESS RATE BY SCRAPER ===' as section;

SELECT 
  scraper_name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'rate_limited') as rate_limited,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 1) as success_rate_pct,
  AVG(duration_seconds) as avg_duration_sec,
  MAX(started_at) as last_run
FROM scraper_runs
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY scraper_name
ORDER BY scraper_name;

-- ============================================================
-- SECTION 11: Daily Run Pattern (Last 7 Days)
-- ============================================================

SELECT 
  '=== DAILY RUN PATTERN ===' as section;

SELECT 
  DATE(started_at) as date,
  COUNT(*) FILTER (WHERE scraper_name = 'fpds') as fpds_runs,
  COUNT(*) FILTER (WHERE scraper_name = 'dod-news') as dod_runs,
  COUNT(*) FILTER (WHERE scraper_name = 'sam-gov') as sam_runs,
  COUNT(*) FILTER (WHERE scraper_name = 'dsip') as dsip_runs,
  COUNT(*) FILTER (WHERE status = 'success') as total_successful,
  COUNT(*) FILTER (WHERE status = 'failed') as total_failed
FROM scraper_runs
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
