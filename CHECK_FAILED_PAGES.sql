-- ============================================
-- Check Failed Pages & Missing Data
-- ============================================

-- 1. HOW MANY PAGES FAILED?
SELECT 
  '❌ Failed Pages' as metric,
  COUNT(*) as total,
  COUNT(DISTINCT date) as days_affected
FROM fpds_page_progress
WHERE status = 'failed';

-- 2. FAILED PAGES BY DATE
SELECT 
  date,
  COUNT(*) as failed_pages,
  ARRAY_AGG(page_number ORDER BY page_number) as which_pages,
  STRING_AGG(DISTINCT LEFT(error_message, 50), '; ') as error_types
FROM fpds_page_progress
WHERE status = 'failed'
GROUP BY date
ORDER BY date DESC;

-- 3. ESTIMATED MISSING CONTRACTS
SELECT 
  '📊 Estimated Data Loss' as metric,
  COUNT(*) * 100 as "Estimated Missing Contracts",
  COUNT(*) as "Failed Pages"
FROM fpds_page_progress
WHERE status = 'failed';

-- 4. COMPLETE VS FAILED PAGES
SELECT 
  status,
  COUNT(*) as pages,
  SUM(contracts_found) as total_contracts_found,
  SUM(contracts_inserted) as total_inserted,
  SUM(contracts_failed) as total_failed
FROM fpds_page_progress
GROUP BY status
ORDER BY status;

-- 5. DAILY SCRAPING SUCCESS RATE
SELECT 
  date,
  COUNT(*) as total_pages,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_pages,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_pages,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*),
    1
  ) as success_rate
FROM fpds_page_progress
GROUP BY date
ORDER BY date DESC
LIMIT 20;

-- 6. MOST RECENT FAILURES
SELECT 
  date,
  page_number,
  error_message,
  completed_at as failed_at
FROM fpds_page_progress
WHERE status = 'failed'
ORDER BY completed_at DESC
LIMIT 20;

-- 7. DAYS WITH INCOMPLETE COVERAGE
-- (Has some successful pages but also failures)
SELECT 
  date,
  COUNT(*) as total_pages_attempted,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  MAX(page_number) FILTER (WHERE status = 'completed') as highest_successful_page
FROM fpds_page_progress
GROUP BY date
HAVING COUNT(*) FILTER (WHERE status = 'failed') > 0
ORDER BY date DESC;

-- 8. CHECK IF WE'RE MISSING PAGE 1 DATA
-- (Critical because that's the first 100 contracts of each day)
SELECT 
  date,
  page_number,
  status,
  contracts_found,
  error_message
FROM fpds_page_progress
WHERE page_number = 1
  AND status = 'failed'
ORDER BY date DESC;

