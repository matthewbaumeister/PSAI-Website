-- ============================================
-- Check Congressional Stock Trades Scraper Log
-- ============================================
-- Quick queries to monitor the congressional trades scraper

-- Latest run
SELECT 
    'Latest Run' as check_type,
    scrape_type,
    date_range,
    status,
    records_found,
    records_inserted,
    records_updated,
    records_errors,
    started_at,
    duration_seconds
FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- All historical runs
SELECT 
    'Historical Runs' as check_type,
    scrape_type,
    date_range,
    status,
    records_found,
    records_inserted,
    records_updated,
    started_at,
    duration_seconds
FROM congressional_trades_scraper_log
WHERE scrape_type = 'historical'
ORDER BY started_at DESC;

-- Recent daily runs (last 7 days)
SELECT 
    'Daily Runs (7 days)' as check_type,
    date_range,
    status,
    records_found,
    records_inserted,
    records_updated,
    started_at,
    duration_seconds
FROM congressional_trades_scraper_log
WHERE scrape_type = 'daily'
  AND started_at >= NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- Failed runs
SELECT 
    'Failed Runs' as check_type,
    scrape_type,
    date_range,
    error_message,
    started_at
FROM congressional_trades_scraper_log
WHERE status = 'failed'
ORDER BY started_at DESC;

-- Success rate
SELECT 
    'Success Rate' as check_type,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'completed') as successful,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2) as success_rate_pct
FROM congressional_trades_scraper_log;

