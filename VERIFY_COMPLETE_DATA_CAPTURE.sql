-- =====================================================
-- COMPLETE DATA CAPTURE VERIFICATION
-- Check that ALL 40+ fields are being captured correctly
-- =====================================================

WITH 
-- Summary stats
summary AS (
  SELECT 
    'SUMMARY' as section,
    'Total Contracts' as field,
    COUNT(*)::TEXT as populated,
    '48 expected' as status,
    NULL::TEXT as sample
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'SUMMARY',
    'Team Relationships',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) >= 3 THEN '✅ OK' ELSE '⚠️ Check' END,
    STRING_AGG(DISTINCT company_name || ' (' || team_role || ')', ', ')
  FROM dod_contract_team_members
  
  UNION ALL
  
  SELECT 
    'SUMMARY',
    'Performance Locations',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ Missing' END,
    COUNT(*) FILTER (WHERE weighted_award_amount IS NOT NULL)::TEXT || ' with weighted values'
  FROM dod_contract_performance_locations
),

-- Core fields
core_fields AS (
  SELECT 
    'CORE FIELDS' as section,
    'vendor_name' as field,
    COUNT(*) FILTER (WHERE vendor_name IS NOT NULL)::TEXT as populated,
    CASE WHEN COUNT(*) FILTER (WHERE vendor_name IS NOT NULL) = COUNT(*) THEN '✅ 100%' ELSE '⚠️ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE vendor_name IS NOT NULL) / COUNT(), 1) || '%' END as status,
    (SELECT vendor_name FROM dod_contract_news WHERE vendor_name IS NOT NULL LIMIT 1) as sample
  FROM dod_contract_news
  
  UNION ALL SELECT 'CORE FIELDS', 'vendor_state', COUNT(*) FILTER (WHERE vendor_state IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE vendor_state IS NOT NULL) = COUNT(*) THEN '✅ 100%' ELSE '⚠️ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE vendor_state IS NOT NULL) / COUNT(), 1) || '%' END, (SELECT vendor_state FROM dod_contract_news WHERE vendor_state IS NOT NULL LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'CORE FIELDS', 'vendor_city', COUNT(*) FILTER (WHERE vendor_city IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE vendor_city IS NOT NULL) = COUNT(*) THEN '✅ 100%' ELSE '⚠️ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE vendor_city IS NOT NULL) / COUNT(), 1) || '%' END, (SELECT vendor_city FROM dod_contract_news WHERE vendor_city IS NOT NULL LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'CORE FIELDS', 'award_amount', COUNT(*) FILTER (WHERE award_amount IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE award_amount IS NOT NULL) = COUNT(*) THEN '✅ 100%' ELSE '⚠️ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE award_amount IS NOT NULL) / COUNT(), 1) || '%' END, '$' || (SELECT ROUND(award_amount/1000000, 1) FROM dod_contract_news WHERE award_amount IS NOT NULL ORDER BY award_amount DESC LIMIT 1)::TEXT || 'M (largest)' FROM dod_contract_news
  UNION ALL SELECT 'CORE FIELDS', 'contract_number', COUNT(*) FILTER (WHERE contract_number IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE contract_number IS NOT NULL) = COUNT(*) THEN '✅ 100%' ELSE '⚠️ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE contract_number IS NOT NULL) / COUNT(), 1) || '%' END, (SELECT contract_number FROM dod_contract_news WHERE contract_number IS NOT NULL LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'CORE FIELDS', 'service_branch', COUNT(*) FILTER (WHERE service_branch IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE service_branch IS NOT NULL) = COUNT(*) THEN '✅ 100%' ELSE '⚠️ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE service_branch IS NOT NULL) / COUNT(), 1) || '%' END, (SELECT STRING_AGG(DISTINCT service_branch, ', ') FROM dod_contract_news) FROM dod_contract_news
),

-- Enhanced fields
enhanced_fields AS (
  SELECT 'ENHANCED FIELDS' as section, 'is_small_business_set_aside', COUNT(*) FILTER (WHERE is_small_business_set_aside = true)::TEXT || ' / ' || COUNT(*)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE is_small_business_set_aside = true) > 0 THEN '✅ Detecting' ELSE '⚠️ None found' END, (SELECT vendor_name FROM dod_contract_news WHERE is_small_business_set_aside = true LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'set_aside_type', COUNT(*) FILTER (WHERE set_aside_type IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE set_aside_type IS NOT NULL) > 0 THEN '✅ OK' ELSE '⚠️ None' END, (SELECT STRING_AGG(DISTINCT set_aside_type, ', ') FROM dod_contract_news WHERE set_aside_type IS NOT NULL) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'is_teaming', COUNT(*) FILTER (WHERE is_teaming = true)::TEXT || ' contracts', CASE WHEN COUNT(*) FILTER (WHERE is_teaming = true) > 0 THEN '✅ Detecting' ELSE '⚠️ None' END, COUNT(*) FILTER (WHERE is_teaming = true)::TEXT || ' teaming contracts' FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'naics_code', COUNT(*) FILTER (WHERE naics_code IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE naics_code IS NOT NULL) > 0 THEN '✅ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE naics_code IS NOT NULL) / COUNT(), 1) || '%' ELSE '⚠️ None' END, (SELECT STRING_AGG(DISTINCT naics_code, ', ') FROM (SELECT DISTINCT naics_code FROM dod_contract_news WHERE naics_code IS NOT NULL LIMIT 3) t) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'solicitation_number', COUNT(*) FILTER (WHERE solicitation_number IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE solicitation_number IS NOT NULL) > 0 THEN '✅ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE solicitation_number IS NOT NULL) / COUNT(), 1) || '%' ELSE '⚠️ None' END, (SELECT solicitation_number FROM dod_contract_news WHERE solicitation_number IS NOT NULL LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'is_fms (Foreign Military Sales)', COUNT(*) FILTER (WHERE is_fms = true)::TEXT || ' contracts', CASE WHEN COUNT(*) FILTER (WHERE is_fms = true) > 0 THEN '✅ Detecting' ELSE '⚠️ None' END, (SELECT STRING_AGG(fms_countries::TEXT, ', ') FROM dod_contract_news WHERE is_fms = true LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'contract_type', COUNT(*) FILTER (WHERE contract_type IS NOT NULL)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE contract_type IS NOT NULL) > 0 THEN '✅ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE contract_type IS NOT NULL) / COUNT(), 1) || '%' ELSE '⚠️ None' END, (SELECT STRING_AGG(DISTINCT contract_type, ', ') FROM (SELECT DISTINCT contract_type FROM dod_contract_news WHERE contract_type IS NOT NULL LIMIT 5) t) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'is_idiq', COUNT(*) FILTER (WHERE is_idiq = true)::TEXT || ' contracts', CASE WHEN COUNT(*) FILTER (WHERE is_idiq = true) > 0 THEN '✅ Detecting' ELSE '⚠️ None' END, NULL FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'has_options', COUNT(*) FILTER (WHERE has_options = true)::TEXT || ' contracts', CASE WHEN COUNT(*) FILTER (WHERE has_options = true) > 0 THEN '✅ Detecting' ELSE '⚠️ None' END, (SELECT 'Cumulative: $' || ROUND(cumulative_value_with_options/1000000, 1) || 'M' FROM dod_contract_news WHERE has_options = true ORDER BY cumulative_value_with_options DESC LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'is_competed', COUNT(*) FILTER (WHERE is_competed = true)::TEXT || ' competed, ' || COUNT(*) FILTER (WHERE is_competed = false)::TEXT || ' sole source', CASE WHEN COUNT(*) FILTER (WHERE is_competed IS NOT NULL) > 0 THEN '✅ Tracking' ELSE '⚠️ None' END, NULL FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'is_sbir', COUNT(*) FILTER (WHERE is_sbir = true)::TEXT || ' contracts', CASE WHEN COUNT(*) FILTER (WHERE is_sbir = true) > 0 THEN '✅ Detecting' ELSE '⚠️ None (normal)' END, NULL FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'industry_tags', COUNT(*) FILTER (WHERE industry_tags IS NOT NULL AND array_length(industry_tags, 1) > 0)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE industry_tags IS NOT NULL) > 0 THEN '✅ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE industry_tags IS NOT NULL) / COUNT(), 1) || '%' ELSE '⚠️ None' END, (SELECT array_to_string(industry_tags, ', ') FROM dod_contract_news WHERE industry_tags IS NOT NULL LIMIT 1) FROM dod_contract_news
  UNION ALL SELECT 'ENHANCED FIELDS', 'technology_tags', COUNT(*) FILTER (WHERE technology_tags IS NOT NULL AND array_length(technology_tags, 1) > 0)::TEXT, CASE WHEN COUNT(*) FILTER (WHERE technology_tags IS NOT NULL) > 0 THEN '✅ ' || ROUND(100.0 * COUNT(*) FILTER (WHERE technology_tags IS NOT NULL) / COUNT(), 1) || '%' ELSE '⚠️ None' END, (SELECT array_to_string(technology_tags, ', ') FROM dod_contract_news WHERE technology_tags IS NOT NULL LIMIT 1) FROM dod_contract_news
),

-- Critical checks
critical_issues AS (
  SELECT 
    'CRITICAL CHECKS' as section,
    'Vendor State NULL' as field,
    COUNT(*) FILTER (WHERE vendor_state IS NULL)::TEXT as populated,
    CASE WHEN COUNT(*) FILTER (WHERE vendor_state IS NULL) = 0 THEN '✅ No issues' ELSE '❌ ' || COUNT(*) FILTER (WHERE vendor_state IS NULL) || ' missing' END as status,
    (SELECT vendor_name FROM dod_contract_news WHERE vendor_state IS NULL LIMIT 1) as sample
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'CRITICAL CHECKS',
    'Set-Aside Detection',
    COUNT(*) FILTER (WHERE is_small_business_set_aside = true)::TEXT || ' found',
    CASE 
      WHEN COUNT(*) FILTER (WHERE raw_paragraph ILIKE '%set-aside%' OR raw_paragraph ILIKE '%set aside%') > COUNT(*) FILTER (WHERE is_small_business_set_aside = true)
      THEN '⚠️ Possible missed: ' || (COUNT(*) FILTER (WHERE raw_paragraph ILIKE '%set-aside%' OR raw_paragraph ILIKE '%set aside%') - COUNT(*) FILTER (WHERE is_small_business_set_aside = true))::TEXT
      ELSE '✅ OK'
    END,
    COUNT(*) FILTER (WHERE raw_paragraph ILIKE '%set-aside%' OR raw_paragraph ILIKE '%set aside%')::TEXT || ' mention "set-aside" in text'
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'CRITICAL CHECKS',
    'FMS Country Parsing',
    COUNT(*) FILTER (WHERE is_fms = true AND (fms_countries IS NULL OR array_length(fms_countries, 1) = 0))::TEXT || ' FMS without countries',
    CASE 
      WHEN COUNT(*) FILTER (WHERE is_fms = true AND (fms_countries IS NULL OR array_length(fms_countries, 1) = 0)) > 0
      THEN '⚠️ Check parsing'
      ELSE '✅ OK'
    END,
    NULL
  FROM dod_contract_news
),

-- Sample data
sample_contract AS (
  SELECT 
    'SAMPLE CONTRACT' as section,
    vendor_name as field,
    'Amount: $' || ROUND(award_amount/1000000, 1) || 'M' as populated,
    'Type: ' || COALESCE(contract_type, 'Not specified') as status,
    'Competed: ' || CASE WHEN is_competed THEN 'Yes' ELSE 'No/Unknown' END || ', FMS: ' || CASE WHEN is_fms THEN 'Yes' ELSE 'No' END as sample
  FROM dod_contract_news
  ORDER BY award_amount DESC
  LIMIT 3
)

-- Combine all
SELECT section, field, populated, status, sample
FROM (
  SELECT *, 1 as sort FROM summary
  UNION ALL SELECT *, 2 FROM core_fields
  UNION ALL SELECT *, 3 FROM enhanced_fields
  UNION ALL SELECT *, 4 FROM critical_issues
  UNION ALL SELECT *, 5 FROM sample_contract
) combined
ORDER BY sort, section, field;

