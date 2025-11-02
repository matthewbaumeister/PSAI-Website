-- =====================================================
-- COMPREHENSIVE FIELD VALIDATION
-- Check that all "enhanced" fields are actually working
-- =====================================================

-- 1. Contract Types - Should be working
SELECT 
  '1. CONTRACT TYPES' as field_category,
  COUNT(*) as total_contracts,
  COUNT(contract_types) as populated,
  ROUND(100.0 * COUNT(contract_types) / COUNT(*), 1) as pct,
  CASE 
    WHEN COUNT(contract_types)::float / COUNT(*) > 0.8 THEN '✅ GOOD'
    WHEN COUNT(contract_types)::float / COUNT(*) > 0.5 THEN '⚠️ OK'
    ELSE '❌ BROKEN'
  END as status
FROM dod_contract_news;

-- 2. Options & Cumulative Value
SELECT 
  '2. OPTIONS & CUMULATIVE VALUE' as field_category,
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE has_options = true) as has_options_count,
  COUNT(cumulative_value_with_options) as has_cumulative_value,
  COUNT(options_value) as has_options_value,
  CASE 
    WHEN COUNT(cumulative_value_with_options) > 0 THEN '✅ WORKING'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 3. FMS (Foreign Military Sales)
SELECT 
  '3. FOREIGN MILITARY SALES' as field_category,
  COUNT(*) FILTER (WHERE is_fms = true) as marked_as_fms,
  COUNT(fms_countries) as has_fms_countries,
  COUNT(fms_amount) as has_fms_amount,
  CASE 
    WHEN COUNT(fms_countries) > 0 THEN '⚠️ WORKING BUT BUGGY'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 4. Competition Tracking
SELECT 
  '4. COMPETITION TRACKING' as field_category,
  COUNT(*) as total,
  COUNT(is_competed) as has_is_competed,
  COUNT(competition_type) as has_competition_type,
  COUNT(number_of_offers_received) as has_offers_count,
  CASE 
    WHEN COUNT(is_competed) > 0 THEN '✅ WORKING'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 5. Modifications
SELECT 
  '5. MODIFICATIONS' as field_category,
  COUNT(*) FILTER (WHERE is_modification = true) as modification_count,
  COUNT(modification_number) as has_mod_number,
  COUNT(modification_type) as has_mod_type,
  COUNT(*) FILTER (WHERE is_option_exercise = true) as option_exercise_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_modification = true) > 0 THEN '✅ WORKING'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 6. SBIR/STTR
SELECT 
  '6. SBIR/STTR' as field_category,
  COUNT(*) FILTER (WHERE is_sbir = true) as sbir_count,
  COUNT(sbir_phase) as has_sbir_phase,
  COUNT(*) FILTER (WHERE is_sbir_sole_source = true) as sbir_sole_source_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_sbir = true) > 0 THEN '✅ WORKING'
    ELSE '⚠️ RARE OR NOT WORKING'
  END as status
FROM dod_contract_news;

-- 7. Performance Locations (Breakdown)
SELECT 
  '7. PERFORMANCE LOCATIONS' as field_category,
  COUNT(performance_locations) as has_basic_locations,
  COUNT(performance_location_breakdown) as has_breakdown_with_pct,
  ROUND(100.0 * COUNT(performance_location_breakdown) / NULLIF(COUNT(*), 0), 1) as breakdown_pct,
  CASE 
    WHEN COUNT(performance_location_breakdown) > 0 THEN '✅ WORKING'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 8. Funding Sources
SELECT 
  '8. FUNDING SOURCES' as field_category,
  COUNT(funding_sources) as has_funding_sources,
  COUNT(total_obligated_amount) as has_obligated_amount,
  ROUND(100.0 * COUNT(funding_sources) / NULLIF(COUNT(*), 0), 1) as funding_pct,
  CASE 
    WHEN COUNT(funding_sources) > 0 THEN '✅ WORKING'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 9. SET-ASIDE (THE BROKEN ONE)
SELECT 
  '9. SET-ASIDE TRACKING' as field_category,
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'set-aside|set aside') as has_setaside_keyword,
  COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as marked_as_setaside,
  COUNT(set_aside_type) as has_setaside_type,
  CASE 
    WHEN COUNT(set_aside_type) > 0 THEN '✅ WORKING'
    WHEN COUNT(*) FILTER (WHERE raw_paragraph ~* 'set-aside|set aside') > 0 THEN '❌ BROKEN - KEYWORDS PRESENT BUT NOT EXTRACTED'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- 10. IDIQ Tracking
SELECT 
  '10. IDIQ TRACKING' as field_category,
  COUNT(*) FILTER (WHERE is_idiq = true) as idiq_count,
  COUNT(*) FILTER (WHERE is_multiple_award = true) as multiple_award_count,
  COUNT(*) FILTER (WHERE is_hybrid_contract = true) as hybrid_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_idiq = true) > 0 THEN '✅ WORKING'
    ELSE '❌ NOT WORKING'
  END as status
FROM dod_contract_news;

-- =====================================================
-- SUMMARY: Which fields are broken?
-- =====================================================
WITH field_status AS (
  SELECT 
    'Contract Types' as field,
    CASE WHEN COUNT(contract_types)::float / COUNT(*) > 0.8 THEN 'GOOD' ELSE 'BROKEN' END as status
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'Set-Aside',
    CASE 
      WHEN COUNT(set_aside_type) > 0 THEN 'GOOD'
      WHEN COUNT(*) FILTER (WHERE raw_paragraph ~* 'set-aside|set aside') > 0 THEN 'BROKEN'
      ELSE 'RARE'
    END
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'FMS Countries',
    CASE WHEN COUNT(fms_countries) > 0 THEN 'BUGGY' ELSE 'BROKEN' END
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'Performance Breakdown',
    CASE WHEN COUNT(performance_location_breakdown) > 0 THEN 'GOOD' ELSE 'BROKEN' END
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'Funding Sources',
    CASE WHEN COUNT(funding_sources) > 0 THEN 'GOOD' ELSE 'BROKEN' END
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'Modifications',
    CASE WHEN COUNT(*) FILTER (WHERE is_modification = true) > 0 THEN 'GOOD' ELSE 'BROKEN' END
  FROM dod_contract_news
)
SELECT 
  '=== FIELD STATUS SUMMARY ===' as section,
  field,
  status,
  CASE status
    WHEN 'GOOD' THEN '✅'
    WHEN 'BUGGY' THEN '⚠️'
    WHEN 'BROKEN' THEN '❌'
    WHEN 'RARE' THEN '🔍'
  END as emoji
FROM field_status
ORDER BY 
  CASE status
    WHEN 'BROKEN' THEN 1
    WHEN 'BUGGY' THEN 2
    WHEN 'RARE' THEN 3
    WHEN 'GOOD' THEN 4
  END,
  field;

