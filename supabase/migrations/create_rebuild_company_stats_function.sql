-- ============================================
-- STORED PROCEDURE: Rebuild Company Stats
-- ============================================
-- Makes daily rebuilds fast and efficient
-- Called by: cron/daily-company-update.ts
-- ============================================

CREATE OR REPLACE FUNCTION rebuild_company_stats_from_fpds()
RETURNS TABLE (
  companies_created INTEGER,
  total_value_sum DECIMAL,
  duration_seconds DECIMAL
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  companies_count INTEGER;
  value_sum DECIMAL;
BEGIN
  start_time := clock_timestamp();
  
  -- Clear existing stats
  TRUNCATE TABLE fpds_company_stats CASCADE;
  
  -- Rebuild from FPDS contracts
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
    
    -- Statistics (using COALESCE to handle NULLs and try multiple columns)
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
  
  -- Get stats
  SELECT COUNT(*), COALESCE(SUM(total_value), 0)
  INTO companies_count, value_sum
  FROM fpds_company_stats;
  
  end_time := clock_timestamp();
  
  -- Return results
  RETURN QUERY
  SELECT 
    companies_count,
    value_sum,
    EXTRACT(EPOCH FROM (end_time - start_time))::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Test the function
-- ============================================

SELECT * FROM rebuild_company_stats_from_fpds();

-- Should return something like:
-- companies_created | total_value_sum      | duration_seconds
-- 3247              | 12543234567.89       | 4.23

-- ============================================
-- Grant permissions
-- ============================================

-- Allow service role to execute
GRANT EXECUTE ON FUNCTION rebuild_company_stats_from_fpds() TO service_role;
GRANT EXECUTE ON FUNCTION rebuild_company_stats_from_fpds() TO authenticated;

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Stored procedure created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'This function can now be called from TypeScript:';
  RAISE NOTICE '  await supabase.rpc(''rebuild_company_stats_from_fpds'')';
  RAISE NOTICE '';
  RAISE NOTICE 'It will automatically rebuild company stats from contracts';
  RAISE NOTICE 'and return: companies_created, total_value, duration';
  RAISE NOTICE '';
END $$;

