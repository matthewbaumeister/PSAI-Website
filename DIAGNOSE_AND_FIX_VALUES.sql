-- ============================================
-- DIAGNOSE AND FIX ZERO VALUES ISSUE
-- ============================================

-- STEP 1: Check what value columns have data
SELECT 
  '1. Total contracts' as check_step,
  COUNT(*)::text as result
FROM fpds_contracts
UNION ALL
SELECT 
  '2. With base_and_exercised_options_value > 0',
  COUNT(*)::text
FROM fpds_contracts
WHERE base_and_exercised_options_value > 0
UNION ALL
SELECT 
  '3. With base_and_all_options_value > 0',
  COUNT(*)::text
FROM fpds_contracts
WHERE base_and_all_options_value > 0
UNION ALL
SELECT 
  '4. With dollars_obligated > 0',
  COUNT(*)::text
FROM fpds_contracts
WHERE dollars_obligated > 0
UNION ALL
SELECT 
  '5. With current_total_value_of_award > 0',
  COUNT(*)::text
FROM fpds_contracts
WHERE current_total_value_of_award > 0;

-- STEP 2: Show sample data from actual contracts
SELECT 
  vendor_name,
  base_and_exercised_options_value,
  base_and_all_options_value,
  dollars_obligated,
  current_total_value_of_award,
  date_signed
FROM fpds_contracts
WHERE vendor_name IS NOT NULL
ORDER BY date_signed DESC
LIMIT 20;

-- STEP 3: Find which column has the most non-zero values
WITH value_counts AS (
  SELECT
    'base_and_exercised_options_value' as column_name,
    COUNT(*) FILTER (WHERE base_and_exercised_options_value > 0) as non_zero_count,
    SUM(base_and_exercised_options_value) as total_value
  FROM fpds_contracts
  UNION ALL
  SELECT
    'base_and_all_options_value',
    COUNT(*) FILTER (WHERE base_and_all_options_value > 0),
    SUM(base_and_all_options_value)
  FROM fpds_contracts
  UNION ALL
  SELECT
    'dollars_obligated',
    COUNT(*) FILTER (WHERE dollars_obligated > 0),
    SUM(dollars_obligated)
  FROM fpds_contracts
  UNION ALL
  SELECT
    'current_total_value_of_award',
    COUNT(*) FILTER (WHERE current_total_value_of_award > 0),
    SUM(current_total_value_of_award)
  FROM fpds_contracts
)
SELECT 
  column_name,
  non_zero_count,
  TO_CHAR(total_value, '$999,999,999,999,999') as total_value
FROM value_counts
ORDER BY non_zero_count DESC;

-- ============================================
-- DECISION: Which column should we use?
-- ============================================
-- Look at the results above and use the column with the MOST non-zero values

-- ============================================
-- RE-BUILD fpds_company_stats with correct column
-- ============================================

-- Clean slate
TRUNCATE TABLE fpds_company_stats CASCADE;

-- Choose the BEST value column based on the data above
-- This query uses COALESCE to try multiple columns in order of preference

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
  
  -- Statistics (using COALESCE to fall back to best available value)
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
  
  -- Metrics (using COALESCE)
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

-- ============================================
-- VERIFICATION - Should show REAL values now
-- ============================================

SELECT 
  '✓ Total companies' as metric,
  COUNT(*)::text as value
FROM fpds_company_stats
UNION ALL
SELECT 
  '  With value > $0',
  COUNT(*)::text
FROM fpds_company_stats
WHERE total_value > 0
UNION ALL
SELECT 
  '  With value > $1M',
  COUNT(*)::text
FROM fpds_company_stats
WHERE total_value > 1000000
UNION ALL
SELECT 
  '  With value > $100M',
  COUNT(*)::text
FROM fpds_company_stats
WHERE total_value > 100000000
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ''
UNION ALL
SELECT 
  '💰 Total contract value',
  TO_CHAR(SUM(total_value), '$999,999,999,999')
FROM fpds_company_stats;

-- Top 20 companies by ACTUAL value
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_value DESC) as rank,
  company_name,
  total_contracts,
  TO_CHAR(total_value, '$999,999,999,999') as total_value,
  small_business,
  sbir_contracts,
  TO_CHAR(most_recent_contract_date, 'YYYY-MM-DD') as most_recent
FROM fpds_company_stats
WHERE total_value > 0  -- Only show companies with actual values
ORDER BY total_value DESC
LIMIT 20;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  total_companies INTEGER;
  with_values INTEGER;
  total_value_sum DECIMAL;
BEGIN
  SELECT COUNT(*) INTO total_companies FROM fpds_company_stats;
  SELECT COUNT(*) INTO with_values FROM fpds_company_stats WHERE total_value > 0;
  SELECT SUM(total_value) INTO total_value_sum FROM fpds_company_stats;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✓ DIAGNOSIS COMPLETE                                      ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Total companies: %', total_companies;
  RAISE NOTICE 'Companies with contract values: %', with_values;
  RAISE NOTICE 'Total contract value: $%', ROUND(total_value_sum / 1000000000, 1) || 'B';
  RAISE NOTICE '';
  
  IF with_values < (total_companies * 0.5) THEN
    RAISE WARNING 'Less than 50%% of companies have values - your FPDS data may be incomplete';
  ELSIF with_values > (total_companies * 0.8) THEN
    RAISE NOTICE '✅ GOOD! Over 80%% of companies have contract values';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to enrich! Run: npm run enrich-companies';
  ELSE
    RAISE NOTICE '⚠ ACCEPTABLE: %% of companies have values', ROUND(with_values::numeric / total_companies * 100, 1);
    RAISE NOTICE 'Some contracts may not have value data populated';
  END IF;
  RAISE NOTICE '';
END $$;

