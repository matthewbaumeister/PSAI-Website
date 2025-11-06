-- ============================================
-- VIEW ENRICHED COMPANIES - FIXED COLUMN NAMES
-- Copy/paste this into Supabase SQL Editor
-- ============================================

-- Quick summary
SELECT 
  COUNT(*) as total_enriched,
  COUNT(*) FILTER (WHERE sam_enriched = TRUE) as with_sam_data,
  COUNT(*) FILTER (WHERE is_public_company = TRUE) as public_companies,
  ROUND(AVG(data_quality_score)) as avg_quality_score
FROM company_intelligence;

-- View all enriched companies
SELECT 
  id,
  company_name,
  sam_legal_name as "Legal Name",
  COALESCE(headquarters_city || ', ' || headquarters_state, 'N/A') as "HQ Location",
  COALESCE(sam_business_type, 'N/A') as "Business Type",
  COALESCE(website, 'N/A') as "Website",
  CASE WHEN is_small_business THEN 'Yes' ELSE 'No' END as "Small Business",
  data_quality_score as "Quality Score",
  TO_CHAR(last_enriched, 'YYYY-MM-DD HH24:MI') as "Last Enriched"
FROM company_intelligence
ORDER BY id;

-- Detailed view with contact info
SELECT 
  company_name as "Company",
  sam_legal_name as "Legal Name",
  headquarters_city || ', ' || headquarters_state as "Location",
  sam_business_type as "Type",
  website as "Website",
  primary_email as "Email",
  primary_phone as "Phone",
  CASE WHEN is_small_business THEN '✓' ELSE '' END as "SB",
  CASE WHEN is_woman_owned THEN '✓' ELSE '' END as "WO",
  CASE WHEN is_veteran_owned THEN '✓' ELSE '' END as "VO",
  data_quality_score as "Quality"
FROM company_intelligence
ORDER BY data_quality_score DESC;

-- Full detail of first company (UT-Battelle)
SELECT 
  'Company Name' as field,
  company_name as value
FROM company_intelligence
WHERE id = 1
UNION ALL
SELECT 'UEI', vendor_uei FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Legal Name', sam_legal_name FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Business Type', sam_business_type FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'HQ Address', headquarters_address FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'HQ City', headquarters_city FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'HQ State', headquarters_state FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Website', website FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Email', primary_email FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Phone', primary_phone FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Registration Status', sam_registration_status FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Small Business', CASE WHEN is_small_business THEN 'Yes' ELSE 'No' END FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Woman Owned', CASE WHEN is_woman_owned THEN 'Yes' ELSE 'No' END FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Veteran Owned', CASE WHEN is_veteran_owned THEN 'Yes' ELSE 'No' END FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Primary NAICS', primary_naics || ' - ' || COALESCE(primary_naics_description, '') FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Data Quality Score', data_quality_score::text FROM company_intelligence WHERE id = 1
UNION ALL
SELECT 'Confidence', confidence_level FROM company_intelligence WHERE id = 1;

-- Link to contract data
SELECT 
  ci.company_name as "Company",
  ci.sam_legal_name as "Legal Name",
  fcs.total_contracts as "Total Contracts",
  TO_CHAR(fcs.total_value, '$999,999,999,999') as "Contract Value",
  ci.data_quality_score as "Quality"
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY fcs.total_value DESC;

