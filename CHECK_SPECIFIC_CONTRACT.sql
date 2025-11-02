-- =====================================================
-- CHECK SPECIFIC CONTRACT: Advanced Navigation
-- =====================================================

SELECT 
  vendor_name,
  vendor_state,
  award_amount,
  is_small_business,
  is_small_business_set_aside,
  set_aside_type,
  is_competed,
  competition_type,
  number_of_offers_received,
  SUBSTRING(raw_paragraph, 1, 500) as paragraph_sample
FROM dod_contract_news
WHERE vendor_name LIKE '%Advanced Navigation%'
   OR vendor_name LIKE '%Hood Rivera%';

-- =====================================================
-- CHECK ALL CONTRACTS FOR SET-ASIDE KEYWORDS
-- =====================================================
SELECT 
  'Contracts with set-aside keywords' as check_type,
  COUNT(*) as total_with_keywords,
  COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as marked_as_set_aside,
  COUNT(*) FILTER (WHERE set_aside_type IS NOT NULL) as has_set_aside_type
FROM dod_contract_news
WHERE raw_paragraph ~* 'set-aside|set aside';

-- =====================================================
-- SHOW EXAMPLES WITH SET-ASIDE KEYWORDS BUT NOT MARKED
-- =====================================================
SELECT 
  vendor_name,
  award_amount,
  is_small_business,
  is_small_business_set_aside,
  set_aside_type,
  SUBSTRING(raw_paragraph, 1, 400) as sample
FROM dod_contract_news
WHERE raw_paragraph ~* 'set-aside|set aside'
  AND (is_small_business_set_aside IS NULL OR is_small_business_set_aside = false)
LIMIT 5;

