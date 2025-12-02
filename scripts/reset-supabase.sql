/**
 * Supabase Database Reset Script
 * WARNING: This will delete all data and tables!
 * 
 * Instructions:
 * 1. Make sure you've run the backup script first!
 * 2. Go to Supabase Dashboard → SQL Editor
 * 3. Copy and paste this script
 * 4. Review carefully
 * 5. Execute
 */

-- =================================
-- STEP 1: Drop all tables in public schema
-- =================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
    
    -- Drop all functions
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', r.routine_name;
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') 
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- =================================
-- STEP 2: Reset auth tables (optional - be careful!)
-- =================================
-- UNCOMMENT BELOW ONLY IF YOU WANT TO DELETE ALL USERS

-- TRUNCATE auth.users CASCADE;
-- TRUNCATE auth.identities CASCADE;
-- TRUNCATE auth.sessions CASCADE;
-- TRUNCATE auth.refresh_tokens CASCADE;

-- =================================
-- STEP 3: Clean up storage buckets (optional)
-- =================================
-- UNCOMMENT BELOW TO DELETE ALL STORAGE BUCKETS

-- DELETE FROM storage.objects;
-- DELETE FROM storage.buckets;

-- =================================
-- VERIFICATION
-- =================================
-- Run these queries to verify the reset:

-- Check remaining tables
SELECT 'Tables:', count(*) FROM pg_tables WHERE schemaname = 'public';

-- Check remaining views
SELECT 'Views:', count(*) FROM pg_views WHERE schemaname = 'public';

-- Check remaining functions
SELECT 'Functions:', count(*) FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- =================================
-- SUCCESS MESSAGE
-- =================================
DO $$ 
BEGIN
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Database reset complete!';
    RAISE NOTICE 'All public tables, views, and functions removed.';
    RAISE NOTICE 'You can now start fresh with your new schema.';
    RAISE NOTICE '=================================';
END $$;

