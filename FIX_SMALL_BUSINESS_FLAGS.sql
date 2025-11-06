-- ============================================
-- FIX SMALL BUSINESS FLAGS
-- ============================================
-- SAM.gov has incorrect small business flags for some companies
-- Use FPDS contract data instead (government-verified)
-- ============================================

-- Show the problem
SELECT 
  'PROBLEM: SAM.gov says these are small businesses (WRONG!)' as issue,
  ci.company_name,
  fcs.total_contracts,
  TO_CHAR(fcs.total_value, '$999,999,999,999') as contract_value
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
WHERE ci.is_small_business = TRUE
  AND fcs.total_value > 1000000000  -- Over $1 billion
ORDER BY fcs.total_value DESC;

-- Fix: Override SAM.gov data with FPDS contract data
UPDATE company_intelligence ci
SET 
  is_small_business = fcs.small_business,
  is_woman_owned = fcs.woman_owned,
  is_veteran_owned = fcs.veteran_owned,
  is_service_disabled_veteran_owned = COALESCE(
    fcs.service_disabled_veteran, 
    ci.is_service_disabled_veteran_owned
  ),
  is_hubzone = COALESCE(fcs.hubzone, ci.is_hubzone),
  is_8a_program = COALESCE(fcs.eight_a, ci.is_8a_program)
FROM fpds_company_stats fcs
WHERE fcs.id = ci.fpds_company_stats_id
  AND ci.fpds_company_stats_id IS NOT NULL;

-- Verify the fix
SELECT 
  'FIXED: Using contract data (government-verified)' as status,
  ci.company_name,
  ci.is_small_business,
  fcs.total_contracts,
  TO_CHAR(fcs.total_value, '$999,999,999,999') as contract_value
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY fcs.total_value DESC
LIMIT 10;

-- Summary
SELECT 
  CASE 
    WHEN is_small_business THEN 'Small Business'
    ELSE 'Large Business'
  END as category,
  COUNT(*) as count
FROM company_intelligence
GROUP BY is_small_business
ORDER BY is_small_business DESC;

