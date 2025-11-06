-- Check if congressional_members exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'congressional_members' 
ORDER BY ordinal_position;
