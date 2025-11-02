-- =====================================================
-- CHECK PARSING ISSUES
-- =====================================================

-- 1. Check full text storage (raw_paragraph)
SELECT 
  'Full text storage' as check_type,
  COUNT(*) as total,
  COUNT(raw_paragraph) as has_raw_paragraph,
  ROUND(100.0 * COUNT(raw_paragraph) / COUNT(*), 1) as pct
FROM dod_contract_news;

-- 2. Check FMS countries parsing issues
SELECT 
  vendor_name,
  is_fms,
  fms_countries,
  SUBSTRING(raw_paragraph, 1, 300) as paragraph_sample
FROM dod_contract_news
WHERE is_fms = true
ORDER BY array_length(fms_countries, 1) DESC NULLS LAST
LIMIT 10;

-- 3. Check for teaming/multiple vendors in descriptions
SELECT 
  'Teaming Keywords' as check_type,
  COUNT(*) FILTER (WHERE raw_paragraph ~* 'team|teaming|joint venture|JV|prime contractor|subcontractor') as has_teaming_keywords,
  COUNT(*) as total
FROM dod_contract_news;

-- 4. Look for contracts with multiple vendors mentioned
SELECT 
  vendor_name,
  contract_number,
  SUBSTRING(raw_paragraph, 1, 400) as sample
FROM dod_contract_news
WHERE raw_paragraph ~* '\b(and|along with|in partnership with|teaming with)\b'
LIMIT 5;

-- 5. Check for keywords field usage
SELECT 
  'Keywords field' as check_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE contract_description IS NOT NULL) as has_description,
  AVG(LENGTH(contract_description)) as avg_description_length
FROM dod_contract_news;

-- 6. Sample problematic FMS entries
SELECT 
  '=== PROBLEMATIC FMS COUNTRIES ===' as section,
  vendor_name,
  fms_countries,
  CASE 
    WHEN array_length(fms_countries, 1) > 20 THEN 'TOO MANY'
    WHEN EXISTS (SELECT 1 FROM unnest(fms_countries) c WHERE LENGTH(c) < 3) THEN 'TOO SHORT'
    WHEN EXISTS (SELECT 1 FROM unnest(fms_countries) c WHERE c ~* '[^a-zA-Z\s-]') THEN 'INVALID CHARS'
    ELSE 'OK'
  END as issue_type
FROM dod_contract_news
WHERE is_fms = true
  AND fms_countries IS NOT NULL
ORDER BY array_length(fms_countries, 1) DESC;

