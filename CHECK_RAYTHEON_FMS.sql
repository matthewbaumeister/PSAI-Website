-- Check Raytheon's FMS countries specifically
SELECT 
  vendor_name,
  fms_countries,
  array_length(fms_countries, 1) as count,
  SUBSTRING(raw_paragraph, 1, 500) as paragraph_sample
FROM dod_contract_news
WHERE vendor_name LIKE '%Raytheon%'
  AND is_fms = true
ORDER BY array_length(fms_countries, 1) DESC;

