-- =====================================================
-- Test SAM.gov Search URLs
-- =====================================================
-- Run this after applying fix_sam_gov_search_urls.sql
-- Copy the URLs and test them in your browser
-- =====================================================

-- Step 1: Get 5 recent search URLs to test
SELECT 
  piid,
  vendor_name,
  TO_CHAR(date_signed, 'YYYY-MM-DD') as award_date,
  solicitation_id,
  sam_gov_opportunity_url
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NOT NULL
  AND date_signed >= '2024-01-01'  -- Recent ones more likely to find results
ORDER BY date_signed DESC
LIMIT 5;

-- Step 2: Check the URL format looks correct
SELECT 
  solicitation_id,
  sam_gov_opportunity_url,
  CASE 
    WHEN sam_gov_opportunity_url LIKE 'https://sam.gov/search/?index=opp&q=%' THEN 'Correct format'
    ELSE 'Wrong format'
  END as url_check
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NOT NULL
LIMIT 10;

-- Step 3: Overall stats after fix
SELECT 
  COUNT(*) as total_contracts,
  COUNT(solicitation_id) FILTER (WHERE solicitation_id IS NOT NULL AND solicitation_id != '') as with_solicitation_id,
  COUNT(sam_gov_opportunity_url) as with_search_url,
  ROUND(100.0 * COUNT(sam_gov_opportunity_url) / NULLIF(COUNT(*), 0), 1) as coverage_percentage
FROM fpds_contracts;

-- Step 4: Get URLs for high-value DoD contracts (most likely to have SAM.gov records)
SELECT 
  piid,
  vendor_name,
  base_and_exercised_options_value,
  contracting_agency_name,
  solicitation_id,
  sam_gov_opportunity_url
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NOT NULL
  AND contracting_agency_name LIKE '%Defense%'
  AND base_and_exercised_options_value > 1000000
  AND date_signed >= '2023-01-01'
ORDER BY base_and_exercised_options_value DESC
LIMIT 10;

-- Step 5: Sample different solicitation ID formats
SELECT 
  SUBSTRING(solicitation_id, 1, 10) as sol_id_pattern,
  COUNT(*) as count,
  MIN(sam_gov_opportunity_url) as sample_url
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NOT NULL
GROUP BY SUBSTRING(solicitation_id, 1, 10)
ORDER BY count DESC
LIMIT 20;

