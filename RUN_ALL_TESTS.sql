-- =====================================================
-- RUN ALL TESTS - Complete Validation Suite
-- Run this after scraping to validate everything works
-- =====================================================

-- TEST 1: Set-Aside Fix (Your Bug)
SELECT 
  '=== TEST 1: SET-ASIDE FIX ===' as test,
  vendor_name,
  is_small_business_set_aside,
  set_aside_type,
  CASE 
    WHEN is_small_business_set_aside = true AND set_aside_type IS NOT NULL THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM dod_contract_news
WHERE vendor_name LIKE '%Advanced Navigation%'
LIMIT 1;

-- TEST 2: FMS Countries Clean
SELECT 
  '=== TEST 2: FMS COUNTRIES CLEAN ===' as test,
  COUNT(*) FILTER (
    WHERE is_fms = true 
    AND EXISTS (
      SELECT 1 FROM unnest(fms_countries) c 
      WHERE c ~* 'will|completed|expect|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov'
    )
  ) as garbage_entries,
  COUNT(*) FILTER (WHERE is_fms = true) as total_fms,
  CASE 
    WHEN COUNT(*) FILTER (
      WHERE is_fms = true 
      AND EXISTS (
        SELECT 1 FROM unnest(fms_countries) c 
        WHERE c ~* 'will|completed|expect|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov'
      )
    ) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Still has garbage'
  END as status
FROM dod_contract_news;

-- TEST 3: Set-Aside Coverage
SELECT 
  '=== TEST 3: SET-ASIDE COVERAGE ===' as test,
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'set-aside|set aside') as has_keyword,
  COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as marked_as_set_aside,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_small_business_set_aside = true) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - No set-asides found'
  END as status
FROM dod_contract_news;

-- TEST 4: Contracting Activity Improved
SELECT 
  '=== TEST 4: CONTRACTING ACTIVITY IMPROVED ===' as test,
  COUNT(contracting_activity) as has_contracting_activity,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(contracting_activity) / COUNT(*), 1) as pct,
  CASE 
    WHEN 100.0 * COUNT(contracting_activity) / COUNT(*) > 50 THEN '✅ PASS'
    WHEN 100.0 * COUNT(contracting_activity) / COUNT(*) > 25 THEN '⚠️ PARTIAL'
    ELSE '❌ FAIL'
  END as status
FROM dod_contract_news;

-- TEST 5: Keyword/Tag Extraction
SELECT 
  '=== TEST 5: KEYWORD/TAG EXTRACTION ===' as test,
  COUNT(industry_tags) as has_industry,
  COUNT(technology_tags) as has_tech,
  COUNT(service_tags) as has_service,
  CASE 
    WHEN COUNT(industry_tags) > (COUNT(*) * 0.7) THEN '✅ PASS'
    WHEN COUNT(industry_tags) > (COUNT(*) * 0.4) THEN '⚠️ PARTIAL'
    ELSE '❌ FAIL'
  END as status
FROM dod_contract_news;

-- TEST 6: NAICS & Solicitation
SELECT 
  '=== TEST 6: NAICS & SOLICITATION ===' as test,
  COUNT(naics_code) as has_naics,
  COUNT(solicitation_number) as has_solicitation,
  CASE 
    WHEN COUNT(naics_code) > 0 OR COUNT(solicitation_number) > 0 THEN '✅ PASS'
    ELSE '⚠️ RARE (may not be in test data)'
  END as status
FROM dod_contract_news;

-- TEST 7: Teaming Detection
SELECT 
  '=== TEST 7: TEAMING DETECTION ===' as test,
  COUNT(*) FILTER (WHERE is_teaming = true) as teaming_count,
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'team|subcontractor|prime') as has_keywords,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_teaming = true) > 0 THEN '✅ PASS'
    WHEN COUNT(*) FILTER (WHERE raw_paragraph ~* 'team|subcontractor|prime') = 0 THEN '⚠️ RARE'
    ELSE '⚠️ PARTIAL'
  END as status
FROM dod_contract_news;

-- =====================================================
-- OVERALL SUMMARY
-- =====================================================
SELECT 
  '=== OVERALL TEST SUMMARY ===' as section,
  COUNT(*) as total_tests,
  SUM(CASE WHEN test_status = 'PASS' THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN test_status = 'PARTIAL' THEN 1 ELSE 0 END) as partial,
  SUM(CASE WHEN test_status = 'FAIL' THEN 1 ELSE 0 END) as failed
FROM (
  SELECT 
    CASE 
      WHEN is_small_business_set_aside = true AND set_aside_type IS NOT NULL THEN 'PASS'
      ELSE 'FAIL'
    END as test_status
  FROM dod_contract_news
  WHERE vendor_name LIKE '%Advanced Navigation%'
  LIMIT 1
) t;

-- =====================================================
-- SAMPLE ENHANCED DATA
-- =====================================================
SELECT 
  '=== SAMPLE ENHANCED DATA ===' as section,
  vendor_name,
  vendor_state,
  award_amount,
  is_small_business_set_aside,
  set_aside_type,
  is_fms,
  array_length(fms_countries, 1) as fms_country_count,
  is_teaming,
  naics_code,
  array_length(industry_tags, 1) as industry_tag_count,
  contracting_activity IS NOT NULL as has_contracting_activity
FROM dod_contract_news
ORDER BY award_amount DESC
LIMIT 5;

