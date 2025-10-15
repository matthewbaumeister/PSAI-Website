-- Export a sample record with ALL fields for analysis
-- Run this in Supabase SQL Editor and copy the entire JSON result

-- Export 2 sample records as JSON (easy to share)
SELECT json_agg(row_to_json(t)) as sample_records
FROM (
    SELECT *
    FROM sbir_final
    WHERE topic_number IS NOT NULL
    ORDER BY last_scraped DESC
    LIMIT 2
) t;
 
