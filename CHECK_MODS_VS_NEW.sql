-- =====================================================
-- MODS VS NEW WORK ANALYSIS
-- =====================================================

-- 1. Overall breakdown
SELECT 
  '=== MODIFICATION vs NEW WORK ===' as section,
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE is_modification = true) as modifications,
  COUNT(*) FILTER (WHERE is_modification = false OR is_modification IS NULL) as new_work,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_modification = true) / COUNT(*), 1) as pct_modifications
FROM dod_contract_news;

-- 2. Modification type breakdown
SELECT 
  '=== MODIFICATION TYPES ===' as section,
  modification_type,
  COUNT(*) as count,
  ROUND(AVG(award_amount), 0) as avg_amount
FROM dod_contract_news
WHERE is_modification = true
GROUP BY modification_type
ORDER BY count DESC;

-- 3. Option exercises vs other mods
SELECT 
  '=== OPTION EXERCISES ===' as section,
  is_option_exercise,
  COUNT(*) as count,
  SUM(award_amount) as total_value
FROM dod_contract_news
WHERE is_modification = true
GROUP BY is_option_exercise;

-- 4. New work with vs without base contract reference
SELECT 
  '=== NEW WORK TRACKING ===' as section,
  CASE 
    WHEN base_contract_number IS NOT NULL THEN 'Has parent contract'
    WHEN modification_number IS NOT NULL THEN 'Has mod number'
    ELSE 'Fresh award'
  END as category,
  COUNT(*) as count,
  SUM(award_amount) as total_value
FROM dod_contract_news
WHERE is_modification = false OR is_modification IS NULL
GROUP BY category
ORDER BY count DESC;

-- 5. Show examples of each type
SELECT 
  '=== MODIFICATION EXAMPLES ===' as section,
  vendor_name,
  award_amount,
  is_modification,
  modification_type,
  is_option_exercise,
  modification_number,
  base_contract_number
FROM dod_contract_news
WHERE is_modification = true
ORDER BY award_amount DESC
LIMIT 5;

-- 6. Show examples of new work
SELECT 
  '=== NEW WORK EXAMPLES ===' as section,
  vendor_name,
  award_amount,
  is_modification,
  is_idiq,
  contract_types,
  has_options
FROM dod_contract_news
WHERE is_modification = false OR is_modification IS NULL
ORDER BY award_amount DESC
LIMIT 5;

