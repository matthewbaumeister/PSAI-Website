-- =====================================================
-- Check SAM.gov URL Implementation
-- =====================================================
-- Run this after applying the migration to verify it worked
-- =====================================================

-- Step 1: Overall coverage statistics
SELECT 
  COUNT(*) as total_contracts,
  COUNT(solicitation_id) FILTER (WHERE solicitation_id IS NOT NULL AND solicitation_id != '') as with_solicitation_id,
  COUNT(sam_gov_opportunity_url) as with_sam_gov_url,
  ROUND(100.0 * COUNT(sam_gov_opportunity_url) / NULLIF(COUNT(*), 0), 1) as coverage_percentage
FROM fpds_contracts;

-- Step 2: Sample contracts with SAM.gov links
SELECT 
  piid,
  vendor_name,
  TO_CHAR(date_signed, 'YYYY-MM-DD') as award_date,
  base_and_exercised_options_value as contract_value,
  solicitation_id,
  sam_gov_opportunity_url,
  usaspending_contract_url
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NOT NULL
ORDER BY date_signed DESC
LIMIT 10;

-- Step 3: Contracts WITHOUT SAM.gov links (for comparison)
SELECT 
  piid,
  vendor_name,
  TO_CHAR(date_signed, 'YYYY-MM-DD') as award_date,
  contract_type,
  solicitation_id,
  CASE 
    WHEN solicitation_id IS NULL OR solicitation_id = '' THEN 'No solicitation_id'
    ELSE 'Has solicitation_id but no URL'
  END as reason
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NULL
ORDER BY date_signed DESC
LIMIT 10;

-- Step 4: Check by contract type
SELECT 
  contract_type,
  COUNT(*) as total,
  COUNT(sam_gov_opportunity_url) as with_sam_link,
  ROUND(100.0 * COUNT(sam_gov_opportunity_url) / COUNT(*), 1) as pct
FROM fpds_contracts
WHERE contract_type IS NOT NULL
GROUP BY contract_type
ORDER BY total DESC
LIMIT 20;

-- Step 5: Check by agency
SELECT 
  contracting_agency_name,
  COUNT(*) as total,
  COUNT(sam_gov_opportunity_url) as with_sam_link,
  ROUND(100.0 * COUNT(sam_gov_opportunity_url) / COUNT(*), 0) as pct
FROM fpds_contracts
WHERE contracting_agency_name IS NOT NULL
GROUP BY contracting_agency_name
ORDER BY total DESC
LIMIT 15;

-- Step 6: Recent contracts (last 30 days)
SELECT 
  TO_CHAR(date_signed, 'YYYY-MM-DD') as award_date,
  piid,
  vendor_name,
  SUBSTRING(description_of_requirement, 1, 80) as description,
  sam_gov_opportunity_url IS NOT NULL as has_sam_link
FROM fpds_contracts
WHERE date_signed >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date_signed DESC
LIMIT 20;

-- Step 7: Test the helper function
SELECT 
  'W911NF-24-R-0045' as solicitation_id,
  generate_sam_gov_url('W911NF-24-R-0045') as generated_url;

-- Step 8: Find high-value contracts with SAM.gov links
SELECT 
  piid,
  vendor_name,
  base_and_exercised_options_value,
  solicitation_id,
  sam_gov_opportunity_url
FROM fpds_contracts
WHERE sam_gov_opportunity_url IS NOT NULL
  AND base_and_exercised_options_value > 1000000
ORDER BY base_and_exercised_options_value DESC
LIMIT 20;

