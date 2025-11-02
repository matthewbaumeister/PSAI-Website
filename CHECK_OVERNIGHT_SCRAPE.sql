-- ============================================
-- Check Overnight Backwards Scraper Results
-- ============================================

-- 1. OVERALL STATS
SELECT 
  '📊 Total Contracts Scraped' as metric,
  COUNT(*) as count,
  MIN(date_signed::date) as earliest_date,
  MAX(date_signed::date) as latest_date,
  ROUND(AVG(data_quality_score), 1) as avg_quality_score
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full';

-- 2. CONTRACTS PER DAY (Last 90 days)
SELECT 
  DATE(date_signed) as day,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-08-01'
ORDER BY day DESC;

-- 3. CONTRACTS PER MONTH
SELECT 
  TO_CHAR(date_signed, 'YYYY-MM') as month,
  COUNT(*) as contracts,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  ROUND(AVG(data_quality_score), 1) as avg_quality,
  SUM(base_and_exercised_options_value)::money as total_value
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
GROUP BY TO_CHAR(date_signed, 'YYYY-MM')
ORDER BY month DESC;

-- 4. FAILED CONTRACTS (Errors)
SELECT 
  '❌ Failed Contracts Needing Retry' as metric,
  COUNT(*) as total_failures,
  COUNT(DISTINCT contract_id) as unique_contracts,
  COUNT(DISTINCT DATE_TRUNC('day', created_at)) as days_with_failures
FROM fpds_failed_contracts;

-- 5. ERRORS BY DAY
SELECT 
  DATE_TRUNC('day', created_at)::date as day,
  COUNT(*) as failures,
  COUNT(DISTINCT contract_id) as unique_failed_contracts,
  STRING_AGG(DISTINCT error_type, ', ') as error_types
FROM fpds_failed_contracts
GROUP BY DATE_TRUNC('day', created_at)::date
ORDER BY day DESC
LIMIT 30;

-- 6. SCRAPER LOG (Progress Tracking)
SELECT 
  scrape_type,
  date_range,
  records_found,
  records_inserted,
  records_errors,
  status,
  started_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - started_at))/60 as runtime_minutes
FROM fpds_scraper_log
WHERE scrape_type = 'daily_scrape'
  AND started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC
LIMIT 100;

-- 7. DATA QUALITY BREAKDOWN
SELECT 
  CASE 
    WHEN data_quality_score >= 90 THEN '🟢 Excellent (90-100)'
    WHEN data_quality_score >= 70 THEN '🟡 Good (70-89)'
    WHEN data_quality_score >= 50 THEN '🟠 Fair (50-69)'
    ELSE '🔴 Poor (<50)'
  END as quality_level,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_score
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
GROUP BY 
  CASE 
    WHEN data_quality_score >= 90 THEN '🟢 Excellent (90-100)'
    WHEN data_quality_score >= 70 THEN '🟡 Good (70-89)'
    WHEN data_quality_score >= 50 THEN '🟠 Fair (50-69)'
    ELSE '🔴 Poor (<50)'
  END
ORDER BY avg_score DESC;

-- 8. TOP VENDORS (Most contracts)
SELECT 
  vendor_name,
  COUNT(*) as contracts,
  SUM(base_and_exercised_options_value)::money as total_value,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND vendor_name IS NOT NULL
GROUP BY vendor_name
ORDER BY contracts DESC
LIMIT 20;

-- 9. DAYS WITH ZERO CONTRACTS (Possible issues)
WITH all_dates AS (
  SELECT generate_series(
    '2025-08-22'::date,
    '2025-11-01'::date,
    '1 day'::interval
  )::date as day
)
SELECT 
  ad.day,
  COALESCE(COUNT(c.id), 0) as contracts
FROM all_dates ad
LEFT JOIN fpds_contracts c ON DATE(c.date_signed) = ad.day
  AND c.data_source = 'usaspending.gov-full'
GROUP BY ad.day
HAVING COALESCE(COUNT(c.id), 0) = 0
ORDER BY ad.day DESC;

-- 10. SUCCESS RATE CALCULATION
WITH stats AS (
  SELECT 
    COUNT(*) as total_inserted,
    (SELECT COUNT(DISTINCT contract_id) FROM fpds_failed_contracts) as total_failed
  FROM fpds_contracts
  WHERE data_source = 'usaspending.gov-full'
    AND date_signed >= '2025-08-22'
)
SELECT 
  '🎯 Success Rate' as metric,
  total_inserted as "✅ Succeeded",
  total_failed as "❌ Failed",
  (total_inserted + total_failed) as "📊 Total Attempted",
  ROUND((total_inserted::numeric / (total_inserted + total_failed) * 100), 1) || '%' as "Success Rate"
FROM stats;

-- 11. CONTRACTS BY AGENCY (Top 10)
SELECT 
  contracting_agency_name,
  COUNT(*) as contracts,
  SUM(base_and_exercised_options_value)::money as total_value
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND contracting_agency_name IS NOT NULL
GROUP BY contracting_agency_name
ORDER BY contracts DESC
LIMIT 10;

-- 12. SMALL BUSINESS CONTRACTS
SELECT 
  'Small Business Contracts' as category,
  COUNT(*) as contracts,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM fpds_contracts WHERE data_source = 'usaspending.gov-full') * 100, 1) || '%' as percentage
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND small_business = true;

