-- ============================================
-- GSA PRICING FULL RUN VERIFICATION
-- Comprehensive check of all imported pricing data
-- ============================================

-- ============================================
-- SECTION 1: OVERALL STATISTICS
-- ============================================
SELECT 
  '=== OVERALL STATISTICS ===' as section,
  1 as sort_order
UNION ALL
SELECT 
  'Overall Stats' as section,
  2 as sort_order;

SELECT 
  COUNT(*) as total_labor_categories,
  COUNT(DISTINCT contractor_id) as contractors_with_pricing,
  COUNT(DISTINCT contract_number) as unique_contracts,
  MIN(hourly_rate) as min_rate,
  MAX(hourly_rate) as max_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hourly_rate) as median_rate
FROM gsa_labor_categories;

-- ============================================
-- SECTION 2: RATE DISTRIBUTION
-- ============================================
SELECT 
  '=== RATE DISTRIBUTION ===' as section,
  3 as sort_order
UNION ALL
SELECT 
  'Rate Stats' as section,
  4 as sort_order;

SELECT 
  MIN(hourly_rate) as min_rate,
  PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY hourly_rate) as p10_rate,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY hourly_rate) as q1_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hourly_rate) as median_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY hourly_rate) as q3_rate,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY hourly_rate) as p90_rate,
  MAX(hourly_rate) as max_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL;

-- ============================================
-- SECTION 3: DATA COMPLETENESS
-- ============================================
SELECT 
  '=== DATA COMPLETENESS ===' as section,
  5 as sort_order
UNION ALL
SELECT 
  'Field Coverage' as section,
  6 as sort_order;

SELECT 
  COUNT(*) as total_records,
  COUNT(hourly_rate) as has_rate,
  COUNT(education_level) as has_education,
  COUNT(years_experience) as has_experience,
  COUNT(security_clearance) as has_clearance,
  ROUND(100.0 * COUNT(hourly_rate) / COUNT(*), 1) as pct_with_rate,
  ROUND(100.0 * COUNT(education_level) / COUNT(*), 1) as pct_with_education,
  ROUND(100.0 * COUNT(years_experience) / COUNT(*), 1) as pct_with_experience,
  ROUND(100.0 * COUNT(security_clearance) / COUNT(*), 1) as pct_with_clearance
FROM gsa_labor_categories;

-- ============================================
-- SECTION 4: TOP 20 MOST COMMON LABOR CATEGORIES
-- ============================================
SELECT 
  '=== TOP 20 MOST COMMON LABOR CATEGORIES ===' as section,
  7 as sort_order
UNION ALL
SELECT 
  'Common Categories' as section,
  8 as sort_order;

SELECT 
  labor_category,
  COUNT(*) as contractor_count,
  MIN(hourly_rate) as min_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  MAX(hourly_rate) as max_rate,
  MAX(hourly_rate) - MIN(hourly_rate) as rate_spread
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
GROUP BY labor_category
ORDER BY contractor_count DESC
LIMIT 20;

-- ============================================
-- SECTION 5: TOP 20 CONTRACTORS BY LABOR CATEGORY COUNT
-- ============================================
SELECT 
  '=== TOP 20 CONTRACTORS BY LABOR CATEGORY COUNT ===' as section,
  9 as sort_order
UNION ALL
SELECT 
  'Top Contractors' as section,
  10 as sort_order;

SELECT 
  c.company_name,
  c.contract_number,
  c.company_state,
  c.primary_sin,
  COUNT(*) as labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.company_name, c.contract_number, c.company_state, c.primary_sin
ORDER BY labor_categories DESC
LIMIT 20;

-- ============================================
-- SECTION 6: RATE DISTRIBUTION BY EDUCATION LEVEL
-- ============================================
SELECT 
  '=== RATE DISTRIBUTION BY EDUCATION LEVEL ===' as section,
  11 as sort_order
UNION ALL
SELECT 
  'Education Level Rates' as section,
  12 as sort_order;

SELECT 
  COALESCE(education_level, 'Not Specified') as education_level,
  COUNT(*) as count,
  MIN(hourly_rate) as min_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  MAX(hourly_rate) as max_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
GROUP BY education_level
ORDER BY avg_rate DESC;

-- ============================================
-- SECTION 7: TOP 10 HIGHEST PAID LABOR CATEGORIES
-- ============================================
SELECT 
  '=== TOP 10 HIGHEST PAID LABOR CATEGORIES ===' as section,
  13 as sort_order
UNION ALL
SELECT 
  'Highest Rates' as section,
  14 as sort_order;

SELECT 
  lc.labor_category,
  lc.hourly_rate,
  lc.education_level,
  lc.years_experience,
  lc.security_clearance,
  c.company_name,
  c.contract_number,
  c.company_state
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate DESC
LIMIT 10;

-- ============================================
-- SECTION 8: TOP 10 LOWEST PAID LABOR CATEGORIES
-- ============================================
SELECT 
  '=== TOP 10 LOWEST PAID LABOR CATEGORIES ===' as section,
  15 as sort_order
UNION ALL
SELECT 
  'Lowest Rates' as section,
  16 as sort_order;

SELECT 
  lc.labor_category,
  lc.hourly_rate,
  lc.education_level,
  lc.years_experience,
  c.company_name,
  c.contract_number,
  c.company_state
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate ASC
LIMIT 10;

-- ============================================
-- SECTION 9: SMALL BUSINESS VS LARGE BUSINESS RATES
-- ============================================
SELECT 
  '=== SMALL BUSINESS VS LARGE BUSINESS RATES ===' as section,
  17 as sort_order
UNION ALL
SELECT 
  'Business Size Comparison' as section,
  18 as sort_order;

SELECT 
  CASE WHEN c.small_business = true THEN 'Small Business' ELSE 'Large Business' END as business_type,
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

-- ============================================
-- SECTION 10: PRICING BY STATE (TOP 20)
-- ============================================
SELECT 
  '=== PRICING BY STATE (TOP 20) ===' as section,
  19 as sort_order
UNION ALL
SELECT 
  'State Pricing' as section,
  20 as sort_order;

SELECT 
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

-- ============================================
-- SECTION 11: PRICING BY PRIMARY SIN (TOP 20)
-- ============================================
SELECT 
  '=== PRICING BY PRIMARY SIN (TOP 20) ===' as section,
  21 as sort_order
UNION ALL
SELECT 
  'SIN Pricing' as section,
  22 as sort_order;

SELECT 
  c.primary_sin,
  COUNT(DISTINCT c.id) as contractors,
  COUNT(*) as labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL AND c.primary_sin IS NOT NULL
GROUP BY c.primary_sin
HAVING COUNT(DISTINCT c.id) >= 5
ORDER BY contractors DESC
LIMIT 20;

-- ============================================
-- SECTION 12: PARSE STATUS SUMMARY
-- ============================================
SELECT 
  '=== PARSE STATUS SUMMARY ===' as section,
  23 as sort_order
UNION ALL
SELECT 
  'Parse Status' as section,
  24 as sort_order;

SELECT 
  parse_status,
  COUNT(*) as file_count,
  SUM(labor_categories_count) as total_categories,
  AVG(labor_categories_count)::numeric(10,1) as avg_categories_per_file
FROM gsa_price_lists
GROUP BY parse_status
ORDER BY file_count DESC;

-- ============================================
-- SECTION 13: MOST COMPETITIVE LABOR CATEGORIES
-- (Categories with highest number of contractors and biggest rate spread)
-- ============================================
SELECT 
  '=== MOST COMPETITIVE LABOR CATEGORIES ===' as section,
  25 as sort_order
UNION ALL
SELECT 
  'Competitive Categories (10+ contractors)' as section,
  26 as sort_order;

SELECT 
  labor_category,
  COUNT(*) as contractor_count,
  MIN(hourly_rate) as min_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  MAX(hourly_rate) as max_rate,
  (MAX(hourly_rate) - MIN(hourly_rate)) as rate_spread,
  ROUND(100.0 * (MAX(hourly_rate) - MIN(hourly_rate)) / MIN(hourly_rate), 1) as pct_spread
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
GROUP BY labor_category
HAVING COUNT(*) >= 10
ORDER BY rate_spread DESC
LIMIT 20;

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT 
  '=== SUMMARY ===' as section,
  27 as sort_order
UNION ALL
SELECT 
  'Data Collection Complete!' as section,
  28 as sort_order;

SELECT 
  '✓ Total Labor Categories' as metric,
  COUNT(*)::text as value
FROM gsa_labor_categories
UNION ALL
SELECT 
  '✓ Unique Contractors' as metric,
  COUNT(DISTINCT contractor_id)::text as value
FROM gsa_labor_categories
UNION ALL
SELECT 
  '✓ Files Parsed Successfully' as metric,
  COUNT(*)::text as value
FROM gsa_price_lists
WHERE parse_status = 'completed'
UNION ALL
SELECT 
  '✓ Average Rate' as metric,
  '$' || ROUND(AVG(hourly_rate), 2)::text || '/hr' as value
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL;

