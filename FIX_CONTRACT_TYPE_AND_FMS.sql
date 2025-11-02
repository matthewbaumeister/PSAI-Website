-- =====================================================
-- QUICK CHECK: contract_types and FMS countries
-- =====================================================

WITH summary AS (
  SELECT 
    'contract_types (correct column)' as check_name,
    COUNT(*) FILTER (WHERE contract_types IS NOT NULL AND array_length(contract_types, 1) > 0)::TEXT || ' / 48' as result,
    CASE 
      WHEN COUNT(*) FILTER (WHERE contract_types IS NOT NULL AND array_length(contract_types, 1) > 0) > 0 
      THEN '✅ Working!'
      ELSE '❌ Not working'
    END as status,
    (SELECT array_to_string(contract_types, ', ') FROM dod_contract_news WHERE contract_types IS NOT NULL LIMIT 1) as sample
  FROM dod_contract_news
  
  UNION ALL
  
  SELECT 
    'FMS countries (current)',
    COUNT(*) FILTER (WHERE is_fms = true)::TEXT || ' FMS contracts',
    COUNT(*) FILTER (WHERE is_fms = true AND fms_countries IS NOT NULL AND array_length(fms_countries, 1) > 0)::TEXT || ' with countries',
    (SELECT array_to_string(fms_countries, ', ') FROM dod_contract_news WHERE is_fms = true AND fms_countries IS NOT NULL LIMIT 1)
  FROM dod_contract_news
),

contract_types_detail AS (
  SELECT 
    vendor_name,
    award_amount,
    contract_types,
    array_to_string(contract_types, ', ') as types_list
  FROM dod_contract_news
  WHERE contract_types IS NOT NULL AND array_length(contract_types, 1) > 0
  ORDER BY award_amount DESC
  LIMIT 10
)

SELECT 'SUMMARY' as section, * FROM summary
UNION ALL
SELECT '========' as section, '========' as check_name, '========' as result, '========' as status, '========' as sample
UNION ALL
SELECT 
  'TOP CONTRACTS' as section,
  vendor_name,
  '$' || ROUND(award_amount/1000000, 1) || 'M',
  types_list,
  NULL,
  NULL
FROM contract_types_detail;

