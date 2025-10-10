-- Check total count in sbir_final table
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN status IN ('Open', 'Pre-Release') THEN 1 END) as active_records,
    MAX(last_scraped) as last_update
FROM sbir_final;
