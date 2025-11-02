-- =====================================================
-- SINGLE VIEW: Complete DoD Enhancement Verification
-- Shows ALL contracts with ALL enhanced fields
-- =====================================================

SELECT 
  -- Basic Info
  vendor_name,
  vendor_city,
  vendor_state,
  vendor_location,
  contract_number,
  award_amount,
  service_branch,
  
  -- NEW: Contract Types & Structure
  contract_types,
  is_idiq,
  is_multiple_award,
  is_hybrid_contract,
  
  -- NEW: Options & Cumulative Value
  has_options,
  base_contract_value,
  options_value,
  cumulative_value_with_options,
  options_period_end_date,
  
  -- NEW: Foreign Military Sales
  is_fms,
  fms_countries,
  fms_amount,
  fms_percentage,
  
  -- NEW: Competition
  is_competed,
  competition_type,
  number_of_offers_received,
  non_compete_authority,
  non_compete_justification,
  
  -- NEW: Modifications
  is_modification,
  modification_number,
  base_contract_number,
  modification_type,
  is_option_exercise,
  
  -- NEW: SBIR/STTR
  is_sbir,
  sbir_phase,
  is_sbir_sole_source,
  
  -- NEW: Multiple Award Info
  number_of_awardees,
  is_combined_announcement,
  
  -- NEW: Performance Locations (JSONB)
  performance_location_breakdown,
  
  -- NEW: Funding (JSONB)
  funding_sources,
  total_obligated_amount,
  funds_expire,
  
  -- NEW: Set-Aside
  is_small_business_set_aside,
  set_aside_type,
  
  -- Quality
  data_quality_score,
  parsing_confidence,
  
  -- Dates
  published_date,
  completion_date,
  scraped_at

FROM dod_contract_news
ORDER BY award_amount DESC NULLS LAST;

-- This shows ALL 48 contracts with ALL enhanced fields
-- Scroll right to see all the new columns!

