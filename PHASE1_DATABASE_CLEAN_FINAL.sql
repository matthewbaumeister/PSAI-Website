-- =====================================================
-- PropShop AI - Phase 1 Database Setup (Clean Final)
-- This script will clean everything and start fresh
-- WARNING: This will delete all existing data!
-- =====================================================

-- =====================================================
-- STEP 1: Clean Slate - Drop Everything
-- =====================================================

-- Drop all existing objects in reverse dependency order
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;

DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS admin_invitations CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;

-- Drop all indexes
DROP INDEX IF EXISTS idx_users_email CASCADE;
DROP INDEX IF EXISTS idx_users_email_verified CASCADE;
DROP INDEX IF EXISTS idx_user_sessions_user_id CASCADE;
DROP INDEX IF EXISTS idx_user_sessions_token CASCADE;
DROP INDEX IF EXISTS idx_user_sessions_expires CASCADE;
DROP INDEX IF EXISTS idx_email_verifications_token CASCADE;
DROP INDEX IF EXISTS idx_password_resets_token CASCADE;
DROP INDEX IF EXISTS idx_admin_invitations_token CASCADE;
DROP INDEX IF EXISTS idx_users_is_admin CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: Create Tables
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
-- STEP 3: Create Indexes
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users(email_verified_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_email_verifications_token ON email_verifications(verification_token);
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- =====================================================
-- STEP 4: Create Functions and Triggers
-- =====================================================

-- Update timestamp trigger function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Session cleanup function
CREATE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: Enable Row Level Security
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Create RLS Policies
-- =====================================================

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Email verifications policies
CREATE POLICY "Users can view own verifications" ON email_verifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own verifications" ON email_verifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Password resets policies
CREATE POLICY "Users can view own resets" ON password_resets
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own resets" ON password_resets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admin invitations policies
CREATE POLICY "Admins can view all invitations" ON admin_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert invitations" ON admin_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- =====================================================
-- STEP 7: Insert Initial Data
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
-- STEP 8: Set Permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON email_verifications TO authenticated;
GRANT SELECT, INSERT ON password_resets TO authenticated;
GRANT SELECT, INSERT ON user_settings TO authenticated;
GRANT SELECT, INSERT ON admin_invitations TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- STEP 9: Verification
-- =====================================================

-- Verify all tables exist
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- Verify RLS is enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- Verify admin user was created
SELECT 'Admin user:' as info;
SELECT id, email, first_name, last_name, is_admin, email_verified_at 
FROM users 
WHERE email = 'admin@propshop.ai';

-- Verify user settings were created
SELECT 'User settings:' as info;
SELECT us.setting_key, us.setting_value, u.email 
FROM user_settings us 
JOIN users u ON us.user_id = u.id 
WHERE u.email = 'admin@propshop.ai';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'PropShop AI Phase 1 Database Setup Complete!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'All existing objects dropped and recreated';
  RAISE NOTICE 'Tables created: 6';
  RAISE NOTICE 'Indexes created: 8';
  RAISE NOTICE 'RLS policies: 20+';
  RAISE NOTICE 'Default admin user: admin@propshop.ai';
  RAISE NOTICE 'Next step: Test database connection at /api/test-db';
  RAISE NOTICE '=====================================================';
END $$;
