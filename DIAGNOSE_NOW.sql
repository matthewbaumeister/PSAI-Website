-- =====================================================
-- DIAGNOSTIC: Why is team data empty?
-- =====================================================

-- 1. How many contracts were scraped?
SELECT 'Total contracts' as check_name, COUNT(*) as count FROM dod_contract_news;

-- 2. Which contracts have teaming?
SELECT 'Contracts with is_teaming=true' as check_name, COUNT(*) as count 
FROM dod_contract_news WHERE is_teaming = true;

-- 3. Show the teaming contract details
SELECT 
  vendor_name,
  is_teaming,
  team_members,
  prime_contractor,
  subcontractors,
  team_work_share
FROM dod_contract_news
WHERE is_teaming = true;

-- 4. Check if team_work_share column exists and has data type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'dod_contract_news' 
  AND column_name = 'team_work_share';

-- 5. Look at raw text for contracts mentioning "team" or percentages
SELECT 
  vendor_name,
  award_amount,
  is_teaming,
  CASE 
    WHEN raw_paragraph ILIKE '%team%' THEN '✅ mentions team'
    ELSE '❌ no team mention'
  END as has_team_keyword,
  CASE 
    WHEN raw_paragraph ~ '\d+%' THEN '✅ has %'
    ELSE '❌ no %'
  END as has_percentage,
  SUBSTRING(raw_paragraph, 1, 400) as text_sample
FROM dod_contract_news
LIMIT 5;

-- 6. Check the specific teaming contract (G.S.E Dynamics)
SELECT 
  vendor_name,
  is_teaming,
  team_members,
  team_work_share,
  SUBSTRING(raw_paragraph, 1, 600) as paragraph_excerpt
FROM dod_contract_news
WHERE vendor_name ILIKE '%G.S.E%' OR vendor_name ILIKE '%GSE%';

-- 7. Check if scraper is actually populating team_work_share
SELECT 
  vendor_name,
  CASE 
    WHEN team_work_share IS NULL THEN '❌ NULL'
    WHEN team_work_share::text = '[]' THEN '⚠️ Empty array'
    WHEN team_work_share::text = 'null' THEN '❌ null string'
    ELSE '✅ Has data: ' || team_work_share::text
  END as team_work_share_status
FROM dod_contract_news
WHERE is_teaming = true;

-- =====================================================
-- INTERPRETATION:
-- =====================================================
-- If is_teaming = true BUT team_work_share IS NULL:
--   → The text mentions "teaming" but no work share percentages
--   → This is NORMAL - most contracts don't specify percentages
--
-- If you see percentages in raw_paragraph:
--   → Check if they're about performance locations (e.g., "Virginia, 35%")
--   → The scraper should now filter those out
-- =====================================================

