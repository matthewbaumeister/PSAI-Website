-- ============================================
-- COMPANY PUBLIC INFO SCRAPER TABLES
-- LinkedIn & Company Website Public Data Collection
-- ============================================
-- This migration creates tables for scraping and storing:
--   - LinkedIn company profiles (public data)
--   - LinkedIn employee data (public profiles)
--   - Company website information (public sites)
--   - Employee movement tracking
--   - Scraper queue and logging
--
-- NOTE: Uses "company_public_info_" prefix to avoid conflicts
--       with existing company_enrichment tables
-- ============================================

-- ============================================
-- TABLE 1: company_linkedin_profiles
-- Stores LinkedIn company page data
-- ============================================

CREATE TABLE IF NOT EXISTS company_linkedin_profiles (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to existing tables
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  
  -- LinkedIn Profile
  linkedin_url TEXT UNIQUE NOT NULL,
  linkedin_company_id TEXT, -- LinkedIn's internal ID
  linkedin_vanity_name TEXT, -- URL slug
  
  -- Company Info
  tagline TEXT,
  description TEXT,
  about TEXT, -- Full "About" section
  industry TEXT,
  specialties TEXT[], -- Array of specialties
  company_size TEXT, -- '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'
  company_size_min INTEGER, -- Parsed min
  company_size_max INTEGER, -- Parsed max
  employee_count_linkedin INTEGER, -- LinkedIn's reported count
  
  -- Location
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_country TEXT,
  headquarters_full TEXT, -- Full location string
  
  -- Company Details
  founded_year INTEGER,
  company_type TEXT, -- 'Public Company', 'Privately Held', 'Non-profit', etc.
  website TEXT,
  phone TEXT,
  
  -- Social Metrics
  follower_count INTEGER,
  
  -- Key People (Top 5-10 from LinkedIn)
  ceo_name TEXT,
  ceo_linkedin_url TEXT,
  leadership_team JSONB, -- Array of {name, title, linkedin_url}
  
  -- Engagement Metrics
  recent_posts_count INTEGER,
  avg_post_engagement DECIMAL(10,2),
  
  -- Data Quality
  profile_completeness_pct DECIMAL(5,2),
  last_verified_active BOOLEAN, -- Is company still active on LinkedIn?
  
  -- Scraping Metadata
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_success BOOLEAN DEFAULT TRUE,
  scrape_error TEXT,
  scrape_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_company_name ON company_linkedin_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_linkedin_company_id ON company_linkedin_profiles(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_uei ON company_linkedin_profiles(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_linkedin_url ON company_linkedin_profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_employee_count ON company_linkedin_profiles(employee_count_linkedin DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_linkedin_last_scraped ON company_linkedin_profiles(last_scraped);
CREATE INDEX IF NOT EXISTS idx_linkedin_scrape_success ON company_linkedin_profiles(scrape_success) WHERE scrape_success = FALSE;

COMMENT ON TABLE company_linkedin_profiles IS 'LinkedIn company profile data for all contractors';
COMMENT ON COLUMN company_linkedin_profiles.employee_count_linkedin IS 'Employee count as reported by LinkedIn';

-- ============================================
-- TABLE 2: company_employees
-- Tracks individual employees found on LinkedIn
-- ============================================

CREATE TABLE IF NOT EXISTS company_employees (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  linkedin_profile_id BIGINT REFERENCES company_linkedin_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  
  -- Employee Info
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  linkedin_url TEXT UNIQUE NOT NULL,
  linkedin_profile_id_employee TEXT, -- LinkedIn's internal employee ID
  
  -- Current Position
  current_title TEXT,
  current_department TEXT, -- Engineering, Sales, Operations, etc.
  is_current_employee BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE, -- NULL if still employed
  tenure_months INTEGER,
  
  -- Contact Info (if available)
  email TEXT,
  phone TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Profile Details
  headline TEXT,
  summary TEXT,
  profile_photo_url TEXT,
  
  -- Employment History (all companies, not just current)
  employment_history JSONB, -- Array of {company, title, start, end, description}
  total_years_experience INTEGER,
  
  -- Education
  education JSONB, -- Array of {school, degree, field, start, end}
  highest_degree TEXT, -- 'Bachelor', 'Master', 'PhD', etc.
  
  -- Skills & Certifications
  skills TEXT[], -- Top skills
  certifications JSONB, -- Array of {name, issuer, date, url}
  
  -- Seniority Level
  seniority_level TEXT, -- 'Entry Level', 'Mid-Senior', 'Director', 'Executive', 'C-Level'
  is_leadership BOOLEAN DEFAULT FALSE,
  is_executive BOOLEAN DEFAULT FALSE,
  is_founder BOOLEAN DEFAULT FALSE,
  
  -- Activity Metrics
  connections_count INTEGER,
  followers_count INTEGER,
  
  -- Scraping Metadata
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_success BOOLEAN DEFAULT TRUE,
  scrape_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_company_id ON company_employees(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_employees_linkedin_profile ON company_employees(linkedin_profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_name ON company_employees(full_name);
CREATE INDEX IF NOT EXISTS idx_employees_first_name ON company_employees(first_name);
CREATE INDEX IF NOT EXISTS idx_employees_last_name ON company_employees(last_name);
CREATE INDEX IF NOT EXISTS idx_employees_title ON company_employees(current_title);
CREATE INDEX IF NOT EXISTS idx_employees_is_leadership ON company_employees(is_leadership) WHERE is_leadership = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_is_executive ON company_employees(is_executive) WHERE is_executive = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_current ON company_employees(is_current_employee) WHERE is_current_employee = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_linkedin_url ON company_employees(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_employees_last_scraped ON company_employees(last_scraped);

-- Full-text search on employee names
CREATE INDEX IF NOT EXISTS idx_employees_fulltext ON company_employees 
  USING GIN(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(current_title, '')));

COMMENT ON TABLE company_employees IS 'Individual employees discovered from LinkedIn and company websites';
COMMENT ON COLUMN company_employees.is_current_employee IS 'True if employee is currently working at this company';

-- ============================================
-- TABLE 3: employee_movement_tracking
-- Track when employees change companies
-- ============================================

CREATE TABLE IF NOT EXISTS employee_movement_tracking (
  id BIGSERIAL PRIMARY KEY,
  
  -- Employee
  employee_id BIGINT REFERENCES company_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_linkedin_url TEXT NOT NULL,
  
  -- Movement
  from_company_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  from_company_name TEXT NOT NULL,
  to_company_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  to_company_name TEXT NOT NULL,
  
  -- Position Change
  from_title TEXT,
  to_title TEXT,
  from_department TEXT,
  to_department TEXT,
  
  -- Dates
  left_date DATE,
  joined_date DATE,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Movement Type
  movement_type TEXT, -- 'promotion' (internal), 'lateral' (internal), 'exit' (left company), 'joined' (joined company)
  is_within_government_ecosystem BOOLEAN DEFAULT FALSE, -- Did they stay in gov contracting?
  
  -- Analysis
  title_level_change TEXT, -- 'promoted', 'lateral', 'demotion'
  salary_band_change TEXT, -- 'likely_increase', 'likely_same', 'likely_decrease' (heuristic)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movement_employee ON employee_movement_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_movement_employee_name ON employee_movement_tracking(employee_name);
CREATE INDEX IF NOT EXISTS idx_movement_from_company ON employee_movement_tracking(from_company_id);
CREATE INDEX IF NOT EXISTS idx_movement_to_company ON employee_movement_tracking(to_company_id);
CREATE INDEX IF NOT EXISTS idx_movement_detected ON employee_movement_tracking(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_movement_type ON employee_movement_tracking(movement_type);
CREATE INDEX IF NOT EXISTS idx_movement_govt_ecosystem ON employee_movement_tracking(is_within_government_ecosystem) 
  WHERE is_within_government_ecosystem = TRUE;

COMMENT ON TABLE employee_movement_tracking IS 'Tracks employee movement between companies for relationship intelligence';
COMMENT ON COLUMN employee_movement_tracking.is_within_government_ecosystem IS 'True if employee moved between government contractors';

-- ============================================
-- TABLE 4: company_website_data
-- Stores scraped data from company websites
-- ============================================

CREATE TABLE IF NOT EXISTS company_website_data (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  
  -- Website Structure
  homepage_url TEXT,
  about_url TEXT,
  team_url TEXT,
  leadership_url TEXT,
  contact_url TEXT,
  careers_url TEXT,
  news_url TEXT,
  
  -- Scraped Content
  about_text TEXT, -- Full about page text
  mission_statement TEXT,
  company_description TEXT,
  
  -- Leadership (scraped from website)
  leadership_team JSONB, -- Array of {name, title, bio, photo_url, email, linkedin_url}
  executive_count INTEGER,
  board_members JSONB, -- Array of board members
  
  -- Contact Info
  general_email TEXT,
  general_phone TEXT,
  sales_email TEXT,
  careers_email TEXT,
  press_email TEXT,
  
  -- Email Patterns (inferred)
  email_pattern TEXT, -- 'first.last@', 'firstl@', 'flast@', 'first@'
  common_email_domains TEXT[], -- ['company.com', 'company.co']
  discovered_emails TEXT[], -- All emails found on site
  
  -- Office Locations
  office_locations JSONB, -- Array of {address, city, state, zip, country, type, phone}
  office_count INTEGER,
  
  -- Certifications & Credentials
  certifications TEXT[], -- ISO, CMMI, etc.
  security_clearances TEXT[], -- 'Secret', 'Top Secret', 'TS/SCI'
  duns_number TEXT,
  cage_code TEXT,
  
  -- Capabilities & Services
  service_offerings TEXT[], -- Parsed from site
  capabilities TEXT[],
  past_performance TEXT[], -- Project descriptions/case studies
  
  -- Technologies Used (detected)
  tech_stack JSONB, -- {frontend: [], backend: [], hosting: [], analytics: []}
  
  -- Social Links
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  github_url TEXT,
  
  -- SEO & Metadata
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Data Quality
  scrape_depth INTEGER, -- How many pages scraped
  content_richness_score INTEGER, -- 0-100
  
  -- Scraping Metadata
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_success BOOLEAN DEFAULT TRUE,
  scrape_error TEXT,
  scrape_duration_seconds INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_company_id ON company_website_data(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_website_url ON company_website_data(website_url);
CREATE INDEX IF NOT EXISTS idx_website_last_scraped ON company_website_data(last_scraped);
CREATE INDEX IF NOT EXISTS idx_website_scrape_success ON company_website_data(scrape_success) WHERE scrape_success = FALSE;

-- Full-text search on website content
CREATE INDEX IF NOT EXISTS idx_website_fulltext ON company_website_data 
  USING GIN(to_tsvector('english', 
    COALESCE(about_text, '') || ' ' || 
    COALESCE(company_description, '') || ' ' ||
    COALESCE(mission_statement, '')
  ));

COMMENT ON TABLE company_website_data IS 'Data scraped from company websites including leadership and contact info';
COMMENT ON COLUMN company_website_data.email_pattern IS 'Inferred email naming pattern for the company';

-- ============================================
-- TABLE 5: company_scraper_queue
-- Manages scraping queue with priority
-- ============================================

CREATE TABLE IF NOT EXISTS company_public_info_scraper_queue (
  id BIGSERIAL PRIMARY KEY,
  
  -- Target Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website_url TEXT,
  linkedin_url TEXT,
  
  -- Scrape Type
  scrape_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'linkedin_only', 'website_only', 'refresh'
  
  -- Priority (1-10, 10=highest)
  priority INTEGER DEFAULT 5,
  priority_reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'skipped'
  
  -- Progress Tracking
  linkedin_scraped BOOLEAN DEFAULT FALSE,
  linkedin_employees_scraped BOOLEAN DEFAULT FALSE,
  website_scraped BOOLEAN DEFAULT FALSE,
  
  -- Results
  linkedin_profile_id BIGINT,
  website_data_id BIGINT,
  employees_found INTEGER DEFAULT 0,
  
  -- Error Handling
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  
  -- Rate Limiting
  next_attempt_after TIMESTAMP WITH TIME ZONE,
  backoff_seconds INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_info_queue_status ON company_public_info_scraper_queue(status);
CREATE INDEX IF NOT EXISTS idx_public_info_queue_priority ON company_public_info_scraper_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_public_info_queue_next_attempt ON company_public_info_scraper_queue(next_attempt_after);
CREATE INDEX IF NOT EXISTS idx_public_info_queue_company_id ON company_public_info_scraper_queue(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_public_info_queue_pending ON company_public_info_scraper_queue(status, priority DESC) 
  WHERE status = 'pending';

-- Unique constraint to prevent duplicate queue items
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_info_queue_unique_pending 
  ON company_public_info_scraper_queue(company_intelligence_id, scrape_type) 
  WHERE status IN ('pending', 'in_progress');

COMMENT ON TABLE company_public_info_scraper_queue IS 'Queue for managing company public data scraping jobs (LinkedIn + websites)';
COMMENT ON COLUMN company_public_info_scraper_queue.priority IS 'Priority 1-10 where 10 is highest priority';

-- ============================================
-- TABLE 6: company_scraper_run_log
-- Tracks scraper runs
-- ============================================

CREATE TABLE IF NOT EXISTS company_public_info_scraper_run_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Run Type
  run_type TEXT NOT NULL, -- 'historical', 'daily', 'manual', 'priority'
  scrape_type TEXT NOT NULL, -- 'full', 'linkedin_only', 'website_only'
  
  -- Stats
  total_companies_queued INTEGER DEFAULT 0,
  companies_scraped INTEGER DEFAULT 0,
  companies_successful INTEGER DEFAULT 0,
  companies_failed INTEGER DEFAULT 0,
  companies_skipped INTEGER DEFAULT 0,
  
  linkedin_profiles_created INTEGER DEFAULT 0,
  employees_discovered INTEGER DEFAULT 0,
  employees_created INTEGER DEFAULT 0,
  websites_scraped INTEGER DEFAULT 0,
  
  -- Performance
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  avg_scrape_time_seconds DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
  
  -- Errors
  error_count INTEGER DEFAULT 0,
  errors JSONB, -- Array of error details
  
  -- Trigger Info
  triggered_by TEXT, -- 'cron', 'admin_ui', 'api', 'github_action'
  trigger_user_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_info_log_run_type ON company_public_info_scraper_run_log(run_type);
CREATE INDEX IF NOT EXISTS idx_public_info_log_started_at ON company_public_info_scraper_run_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_info_log_status ON company_public_info_scraper_run_log(status);

COMMENT ON TABLE company_public_info_scraper_run_log IS 'Logs of public info scraper execution runs for monitoring and debugging';

-- ============================================
-- VIEWS
-- ============================================

-- View: Companies with LinkedIn data
CREATE OR REPLACE VIEW companies_with_linkedin AS
SELECT 
  ci.id,
  ci.company_name,
  ci.vendor_uei,
  lp.linkedin_url,
  lp.employee_count_linkedin,
  lp.industry,
  lp.company_size,
  lp.follower_count,
  lp.last_scraped,
  COUNT(DISTINCT ce.id) as employees_tracked,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.is_leadership = TRUE) as leadership_count,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.is_executive = TRUE) as executive_count
FROM company_intelligence ci
INNER JOIN company_linkedin_profiles lp ON lp.company_intelligence_id = ci.id
LEFT JOIN company_employees ce ON ce.company_intelligence_id = ci.id
GROUP BY ci.id, ci.company_name, ci.vendor_uei, lp.linkedin_url, 
         lp.employee_count_linkedin, lp.industry, lp.company_size, 
         lp.follower_count, lp.last_scraped;

COMMENT ON VIEW companies_with_linkedin IS 'Companies with LinkedIn profile data and employee counts';

-- View: Companies with website data
CREATE OR REPLACE VIEW companies_with_website_data AS
SELECT 
  ci.id,
  ci.company_name,
  ci.vendor_uei,
  cw.website_url,
  cw.executive_count,
  cw.office_count,
  array_length(cw.discovered_emails, 1) as email_count,
  array_length(cw.certifications, 1) as certification_count,
  cw.email_pattern,
  cw.last_scraped,
  cw.content_richness_score
FROM company_intelligence ci
INNER JOIN company_website_data cw ON cw.company_intelligence_id = ci.id;

COMMENT ON VIEW companies_with_website_data IS 'Companies with website scraping data';

-- View: Recent employee movements
CREATE OR REPLACE VIEW recent_employee_movements AS
SELECT 
  em.id,
  em.employee_name,
  em.employee_linkedin_url,
  em.from_company_name,
  em.to_company_name,
  em.from_title,
  em.to_title,
  em.movement_type,
  em.title_level_change,
  em.detected_at,
  EXTRACT(EPOCH FROM (em.joined_date - em.left_date))/86400 as days_between_jobs
FROM employee_movement_tracking em
WHERE em.detected_at >= NOW() - INTERVAL '90 days'
ORDER BY em.detected_at DESC;

COMMENT ON VIEW recent_employee_movements IS 'Employee movements detected in the last 90 days';

-- View: Top companies by employee tracking
CREATE OR REPLACE VIEW top_companies_by_employees AS
SELECT 
  ci.id,
  ci.company_name,
  COUNT(ce.id) as total_employees_tracked,
  COUNT(ce.id) FILTER (WHERE ce.is_leadership = TRUE) as leadership_count,
  COUNT(ce.id) FILTER (WHERE ce.is_executive = TRUE) as executive_count,
  lp.employee_count_linkedin,
  ROUND(COUNT(ce.id)::numeric / NULLIF(lp.employee_count_linkedin, 0) * 100, 2) as coverage_pct
FROM company_intelligence ci
INNER JOIN company_linkedin_profiles lp ON lp.company_intelligence_id = ci.id
LEFT JOIN company_employees ce ON ce.company_intelligence_id = ci.id
GROUP BY ci.id, ci.company_name, lp.employee_count_linkedin
HAVING COUNT(ce.id) > 0
ORDER BY total_employees_tracked DESC;

COMMENT ON VIEW top_companies_by_employees IS 'Companies ranked by number of employees tracked';

-- View: Scraper queue status summary
CREATE OR REPLACE VIEW company_public_info_queue_summary AS
SELECT 
  status,
  scrape_type,
  COUNT(*) as count,
  AVG(priority) as avg_priority,
  MIN(created_at) as oldest,
  MAX(created_at) as newest,
  COUNT(*) FILTER (WHERE attempt_count > 0) as retry_count
FROM company_public_info_scraper_queue
GROUP BY status, scrape_type
ORDER BY status, scrape_type;

COMMENT ON VIEW company_public_info_queue_summary IS 'Summary of company public info scraper queue by status and type';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate employee movement statistics
CREATE OR REPLACE FUNCTION get_employee_movement_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_movements BIGINT,
  within_gov_ecosystem BIGINT,
  promotions BIGINT,
  demotions BIGINT,
  lateral_moves BIGINT,
  top_source_companies TEXT[],
  top_destination_companies TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_movements,
    COUNT(*) FILTER (WHERE is_within_government_ecosystem = TRUE)::BIGINT as within_gov_ecosystem,
    COUNT(*) FILTER (WHERE title_level_change = 'promoted')::BIGINT as promotions,
    COUNT(*) FILTER (WHERE title_level_change = 'demotion')::BIGINT as demotions,
    COUNT(*) FILTER (WHERE title_level_change = 'lateral')::BIGINT as lateral_moves,
    ARRAY_AGG(DISTINCT from_company_name ORDER BY from_company_name)::TEXT[] as top_source_companies,
    ARRAY_AGG(DISTINCT to_company_name ORDER BY to_company_name)::TEXT[] as top_destination_companies
  FROM employee_movement_tracking
  WHERE detected_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_employee_movement_stats IS 'Calculate employee movement statistics for the specified period';

-- Function: Get company enrichment completeness
CREATE OR REPLACE FUNCTION get_enrichment_completeness(p_company_id BIGINT)
RETURNS TABLE (
  has_linkedin BOOLEAN,
  has_website_data BOOLEAN,
  has_employees BOOLEAN,
  employee_count INTEGER,
  enrichment_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM company_linkedin_profiles WHERE company_intelligence_id = p_company_id) as has_linkedin,
    EXISTS(SELECT 1 FROM company_website_data WHERE company_intelligence_id = p_company_id) as has_website_data,
    EXISTS(SELECT 1 FROM company_employees WHERE company_intelligence_id = p_company_id) as has_employees,
    COUNT(ce.id)::INTEGER as employee_count,
    (
      CASE WHEN EXISTS(SELECT 1 FROM company_linkedin_profiles WHERE company_intelligence_id = p_company_id) THEN 40 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM company_website_data WHERE company_intelligence_id = p_company_id) THEN 30 ELSE 0 END +
      CASE WHEN COUNT(ce.id) > 0 THEN 20 ELSE 0 END +
      CASE WHEN COUNT(ce.id) FILTER (WHERE ce.is_leadership = TRUE) > 0 THEN 10 ELSE 0 END
    )::INTEGER as enrichment_score
  FROM company_employees ce
  WHERE ce.company_intelligence_id = p_company_id
  GROUP BY p_company_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_enrichment_completeness IS 'Calculate enrichment completeness score (0-100) for a company';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_linkedin_profiles_updated_at
  BEFORE UPDATE ON company_linkedin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_updated_at();

CREATE TRIGGER trigger_update_employees_updated_at
  BEFORE UPDATE ON company_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_updated_at();

CREATE TRIGGER trigger_update_website_data_updated_at
  BEFORE UPDATE ON company_website_data
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_updated_at();

CREATE TRIGGER trigger_update_scraper_queue_updated_at
  BEFORE UPDATE ON company_public_info_scraper_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_updated_at();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Company Public Info Scraper Tables Created!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - company_linkedin_profiles (LinkedIn company data)';
  RAISE NOTICE '  - company_employees (Employee tracking)';
  RAISE NOTICE '  - employee_movement_tracking (Career movement tracking)';
  RAISE NOTICE '  - company_website_data (Website scraping data)';
  RAISE NOTICE '  - company_public_info_scraper_queue (Scraping queue)';
  RAISE NOTICE '  - company_public_info_scraper_run_log (Execution logs)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  - companies_with_linkedin';
  RAISE NOTICE '  - companies_with_website_data';
  RAISE NOTICE '  - recent_employee_movements';
  RAISE NOTICE '  - top_companies_by_employees';
  RAISE NOTICE '  - company_public_info_queue_summary';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  - get_employee_movement_stats(days)';
  RAISE NOTICE '  - get_enrichment_completeness(company_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Install: pip install -r requirements-scraper.txt';
  RAISE NOTICE '  2. Install: playwright install chromium';
  RAISE NOTICE '  3. Test: python scrapers/test_scrapers.py';
  RAISE NOTICE '  4. See: COMPANY_PUBLIC_INFO_SCRAPER_QUICKSTART.md';
  RAISE NOTICE '============================================';
END $$;

