-- ============================================
-- SIMPLE VIEW: Enriched Companies
-- Copy/paste this into Supabase SQL Editor
-- ============================================

-- Quick summary
SELECT 
  COUNT(*) as total_enriched,
  COUNT(*) FILTER (WHERE sam_enriched = TRUE) as with_sam_data,
  ROUND(AVG(data_quality_score)) as avg_quality_score
FROM company_intelligence;

-- View all enriched companies
SELECT 
  id,
  company_name,
  sam_legal_name,
  headquarters_city,
  headquarters_state,
  sam_entity_structure,
  primary_website,
  is_small_business,
  is_woman_owned,
  data_quality_score,
  confidence_level,
  last_enriched
FROM company_intelligence
ORDER BY id;

-- Full detail for one company (UT-Battelle)
SELECT * FROM company_intelligence WHERE id = 1;

-- See contract data linked to enriched companies
SELECT 
  ci.company_name,
  ci.headquarters_state,
  ci.sam_entity_structure,
  fcs.total_contracts,
  TO_CHAR(fcs.total_value, '$999,999,999,999') as total_value,
  ci.data_quality_score
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.id = ci.fpds_company_stats_id
ORDER BY fcs.total_value DESC;

