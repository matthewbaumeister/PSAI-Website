-- =====================================================
-- CHECK CURRENT DATABASE STATE
-- Run this RIGHT NOW to see what's missing
-- =====================================================

-- 1. Check if basic table exists
SELECT 
  'dod_contract_news table' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dod_contract_news')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 2. Check if enhanced columns exist
SELECT 
  column_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns
WHERE table_name = 'dod_contract_news'
  AND column_name IN (
    'team_work_share',
    'is_teaming',
    'prime_contractor',
    'subcontractors',
    'is_small_business_set_aside',
    'set_aside_type',
    'naics_code',
    'solicitation_number',
    'industry_tags',
    'technology_tags',
    'service_tags'
  )
GROUP BY column_name
ORDER BY column_name;

-- 3. Check if team members table exists
SELECT 
  'dod_contract_team_members table' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dod_contract_team_members')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 4. Check if analytics views exist
SELECT 
  table_name as view_name,
  '✅ EXISTS' as status
FROM information_schema.views
WHERE table_name IN (
  'company_prime_contracts',
  'company_subcontractor_performance',
  'company_overall_performance',
  'teaming_relationships',
  'dod_contracts_with_teams'
)
ORDER BY table_name;

-- 5. Count current data
SELECT 
  (SELECT COUNT(*) FROM dod_contract_news) as contracts_in_db,
  (SELECT COUNT(*) FROM dod_contract_team_members) as team_members_in_db;

-- =====================================================
-- SUMMARY: What do you need to do?
-- =====================================================
-- If team_work_share is MISSING → Run: add_all_missing_fields.sql
-- If dod_contract_team_members is MISSING → Run: add_team_members_table.sql
-- If both exist → You're ready to scrape!
-- =====================================================

