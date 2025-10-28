-- Verify all 5 instruction columns were created
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'dsip_opportunities' 
AND (column_name LIKE 'instructions%' OR column_name = 'consolidated_instructions_url')
ORDER BY column_name;

