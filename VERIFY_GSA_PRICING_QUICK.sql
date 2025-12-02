-- ============================================
-- GSA PRICING QUICK VERIFICATION
-- Fast overview of all imported pricing data
-- ============================================

-- QUICK STATS (Run this first)
SELECT 
  COUNT(*) as total_labor_categories,
  COUNT(DISTINCT contractor_id) as contractors_with_pricing,
  COUNT(DISTINCT contract_number) as unique_contracts,
  MIN(hourly_rate) as min_rate,
  MAX(hourly_rate) as max_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL;

-- DATA COMPLETENESS
SELECT 
  COUNT(*) as total_records,
  COUNT(hourly_rate) as has_rate,
  COUNT(education_level) as has_education,
  COUNT(years_experience) as has_experience,
  ROUND(100.0 * COUNT(hourly_rate) / COUNT(*), 1) as pct_with_rate,
  ROUND(100.0 * COUNT(education_level) / COUNT(*), 1) as pct_with_education
FROM gsa_labor_categories;

-- TOP 10 MOST COMMON LABOR CATEGORIES
SELECT 
  labor_category,
  COUNT(*) as contractor_count,
  MIN(hourly_rate) as min_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  MAX(hourly_rate) as max_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
GROUP BY labor_category
ORDER BY contractor_count DESC
LIMIT 10;

-- TOP 10 CONTRACTORS BY LABOR CATEGORY COUNT
SELECT 
  c.company_name,
  c.company_state,
  COUNT(*) as labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.company_name, c.company_state
ORDER BY labor_categories DESC
LIMIT 10;

-- RATES BY EDUCATION LEVEL
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

-- TOP 10 HIGHEST PAID
SELECT 
  lc.labor_category,
  lc.hourly_rate,
  lc.education_level,
  c.company_name,
  c.company_state
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate DESC
LIMIT 10;

-- TOP 10 LOWEST PAID
SELECT 
  lc.labor_category,
  lc.hourly_rate,
  c.company_name,
  c.company_state
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate ASC
LIMIT 10;

-- SMALL VS LARGE BUSINESS
SELECT 
  CASE WHEN c.small_business = true THEN 'Small Business' ELSE 'Large Business' END as business_type,
  COUNT(DISTINCT c.id) as contractors,
  COUNT(*) as labor_categories,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.small_business;

-- PARSE STATUS
SELECT 
  parse_status,
  COUNT(*) as file_count,
  SUM(labor_categories_count) as total_categories
FROM gsa_price_lists
GROUP BY parse_status
ORDER BY file_count DESC;

