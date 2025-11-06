-- ============================================
-- SIMPLE COMPANY REBUILD
-- ============================================
-- One script, no errors, just works
-- ============================================

-- Step 1: Clear existing data
TRUNCATE TABLE fpds_company_stats CASCADE;

-- Step 2: Rebuild from contracts
INSERT INTO fpds_company_stats (
  company_name,
  vendor_uei,
  vendor_duns,
  total_contracts,
  total_value,
  total_obligated,
  sbir_contracts,
  sbir_value,
  phase_1_contracts,
  phase_2_contracts,
  phase_3_contracts,
  dod_contracts,
  dod_value,
  first_contract_date,
  most_recent_contract_date,
  years_active,
  top_naics_codes,
  top_psc_codes,
  top_agencies,
  primary_place_of_performance_state,
  small_business,
  woman_owned,
  veteran_owned,
  service_disabled_veteran,
  hubzone,
  eight_a,
  avg_contract_value,
  median_contract_value,
  largest_contract_value,
  last_updated
)
SELECT 
  vendor_name as company_name,
  MAX(vendor_uei) as vendor_uei,
  MAX(vendor_duns) as vendor_duns,
  
  -- Statistics
  COUNT(*) as total_contracts,
  SUM(COALESCE(
    base_and_exercised_options_value,
    current_total_value_of_award,
    base_and_all_options_value,
    dollars_obligated,
    0
  )) as total_value,
  SUM(COALESCE(dollars_obligated, 0)) as total_obligated,
  
  -- SBIR
  COUNT(*) FILTER (WHERE sbir_phase IS NOT NULL) as sbir_contracts,
  SUM(COALESCE(
    base_and_exercised_options_value,
    current_total_value_of_award,
    base_and_all_options_value,
    dollars_obligated,
    0
  )) FILTER (WHERE sbir_phase IS NOT NULL) as sbir_value,
  COUNT(*) FILTER (WHERE sbir_phase = 'Phase I') as phase_1_contracts,
  COUNT(*) FILTER (WHERE sbir_phase = 'Phase II') as phase_2_contracts,
  COUNT(*) FILTER (WHERE sbir_phase = 'Phase III') as phase_3_contracts,
  
  -- DoD
  COUNT(*) FILTER (WHERE 
    contracting_agency_name ILIKE '%DEFENSE%' OR 
    contracting_agency_name ILIKE '%ARMY%' OR 
    contracting_agency_name ILIKE '%NAVY%' OR 
    contracting_agency_name ILIKE '%AIR FORCE%'
  ) as dod_contracts,
  SUM(COALESCE(
    base_and_exercised_options_value,
    current_total_value_of_award,
    base_and_all_options_value,
    dollars_obligated,
    0
  )) FILTER (WHERE 
    contracting_agency_name ILIKE '%DEFENSE%' OR 
    contracting_agency_name ILIKE '%ARMY%' OR 
    contracting_agency_name ILIKE '%NAVY%' OR 
    contracting_agency_name ILIKE '%AIR FORCE%'
  ) as dod_value,
  
  -- Timeline
  MIN(date_signed) as first_contract_date,
  MAX(date_signed) as most_recent_contract_date,
  EXTRACT(YEAR FROM AGE(MAX(date_signed), MIN(date_signed)))::INTEGER as years_active,
  
  -- Patterns
  (ARRAY_AGG(DISTINCT naics_code ORDER BY naics_code) FILTER (WHERE naics_code IS NOT NULL))[1:10] as top_naics_codes,
  (ARRAY_AGG(DISTINCT psc_code ORDER BY psc_code) FILTER (WHERE psc_code IS NOT NULL))[1:10] as top_psc_codes,
  (ARRAY_AGG(DISTINCT contracting_agency_name ORDER BY contracting_agency_name) FILTER (WHERE contracting_agency_name IS NOT NULL))[1:10] as top_agencies,
  MODE() WITHIN GROUP (ORDER BY place_of_performance_state) as primary_place_of_performance_state,
  
  -- Socioeconomic
  BOOL_OR(small_business) as small_business,
  BOOL_OR(woman_owned_small_business) as woman_owned,
  BOOL_OR(veteran_owned_small_business) as veteran_owned,
  BOOL_OR(service_disabled_veteran_owned) as service_disabled_veteran,
  BOOL_OR(hubzone_small_business) as hubzone,
  BOOL_OR(eight_a_program_participant) as eight_a,
  
  -- Metrics
  AVG(COALESCE(
    base_and_exercised_options_value,
    current_total_value_of_award,
    base_and_all_options_value,
    dollars_obligated,
    0
  )) as avg_contract_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(
    base_and_exercised_options_value,
    current_total_value_of_award,
    base_and_all_options_value,
    dollars_obligated,
    0
  )) as median_contract_value,
  MAX(COALESCE(
    base_and_exercised_options_value,
    current_total_value_of_award,
    base_and_all_options_value,
    dollars_obligated,
    0
  )) as largest_contract_value,
  
  NOW() as last_updated
  
FROM fpds_contracts
WHERE vendor_name IS NOT NULL
  AND vendor_name != ''
  AND vendor_name != 'MULTIPLE VENDORS'
GROUP BY vendor_name
HAVING COUNT(*) > 0;

-- Step 3: Show summary
SELECT 
  'Total companies' as metric,
  COUNT(*)::text as value
FROM fpds_company_stats
UNION ALL
SELECT 
  'With UEI',
  COUNT(*)::text
FROM fpds_company_stats
WHERE vendor_uei IS NOT NULL AND vendor_uei != ''
UNION ALL
SELECT 
  'With values > $0',
  COUNT(*)::text
FROM fpds_company_stats
WHERE total_value > 0
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
WHERE sbir_contracts > 0;

-- Step 4: Show top 20 by value
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_value DESC) as rank,
  company_name,
  total_contracts,
  TO_CHAR(total_value, '$999,999,999,999') as total_value,
  small_business,
  sbir_contracts,
  TO_CHAR(most_recent_contract_date, 'YYYY-MM-DD') as most_recent
FROM fpds_company_stats
WHERE total_value > 0
ORDER BY total_value DESC
LIMIT 20;

