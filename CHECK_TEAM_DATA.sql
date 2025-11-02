-- =====================================================
-- DIAGNOSTIC QUERIES FOR TEAM MEMBERS DATA
-- Run these in order to understand what's happening
-- =====================================================

-- =====================================================
-- STEP 1: Check if contracts were scraped at all
-- =====================================================
SELECT 
  '1. Total Contracts Scraped' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No contracts found'
    ELSE '✅ Contracts found'
  END as status
FROM dod_contract_news;

-- =====================================================
-- STEP 2: Check if any contracts have teaming info
-- =====================================================
SELECT 
  '2. Contracts with Teaming' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ No teaming detected'
    ELSE '✅ Teaming detected'
  END as status
FROM dod_contract_news
WHERE is_teaming = true;

-- =====================================================
-- STEP 3: Check if team_work_share column exists
-- =====================================================
SELECT 
  '3. Team Work Share Column' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Column does not exist - need to run add_all_missing_fields.sql'
    ELSE '✅ Column exists'
  END as status
FROM information_schema.columns
WHERE table_name = 'dod_contract_news' 
  AND column_name = 'team_work_share';

-- =====================================================
-- STEP 4: Check team members table
-- =====================================================
SELECT 
  '4. Team Members Table' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ No team members inserted'
    ELSE '✅ Team members inserted'
  END as status
FROM dod_contract_team_members;

-- =====================================================
-- STEP 5: Sample raw text to see what we're working with
-- =====================================================
SELECT 
  vendor_name,
  is_teaming,
  team_members,
  prime_contractor,
  subcontractors,
  SUBSTRING(raw_paragraph, 1, 500) as paragraph_sample
FROM dod_contract_news
LIMIT 5;

-- =====================================================
-- STEP 6: Check what columns exist in dod_contract_news
-- =====================================================
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('team_work_share', 'is_teaming', 'prime_contractor', 'subcontractors', 
                          'is_small_business_set_aside', 'naics_code', 'industry_tags') 
    THEN '✅ Enhanced field'
    ELSE ''
  END as notes
FROM information_schema.columns
WHERE table_name = 'dod_contract_news'
  AND column_name IN ('is_teaming', 'team_members', 'prime_contractor', 'subcontractors', 
                      'team_work_share', 'is_small_business_set_aside', 'naics_code')
ORDER BY column_name;

-- =====================================================
-- STEP 7: If team members exist, show them
-- =====================================================
SELECT 
  company_name,
  team_role,
  work_share_percentage,
  award_amount,
  weighted_award_amount,
  contract_number
FROM dod_contract_team_members
ORDER BY weighted_award_amount DESC NULLS LAST;

-- =====================================================
-- STEP 8: Find contracts that mention percentages
-- =====================================================
SELECT 
  vendor_name,
  award_amount,
  is_teaming,
  SUBSTRING(raw_paragraph, 1, 300) as text_sample
FROM dod_contract_news
WHERE raw_paragraph ~ '\d+%'
ORDER BY award_amount DESC
LIMIT 10;

-- =====================================================
-- STEP 9: Full data quality check
-- =====================================================
SELECT 
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE is_teaming = true) as teaming_contracts,
  COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as small_business_set_aside,
  COUNT(*) FILTER (WHERE is_fms = true) as fms_contracts,
  AVG(award_amount)::NUMERIC(15,2) as avg_award_amount,
  MAX(award_amount)::NUMERIC(15,2) as max_award_amount
FROM dod_contract_news;

-- =====================================================
-- STEP 10: Sample of basic data (safe columns)
-- =====================================================
SELECT 
  vendor_name,
  vendor_state,
  vendor_city,
  award_amount,
  service_branch,
  contract_number,
  is_teaming,
  is_small_business_set_aside,
  is_fms
FROM dod_contract_news
ORDER BY award_amount DESC
LIMIT 10;

