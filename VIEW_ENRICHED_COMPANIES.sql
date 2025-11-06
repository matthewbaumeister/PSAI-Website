-- ============================================
-- VIEW ENRICHED COMPANIES DATA
-- ============================================
-- Shows the 6 companies we just enriched
-- ============================================

-- Summary of enrichment
SELECT 
  '📊 ENRICHMENT SUMMARY' as section,
  '' as metric,
  '' as value
UNION ALL
SELECT 
  '',
  'Total companies enriched',
  COUNT(*)::text
FROM company_intelligence
UNION ALL
SELECT 
  '',
  'With SAM.gov data',
  COUNT(*)::text
FROM company_intelligence
WHERE sam_enriched = TRUE
UNION ALL
SELECT 
  '',
  'Public companies found',
  COUNT(*)::text
FROM company_intelligence
WHERE is_public_company = TRUE
UNION ALL
SELECT 
  '',
  'Average quality score',
  ROUND(AVG(data_quality_score))::text
FROM company_intelligence;

-- ============================================
-- Detailed view of enriched companies
-- ============================================

SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator,
  '' as col2, '' as col3, '' as col4, '' as col5
UNION ALL
SELECT 
  '📋 ENRICHED COMPANIES DETAIL',
  '', '', '', '';

-- Main data
SELECT 
  ROW_NUMBER() OVER (ORDER BY id) as "#",
  company_name,
  sam_legal_name as "Legal Name",
  headquarters_city || ', ' || headquarters_state as "HQ Location",
  sam_entity_structure as "Business Type"
FROM company_intelligence
ORDER BY id;

-- More details
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator,
  '' as col2, '' as col3, '' as col4, '' as col5
UNION ALL
SELECT 
  '📞 CONTACT & CERTIFICATION INFO',
  '', '', '', '';

SELECT 
  company_name,
  primary_website as "Website",
  primary_email as "Email",
  CASE WHEN is_small_business THEN '✓' ELSE '' END as "Small Biz",
  CASE WHEN is_woman_owned THEN '✓' ELSE '' END as "Woman Owned"
FROM company_intelligence
ORDER BY id;

-- Quality metrics
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator,
  '' as col2, '' as col3, '' as col4, '' as col5
UNION ALL
SELECT 
  '📈 DATA QUALITY METRICS',
  '', '', '', '';

SELECT 
  company_name,
  data_quality_score as "Quality Score",
  confidence_level as "Confidence",
  CASE WHEN sam_enriched THEN '✓' ELSE '✗' END as "SAM.gov",
  CASE WHEN sec_enriched THEN '✓' ELSE '✗' END as "SEC"
FROM company_intelligence
ORDER BY data_quality_score DESC;

-- Full detail of first company (example)
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator,
  '' as col2
UNION ALL
SELECT 
  '🔍 FULL DETAIL - FIRST COMPANY',
  '';

SELECT 
  'Company Name' as field,
  company_name as value
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Legal Name',
  sam_legal_name
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'UEI',
  uei
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'CAGE Code',
  COALESCE(cage_code, 'N/A')
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Business Structure',
  COALESCE(sam_entity_structure, 'N/A')
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Headquarters',
  headquarters_address_line1 || ', ' || headquarters_city || ', ' || headquarters_state || ' ' || headquarters_zip_code
FROM company_intelligence
WHERE headquarters_address_line1 IS NOT NULL
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Website',
  COALESCE(primary_website, 'N/A')
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Email',
  COALESCE(primary_email, 'N/A')
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Phone',
  COALESCE(primary_phone, 'N/A')
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Registration Status',
  COALESCE(sam_registration_status, 'N/A')
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Small Business',
  CASE WHEN is_small_business THEN 'Yes' ELSE 'No' END
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Woman Owned',
  CASE WHEN is_woman_owned THEN 'Yes' ELSE 'No' END
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Veteran Owned',
  CASE WHEN is_veteran_owned THEN 'Yes' ELSE 'No' END
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'HUBZone',
  CASE WHEN is_hubzone THEN 'Yes' ELSE 'No' END
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Data Sources',
  ARRAY_TO_STRING(data_sources, ', ')
FROM company_intelligence
WHERE data_sources IS NOT NULL
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Quality Score',
  data_quality_score::text
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Confidence',
  confidence_level
FROM company_intelligence
ORDER BY id
LIMIT 1
UNION ALL
SELECT 
  'Last Enriched',
  TO_CHAR(last_enriched, 'YYYY-MM-DD HH24:MI:SS')
FROM company_intelligence
ORDER BY id
LIMIT 1;

-- ============================================
-- Links to fpds_company_stats
-- ============================================

SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator,
  '' as col2, '' as col3
UNION ALL
SELECT 
  '🔗 LINKED TO CONTRACT DATA',
  '', '';

SELECT 
  ci.company_name,
  fcs.total_contracts as "Contracts",
  TO_CHAR(fcs.total_value, '$999,999,999,999') as "Total Value"
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY ci.id;

