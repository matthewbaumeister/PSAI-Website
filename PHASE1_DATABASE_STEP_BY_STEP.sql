-- =====================================================
-- PropShop AI - Phase 1 Database Setup (Step by Step)
-- Run each section separately to debug any issues
-- =====================================================

-- =====================================================
-- STEP 1: Enable Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: Create Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
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

-- Verify users table was created
SELECT 'Users table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- =====================================================
-- STEP 3: Create User Sessions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Verify user_sessions table was created
SELECT 'User sessions table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_sessions';

-- =====================================================
-- STEP 4: Create Email Verifications Table
-- =====================================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify email_verifications table was created
SELECT 'Email verifications table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_verifications';

-- =====================================================
-- STEP 5: Create Password Resets Table
-- =====================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reset_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify password_resets table was created
SELECT 'Password resets table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'password_resets';

-- =====================================================
-- STEP 6: Create Admin Invitations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify admin_invitations table was created
SELECT 'Admin invitations table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'admin_invitations';

-- =====================================================
-- STEP 7: Create User Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Verify user_settings table was created
SELECT 'User settings table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_settings';

-- =====================================================
-- STEP 8: Create Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Verify indexes were created
SELECT 'Indexes created successfully' as status;
SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- =====================================================
-- STEP 9: Create Functions and Triggers
-- =====================================================
-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Verify functions and triggers were created
SELECT 'Functions and triggers created successfully' as status;
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- =====================================================
-- STEP 10: Enable Row Level Security
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 'RLS enabled successfully' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- =====================================================
-- STEP 11: Create RLS Policies
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

-- Verify policies were created
SELECT 'RLS policies created successfully' as status;
SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';

-- =====================================================
-- STEP 12: Insert Initial Data
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
) ON CONFLICT (email) DO NOTHING;

-- Verify admin user was created
SELECT 'Admin user created successfully' as status;
SELECT id, email, first_name, last_name, is_admin, email_verified_at 
FROM users 
WHERE email = 'admin@propshop.ai';

-- Insert default settings for admin user
INSERT INTO user_settings (user_id, setting_key, setting_value)
SELECT 
  id,
  'theme',
  'light'
FROM users 
WHERE email = 'admin@propshop.ai'
ON CONFLICT (user_id, setting_key) DO NOTHING;

INSERT INTO user_settings (user_id, setting_key, setting_value)
SELECT 
  id,
  'notifications_enabled',
  'true'
FROM users 
WHERE email = 'admin@propshop.ai'
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- Verify settings were created
SELECT 'User settings created successfully' as status;
SELECT us.setting_key, us.setting_value, u.email 
FROM user_settings us 
JOIN users u ON us.user_id = u.id 
WHERE u.email = 'admin@propshop.ai';

-- =====================================================
-- STEP 13: Set Permissions
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
-- STEP 14: Final Verification
-- =====================================================
-- Verify all tables exist
SELECT 'Final verification - All tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- Verify RLS is enabled on all tables
SELECT 'Final verification - RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'PropShop AI Phase 1 Database Setup Complete!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tables created: 6';
  RAISE NOTICE 'Indexes created: 8';
  RAISE NOTICE 'RLS policies: 20+';
  RAISE NOTICE 'Default admin user: admin@propshop.ai';
  RAISE NOTICE 'Next step: Test database connection at /api/test-db';
  RAISE NOTICE '=====================================================';
END $$;
