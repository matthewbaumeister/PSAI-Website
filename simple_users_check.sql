-- Simple check for users table data
-- Run this in your Supabase SQL Editor

-- 1. Basic user count and structure
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
    'Active Users' as metric,
    COUNT(*)::text as value
FROM users WHERE is_active = true
UNION ALL
SELECT 
    'Admin Users' as metric,
    COUNT(*)::text as value
FROM users WHERE is_admin = true
UNION ALL
SELECT 
    'Verified Users' as metric,
    COUNT(*)::text as value
FROM users WHERE email_verified_at IS NOT NULL;

-- 2. Sample user data
SELECT 
    id,
    email,
    first_name,
    last_name,
    company_name,
    is_active,
    is_admin,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
