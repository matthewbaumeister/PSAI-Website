-- =====================================================
-- RUN TEAM MEMBERS TABLE MIGRATION
-- Execute this in Supabase SQL Editor
-- =====================================================

-- First, clear existing data for clean test
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;

-- Now run the migration
\i supabase/migrations/add_team_members_table.sql

-- Verify table was created
SELECT 
  'dod_contract_team_members' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'dod_contract_team_members';

-- Verify views were created
SELECT 
  table_name as view_name,
  'VIEW' as type
FROM information_schema.views
WHERE table_name IN (
  'company_prime_contracts',
  'company_subcontractor_performance',
  'company_overall_performance',
  'teaming_relationships',
  'dod_contracts_with_teams'
)
ORDER BY table_name;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'dod_contract_team_members'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Migration ready! Now run: npx tsx test-dod-single-article.ts' as next_step;

