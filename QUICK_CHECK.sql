-- =====================================================
-- QUICK DATA ACCURACY CHECK (Single Query)
-- =====================================================

WITH data_summary AS (
  SELECT 
    COUNT(*) as total_contracts,
    COUNT(*) FILTER (WHERE is_teaming = true) as teaming_count,
    COUNT(*) FILTER (WHERE team_work_share IS NOT NULL AND jsonb_array_length(team_work_share) > 0) as work_share_count,
    (SELECT COUNT(*) FROM dod_contract_team_members) as team_members_count,
    COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as small_biz_count,
    COUNT(*) FILTER (WHERE is_fms = true) as fms_count,
    COUNT(*) FILTER (WHERE naics_code IS NOT NULL) as naics_count,
    COUNT(*) FILTER (WHERE raw_paragraph ~ '\d+%') as contracts_mentioning_percentages
  FROM dod_contract_news
),
top_contracts AS (
  SELECT 
    vendor_name,
    vendor_state,
    award_amount,
    is_teaming,
    team_work_share,
    is_small_business_set_aside,
    naics_code
  FROM dod_contract_news
  ORDER BY award_amount DESC
  LIMIT 5
)
SELECT 
  '=== DATA SUMMARY ===' as section,
  total_contracts,
  teaming_count,
  work_share_count,
  team_members_count,
  small_biz_count,
  fms_count,
  naics_count,
  contracts_mentioning_percentages,
  NULL::TEXT as vendor_name,
  NULL::TEXT as vendor_state,
  NULL::NUMERIC as award_amount,
  NULL::BOOLEAN as is_teaming,
  NULL::JSONB as team_work_share
FROM data_summary

UNION ALL

SELECT 
  '=== TOP 5 CONTRACTS ===' as section,
  NULL::BIGINT, NULL::BIGINT, NULL::BIGINT, NULL::BIGINT,
  NULL::BIGINT, NULL::BIGINT, NULL::BIGINT, NULL::BIGINT,
  vendor_name,
  vendor_state,
  award_amount,
  is_teaming,
  team_work_share
FROM top_contracts;

