-- ============================================
-- Check Page-Level Scraper Progress & Errors
-- ============================================

-- 1. CURRENT PROGRESS SUMMARY
SELECT 
  '📊 Overall Progress' as metric,
  COUNT(DISTINCT date) as days_processed,
  COUNT(*) as total_pages,
  SUM(contracts_inserted) as total_inserted,
  SUM(contracts_failed) as total_failed
FROM fpds_page_progress
WHERE status = 'completed';

-- 2. RECENT DAYS PROGRESS
SELECT * FROM fpds_daily_progress_summary
ORDER BY date DESC
LIMIT 20;

-- 3. FAILED CONTRACTS (Errors)
SELECT 
  '❌ Current Failures' as metric,
  COUNT(*) as total_failures,
  COUNT(DISTINCT contract_id) as unique_contracts,
  MIN(created_at) as oldest_failure,
  MAX(created_at) as newest_failure
FROM fpds_failed_contracts;

-- 4. ERRORS BY DATE
SELECT 
  DATE(created_at) as day,
  COUNT(*) as failures,
  COUNT(DISTINCT contract_id) as unique_failed,
  STRING_AGG(DISTINCT error_type, ', ') as error_types
FROM fpds_failed_contracts
GROUP BY DATE(created_at)
ORDER BY day DESC
LIMIT 30;

-- 5. ERRORS BY TYPE
SELECT 
  error_type,
  COUNT(*) as count,
  COUNT(DISTINCT contract_id) as unique_contracts
FROM fpds_failed_contracts
GROUP BY error_type
ORDER BY count DESC;

-- 6. MOST RECENT PAGE PROCESSED
SELECT 
  date,
  page_number,
  contracts_found,
  contracts_inserted,
  contracts_failed,
  completed_at
FROM fpds_page_progress
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;

-- 7. PAGES WITH HIGH FAILURE RATE
SELECT 
  date,
  page_number,
  contracts_found,
  contracts_inserted,
  contracts_failed,
  ROUND((contracts_failed::numeric / contracts_found * 100), 1) as failure_rate
FROM fpds_page_progress
WHERE contracts_found > 0
  AND contracts_failed > 20
ORDER BY failure_rate DESC
LIMIT 20;

-- 8. FAILED PAGES (Need Retry)
SELECT 
  date,
  page_number,
  error_message,
  completed_at
FROM fpds_page_progress
WHERE status = 'failed'
ORDER BY date DESC, page_number
LIMIT 50;

-- 9. INCOMPLETE DAYS (Might need more pages)
SELECT 
  date,
  MAX(page_number) as highest_page,
  SUM(contracts_inserted) as total_contracts,
  COUNT(*) as pages_completed
FROM fpds_page_progress
WHERE status = 'completed'
GROUP BY date
HAVING SUM(contracts_found) >= 100  -- Days that had at least 100 contracts
  AND MAX(page_number) < 3          -- But only 1-2 pages (might be incomplete)
ORDER BY date DESC;

-- 10. TOTAL CONTRACTS IN DATABASE
SELECT 
  '📈 Database Stats' as metric,
  COUNT(*) as total_contracts,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  MIN(date_signed) as earliest_date,
  MAX(date_signed) as latest_date
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full';

