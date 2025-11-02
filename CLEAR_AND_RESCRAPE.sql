-- =====================================================
-- CLEAR ALL DATA AND RE-SCRAPE
-- Run this in Supabase SQL Editor
-- =====================================================

-- This will clear everything and let you start fresh
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;

-- Verify it's empty
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

-- All should show 0 rows
-- Now run: npx tsx test-dod-single-article.ts

