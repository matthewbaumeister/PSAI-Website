-- Check the 6 enriched companies
SELECT 
  company_name,
  sam_legal_name,
  headquarters_city,
  headquarters_state,
  sam_entity_structure,
  is_small_business,
  is_woman_owned,
  data_quality_score,
  confidence_level
FROM company_intelligence
ORDER BY id
LIMIT 10;
