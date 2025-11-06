-- Check if dod_news_scraper_log table exists and its columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'dod_news_scraper_log'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

