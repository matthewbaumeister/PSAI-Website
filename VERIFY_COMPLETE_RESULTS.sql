-- =====================================================
-- COMPREHENSIVE DoD Enhancement Verification
-- Shows ALL results in one consolidated output
-- =====================================================

-- =====================================================
-- 1. OVERALL DATA COVERAGE SUMMARY (Run this first)
-- =====================================================
SELECT 
  '=== DATA COVERAGE SUMMARY ===' as section,
  COUNT(*) as total_contracts,
  
  -- Basic fields (should be 100%)
  ROUND(100.0 * COUNT(vendor_state) / COUNT(*), 1) as vendor_state_pct,
  ROUND(100.0 * COUNT(award_amount) / COUNT(*), 1) as award_amount_pct,
  
  -- NEW Enhanced fields
  ROUND(100.0 * COUNT(contract_types) / COUNT(*), 1) as contract_types_pct,
  ROUND(100.0 * COUNT(cumulative_value_with_options) / COUNT(*), 1) as cumulative_value_pct,
  ROUND(100.0 * COUNT(performance_location_breakdown) / COUNT(*), 1) as perf_location_breakdown_pct,
  ROUND(100.0 * COUNT(funding_sources) / COUNT(*), 1) as funding_sources_pct,
  
  -- Contract Type Counts
  COUNT(*) FILTER (WHERE is_idiq = true) as idiq_count,
  COUNT(*) FILTER (WHERE is_fms = true) as fms_count,
  COUNT(*) FILTER (WHERE is_competed = false) as sole_source_count,
  COUNT(*) FILTER (WHERE is_sbir = true) as sbir_count,
  COUNT(*) FILTER (WHERE has_options = true) as has_options_count,
  COUNT(*) FILTER (WHERE is_modification = true) as modification_count
  
FROM dod_contract_news;

-- =====================================================
-- 2. TOP 10 CONTRACTS WITH ALL ENHANCED FIELDS
-- =====================================================
SELECT 
  vendor_name,
  vendor_state,
  award_amount,
  
  -- NEW: Contract Types
  contract_types,
  is_idiq,
  is_multiple_award,
  
  -- NEW: Options & Cumulative Value
  has_options,
  cumulative_value_with_options,
  base_contract_value,
  options_value,
  
  -- NEW: FMS
  is_fms,
  fms_countries,
  
  -- NEW: Competition
  is_competed,
  competition_type,
  
  -- NEW: Modifications
  is_modification,
  
  -- NEW: SBIR
  is_sbir,
  sbir_phase,
  
  data_quality_score
FROM dod_contract_news
ORDER BY award_amount DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- 3. PERFORMANCE LOCATION BREAKDOWN EXAMPLES
-- =====================================================
SELECT 
  '=== PERFORMANCE LOCATIONS (JSONB) ===' as section,
  vendor_name,
  award_amount,
  performance_location_breakdown
FROM dod_contract_news
WHERE performance_location_breakdown IS NOT NULL
  AND performance_location_breakdown != '[]'::jsonb
ORDER BY award_amount DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 4. FUNDING SOURCES BREAKDOWN EXAMPLES
-- =====================================================
SELECT 
  '=== FUNDING SOURCES (JSONB) ===' as section,
  vendor_name,
  award_amount,
  funding_sources,
  total_obligated_amount
FROM dod_contract_news
WHERE funding_sources IS NOT NULL
  AND funding_sources != '[]'::jsonb
ORDER BY award_amount DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 5. IDIQ CONTRACTS (Most Valuable)
-- =====================================================
SELECT 
  '=== TOP IDIQ CONTRACTS ===' as section,
  vendor_name,
  vendor_state,
  award_amount,
  cumulative_value_with_options,
  contract_types,
  number_of_awardees,
  is_multiple_award
FROM dod_contract_news
WHERE is_idiq = true
ORDER BY cumulative_value_with_options DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 6. FMS CONTRACTS (Foreign Military Sales)
-- =====================================================
SELECT 
  '=== FOREIGN MILITARY SALES ===' as section,
  vendor_name,
  vendor_state,
  award_amount,
  fms_countries,
  fms_amount,
  fms_percentage
FROM dod_contract_news
WHERE is_fms = true
ORDER BY fms_amount DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 7. SBIR/STTR CONTRACTS
-- =====================================================
SELECT 
  '=== SBIR/STTR CONTRACTS ===' as section,
  vendor_name,
  vendor_state,
  award_amount,
  sbir_phase,
  is_sbir_sole_source,
  contract_types
FROM dod_contract_news
WHERE is_sbir = true
ORDER BY award_amount DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 8. SOLE SOURCE CONTRACTS
-- =====================================================
SELECT 
  '=== SOLE SOURCE CONTRACTS ===' as section,
  vendor_name,
  vendor_state,
  award_amount,
  non_compete_authority,
  non_compete_justification,
  competition_type
FROM dod_contract_news
WHERE is_competed = false
ORDER BY award_amount DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 9. CONTRACTS WITH OPTIONS
-- =====================================================
SELECT 
  '=== CONTRACTS WITH OPTIONS ===' as section,
  vendor_name,
  vendor_state,
  award_amount as base_value,
  options_value,
  cumulative_value_with_options,
  options_period_end_date
FROM dod_contract_news
WHERE has_options = true
ORDER BY cumulative_value_with_options DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 10. MODIFICATION CONTRACTS
-- =====================================================
SELECT 
  '=== MODIFICATION CONTRACTS ===' as section,
  vendor_name,
  vendor_state,
  award_amount,
  modification_number,
  base_contract_number,
  modification_type,
  is_option_exercise
FROM dod_contract_news
WHERE is_modification = true
ORDER BY award_amount DESC NULLS LAST
LIMIT 5;

