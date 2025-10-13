-- Increase Supabase SQL Timeout - Run this FIRST before any cleanup
-- This increases the timeout for the postgres role to 10 minutes

-- Option 1: Set timeout for current session only (10 minutes)
SET statement_timeout = '10min';

-- Option 2: Set timeout permanently for postgres role (recommended)
ALTER ROLE postgres SET statement_timeout = '10min';

-- Reload PostgREST to apply changes (if using API)
NOTIFY pgrst, 'reload config';

-- Verify the change
SELECT 
  rolname,
  rolconfig
FROM pg_roles
WHERE rolname = 'postgres';

-- Expected result should show: statement_timeout=10min

-- Now you can run the cleanup scripts without timeout errors!

