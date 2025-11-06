-- ============================================
-- CREATE COMPANY STATS FROM FPDS CONTRACTS
-- ============================================
-- This aggregates 47,429 contracts into unique companies
-- for enrichment with SAM.gov and SEC data
-- ============================================

-- First, let's see what we have
SELECT 
  COUNT(*) as total_contracts,
  COUNT(DISTINCT vendor_name) as unique_companies,
  COUNT(DISTINCT vendor_uei) as unique_ueis
FROM fpds_contracts
WHERE vendor_name IS NOT NULL;

-- ============================================
-- Create company_stats from contracts
-- ============================================

INSERT INTO fpds_company_stats (
  company_name,
  vendor_uei,
  vendor_duns,
  vendor_cage_code,
  vendor_address,
  vendor_city,
  vendor_state,
  vendor_zip,
  vendor_country,
  parent_company_name,
  parent_uei,
  parent_duns,
  
  -- Socioeconomic flags
  small_business,
  woman_owned_small_business,
  veteran_owned_small_business,
  service_disabled_veteran_owned,
  hubzone_small_business,
  eight_a_program_participant,
  
  -- Classification
  primary_naics_code,
  primary_naics_description,
  primary_psc_code,
  primary_psc_description,
  
  -- Contract Statistics
  total_contracts,
  total_value,
  total_obligated,
  
  -- SBIR Specific
  sbir_contracts,
  sbir_value,
  phase_1_contracts,
  phase_2_contracts,
  phase_3_contracts,
  
  -- By Agency
  dod_contracts,
  dod_value,
  
  -- Timeline
  first_contract_date,
  most_recent_contract_date,
  years_active,
  
  -- Patterns
  top_naics_codes,
  top_psc_codes,
  top_agencies,
  primary_place_of_performance_state,
  
  -- Success Metrics
  avg_contract_value,
  median_contract_value,
  largest_contract_value,
  
  last_updated
)
SELECT 
  vendor_name as company_name,
  
  -- Take most common/recent values for company identifiers
  MAX(vendor_uei) as vendor_uei,
  MAX(vendor_duns) as vendor_duns,
  MAX(vendor_cage_code) as vendor_cage_code,
  MAX(vendor_address) as vendor_address,
  MAX(vendor_city) as vendor_city,
  MAX(vendor_state) as vendor_state,
  MAX(vendor_zip) as vendor_zip,
  MAX(vendor_country) as vendor_country,
  MAX(parent_company_name) as parent_company_name,
  MAX(parent_uei) as parent_uei,
  MAX(parent_duns) as parent_duns,
  
  -- Socioeconomic (TRUE if ANY contract has it)
  BOOL_OR(small_business) as small_business,
  BOOL_OR(woman_owned_small_business) as woman_owned_small_business,
  BOOL_OR(veteran_owned_small_business) as veteran_owned_small_business,
  BOOL_OR(service_disabled_veteran_owned) as service_disabled_veteran_owned,
  BOOL_OR(hubzone_small_business) as hubzone_small_business,
  BOOL_OR(eight_a_program_participant) as eight_a_program_participant,
  
  -- Most common classifications
  MODE() WITHIN GROUP (ORDER BY naics_code) as primary_naics_code,
  MODE() WITHIN GROUP (ORDER BY naics_description) as primary_naics_description,
  MODE() WITHIN GROUP (ORDER BY psc_code) as primary_psc_code,
  MODE() WITHIN GROUP (ORDER BY psc_description) as primary_psc_description,
  
  -- Contract Statistics
  COUNT(*) as total_contracts,
  SUM(base_and_exercised_options_value) as total_value,
  SUM(dollars_obligated) as total_obligated,
  
  -- SBIR Specific
  COUNT(*) FILTER (WHERE sbir_phase IS NOT NULL) as sbir_contracts,
  SUM(base_and_exercised_options_value) FILTER (WHERE sbir_phase IS NOT NULL) as sbir_value,
  COUNT(*) FILTER (WHERE sbir_phase = 'Phase I') as phase_1_contracts,
  COUNT(*) FILTER (WHERE sbir_phase = 'Phase II') as phase_2_contracts,
  COUNT(*) FILTER (WHERE sbir_phase = 'Phase III') as phase_3_contracts,
  
  -- By Agency (DoD focus)
  COUNT(*) FILTER (WHERE contracting_agency_name ILIKE '%DEFENSE%' OR contracting_agency_name ILIKE '%ARMY%' OR contracting_agency_name ILIKE '%NAVY%' OR contracting_agency_name ILIKE '%AIR FORCE%') as dod_contracts,
  SUM(base_and_exercised_options_value) FILTER (WHERE contracting_agency_name ILIKE '%DEFENSE%' OR contracting_agency_name ILIKE '%ARMY%' OR contracting_agency_name ILIKE '%NAVY%' OR contracting_agency_name ILIKE '%AIR FORCE%') as dod_value,
  
  -- Timeline
  MIN(date_signed) as first_contract_date,
  MAX(date_signed) as most_recent_contract_date,
  EXTRACT(YEAR FROM AGE(MAX(date_signed), MIN(date_signed))) as years_active,
  
  -- Patterns (top 5 of each)
  ARRAY_AGG(DISTINCT naics_code ORDER BY naics_code) FILTER (WHERE naics_code IS NOT NULL) as top_naics_codes,
  ARRAY_AGG(DISTINCT psc_code ORDER BY psc_code) FILTER (WHERE psc_code IS NOT NULL) as top_psc_codes,
  ARRAY_AGG(DISTINCT contracting_agency_name ORDER BY contracting_agency_name) FILTER (WHERE contracting_agency_name IS NOT NULL) as top_agencies,
  MODE() WITHIN GROUP (ORDER BY place_of_performance_state) as primary_place_of_performance_state,
  
  -- Success Metrics
  AVG(base_and_exercised_options_value) as avg_contract_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_and_exercised_options_value) as median_contract_value,
  MAX(base_and_exercised_options_value) as largest_contract_value,
  
  NOW() as last_updated
  
FROM fpds_contracts
WHERE vendor_name IS NOT NULL
GROUP BY vendor_name
ORDER BY total_value DESC;

-- ============================================
-- Verification
-- ============================================

-- Check the results
SELECT 
  'Total companies created' as metric,
  COUNT(*)::text as value
FROM fpds_company_stats
UNION ALL
SELECT 
  'Companies with UEI',
  COUNT(*)::text
FROM fpds_company_stats
WHERE vendor_uei IS NOT NULL
UNION ALL
SELECT 
  'Small businesses',
  COUNT(*)::text
FROM fpds_company_stats
WHERE small_business = TRUE
UNION ALL
SELECT 
  'SBIR contractors',
  COUNT(*)::text
FROM fpds_company_stats
WHERE sbir_contracts > 0
UNION ALL
SELECT 
  'Total contract value',
  TO_CHAR(SUM(total_value), '$999,999,999,999')
FROM fpds_company_stats;

-- Show top 20 companies
SELECT 
  company_name,
  vendor_state,
  total_contracts,
  TO_CHAR(total_value, '$999,999,999') as total_value,
  small_business,
  sbir_contracts,
  most_recent_contract_date
FROM fpds_company_stats
ORDER BY total_value DESC
LIMIT 20;

-- ============================================
-- SUCCESS!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Company stats created from FPDS contracts!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run enrichment script';
  RAISE NOTICE '  npm run enrich-companies';
  RAISE NOTICE '';
  RAISE NOTICE 'This will enrich companies with:';
  RAISE NOTICE '  - SAM.gov Entity data (business structure, contact)';
  RAISE NOTICE '  - SEC EDGAR data (public company financials)';
  RAISE NOTICE '  - Cost: $0 (FREE!)';
END $$;

