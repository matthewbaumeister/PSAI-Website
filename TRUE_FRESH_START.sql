-- ============================================
-- TRUE FRESH START - Clear All Scraper State
-- ============================================
-- This clears ONLY scraper progress/logs
-- It does NOT delete actual contract data
-- ============================================

-- STEP 1: See what will be cleared
SELECT 
  'Page Progress' as what,
  COUNT(*) as records,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM fpds_page_progress

UNION ALL

SELECT 
  'Failed Contracts',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM fpds_failed_contracts

UNION ALL

SELECT 
  'Daily Scraper Logs',
  COUNT(*),
  MIN(started_at),
  MAX(started_at)
FROM fpds_scraper_log
WHERE scrape_type = 'daily';

-- STEP 2: Clear all scraper state
DELETE FROM fpds_page_progress;
DELETE FROM fpds_failed_contracts;
DELETE FROM fpds_scraper_log WHERE scrape_type = 'daily';

-- STEP 3: Verify it's all gone
SELECT 
  'Page Progress' as cleared_table,
  COUNT(*) as remaining_records
FROM fpds_page_progress

UNION ALL

SELECT 
  'Failed Contracts',
  COUNT(*)
FROM fpds_failed_contracts

UNION ALL

SELECT 
  'Daily Scraper Logs',
  COUNT(*)
FROM fpds_scraper_log
WHERE scrape_type = 'daily';

-- STEP 4: Verify contract data is still there
SELECT 
  '✅ Contract data preserved' as status,
  COUNT(*) as total_contracts,
  COUNT(DISTINCT DATE(date_signed)) as days_of_data
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full';

-- ============================================
-- After running this, restart your scraper:
-- 1. Stop tmux scraper: Ctrl+C
-- 2. Restart: ./run-fpds-page-level.sh
-- 3. It will now start at page 1 for each day
-- ============================================

