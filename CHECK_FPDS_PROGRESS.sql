-- ============================================
-- CHECK FPDS SCRAPING PROGRESS
-- ============================================
-- Quick queries to see what data you have and what's next

-- 1. Total contracts and data quality
SELECT 
  COUNT(*) as total_contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality_score,
  COUNT(*) FILTER (WHERE data_quality_score >= 80) as high_quality,
  COUNT(*) FILTER (WHERE data_quality_score < 80) as needs_review
FROM fpds_contracts;

-- 2. Contracts by year
SELECT 
  calendar_year,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality,
  MIN(date_signed)::date as earliest_contract,
  MAX(date_signed)::date as latest_contract
FROM fpds_contracts
WHERE calendar_year IS NOT NULL
GROUP BY calendar_year
ORDER BY calendar_year DESC;

-- 3. Recent scraper runs
SELECT 
  scrape_type,
  date_range,
  status,
  total_processed,
  total_inserted,
  total_errors,
  last_page_processed,
  started_at,
  updated_at,
  CASE 
    WHEN status = 'in_progress' 
    THEN ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60) 
    ELSE NULL 
  END as minutes_running
FROM fpds_scraper_log
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Top agencies by contract count (2025 data)
SELECT 
  agency_name,
  COUNT(*) as contracts,
  SUM(total_obligation_amount) as total_amount,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE calendar_year = 2025
GROUP BY agency_name
ORDER BY contracts DESC
LIMIT 10;

-- 5. Date ranges that need completion (gaps in 2025)
WITH date_series AS (
  SELECT generate_series(
    '2025-01-01'::date,
    '2025-10-31'::date,
    '1 day'::interval
  )::date as check_date
)
SELECT 
  check_date,
  COUNT(fc.id) as contracts_on_date
FROM date_series ds
LEFT JOIN fpds_contracts fc ON fc.date_signed::date = ds.check_date
GROUP BY check_date
HAVING COUNT(fc.id) < 3  -- Days with fewer than 3 contracts might need review
ORDER BY check_date DESC
LIMIT 20;

-- 6. Data quality issues to fix
SELECT 
  'Missing UEI/DUNS' as issue_type,
  COUNT(*) as count
FROM fpds_contracts
WHERE recipient_uei IS NULL AND recipient_duns IS NULL
UNION ALL
SELECT 
  'Missing NAICS' as issue_type,
  COUNT(*) as count
FROM fpds_contracts
WHERE naics_code IS NULL
UNION ALL
SELECT 
  'Suspicious contracts' as issue_type,
  COUNT(*) as count
FROM fpds_contracts
WHERE is_suspicious = true
ORDER BY count DESC;

-- 7. Resume info for current scrape
SELECT 
  scrape_type,
  date_range,
  last_page_processed,
  total_processed,
  total_inserted,
  total_errors,
  updated_at,
  '🔄 Run this to resume: npx tsx src/scripts/fpds-full-load-date-range.ts --start=' || 
  split_part(date_range, ' to ', 1) || 
  ' --end=' || 
  split_part(date_range, ' to ', 2) as resume_command
FROM fpds_scraper_log
WHERE status = 'in_progress'
ORDER BY updated_at DESC
LIMIT 1;

