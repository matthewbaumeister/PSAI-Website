-- =====================================================
-- DEBUG SET-ASIDE ISSUE
-- =====================================================

-- 1. Check if Advanced Navigation contract exists
SELECT 
  '1. Advanced Navigation Contract' as check,
  vendor_name,
  is_small_business_set_aside,
  set_aside_type,
  SUBSTRING(raw_paragraph, 1, 300) as paragraph_sample
FROM dod_contract_news
WHERE vendor_name LIKE '%Advanced Navigation%'
   OR vendor_name LIKE '%Hood Rivera%';

-- 2. Check ALL contracts with "set-aside" keyword
SELECT 
  '2. Contracts with set-aside keyword' as check,
  vendor_name,
  is_small_business_set_aside,
  set_aside_type,
  SUBSTRING(raw_paragraph, 1, 200) as sample
FROM dod_contract_news
WHERE raw_paragraph ~* 'set-aside|set aside'
LIMIT 5;

-- 3. Count how many have the keyword
SELECT 
  '3. Keyword count' as check,
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'set-aside|set aside') as has_keyword,
  COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as marked_true,
  COUNT(*) as total
FROM dod_contract_news;

-- 4. Show full raw_paragraph for Advanced Navigation
SELECT 
  '4. Full Advanced Navigation Paragraph' as check,
  raw_paragraph
FROM dod_contract_news
WHERE vendor_name LIKE '%Advanced Navigation%'
LIMIT 1;

