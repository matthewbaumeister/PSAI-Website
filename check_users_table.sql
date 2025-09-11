-- =====================================================
-- PropShop AI - Users Table Analysis
-- Check table structure and data for admin dashboard
-- =====================================================

-- 1. Check table structure and columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check total number of users
SELECT COUNT(*) as total_users FROM users;

-- 3. Check sample user data (first 5 users)
SELECT 
    id,
    email,
    first_name,
    last_name,
    company_name,
    company_size,
    phone,
    email_verified_at,
    created_at,
    updated_at,
    last_login_at,
    is_active,
    is_admin,
    two_factor_enabled,
    session_timeout_minutes
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check user statistics
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
    COUNT(CASE WHEN email_verified_at IS NOT NULL THEN 1 END) as verified_users,
    COUNT(CASE WHEN two_factor_enabled = true THEN 1 END) as users_with_2fa
FROM users;

-- 5. Check user settings table (if it exists)
SELECT 
    COUNT(*) as total_settings,
    setting_key,
    COUNT(*) as count_per_setting
FROM user_settings 
GROUP BY setting_key
ORDER BY count_per_setting DESC;

-- 6. Check user sessions table (if it exists)
SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as users_with_sessions
FROM user_sessions;

-- 7. Check for any missing or null critical fields
SELECT 
    COUNT(CASE WHEN email IS NULL THEN 1 END) as missing_emails,
    COUNT(CASE WHEN first_name IS NULL THEN 1 END) as missing_first_names,
    COUNT(CASE WHEN last_name IS NULL THEN 1 END) as missing_last_names,
    COUNT(CASE WHEN company_name IS NULL THEN 1 END) as missing_company_names,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as missing_created_dates
FROM users;

-- 8. Check recent user activity (last 30 days)
SELECT 
    COUNT(*) as recent_users,
    COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days
FROM users;

-- 9. Check user preferences table (if it exists)
SELECT 
    COUNT(*) as total_preferences,
    preference_key,
    COUNT(*) as count_per_preference
FROM user_preferences 
GROUP BY preference_key
ORDER BY count_per_preference DESC;

-- 10. Check user companies table (if it exists)
SELECT 
    COUNT(*) as total_user_companies,
    COUNT(DISTINCT user_id) as users_with_companies,
    COUNT(DISTINCT company_id) as unique_companies
FROM user_companies;
