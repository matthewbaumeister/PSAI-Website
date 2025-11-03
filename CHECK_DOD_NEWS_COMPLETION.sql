-- =====================================================
-- Check DoD Contract News Scraper Completion
-- =====================================================
-- Verify all workdays have been scraped from Sept 30, 2025 to July 1, 2014
-- =====================================================

-- Step 1: Overall progress summary
SELECT 
  COUNT(DISTINCT published_date) as days_with_data,
  MIN(published_date) as earliest_date,
  MAX(published_date) as latest_date,
  COUNT(*) as total_contracts,
  COUNT(DISTINCT article_id) as total_articles
FROM dod_contracts;

-- Step 2: Check article processing status
SELECT 
  status,
  COUNT(*) as articles,
  SUM(contracts_found) as total_contracts
FROM dod_article_progress
GROUP BY status
ORDER BY status;

-- Step 3: Find missing dates (gaps in data)
-- This generates all dates between July 1, 2014 and Sept 30, 2025
-- and shows which ones are missing
WITH date_range AS (
  SELECT generate_series(
    '2014-07-01'::date,
    '2025-09-30'::date,
    '1 day'::interval
  )::date as expected_date
),
workdays AS (
  -- Filter to only workdays (Mon-Fri, ignoring holidays for now)
  SELECT expected_date
  FROM date_range
  WHERE EXTRACT(DOW FROM expected_date) NOT IN (0, 6) -- Not Sunday(0) or Saturday(6)
),
actual_dates AS (
  SELECT DISTINCT published_date
  FROM dod_contracts
)
SELECT 
  w.expected_date as missing_date,
  TO_CHAR(w.expected_date, 'Day') as day_of_week
FROM workdays w
LEFT JOIN actual_dates a ON w.expected_date = a.published_date
WHERE a.published_date IS NULL
ORDER BY w.expected_date DESC
LIMIT 100;

-- Step 4: Count missing workdays by month
WITH date_range AS (
  SELECT generate_series(
    '2014-07-01'::date,
    '2025-09-30'::date,
    '1 day'::interval
  )::date as expected_date
),
workdays AS (
  SELECT expected_date
  FROM date_range
  WHERE EXTRACT(DOW FROM expected_date) NOT IN (0, 6)
),
actual_dates AS (
  SELECT DISTINCT published_date
  FROM dod_contracts
)
SELECT 
  TO_CHAR(w.expected_date, 'YYYY-MM') as year_month,
  COUNT(*) as missing_workdays
FROM workdays w
LEFT JOIN actual_dates a ON w.expected_date = a.published_date
WHERE a.published_date IS NULL
GROUP BY TO_CHAR(w.expected_date, 'YYYY-MM')
HAVING COUNT(*) > 0
ORDER BY year_month DESC;

-- Step 5: Recent dates (last 30 days) - detailed view
SELECT 
  published_date,
  COUNT(*) as contracts,
  COUNT(DISTINCT article_id) as articles,
  TO_CHAR(published_date, 'Day') as day_of_week
FROM dod_contracts
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY published_date
ORDER BY published_date DESC;

-- Step 6: Failed articles (need retry)
SELECT 
  article_id,
  article_url,
  published_date,
  error_message,
  retry_count
FROM dod_article_progress
WHERE status = 'failed'
ORDER BY published_date DESC
LIMIT 50;

-- Step 7: Processing stats by date
SELECT 
  published_date,
  COUNT(*) as articles,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  SUM(contracts_found) as contracts
FROM dod_article_progress
WHERE published_date >= '2025-09-01'
GROUP BY published_date
ORDER BY published_date DESC;

-- Step 8: Check if scraper is still running
SELECT 
  article_id,
  article_url,
  published_date,
  status,
  started_at,
  NOW() - started_at as running_for
FROM dod_article_progress
WHERE status = 'processing'
ORDER BY started_at DESC;

-- Step 9: Summary by year
SELECT 
  EXTRACT(YEAR FROM published_date) as year,
  COUNT(DISTINCT published_date) as days_with_data,
  COUNT(*) as contracts,
  COUNT(DISTINCT article_id) as articles
FROM dod_contracts
GROUP BY EXTRACT(YEAR FROM published_date)
ORDER BY year DESC;

-- Step 10: Expected vs Actual (Quick Summary)
WITH stats AS (
  SELECT 
    COUNT(DISTINCT published_date) as actual_days,
    MIN(published_date) as earliest,
    MAX(published_date) as latest
  FROM dod_contracts
),
expected AS (
  SELECT 
    COUNT(*) as expected_workdays
  FROM generate_series(
    (SELECT earliest FROM stats),
    (SELECT latest FROM stats),
    '1 day'::interval
  ) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
)
SELECT 
  s.actual_days,
  e.expected_workdays,
  e.expected_workdays - s.actual_days as missing_days,
  ROUND(100.0 * s.actual_days / e.expected_workdays, 1) as completion_pct
FROM stats s, expected e;

