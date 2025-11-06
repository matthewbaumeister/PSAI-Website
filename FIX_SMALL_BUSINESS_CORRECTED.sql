-- ============================================
-- FIX SMALL BUSINESS FLAGS - CORRECTED
-- ============================================
-- Uses BOTH SAM.gov AND contract data
-- Correct foreign key relationship
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
LEFT JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
ORDER BY fcs.total_value DESC NULLS LAST;

-- Apply smart fix
UPDATE company_intelligence ci
SET 
  -- Use contract data as primary source (government-verified on each contract)
  is_small_business = COALESCE(fcs.small_business, ci.is_small_business),
  is_woman_owned = COALESCE(fcs.woman_owned, ci.is_woman_owned),
  is_veteran_owned = COALESCE(fcs.veteran_owned, ci.is_veteran_owned),
  is_service_disabled_veteran_owned = COALESCE(fcs.service_disabled_veteran, ci.is_service_disabled_veteran_owned),
  is_hubzone = COALESCE(fcs.hubzone, ci.is_hubzone),
  is_8a_program = COALESCE(fcs.eight_a, ci.is_8a_program)
FROM fpds_company_stats fcs
WHERE fcs.company_intelligence_id = ci.id;

-- Show fixed results
SELECT 
  '✅ FIXED RESULTS' as status,
  ci.company_name,
  ci.is_small_business as "Is Small Business",
  TO_CHAR(fcs.total_value, '$999,999,999,999') as "Contract Value",
  fcs.total_contracts as "Contracts",
  CASE 
    WHEN ci.is_small_business THEN 'Small business'
    WHEN fcs.total_value > 1000000000 THEN 'Large business (>$1B)'
    WHEN fcs.total_value > 100000000 THEN 'Large business (>$100M)'
    ELSE 'Large business'
  END as "Classification"
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
ORDER BY fcs.total_value DESC NULLS LAST;

-- Summary
SELECT 
  '📊 SUMMARY' as metric,
  '' as value
UNION ALL
SELECT 
  'Total companies',
  COUNT(*)::text
FROM company_intelligence
UNION ALL
SELECT 
  'Small businesses',
  COUNT(*)::text || ' (' || ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM company_intelligence) * 100) || '%)'
FROM company_intelligence
WHERE is_small_business = TRUE
UNION ALL
SELECT 
  'Large businesses',
  COUNT(*)::text || ' (' || ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM company_intelligence) * 100) || '%)'
FROM company_intelligence
WHERE is_small_business = FALSE OR is_small_business IS NULL;

-- Detail view
SELECT 
  ci.company_name as "Company",
  ci.headquarters_city || ', ' || ci.headquarters_state as "Location",
  CASE WHEN ci.is_small_business THEN '✓' ELSE '✗' END as "SB",
  CASE WHEN ci.is_woman_owned THEN '✓' ELSE '' END as "WO",
  CASE WHEN ci.is_veteran_owned THEN '✓' ELSE '' END as "VO",
  COALESCE(TO_CHAR(fcs.total_value / 1000000, '$999,999') || 'M', 'N/A') as "Value",
  COALESCE(fcs.total_contracts::text, 'N/A') as "Contracts"
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
ORDER BY fcs.total_value DESC NULLS LAST;

