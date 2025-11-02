-- =====================================================
-- ANALYZE MISSING DATA: What's the remaining 10%?
-- =====================================================

-- 1. Check which existing fields have low coverage
WITH field_coverage AS (
  SELECT 
    'vendor_name' as field, COUNT(vendor_name) as populated, COUNT(*) as total FROM dod_contract_news
  UNION ALL
  SELECT 'vendor_state', COUNT(vendor_state), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'contract_types', COUNT(contract_types), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'contracting_activity', COUNT(contracting_activity), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'completion_date', COUNT(completion_date), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'start_date', COUNT(start_date), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'performance_locations', COUNT(performance_locations), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'performance_location_breakdown', COUNT(performance_location_breakdown), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'fiscal_year', COUNT(fiscal_year), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'funding_sources', COUNT(funding_sources), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'obligated_amount', COUNT(obligated_amount), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'total_obligated_amount', COUNT(total_obligated_amount), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'contract_type', COUNT(contract_type), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'parent_contract', COUNT(parent_contract), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'modification_number', COUNT(modification_number), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'small_business_type', COUNT(small_business_type), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'set_aside_type', COUNT(set_aside_type), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'program_name', COUNT(program_name), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'contracting_office_location', COUNT(contracting_office_location), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'naics_code', COUNT(naics_code), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'poc_name', COUNT(poc_name), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'poc_email', COUNT(poc_email), COUNT(*) FROM dod_contract_news
  UNION ALL
  SELECT 'poc_phone', COUNT(poc_phone), COUNT(*) FROM dod_contract_news
)
SELECT 
  field,
  populated,
  total,
  ROUND(100.0 * populated / NULLIF(total, 0), 1) as pct_populated,
  ROUND(100.0 * (total - populated) / NULLIF(total, 0), 1) as pct_null
FROM field_coverage
WHERE populated < total
ORDER BY pct_null DESC;

-- =====================================================
-- 2. Analyze raw_paragraph to find patterns we're missing
-- =====================================================
SELECT 
  'Check for NAICS codes' as analysis,
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'NAICS') as has_naics,
  COUNT(*) as total
FROM dod_contract_news

UNION ALL

SELECT 
  'Check for delivery/award dates',
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'awarded|delivery|completion'),
  COUNT(*)
FROM dod_contract_news

UNION ALL

SELECT 
  'Check for set-aside mentions',
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'small business|set-aside|woman-owned|veteran-owned|8\(a\)|HUBZone'),
  COUNT(*)
FROM dod_contract_news

UNION ALL

SELECT 
  'Check for contracting office',
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'contracting activity|contracting office'),
  COUNT(*)
FROM dod_contract_news

UNION ALL

SELECT 
  'Check for POC information',
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'point of contact|POC|contact|@'),
  COUNT(*)
FROM dod_contract_news

UNION ALL

SELECT 
  'Check for program names',
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'program|system'),
  COUNT(*)
FROM dod_contract_news

UNION ALL

SELECT 
  'Check for PSC codes',
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'product service code|PSC'),
  COUNT(*)
FROM dod_contract_news;

-- =====================================================
-- 3. Check contracts with vs without key fields
-- =====================================================
SELECT 
  'Contracts Analysis' as section,
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE is_modification = true) as modifications,
  COUNT(*) FILTER (WHERE is_modification = false OR is_modification IS NULL) as new_work,
  COUNT(*) FILTER (WHERE modification_type IS NOT NULL) as has_mod_type,
  COUNT(*) FILTER (WHERE is_option_exercise = true) as option_exercises,
  COUNT(*) FILTER (WHERE base_contract_number IS NOT NULL) as has_parent_contract
FROM dod_contract_news;

-- =====================================================
-- 4. Sample raw paragraphs to check for missing patterns
-- =====================================================
SELECT 
  vendor_name,
  SUBSTRING(raw_paragraph, 1, 500) as paragraph_sample,
  contracting_activity,
  contract_types,
  is_modification,
  modification_type
FROM dod_contract_news
WHERE contract_types IS NULL
   OR contracting_activity IS NULL
LIMIT 5;

