-- ============================================
-- BUILD MASTER COMPANY LIST - ONE UNIFIED SCRIPT
-- ============================================
-- This creates fpds_company_stats from ALL your data sources:
-- 1. FPDS Contracts (47,429 contracts)
-- 2. DoD Contract News (vendors mentioned)
-- 3. SAM.gov Opportunities (awardees)
-- 4. Army Innovation Submissions (winners)
--
-- Run this ONCE, then run: npm run enrich-companies
-- ============================================

-- Clean start (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE fpds_company_stats CASCADE;

-- ============================================
-- STEP 1: Aggregate from FPDS Contracts
-- ============================================

INSERT INTO fpds_company_stats (
  company_name,
  vendor_uei,
  vendor_duns,
  vendor_address,
  vendor_city,
  vendor_state,
  vendor_zip,
  parent_company_name,
  
  small_business,
  woman_owned_small_business,
  veteran_owned_small_business,
  service_disabled_veteran_owned,
  hubzone_small_business,
  eight_a_program_participant,
  
  total_contracts,
  total_value,
  total_obligated,
  
  sbir_contracts,
  sbir_value,
  
  dod_contracts,
  dod_value,
  
  first_contract_date,
  most_recent_contract_date,
  
  last_updated
)
SELECT 
  vendor_name as company_name,
  MAX(vendor_uei) as vendor_uei,
  MAX(vendor_duns) as vendor_duns,
  MAX(vendor_address) as vendor_address,
  MAX(vendor_city) as vendor_city,
  MAX(vendor_state) as vendor_state,
  MAX(vendor_zip) as vendor_zip,
  MAX(parent_company_name) as parent_company_name,
  
  -- Socioeconomic
  BOOL_OR(small_business) as small_business,
  BOOL_OR(woman_owned_small_business) as woman_owned_small_business,
  BOOL_OR(veteran_owned_small_business) as veteran_owned_small_business,
  BOOL_OR(service_disabled_veteran_owned) as service_disabled_veteran_owned,
  BOOL_OR(hubzone_small_business) as hubzone_small_business,
  BOOL_OR(eight_a_program_participant) as eight_a_program_participant,
  
  -- Statistics
  COUNT(*) as total_contracts,
  SUM(COALESCE(base_and_exercised_options_value, 0)) as total_value,
  SUM(COALESCE(dollars_obligated, 0)) as total_obligated,
  
  -- SBIR
  COUNT(*) FILTER (WHERE sbir_phase IS NOT NULL) as sbir_contracts,
  SUM(COALESCE(base_and_exercised_options_value, 0)) FILTER (WHERE sbir_phase IS NOT NULL) as sbir_value,
  
  -- DoD
  COUNT(*) FILTER (WHERE 
    contracting_agency_name ILIKE '%DEFENSE%' OR 
    contracting_agency_name ILIKE '%ARMY%' OR 
    contracting_agency_name ILIKE '%NAVY%' OR 
    contracting_agency_name ILIKE '%AIR FORCE%'
  ) as dod_contracts,
  SUM(COALESCE(base_and_exercised_options_value, 0)) FILTER (WHERE 
    contracting_agency_name ILIKE '%DEFENSE%' OR 
    contracting_agency_name ILIKE '%ARMY%' OR 
    contracting_agency_name ILIKE '%NAVY%' OR 
    contracting_agency_name ILIKE '%AIR FORCE%'
  ) as dod_value,
  
  -- Timeline
  MIN(date_signed) as first_contract_date,
  MAX(date_signed) as most_recent_contract_date,
  
  NOW() as last_updated
  
FROM fpds_contracts
WHERE vendor_name IS NOT NULL
  AND vendor_name != ''
GROUP BY vendor_name
ORDER BY total_value DESC;

-- ============================================
-- STEP 2: Add companies from DoD Contract News
-- ============================================

INSERT INTO fpds_company_stats (
  company_name,
  vendor_city,
  vendor_state,
  total_contracts,
  total_value,
  dod_contracts,
  dod_value,
  most_recent_contract_date,
  last_updated
)
SELECT DISTINCT ON (vendor_name)
  vendor_name as company_name,
  vendor_city,
  vendor_state,
  1 as total_contracts,
  COALESCE(contract_value, 0) as total_value,
  1 as dod_contracts,
  COALESCE(contract_value, 0) as dod_value,
  announcement_date as most_recent_contract_date,
  NOW() as last_updated
FROM dod_contract_news
WHERE vendor_name IS NOT NULL
  AND vendor_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM fpds_company_stats fcs 
    WHERE fcs.company_name = dod_contract_news.vendor_name
  )
ORDER BY vendor_name, announcement_date DESC;

-- ============================================
-- STEP 3: Add companies from SAM.gov Opportunities
-- ============================================

INSERT INTO fpds_company_stats (
  company_name,
  vendor_uei,
  vendor_duns,
  total_contracts,
  total_value,
  most_recent_contract_date,
  last_updated
)
SELECT DISTINCT ON (awardee_name)
  awardee_name as company_name,
  awardee_uei as vendor_uei,
  awardee_duns as vendor_duns,
  1 as total_contracts,
  COALESCE(award_dollars, 0) as total_value,
  award_date as most_recent_contract_date,
  NOW() as last_updated
FROM sam_gov_opportunities
WHERE awardee_name IS NOT NULL
  AND awardee_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM fpds_company_stats fcs 
    WHERE fcs.company_name = sam_gov_opportunities.awardee_name
  )
ORDER BY awardee_name, award_date DESC NULLS LAST;

-- ============================================
-- STEP 4: Add companies from Army Innovation
-- ============================================

INSERT INTO fpds_company_stats (
  company_name,
  vendor_city,
  vendor_state,
  small_business,
  total_contracts,
  total_value,
  most_recent_contract_date,
  last_updated
)
SELECT DISTINCT ON (company_name)
  company_name,
  company_location as vendor_city,
  company_state as vendor_state,
  is_small_business as small_business,
  1 as total_contracts,
  COALESCE(award_amount, 0) as total_value,
  award_date as most_recent_contract_date,
  NOW() as last_updated
FROM army_innovation_submissions
WHERE company_name IS NOT NULL
  AND company_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM fpds_company_stats fcs 
    WHERE fcs.company_name = army_innovation_submissions.company_name
  )
ORDER BY company_name, award_date DESC NULLS LAST;

-- ============================================
-- VERIFICATION & SUMMARY
-- ============================================

-- Summary stats
SELECT 
  '✓ STEP 1: Companies from FPDS' as step,
  COUNT(*)::text as companies
FROM fpds_company_stats
WHERE vendor_uei IS NOT NULL
UNION ALL
SELECT 
  '✓ STEP 2: Companies from DoD News',
  COUNT(*)::text
FROM fpds_company_stats
WHERE vendor_uei IS NULL AND dod_contracts > 0
UNION ALL
SELECT 
  '✓ STEP 3: Companies from SAM.gov',
  COUNT(*)::text
FROM fpds_company_stats
WHERE vendor_uei IS NOT NULL AND total_contracts = 1
UNION ALL
SELECT 
  '✓ STEP 4: Companies from Army Innovation',
  COUNT(*)::text
FROM fpds_company_stats
WHERE small_business = TRUE AND total_contracts = 1
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ''
UNION ALL
SELECT 
  '📊 TOTAL COMPANIES',
  COUNT(*)::text
FROM fpds_company_stats
UNION ALL
SELECT 
  '   Companies with UEI',
  COUNT(*)::text
FROM fpds_company_stats
WHERE vendor_uei IS NOT NULL
UNION ALL
SELECT 
  '   Small businesses',
  COUNT(*)::text
FROM fpds_company_stats
WHERE small_business = TRUE
UNION ALL
SELECT 
  '   SBIR contractors',
  COUNT(*)::text
FROM fpds_company_stats
WHERE sbir_contracts > 0
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ''
UNION ALL
SELECT 
  '💰 Total contract value',
  TO_CHAR(SUM(total_value), '$999,999,999,999')
FROM fpds_company_stats;

-- Top 25 companies by value
SELECT 
  company_name,
  vendor_state,
  total_contracts,
  TO_CHAR(total_value, '$999,999,999,999') as total_value,
  small_business,
  sbir_contracts,
  TO_CHAR(most_recent_contract_date, 'YYYY-MM-DD') as most_recent
FROM fpds_company_stats
ORDER BY total_value DESC NULLS LAST
LIMIT 25;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  total_companies INTEGER;
  with_uei INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_companies FROM fpds_company_stats;
  SELECT COUNT(*) INTO with_uei FROM fpds_company_stats WHERE vendor_uei IS NOT NULL;
  
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✓ MASTER COMPANY LIST CREATED SUCCESSFULLY!              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Total companies: %', total_companies;
  RAISE NOTICE 'Companies with UEI (can enrich): %', with_uei;
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'NEXT STEP: Run enrichment script';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE 'In terminal, run:';
  RAISE NOTICE '  npm run enrich-companies';
  RAISE NOTICE '';
  RAISE NOTICE 'This will enrich companies with FREE data:';
  RAISE NOTICE '  1. SAM.gov Entity API (business structure, contact)';
  RAISE NOTICE '  2. SEC EDGAR (public company financials)';
  RAISE NOTICE '  3. Cost: $0';
  RAISE NOTICE '';
  RAISE NOTICE 'Estimated time for % companies: ~% minutes', with_uei, CEIL(with_uei / 100.0 * 2);
  RAISE NOTICE '';
END $$;

