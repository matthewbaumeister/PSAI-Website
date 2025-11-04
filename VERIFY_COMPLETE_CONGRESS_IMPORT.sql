-- ====================================
-- COMPREHENSIVE CONGRESS.GOV DATA VERIFICATION
-- ====================================
-- Run this after all imports complete to verify we got EVERYTHING

-- ====================================
-- 1. OVERALL SUMMARY BY CONGRESS
-- ====================================
SELECT 
  '1. OVERALL SUMMARY' as check_name,
  congress::text,
  COUNT(*)::text as total_bills,
  MIN(introduced_date)::text as earliest_bill,
  MAX(introduced_date)::text as latest_bill,
  COUNT(DISTINCT bill_type)::text as bill_types,
  MAX(last_scraped)::text as last_import_time
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

-- ====================================
-- 2. DATA COMPLETENESS BY FIELD
-- ====================================
SELECT 
  '2. DATA COMPLETENESS' as check_name,
  congress::text,
  COUNT(*)::text as total_bills,
  
  -- Core fields (should be 100%)
  COUNT(*) FILTER (WHERE title IS NOT NULL)::text as has_title,
  COUNT(*) FILTER (WHERE bill_type IS NOT NULL)::text as has_bill_type,
  COUNT(*) FILTER (WHERE bill_number IS NOT NULL)::text as has_bill_number,
  
  -- Summary data
  COUNT(*) FILTER (WHERE summary IS NOT NULL)::text as has_summary,
  
  -- Actions (most bills should have actions)
  COUNT(*) FILTER (WHERE actions IS NOT NULL 
    AND jsonb_typeof(actions) = 'array' 
    AND jsonb_array_length(actions) > 0)::text as has_actions,
  
  -- Cosponsors (not all bills have cosponsors)
  COUNT(*) FILTER (WHERE cosponsors IS NOT NULL 
    AND jsonb_typeof(cosponsors) = 'array' 
    AND jsonb_array_length(cosponsors) > 0)::text as has_cosponsors,
  
  -- Amendments (rare, mostly on major bills)
  COUNT(*) FILTER (WHERE amendments IS NOT NULL 
    AND jsonb_typeof(amendments) = 'array' 
    AND jsonb_array_length(amendments) > 0)::text as has_amendments,
  
  -- Text versions (most bills should have at least 1)
  COUNT(*) FILTER (WHERE text_versions IS NOT NULL 
    AND jsonb_typeof(text_versions) = 'array' 
    AND jsonb_array_length(text_versions) > 0)::text as has_text_versions,
  
  -- Committees (most bills go through committees)
  COUNT(*) FILTER (WHERE committees IS NOT NULL 
    AND jsonb_typeof(committees) = 'array' 
    AND jsonb_array_length(committees) > 0)::text as has_committees
  
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

-- ====================================
-- 3. DATA RICHNESS ANALYSIS
-- ====================================
-- Show average array sizes to verify comprehensive data
SELECT 
  '3. DATA RICHNESS (Averages)' as check_name,
  congress::text,
  COUNT(*)::text as total_bills,
  
  ROUND(AVG(COALESCE(jsonb_array_length(actions), 0)), 1)::text as avg_actions,
  ROUND(AVG(COALESCE(jsonb_array_length(cosponsors), 0)), 1)::text as avg_cosponsors,
  ROUND(AVG(COALESCE(jsonb_array_length(amendments), 0)), 1)::text as avg_amendments,
  ROUND(AVG(COALESCE(jsonb_array_length(text_versions), 0)), 1)::text as avg_text_versions,
  
  MAX(COALESCE(jsonb_array_length(actions), 0))::text as max_actions,
  MAX(COALESCE(jsonb_array_length(cosponsors), 0))::text as max_cosponsors,
  MAX(COALESCE(jsonb_array_length(amendments), 0))::text as max_amendments,
  MAX(COALESCE(jsonb_array_length(text_versions), 0))::text as max_text_versions
  
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

-- ====================================
-- 4. IDENTIFY INCOMPLETE DATA
-- ====================================
-- Bills that might be missing data (have action_count but no actions array)
SELECT 
  '4. POTENTIAL DATA ISSUES' as check_name,
  congress::text,
  bill_type::text,
  bill_number::text,
  LEFT(title, 40)::text as title_preview,
  action_count::text,
  (actions IS NULL)::text as actions_null,
  (jsonb_typeof(actions) != 'array')::text as actions_not_array,
  last_scraped::text
FROM congressional_bills
WHERE 
  -- Has action_count but actions is wrong
  (action_count > 0 AND (
    actions IS NULL 
    OR jsonb_typeof(actions) != 'array'
    OR jsonb_array_length(actions) = 0
  ))
ORDER BY congress DESC, action_count DESC
LIMIT 10;

-- ====================================
-- 5. RICHEST BILLS (Most Complete Data)
-- ====================================
-- Show top bills with most comprehensive data to verify depth
SELECT 
  '5. RICHEST BILLS (Top 10)' as check_name,
  congress::text,
  (bill_type || ' ' || bill_number)::text as bill_id,
  LEFT(title, 40)::text as title_preview,
  COALESCE(jsonb_array_length(actions), 0)::text as actions,
  COALESCE(jsonb_array_length(cosponsors), 0)::text as cosponsors,
  COALESCE(jsonb_array_length(amendments), 0)::text as amendments,
  COALESCE(jsonb_array_length(text_versions), 0)::text as text_versions,
  defense_relevance_score::text as defense_score
FROM congressional_bills
WHERE actions IS NOT NULL 
  AND jsonb_typeof(actions) = 'array'
ORDER BY 
  jsonb_array_length(actions) DESC,
  COALESCE(jsonb_array_length(amendments), 0) DESC,
  COALESCE(jsonb_array_length(cosponsors), 0) DESC
LIMIT 10;

-- ====================================
-- 6. DEFENSE BILLS ANALYSIS
-- ====================================
SELECT 
  '6. DEFENSE-RELATED BILLS' as check_name,
  congress::text,
  COUNT(*)::text as total_bills,
  COUNT(*) FILTER (WHERE defense_relevance_score >= 30)::text as high_relevance,
  COUNT(*) FILTER (WHERE defense_relevance_score >= 10 AND defense_relevance_score < 30)::text as medium_relevance,
  COUNT(*) FILTER (WHERE defense_relevance_score < 10)::text as low_relevance,
  ROUND(AVG(defense_relevance_score), 1)::text as avg_defense_score
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

-- ====================================
-- 7. CHECK FOR BROKEN REFERENCE OBJECTS
-- ====================================
-- Make sure we don't have any "url" reference objects instead of actual data
SELECT 
  '7. BROKEN REFERENCE CHECK' as check_name,
  congress::text,
  COUNT(*) FILTER (WHERE actions::text LIKE '%"url":%')::text as broken_actions,
  COUNT(*) FILTER (WHERE cosponsors::text LIKE '%"url":%')::text as broken_cosponsors,
  COUNT(*) FILTER (WHERE amendments::text LIKE '%"url":%')::text as broken_amendments,
  COUNT(*) FILTER (WHERE text_versions::text LIKE '%"url":%')::text as broken_text_versions,
  COUNT(*)::text as total_bills
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

-- ====================================
-- 8. SPECIFIC HIGH-VALUE BILLS TO VERIFY
-- ====================================
-- Check that we got the NDAA and other major bills with full data
SELECT 
  '8. KEY BILLS VERIFICATION' as check_name,
  congress::text,
  (bill_type || ' ' || bill_number)::text as bill_id,
  LEFT(title, 50)::text as title_preview,
  COALESCE(jsonb_array_length(actions), 0)::text as actions,
  COALESCE(jsonb_array_length(cosponsors), 0)::text as cosponsors,
  COALESCE(jsonb_array_length(amendments), 0)::text as amendments,
  is_active::text as is_active,
  status::text as current_status
FROM congressional_bills
WHERE 
  -- Look for NDAA bills (should have TONS of data)
  (title ILIKE '%National Defense Authorization%' 
   OR title ILIKE '%NDAA%'
   OR bill_number IN (2670, 7900, 8370)) -- Known NDAA bill numbers
ORDER BY congress DESC, jsonb_array_length(actions) DESC;

-- ====================================
-- 9. FINAL VERIFICATION SUMMARY
-- ====================================
SELECT 
  '9. FINAL SUMMARY' as check_name,
  COUNT(DISTINCT congress)::text as congresses_imported,
  COUNT(*)::text as total_bills_imported,
  COUNT(*) FILTER (WHERE 
    actions IS NOT NULL 
    AND jsonb_typeof(actions) = 'array'
    AND jsonb_array_length(actions) > 0
  )::text as bills_with_valid_actions,
  COUNT(*) FILTER (WHERE 
    actions IS NULL 
    OR jsonb_typeof(actions) != 'array'
    OR actions::text LIKE '%"url":%'
  )::text as bills_with_issues,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE 
      actions IS NOT NULL 
      AND jsonb_typeof(actions) = 'array'
      AND jsonb_array_length(actions) > 0
    ) / COUNT(*), 
    1
  )::text || '%' as data_quality_percentage
FROM congressional_bills;

-- ====================================
-- 10. EXPECTED vs ACTUAL COUNTS
-- ====================================
-- Compare what we got vs what we tried to import
SELECT 
  '10. IMPORT SUCCESS RATE' as check_name,
  congress::text,
  COUNT(*)::text as bills_in_database,
  '250'::text as expected_from_api,
  CASE 
    WHEN COUNT(*) >= 250 THEN '✓ Complete'
    WHEN COUNT(*) >= 240 THEN '⚠ Almost Complete'
    ELSE '✗ Incomplete'
  END as status
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;

