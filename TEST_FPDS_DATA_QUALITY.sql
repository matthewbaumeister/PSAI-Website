-- ============================================
-- FPDS Data Quality Testing Queries
-- ============================================
-- Run these in Supabase SQL Editor to verify data quality

-- ============================================
-- 1. Check Recent Contracts (Last 3 Days)
-- ============================================
SELECT 
  DATE(last_modified_date) as contract_date,
  COUNT(*) as total_contracts,
  COUNT(DISTINCT piid) as unique_contracts,
  COUNT(DISTINCT awarding_agency_name) as unique_agencies,
  AVG(total_dollars::numeric) as avg_contract_value
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY DATE(last_modified_date)
ORDER BY contract_date DESC;

-- ============================================
-- 2. Data Completeness Check
-- ============================================
-- Check for critical fields being populated
SELECT 
  COUNT(*) as total_contracts,
  COUNT(piid) as has_piid,
  COUNT(awarding_agency_name) as has_agency,
  COUNT(vendor_name) as has_vendor,
  COUNT(description) as has_description,
  COUNT(total_dollars) as has_value,
  COUNT(award_date) as has_award_date,
  ROUND(100.0 * COUNT(piid) / COUNT(*), 2) as piid_completeness,
  ROUND(100.0 * COUNT(description) / COUNT(*), 2) as description_completeness,
  ROUND(100.0 * COUNT(vendor_name) / COUNT(*), 2) as vendor_completeness
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days';

-- ============================================
-- 3. Check for Duplicates
-- ============================================
-- Should return 0 rows if upsert is working correctly
SELECT 
  transaction_number,
  COUNT(*) as duplicate_count
FROM fpds_contracts
GROUP BY transaction_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- ============================================
-- 4. Recent Updates vs New Inserts
-- ============================================
-- Check contracts that were updated (modified_date != award_date)
SELECT 
  DATE(last_modified_date) as date,
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as new_today,
  COUNT(*) FILTER (WHERE created_at::date < CURRENT_DATE) as updated_today,
  COUNT(*) as total
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY DATE(last_modified_date)
ORDER BY date DESC;

-- ============================================
-- 5. Top Agencies (Last 3 Days)
-- ============================================
SELECT 
  awarding_agency_name,
  COUNT(*) as contract_count,
  SUM(total_dollars::numeric) as total_value,
  ROUND(AVG(total_dollars::numeric), 2) as avg_value
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days'
  AND awarding_agency_name IS NOT NULL
GROUP BY awarding_agency_name
ORDER BY contract_count DESC
LIMIT 10;

-- ============================================
-- 6. Contract Value Distribution
-- ============================================
SELECT 
  CASE 
    WHEN total_dollars::numeric < 10000 THEN 'Under $10K'
    WHEN total_dollars::numeric < 100000 THEN '$10K-$100K'
    WHEN total_dollars::numeric < 1000000 THEN '$100K-$1M'
    WHEN total_dollars::numeric < 10000000 THEN '$1M-$10M'
    ELSE 'Over $10M'
  END as value_range,
  COUNT(*) as contract_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days'
  AND total_dollars IS NOT NULL
GROUP BY value_range
ORDER BY 
  CASE 
    WHEN value_range = 'Under $10K' THEN 1
    WHEN value_range = '$10K-$100K' THEN 2
    WHEN value_range = '$100K-$1M' THEN 3
    WHEN value_range = '$1M-$10M' THEN 4
    ELSE 5
  END;

-- ============================================
-- 7. SAM.gov Link Coverage
-- ============================================
-- Check how many contracts have SAM.gov opportunity links
SELECT 
  COUNT(*) as total_contracts,
  COUNT(sam_gov_opportunity_url) as has_sam_gov_link,
  ROUND(100.0 * COUNT(sam_gov_opportunity_url) / COUNT(*), 2) as sam_gov_coverage_pct
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days';

-- ============================================
-- 8. Scraper Progress Tracking
-- ============================================
-- Check page-level progress for last 3 days
SELECT 
  date,
  COUNT(*) as pages_scraped,
  SUM(contracts_found) as total_found,
  SUM(contracts_inserted) as total_inserted,
  SUM(contracts_failed) as total_failed,
  MAX(completed_at) as last_page_completed
FROM fpds_page_progress
WHERE date >= CURRENT_DATE - INTERVAL '3 days'
  AND status = 'completed'
GROUP BY date
ORDER BY date DESC;

-- ============================================
-- 9. Failed Contracts (Need Retry)
-- ============================================
-- Check contracts that failed to fetch details
SELECT 
  date_range,
  page_number,
  COUNT(*) as failed_count,
  MAX(attempt_count) as max_attempts,
  STRING_AGG(DISTINCT error_type, ', ') as error_types
FROM fpds_failed_contracts
WHERE date_range >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY date_range, page_number
ORDER BY date_range DESC, page_number;

-- ============================================
-- 10. Sample Recent Contracts (Visual Check)
-- ============================================
-- View a sample of recent contracts to verify data looks good
SELECT 
  piid,
  awarding_agency_name,
  vendor_name,
  LEFT(description, 100) as description_preview,
  total_dollars,
  award_date,
  last_modified_date
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days'
ORDER BY last_modified_date DESC
LIMIT 10;

