-- =====================================================
-- Verify Enhanced DoD Contract Data Extraction
-- =====================================================

-- 1. Check Basic Fields + NEW Enhanced Fields
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
  base_contract_value,
  options_value,
  cumulative_value_with_options,
  
  -- NEW: Foreign Military Sales
  is_fms,
  fms_countries,
  fms_amount,
  
  -- NEW: Competition
  is_competed,
  competition_type,
  number_of_offers_received,
  
  -- NEW: Modifications
  is_modification,
  modification_number,
  
  -- NEW: SBIR
  is_sbir,
  sbir_phase,
  
  data_quality_score
FROM dod_contract_news
ORDER BY award_amount DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- 2. Check Performance Location Breakdown (JSONB)
-- =====================================================
SELECT 
  vendor_name,
  award_amount,
  performance_location_breakdown
FROM dod_contract_news
WHERE performance_location_breakdown IS NOT NULL
LIMIT 5;

-- =====================================================
-- 3. Check Funding Sources (JSONB)
-- =====================================================
SELECT 
  vendor_name,
  award_amount,
  funding_sources,
  total_obligated_amount
FROM dod_contract_news
WHERE funding_sources IS NOT NULL
LIMIT 5;

-- =====================================================
-- 4. Summary: Data Coverage Improvement
-- =====================================================
SELECT 
  COUNT(*) as total_contracts,
  
  -- Basic fields (should be 100%)
  ROUND(100.0 * COUNT(vendor_state) / COUNT(*), 1) as vendor_state_pct,
  ROUND(100.0 * COUNT(award_amount) / COUNT(*), 1) as award_amount_pct,
  
  -- NEW Enhanced fields
  ROUND(100.0 * COUNT(contract_types) / COUNT(*), 1) as contract_types_pct,
  ROUND(100.0 * COUNT(cumulative_value_with_options) / COUNT(*), 1) as cumulative_value_pct,
  ROUND(100.0 * COUNT(performance_location_breakdown) / COUNT(*), 1) as perf_location_breakdown_pct,
  ROUND(100.0 * COUNT(funding_sources) / COUNT(*), 1) as funding_sources_pct,
  
  -- Flags
  COUNT(*) FILTER (WHERE is_idiq = true) as idiq_count,
  COUNT(*) FILTER (WHERE is_fms = true) as fms_count,
  COUNT(*) FILTER (WHERE is_competed = false) as sole_source_count,
  COUNT(*) FILTER (WHERE is_sbir = true) as sbir_count,
  COUNT(*) FILTER (WHERE has_options = true) as has_options_count,
  COUNT(*) FILTER (WHERE is_modification = true) as modification_count
  
FROM dod_contract_news;

-- =====================================================
-- 5. Test the NEW Views
-- =====================================================

-- IDIQ Contracts
SELECT COUNT(*) as idiq_contracts FROM dod_idiq_contracts;

-- FMS Contracts
SELECT COUNT(*) as fms_contracts FROM dod_fms_contracts;

-- SBIR Contracts
SELECT COUNT(*) as sbir_contracts FROM dod_sbir_contracts;

-- Sole Source Contracts
SELECT COUNT(*) as sole_source_contracts FROM dod_sole_source_contracts;

-- Contracts with Options
SELECT COUNT(*) as contracts_with_options FROM dod_contracts_with_options;

-- =====================================================
-- 6. Sample of IDIQ Contracts (most valuable)
-- =====================================================
SELECT 
  vendor_name,
  award_amount,
  cumulative_value_with_options,
  service_branch,
  number_of_awardees,
  is_multiple_award
FROM dod_idiq_contracts
ORDER BY cumulative_value_with_options DESC NULLS LAST
LIMIT 5;

