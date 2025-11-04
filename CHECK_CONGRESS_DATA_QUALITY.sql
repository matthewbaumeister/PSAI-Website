-- ====================================
-- CONGRESS.GOV DATA QUALITY CHECK
-- ====================================
-- Run this in Supabase SQL Editor to verify the comprehensive data import worked

-- 1. OVERALL SUMMARY
SELECT 
  '1. OVERALL SUMMARY' as check_section,
  COUNT(*)::text as total_bills,
  COUNT(*) FILTER (WHERE is_defense_related = true)::text as defense_related_bills,
  MIN(introduced_date)::text as earliest_bill,
  MAX(introduced_date)::text as latest_bill,
  COUNT(DISTINCT congress)::text as congresses_covered
FROM congressional_bills

UNION ALL

-- 2. DATA QUALITY CHECK - ALL FIELDS
SELECT 
  '2. ACTIONS DATA' as check_section,
  COUNT(*) FILTER (WHERE actions::text LIKE '%"url":%')::text as broken_reference_objects,
  COUNT(*) FILTER (WHERE jsonb_typeof(actions) = 'array')::text as proper_arrays,
  COUNT(*) FILTER (WHERE jsonb_typeof(actions) = 'array' AND jsonb_array_length(actions) > 0)::text as arrays_with_data,
  COUNT(*)::text as total_bills,
  NULL as extra
FROM congressional_bills
WHERE actions IS NOT NULL

UNION ALL

SELECT 
  '3. COSPONSORS DATA' as check_section,
  COUNT(*) FILTER (WHERE cosponsors::text LIKE '%"url":%')::text as broken_reference_objects,
  COUNT(*) FILTER (WHERE jsonb_typeof(cosponsors) = 'array')::text as proper_arrays,
  COUNT(*) FILTER (WHERE jsonb_typeof(cosponsors) = 'array' AND jsonb_array_length(cosponsors) > 0)::text as arrays_with_data,
  COUNT(*)::text as total_bills,
  NULL as extra
FROM congressional_bills
WHERE cosponsors IS NOT NULL

UNION ALL

SELECT 
  '4. AMENDMENTS DATA' as check_section,
  COUNT(*) FILTER (WHERE amendments::text LIKE '%"url":%')::text as broken_reference_objects,
  COUNT(*) FILTER (WHERE jsonb_typeof(amendments) = 'array')::text as proper_arrays,
  COUNT(*) FILTER (WHERE jsonb_typeof(amendments) = 'array' AND jsonb_array_length(amendments) > 0)::text as arrays_with_data,
  COUNT(*)::text as total_bills,
  NULL as extra
FROM congressional_bills
WHERE amendments IS NOT NULL

UNION ALL

SELECT 
  '5. TEXT VERSIONS DATA' as check_section,
  COUNT(*) FILTER (WHERE text_versions::text LIKE '%"url":%')::text as broken_reference_objects,
  COUNT(*) FILTER (WHERE jsonb_typeof(text_versions) = 'array')::text as proper_arrays,
  COUNT(*) FILTER (WHERE jsonb_typeof(text_versions) = 'array' AND jsonb_array_length(text_versions) > 0)::text as arrays_with_data,
  COUNT(*)::text as total_bills,
  NULL as extra
FROM congressional_bills
WHERE text_versions IS NOT NULL;

