-- ============================================
-- GSA MAS DATA VERIFICATION - COMPLETE SUMMARY
-- Run this once to see everything
-- ============================================

WITH stats AS (
  SELECT 
    COUNT(*) as total_contractors,
    COUNT(DISTINCT primary_sin) as unique_sins,
    COUNT(DISTINCT company_state) as states_covered,
    COUNT(DISTINCT contract_number) as unique_contracts,
    COUNT(vendor_uei) as has_uei,
    COUNT(vendor_duns) as has_duns,
    COUNT(website) as has_website,
    COUNT(primary_contact_email) as has_email,
    COUNT(primary_contact_phone) as has_phone,
    COUNT(additional_data) as has_additional_data,
    COUNT(CASE WHEN small_business = true THEN 1 END) as small_businesses,
    COUNT(CASE WHEN woman_owned = true THEN 1 END) as woman_owned,
    COUNT(CASE WHEN veteran_owned = true THEN 1 END) as veteran_owned,
    COUNT(CASE WHEN eight_a_program = true THEN 1 END) as eight_a,
    COUNT(CASE WHEN contract_expiration_date > CURRENT_DATE THEN 1 END) as active_contracts
  FROM gsa_schedule_holders
),
top_sins AS (
  SELECT 
    unnest(sin_codes) as sin,
    COUNT(*) as contractor_count
  FROM gsa_schedule_holders
  GROUP BY sin
  ORDER BY contractor_count DESC
  LIMIT 10
),
state_breakdown AS (
  SELECT 
    company_state,
    COUNT(*) as contractors_in_state
  FROM gsa_schedule_holders
  WHERE company_state IS NOT NULL
  GROUP BY company_state
  ORDER BY contractors_in_state DESC
  LIMIT 10
)

-- Main output with all key metrics
SELECT 
  'OVERALL TOTALS' as section,
  'Total Contractors' as metric,
  total_contractors::text as value
FROM stats
UNION ALL
SELECT 'OVERALL TOTALS', 'Unique SINs', unique_sins::text FROM stats
UNION ALL
SELECT 'OVERALL TOTALS', 'Unique Contracts', unique_contracts::text FROM stats
UNION ALL
SELECT 'OVERALL TOTALS', 'States Covered', states_covered::text FROM stats
UNION ALL
SELECT 'OVERALL TOTALS', 'Active Contracts', active_contracts::text FROM stats
UNION ALL
SELECT '', '', '' -- Blank line
UNION ALL
SELECT 'DATA COMPLETENESS' as section, 'Has UEI', has_uei::text FROM stats
UNION ALL
SELECT 'DATA COMPLETENESS', 'Has DUNS', has_duns::text FROM stats
UNION ALL
SELECT 'DATA COMPLETENESS', 'Has Website', has_website::text FROM stats
UNION ALL
SELECT 'DATA COMPLETENESS', 'Has Email', has_email::text FROM stats
UNION ALL
SELECT 'DATA COMPLETENESS', 'Has Phone', has_phone::text FROM stats
UNION ALL
SELECT 'DATA COMPLETENESS', 'Has Additional Data (Pricing)', has_additional_data::text FROM stats
UNION ALL
SELECT '', '', '' -- Blank line
UNION ALL
SELECT 'BUSINESS TYPES' as section, 'Small Business', small_businesses::text FROM stats
UNION ALL
SELECT 'BUSINESS TYPES', 'Woman Owned', woman_owned::text FROM stats
UNION ALL
SELECT 'BUSINESS TYPES', 'Veteran Owned', veteran_owned::text FROM stats
UNION ALL
SELECT 'BUSINESS TYPES', '8(a) Program', eight_a::text FROM stats
UNION ALL
SELECT '', '', '' -- Blank line
UNION ALL
SELECT 'TOP 10 SINs BY CONTRACTORS', sin, contractor_count::text 
FROM top_sins
UNION ALL
SELECT '', '', '' -- Blank line
UNION ALL
SELECT 'TOP 10 STATES BY CONTRACTORS', company_state, contractors_in_state::text 
FROM state_breakdown

ORDER BY 
  CASE section 
    WHEN 'OVERALL TOTALS' THEN 1
    WHEN 'DATA COMPLETENESS' THEN 2
    WHEN 'BUSINESS TYPES' THEN 3
    WHEN 'TOP 10 SINs BY CONTRACTORS' THEN 4
    WHEN 'TOP 10 STATES BY CONTRACTORS' THEN 5
    ELSE 6
  END,
  metric;


-- Also show some sample records
SELECT 
  '=' as divider,
  '=' as divider2,
  '=' as divider3
UNION ALL
SELECT 
  'SAMPLE RECORDS',
  'Below are 20 sample contractors',
  'with full details'
UNION ALL
SELECT '=', '=', '=';

SELECT 
  company_name,
  contract_number,
  company_state,
  primary_sin,
  website,
  primary_contact_email,
  contract_expiration_date::text as expires,
  CASE WHEN small_business THEN 'Yes' ELSE 'No' END as small_biz
FROM gsa_schedule_holders
ORDER BY created_at DESC
LIMIT 20;

