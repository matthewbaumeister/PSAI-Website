-- ============================================
-- Check 2025 FPDS Data Quality & Coverage
-- ============================================

-- 1. Overall Stats
SELECT 
  '📊 Overall 2025 Stats' as section,
  COUNT(*) as total_contracts,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  ROUND(AVG(data_quality_score), 1) as avg_quality_score,
  SUM(base_and_exercised_options_value::numeric)::money as total_value,
  MIN(date_signed) as earliest_date,
  MAX(date_signed) as latest_date
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31';

-- 2. Data Quality Breakdown
SELECT 
  '✨ Quality Distribution' as section,
  CASE 
    WHEN data_quality_score >= 90 THEN '🟢 High (90-100)'
    WHEN data_quality_score >= 70 THEN '🟡 Medium (70-89)'
    WHEN data_quality_score >= 50 THEN '🟠 Low (50-69)'
    ELSE '🔴 Very Low (<50)'
  END as quality_level,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_score,
  SUM(base_and_exercised_options_value::numeric)::money as total_value
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31'
GROUP BY 
  CASE 
    WHEN data_quality_score >= 90 THEN '🟢 High (90-100)'
    WHEN data_quality_score >= 70 THEN '🟡 Medium (70-89)'
    WHEN data_quality_score >= 50 THEN '🟠 Low (50-69)'
    ELSE '🔴 Very Low (<50)'
  END
ORDER BY avg_score DESC;

-- 3. Coverage by Month
SELECT 
  '📅 Monthly Coverage' as section,
  TO_CHAR(date_signed, 'YYYY-MM') as month,
  COUNT(*) as contracts,
  COUNT(DISTINCT vendor_name) as vendors,
  ROUND(AVG(data_quality_score), 1) as avg_quality,
  SUM(base_and_exercised_options_value::numeric)::money as total_value
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31'
GROUP BY TO_CHAR(date_signed, 'YYYY-MM')
ORDER BY month DESC;

-- 4. Daily Coverage (to see gaps)
SELECT 
  '📆 Daily Coverage (Last 31 days of October)' as section,
  date_signed::date as day,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-10-01'
  AND date_signed <= '2025-10-31'
GROUP BY date_signed::date
ORDER BY day DESC;

-- 5. Failed Contracts to Retry
SELECT 
  '❌ Failed Contracts (Need Retry)' as section,
  COUNT(*) as total_failed,
  COUNT(DISTINCT contract_id) as unique_contracts,
  COUNT(DISTINCT DATE(created_at)) as days_with_failures,
  STRING_AGG(DISTINCT error_type, ', ') as error_types
FROM fpds_failed_contracts
WHERE date_range LIKE '%2025%';

-- 6. Failed Contracts by Error Type
SELECT 
  '🔍 Failure Breakdown' as section,
  error_type,
  COUNT(*) as failures,
  COUNT(DISTINCT contract_id) as unique_contracts,
  MIN(created_at) as first_failure,
  MAX(created_at) as last_failure
FROM fpds_failed_contracts
WHERE date_range LIKE '%2025%'
GROUP BY error_type
ORDER BY failures DESC;

-- 7. Scraper Progress Log
SELECT 
  '📝 Scraper Log' as section,
  scrape_type,
  date_range,
  status,
  records_found,
  records_inserted,
  records_errors,
  started_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - started_at))/60 as runtime_minutes
FROM fpds_scraper_log
WHERE scrape_type LIKE '%2025%'
  OR date_range LIKE '%2025%'
ORDER BY started_at DESC;

-- 8. Top Vendors (by contract count)
SELECT 
  '🏢 Top 10 Vendors' as section,
  vendor_name,
  COUNT(*) as contracts,
  SUM(base_and_exercised_options_value::numeric)::money as total_value,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31'
  AND vendor_name IS NOT NULL
GROUP BY vendor_name
ORDER BY contracts DESC
LIMIT 10;

-- 9. Data Completeness Check
SELECT 
  '🔬 Field Completeness' as section,
  ROUND(COUNT(vendor_name)::numeric / COUNT(*) * 100, 1) as pct_has_vendor_name,
  ROUND(COUNT(total_amount)::numeric / COUNT(*) * 100, 1) as pct_has_amount,
  ROUND(COUNT(naics_code)::numeric / COUNT(*) * 100, 1) as pct_has_naics,
  ROUND(COUNT(fiscal_year)::numeric / COUNT(*) * 100, 1) as pct_has_fiscal_year,
  ROUND(COUNT(description)::numeric / COUNT(*) * 100, 1) as pct_has_description,
  ROUND(COUNT(award_type)::numeric / COUNT(*) * 100, 1) as pct_has_award_type
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31';

-- 10. Suspicious Data Check
SELECT 
  '⚠️  Suspicious Data' as section,
  COUNT(*) as suspicious_contracts,
  STRING_AGG(DISTINCT data_quality_issues, ', ') as issue_types
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31'
  AND is_suspicious = true;

