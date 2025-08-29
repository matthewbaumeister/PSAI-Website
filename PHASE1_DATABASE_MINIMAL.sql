-- =====================================================
-- PropShop AI - Phase 1 Database Setup (Minimal Working Version)
-- This script creates only the essential tables without complex references
-- =====================================================

-- =====================================================
-- STEP 1: Clean Slate - Drop Everything
-- =====================================================

-- Drop all existing objects
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS admin_invitations CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: Create Tables (Basic Version)
-- =====================================================

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  company_size VARCHAR(50),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  session_timeout_minutes INTEGER DEFAULT 30
);

-- 2. USER SESSIONS TABLE
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 3. EMAIL VERIFICATIONS TABLE
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PASSWORD RESETS TABLE
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reset_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ADMIN INVITATIONS TABLE
CREATE TABLE admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. USER SETTINGS TABLE
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- =====================================================
-- STEP 3: Create Basic Indexes
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- =====================================================
-- STEP 4: Insert Initial Data
-- =====================================================

-- Insert default admin user
INSERT INTO users (
  email, 
  first_name, 
  last_name, 
  is_admin, 
  email_verified_at,
  password_hash
) VALUES (
  'admin@propshop.ai',
  'Admin',
  'User',
  true,
  NOW(),
  '$2b$10$dummy.hash.for.admin.user.placeholder'
);

-- Insert default settings for admin user
INSERT INTO user_settings (user_id, setting_key, setting_value)
SELECT 
  id,
  'theme',
  'light'
FROM users 
WHERE email = 'admin@propshop.ai';

INSERT INTO user_settings (user_id, setting_key, setting_value)
SELECT 
  id,
  'notifications_enabled',
  'true'
FROM users 
WHERE email = 'admin@propshop.ai';

-- =====================================================
-- STEP 5: Basic Permissions
-- =====================================================

-- Grant permissions to service role (for API operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- STEP 6: Verification
-- =====================================================

-- Verify all tables exist
SELECT 'Tables created successfully:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- Verify admin user was created
SELECT 'Admin user created:' as status;
SELECT id, email, first_name, last_name, is_admin, email_verified_at 
FROM users 
WHERE email = 'admin@propshop.ai';

-- Verify user settings were created
SELECT 'User settings created:' as status;
SELECT us.setting_key, us.setting_value, u.email 
FROM user_settings us 
JOIN users u ON us.user_id = u.id 
WHERE u.email = 'admin@propshop.ai';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT '=====================================================' as message;
SELECT 'PropShop AI Phase 1 Database Setup Complete!' as message;
SELECT '=====================================================' as message;
SELECT 'Tables created: 6' as message;
SELECT 'Indexes created: 3' as message;
SELECT 'Default admin user: admin@propshop.ai' as message;
SELECT 'Next step: Test database connection at /api/test-db' as message;
SELECT '=====================================================' as message;
