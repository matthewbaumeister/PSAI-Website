-- ============================================
-- GSA PRICING TEST DATA QUALITY CHECK
-- Quick verification of test import (10 files)
-- ============================================

-- Overall Statistics
SELECT 
  'OVERALL STATS' as section,
  COUNT(*) as total_labor_categories,
  COUNT(DISTINCT contractor_id) as unique_contractors,
  COUNT(DISTINCT contract_number) as unique_contracts,
  COUNT(DISTINCT price_list_id) as price_lists_parsed
FROM gsa_labor_categories;

-- Rate Statistics
SELECT 
  'RATE STATS' as section,
  MIN(hourly_rate) as min_rate,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY hourly_rate) as q1_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hourly_rate) as median_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY hourly_rate) as q3_rate,
  MAX(hourly_rate) as max_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL;

-- Data Completeness
SELECT 
  'DATA COMPLETENESS' as section,
  COUNT(*) as total_records,
  COUNT(hourly_rate) as has_rate,
  COUNT(education_level) as has_education,
  COUNT(years_experience) as has_experience,
  COUNT(security_clearance) as has_clearance,
  ROUND(100.0 * COUNT(hourly_rate) / COUNT(*), 1) as pct_with_rate,
  ROUND(100.0 * COUNT(education_level) / COUNT(*), 1) as pct_with_education,
  ROUND(100.0 * COUNT(years_experience) / COUNT(*), 1) as pct_with_experience
FROM gsa_labor_categories;

-- Top 10 Most Expensive Labor Categories
SELECT 
  labor_category,
  hourly_rate,
  education_level,
  years_experience,
  security_clearance,
  c.company_name,
  c.contract_number
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE hourly_rate IS NOT NULL
ORDER BY hourly_rate DESC
LIMIT 10;

-- Top 10 Cheapest Labor Categories
SELECT 
  labor_category,
  hourly_rate,
  education_level,
  years_experience,
  c.company_name,
  c.contract_number
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE hourly_rate IS NOT NULL
ORDER BY hourly_rate ASC
LIMIT 10;

-- Most Common Labor Categories
SELECT 
  labor_category,
  COUNT(*) as contractor_count,
  MIN(hourly_rate) as min_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate,
  MAX(hourly_rate) as max_rate
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
GROUP BY labor_category
HAVING COUNT(*) >= 2
ORDER BY contractor_count DESC
LIMIT 10;

-- Contractors with Pricing
SELECT 
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
ORDER BY labor_category_count DESC;

-- Parse Status Summary
SELECT 
  parse_status,
  COUNT(*) as count,
  SUM(labor_categories_count) as total_categories
FROM gsa_price_lists
GROUP BY parse_status
ORDER BY count DESC;

