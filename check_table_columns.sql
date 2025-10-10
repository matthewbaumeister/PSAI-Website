-- Check what tables exist and their columns
-- Run this in Supabase SQL Editor

-- List all tables that start with 'sbir'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'sbir%'
ORDER BY table_name;

-- Get columns for sbir_final if it exists
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'sbir_final'
ORDER BY ordinal_position;

-- Get columns for sbir_data_new if it exists  
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'sbir_data_new'
ORDER BY ordinal_position;

