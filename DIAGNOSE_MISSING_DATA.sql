-- =====================================================
-- DIAGNOSE: Why is data not being inserted?
-- =====================================================

-- 1. Check if tables exist
SELECT 
  table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = i.table_name)
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (VALUES 
  ('dod_contract_news'),
  ('dod_contract_team_members'),
  ('dod_contract_performance_locations')
) AS i(table_name);

-- 2. Check row counts
SELECT 
  'dod_contract_news' as table_name,
  COUNT(*) as row_count
FROM dod_contract_news
UNION ALL
SELECT 
  'dod_contract_team_members' as table_name,
  COUNT(*) as row_count
FROM dod_contract_team_members
UNION ALL
SELECT 
  'dod_contract_performance_locations' as table_name,
  COUNT(*) as row_count
FROM dod_contract_performance_locations;

-- 3. Check if performance_location_breakdown field has data
SELECT 
  vendor_name,
  performance_location_breakdown,
  jsonb_array_length(performance_location_breakdown) as location_count
FROM dod_contract_news
WHERE performance_location_breakdown IS NOT NULL
LIMIT 5;

-- 4. Show raw performance location data from main table
SELECT 
  vendor_name,
  performance_locations,
  performance_cities,
  performance_states
FROM dod_contract_news
LIMIT 5;

-- 5. Check if performanceLocations is being extracted
SELECT 
  vendor_name,
  SUBSTRING(raw_paragraph, 1, 500) as text_excerpt,
  CASE 
    WHEN raw_paragraph ~ 'will be performed' THEN '✅ has location text'
    ELSE '❌ no location text'
  END as has_location_text
FROM dod_contract_news
LIMIT 3;

-- =====================================================
-- ISSUE DIAGNOSIS:
-- =====================================================
-- If performance_location_breakdown IS NULL:
--   → Scraper isn't populating the field
--   → Need to check if extractPerformanceLocations is being called
--
-- If dod_contract_performance_locations has 0 rows:
--   → The insertion code isn't running
--   → Check if contract.performanceLocations exists in scraper
-- =====================================================

