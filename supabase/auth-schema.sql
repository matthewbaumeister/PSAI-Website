-- ============================================
-- PROPSHOP.AI - AUTHENTICATION & ADMIN SCHEMA
-- ============================================
-- User profiles, roles, and scraper tracking
-- Run this AFTER the hybrid-schema.sql
-- ============================================

-- ============================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Role & Access
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  
  -- Profile Info
  display_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  theme_preference TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  
  -- Usage Tracking
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  last_search_at TIMESTAMPTZ,
  searches_count INTEGER DEFAULT 0,
  
  -- Subscription (for future)
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_expires_at TIMESTAMPTZ
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- ============================================
-- SCRAPER RUNS (for admin dashboard)
-- ============================================

CREATE TABLE IF NOT EXISTS scraper_runs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Scraper identification
  scraper_name TEXT NOT NULL, -- 'defense_gov', 'fpds', 'sam_gov', 'sbir', etc.
  scraper_type TEXT, -- 'daily', 'historical', 'manual'
  
  -- Run details
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  
  -- Trigger info
  triggered_by UUID REFERENCES auth.users(id), -- NULL for automated runs
  trigger_type TEXT DEFAULT 'automated', -- 'automated', 'manual'
  date_range_start DATE,
  date_range_end DATE,
  
  -- Results
  records_found INTEGER DEFAULT 0,
  records_scraped INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Quality metrics
  success_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN records_scraped > 0 
    THEN ROUND((records_inserted + records_updated)::NUMERIC / records_scraped * 100, 2)
    ELSE 0 END
  ) STORED,
  avg_quality_score NUMERIC,
  
  -- Errors & Logs
  error_message TEXT,
  error_stack TEXT,
  log_summary TEXT,
  
  -- Duration
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN completed_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
    ELSE NULL END
  ) STORED
);

-- Indexes for scraper runs
CREATE INDEX IF NOT EXISTS idx_scraper_runs_name ON scraper_runs(scraper_name);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON scraper_runs(started_at DESC);

-- ============================================
-- SCRAPER CONFIGS (admin-configurable)
-- ============================================

CREATE TABLE IF NOT EXISTS scraper_configs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  scraper_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_running BOOLEAN DEFAULT false,
  
  -- Schedule
  schedule_cron TEXT, -- e.g., '0 9 * * *' for daily at 9am
  schedule_description TEXT, -- 'Daily at 9:00 AM'
  
  -- Default settings
  default_days_back INTEGER DEFAULT 7,
  rate_limit_seconds NUMERIC DEFAULT 2,
  
  -- Last run info (denormalized for quick access)
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_records INTEGER,
  last_run_success_rate NUMERIC,
  
  -- Lifetime stats
  total_runs INTEGER DEFAULT 0,
  total_records_scraped INTEGER DEFAULT 0,
  avg_success_rate NUMERIC DEFAULT 0
);

-- Insert default scraper configs
INSERT INTO scraper_configs (scraper_name, display_name, description, schedule_cron, schedule_description)
VALUES 
  ('defense_gov', 'Defense.gov Contracts', 'Scrapes daily contract awards from defense.gov/News/Contracts/', '0 9 * * *', 'Daily at 9:00 AM'),
  ('fpds', 'FPDS Contracts', 'Federal Procurement Data System contract records', '0 10 * * *', 'Daily at 10:00 AM'),
  ('sam_gov', 'SAM.gov Opportunities', 'Active solicitations from SAM.gov', '0 8 * * *', 'Daily at 8:00 AM'),
  ('sbir', 'SBIR/STTR Topics', 'Small Business Innovation Research topics', '0 6 * * 1', 'Weekly on Monday at 6:00 AM')
ON CONFLICT (scraper_name) DO NOTHING;

-- ============================================
-- ADMIN AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'user_disabled', 'scraper_triggered', 'email_sent', etc.
  target_type TEXT, -- 'user', 'scraper', 'email', etc.
  target_id TEXT, -- ID of affected record
  
  details JSONB, -- Additional context
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- ============================================
-- GLOBAL EMAILS (for announcements)
-- ============================================

CREATE TABLE IF NOT EXISTS global_emails (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  body_html TEXT,
  
  -- Targeting
  target_audience TEXT DEFAULT 'all', -- 'all', 'admins', 'pro_users', 'custom'
  target_user_ids UUID[], -- For custom targeting
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Results
  recipients_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scraper_configs_updated_at
  BEFORE UPDATE ON scraper_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update scraper config after run
CREATE OR REPLACE FUNCTION update_scraper_config_after_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') THEN
    UPDATE scraper_configs SET
      last_run_at = NEW.started_at,
      last_run_status = NEW.status,
      last_run_records = NEW.records_scraped,
      last_run_success_rate = NEW.success_rate,
      total_runs = total_runs + 1,
      total_records_scraped = total_records_scraped + COALESCE(NEW.records_scraped, 0),
      is_running = false
    WHERE scraper_name = NEW.scraper_name;
  ELSIF NEW.status = 'running' THEN
    UPDATE scraper_configs SET is_running = true
    WHERE scraper_name = NEW.scraper_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scraper_run_completed
  AFTER INSERT OR UPDATE ON scraper_runs
  FOR EACH ROW EXECUTE FUNCTION update_scraper_config_after_run();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_emails ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Scraper runs - admins only
CREATE POLICY "Admins can view scraper runs" ON scraper_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins can insert scraper runs" ON scraper_runs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Scraper configs - admins only
CREATE POLICY "Admins can manage scraper configs" ON scraper_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Audit log - admins only
CREATE POLICY "Admins can view audit log" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Global emails - admins only
CREATE POLICY "Admins can manage global emails" ON global_emails
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- Scraper status overview
CREATE OR REPLACE VIEW scraper_status_overview AS
SELECT 
  sc.scraper_name,
  sc.display_name,
  sc.description,
  sc.is_enabled,
  sc.is_running,
  sc.schedule_description,
  sc.last_run_at,
  sc.last_run_status,
  sc.last_run_records,
  sc.last_run_success_rate,
  sc.total_runs,
  sc.total_records_scraped,
  sc.avg_success_rate,
  -- Calculate next run (simplified)
  CASE 
    WHEN sc.schedule_cron LIKE '0 % * * *' THEN 
      (CURRENT_DATE + INTERVAL '1 day' + (SPLIT_PART(sc.schedule_cron, ' ', 2) || ' hours')::INTERVAL)
    ELSE NULL
  END as estimated_next_run
FROM scraper_configs sc
ORDER BY sc.display_name;

-- User stats for admin
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active) as active_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days') as active_last_7_days,
  COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '30 days') as active_last_30_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30_days
FROM user_profiles;

-- Recent scraper activity
CREATE OR REPLACE VIEW recent_scraper_activity AS
SELECT 
  sr.id,
  sr.scraper_name,
  sc.display_name,
  sr.status,
  sr.started_at,
  sr.completed_at,
  sr.duration_seconds,
  sr.records_scraped,
  sr.records_inserted,
  sr.records_updated,
  sr.success_rate,
  sr.trigger_type,
  sr.error_message
FROM scraper_runs sr
LEFT JOIN scraper_configs sc ON sr.scraper_name = sc.scraper_name
ORDER BY sr.started_at DESC
LIMIT 50;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPLETE!
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user profiles with roles and preferences';
COMMENT ON TABLE scraper_runs IS 'Log of all scraper executions for admin monitoring';
COMMENT ON TABLE scraper_configs IS 'Configuration and status for each scraper';
COMMENT ON TABLE admin_audit_log IS 'Audit trail of admin actions';
COMMENT ON TABLE global_emails IS 'System-wide email announcements';

