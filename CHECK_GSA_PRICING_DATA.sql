-- ============================================
-- GSA PRICING DATA VERIFICATION
-- Complete overview of pricing data quality and statistics
-- ============================================

-- Section 1: Overall Statistics
-- ============================================
SELECT 
  '=== OVERALL STATISTICS ===' as section,
  1 as sort_order;

SELECT 
  'Total Statistics' as metric,
  2 as sort_order,
  COUNT(*) as total_labor_categories,
  COUNT(DISTINCT contractor_id) as contractors_with_pricing,
  COUNT(DISTINCT contract_number) as unique_contracts,
  COUNT(DISTINCT price_list_id) as price_lists_parsed
FROM gsa_labor_categories;

-- Section 2: Rate Statistics
-- ============================================
SELECT 
  '=== RATE STATISTICS ===' as section,
  3 as sort_order;

SELECT 
  'Hourly Rates' as rate_type,
  4 as sort_order,
  COUNT(*) as count,
  MIN(hourly_rate) as min_rate,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY hourly_rate) as q1_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hourly_rate) as median_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY hourly_rate) as q3_rate,
  MAX(hourly_rate) as max_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL;

-- Section 3: Data Completeness
-- ============================================
SELECT 
  '=== DATA COMPLETENESS ===' as section,
  5 as sort_order;

SELECT 
  'Field Coverage' as category,
  6 as sort_order,
  COUNT(*) as total_records,
  COUNT(hourly_rate) as has_hourly_rate,
  COUNT(education_level) as has_education,
  COUNT(years_experience) as has_experience,
  COUNT(security_clearance) as has_clearance,
  ROUND(100.0 * COUNT(hourly_rate) / COUNT(*), 2) as pct_with_rate,
  ROUND(100.0 * COUNT(education_level) / COUNT(*), 2) as pct_with_education,
  ROUND(100.0 * COUNT(years_experience) / COUNT(*), 2) as pct_with_experience,
  ROUND(100.0 * COUNT(security_clearance) / COUNT(*), 2) as pct_with_clearance
FROM gsa_labor_categories;

-- Section 4: Top 20 Most Expensive Labor Categories
-- ============================================
SELECT 
  '=== TOP 20 MOST EXPENSIVE LABOR CATEGORIES ===' as section,
  7 as sort_order;

SELECT 
  'Expensive Categories' as category,
  8 as sort_order,
  labor_category,
  hourly_rate,
  education_level,
  years_experience,
  security_clearance,
  contract_number
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
ORDER BY hourly_rate DESC
LIMIT 20;

-- Section 5: Top 20 Most Common Labor Categories
-- ============================================
SELECT 
  '=== TOP 20 MOST COMMON LABOR CATEGORIES ===' as section,
  9 as sort_order;

SELECT 
  'Common Categories' as category,
  10 as sort_order,
  labor_category,
  COUNT(*) as contractor_count,
  MIN(hourly_rate) as min_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  MAX(hourly_rate) as max_rate,
  MAX(hourly_rate) - MIN(hourly_rate) as rate_spread
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
GROUP BY labor_category
HAVING COUNT(*) >= 5
ORDER BY contractor_count DESC
LIMIT 20;

-- Section 6: Pricing by SIN
-- ============================================
SELECT 
  '=== PRICING BY SIN (Top 20) ===' as section,
  11 as sort_order;

SELECT 
  'SIN Pricing' as category,
  12 as sort_order,
  c.primary_sin,
  COUNT(DISTINCT lc.contractor_id) as contractors_with_pricing,
  COUNT(*) as total_labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.primary_sin
HAVING COUNT(DISTINCT lc.contractor_id) >= 5
ORDER BY contractors_with_pricing DESC
LIMIT 20;

-- Section 7: Contractors with Most Labor Categories
-- ============================================
SELECT 
  '=== TOP 10 CONTRACTORS BY LABOR CATEGORY COUNT ===' as section,
  13 as sort_order;

SELECT 
  'Top Contractors' as category,
  14 as sort_order,
  c.company_name,
  c.contract_number,
  c.primary_sin,
  c.company_state,
  COUNT(*) as labor_category_count,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.company_name, c.contract_number, c.primary_sin, c.company_state
ORDER BY labor_category_count DESC
LIMIT 10;

-- Section 8: Small Business vs Large Business Rates
-- ============================================
SELECT 
  '=== SMALL BUSINESS VS LARGE BUSINESS RATES ===' as section,
  15 as sort_order;

SELECT 
  'Business Size Comparison' as category,
  16 as sort_order,
  c.small_business,
  COUNT(DISTINCT c.id) as contractors,
  COUNT(*) as labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.small_business
ORDER BY c.small_business DESC;

-- Section 9: Pricing by State (Top 20)
-- ============================================
SELECT 
  '=== PRICING BY STATE (Top 20) ===' as section,
  17 as sort_order;

SELECT 
  'State Pricing' as category,
  18 as sort_order,
  c.company_state,
  COUNT(DISTINCT c.id) as contractors,
  COUNT(*) as labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.company_state
HAVING COUNT(DISTINCT c.id) >= 10
ORDER BY contractors DESC
LIMIT 20;

-- Section 10: Parse Status Summary
-- ============================================
SELECT 
  '=== PARSE STATUS SUMMARY ===' as section,
  19 as sort_order;

SELECT 
  'Parse Status' as category,
  20 as sort_order,
  parse_status,
  COUNT(*) as count,
  SUM(labor_categories_count) as total_labor_categories
FROM gsa_price_lists
GROUP BY parse_status
ORDER BY count DESC;

-- Section 11: Recent Scraper Runs
-- ============================================
SELECT 
  '=== RECENT SCRAPER RUNS ===' as section,
  21 as sort_order;

SELECT 
  'Scraper History' as category,
  22 as sort_order,
  started_at,
  completed_at,
  status,
  total_price_lists,
  downloaded_count,
  parsed_count,
  failed_count,
  labor_categories_found
FROM gsa_pricing_scraper_log
ORDER BY started_at DESC
LIMIT 5;

-- Final Summary Line
SELECT 
  '=== END OF REPORT ===' as section,
  23 as sort_order;

