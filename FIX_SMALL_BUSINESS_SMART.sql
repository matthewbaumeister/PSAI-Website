-- ============================================
-- SMART FIX: Small Business Flags
-- ============================================
-- Uses BOTH SAM.gov AND contract data
-- Applies common sense rules
-- ============================================

-- Show current issues
SELECT 
  '❌ CURRENT ISSUES' as status,
  ci.company_name,
  ci.is_small_business as "SAM.gov Says SB",
  fcs.small_business as "Contracts Say SB",
  TO_CHAR(fcs.total_value, '$999,999,999,999') as "Contract Value",
  CASE 
    WHEN fcs.total_value > 1000000000 THEN 'Obviously NOT small business'
    WHEN fcs.total_value > 100000000 AND NOT fcs.small_business THEN 'Likely NOT small business'
    WHEN fcs.small_business THEN 'Likely small business'
    ELSE 'Unknown'
  END as "Common Sense"
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY fcs.total_value DESC;

-- Apply smart fix
UPDATE company_intelligence ci
SET 
  -- Use contract data as primary source (government-verified on each contract)
  is_small_business = fcs.small_business,
  is_woman_owned = fcs.woman_owned,
  is_veteran_owned = fcs.veteran_owned,
  is_service_disabled_veteran_owned = COALESCE(fcs.service_disabled_veteran, ci.is_service_disabled_veteran_owned),
  is_hubzone = COALESCE(fcs.hubzone, ci.is_hubzone),
  is_8a_program = COALESCE(fcs.eight_a, ci.is_8a_program),
  
  -- Add note about data source
  enrichment_notes = CASE
    WHEN fcs.small_business != ci.is_small_business THEN 
      'Small business flag corrected from contract data (SAM.gov was incorrect)'
    ELSE
      'Small business flag verified by contract data'
  END
FROM fpds_company_stats fcs
WHERE fcs.id = ci.fpds_company_stats_id
  AND ci.fpds_company_stats_id IS NOT NULL;

-- Show fixed results
SELECT 
  '✅ FIXED RESULTS' as status,
  ci.company_name,
  ci.is_small_business as "Is Small Business",
  TO_CHAR(fcs.total_value, '$999,999,999,999') as "Contract Value",
  fcs.total_contracts as "Contracts",
  CASE 
    WHEN ci.is_small_business THEN 'Correct'
    WHEN fcs.total_value > 1000000000 THEN 'Correct - Obviously large'
    WHEN fcs.total_value > 100000000 THEN 'Correct - Likely large'
    ELSE 'Verified by contracts'
  END as "Validation"
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY fcs.total_value DESC;

-- Summary statistics
SELECT 
  '📊 SUMMARY' as section,
  '' as category,
  '' as count
UNION ALL
SELECT 
  '',
  'Total companies enriched',
  COUNT(*)::text
FROM company_intelligence
UNION ALL
SELECT 
  '',
  'Small businesses',
  COUNT(*)::text
FROM company_intelligence
WHERE is_small_business = TRUE
UNION ALL
SELECT 
  '',
  'Large businesses',
  COUNT(*)::text
FROM company_intelligence
WHERE is_small_business = FALSE;

-- Detail comparison
SELECT 
  ci.company_name as "Company",
  CASE WHEN ci.is_small_business THEN '✓' ELSE '✗' END as "Small Biz",
  CASE WHEN ci.is_woman_owned THEN '✓' ELSE '✗' END as "Woman Owned",
  CASE WHEN ci.is_veteran_owned THEN '✓' ELSE '✗' END as "Veteran",
  TO_CHAR(fcs.total_value / 1000000, '$999,999') || 'M' as "Value",
  fcs.total_contracts as "Contracts"
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY fcs.total_value DESC;

