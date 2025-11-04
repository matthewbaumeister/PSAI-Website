-- ============================================
-- ARMY INNOVATION OPPORTUNITIES DATABASE SCHEMA
-- For tracking Army XTECH and Army FUZE opportunities
-- ============================================
-- This schema tracks prize competitions, innovation challenges,
-- and other opportunities from Army XTECH and FUZE programs
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- DROP EXISTING TABLES (Clean slate)
-- ============================================

DROP TABLE IF EXISTS army_innovation_documents CASCADE;
DROP TABLE IF EXISTS army_innovation_submissions CASCADE;
DROP TABLE IF EXISTS army_innovation_scraper_log CASCADE;
DROP TABLE IF EXISTS army_innovation_opportunities CASCADE;
DROP TABLE IF EXISTS army_innovation_programs CASCADE;

-- ============================================
-- 1. Army Innovation Programs Master Table
-- ============================================
-- Tracks the different programs (XTECH, FUZE, etc.)

CREATE TABLE army_innovation_programs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Program Identification
  program_name TEXT NOT NULL UNIQUE, -- 'XTECH', 'FUZE', 'xTechSearch', 'xTechOasis', etc.
  program_full_name TEXT, -- Full name of the program
  program_code TEXT, -- Short code/abbreviation
  
  -- Program Details
  program_type TEXT, -- 'competition', 'accelerator', 'prize_challenge', 'innovation_pilot'
  managing_entity TEXT DEFAULT 'Army', -- 'Army', 'Army DEVCOM', 'Army Futures Command'
  program_status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'Completed'
  
  -- Description
  program_description TEXT,
  program_mission TEXT,
  focus_areas TEXT[], -- Technology focus areas
  
  -- Target Audience
  target_participants TEXT[], -- 'small_business', 'startups', 'academia', 'entrepreneurs', 'industry'
  eligibility_requirements TEXT,
  
  -- Program Structure
  competition_structure TEXT, -- 'multi-phase', 'single-phase', 'rolling'
  typical_phases TEXT[], -- ['Concept White Paper', 'Technology Pitch', 'Proof of Concept']
  typical_timeline_months INTEGER,
  
  -- Financial
  typical_prize_range_min DECIMAL(12,2),
  typical_prize_range_max DECIMAL(12,2),
  total_program_funding DECIMAL(15,2),
  funding_source TEXT, -- 'OTA', 'Prize Authority', 'SBIR', 'Direct Contract'
  
  -- Links
  program_website TEXT,
  registration_url TEXT,
  contact_email TEXT,
  social_media JSONB, -- Twitter, LinkedIn handles
  
  -- Statistics
  total_competitions_held INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  total_awards_made INTEGER DEFAULT 0,
  total_funding_awarded DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  first_competition_date DATE,
  last_competition_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Army Innovation Opportunities
-- ============================================
-- Individual competitions and opportunities

CREATE TABLE army_innovation_opportunities (
  id BIGSERIAL PRIMARY KEY,
  
  -- Program Link
  program_id BIGINT REFERENCES army_innovation_programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL, -- 'XTECH', 'FUZE', denormalized for easier queries
  
  -- Opportunity Identification
  opportunity_number TEXT, -- Unique identifier from source
  opportunity_title TEXT NOT NULL,
  opportunity_subtitle TEXT,
  competition_name TEXT, -- e.g., "xTechSearch 4.0", "xTechOasis"
  competition_year INTEGER,
  
  -- Classification
  opportunity_type TEXT, -- 'prize_competition', 'pitch_event', 'demo_day', 'accelerator_cohort'
  competition_phase TEXT, -- 'Phase 1', 'Phase 2', 'Finals', 'Qualifier'
  track_name TEXT, -- For competitions with multiple tracks
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Announced', 'Open', 'Closed', 'In_Review', 'Winners_Announced', 'Completed', 'Cancelled'
  submission_window_status TEXT, -- 'Pre-Release', 'Open', 'Closed', 'Extended'
  
  -- Dates
  announced_date DATE,
  open_date DATE,
  close_date DATE,
  submission_deadline TIMESTAMP WITH TIME ZONE,
  evaluation_start_date DATE,
  evaluation_end_date DATE,
  winner_announcement_date DATE,
  award_date DATE,
  
  -- Calculated Date Fields
  days_until_close INTEGER,
  days_since_open INTEGER,
  submission_window_days INTEGER,
  
  -- Description
  description TEXT,
  problem_statement TEXT,
  challenge_description TEXT,
  desired_outcome TEXT,
  evaluation_criteria TEXT,
  
  -- Technology Focus
  technology_areas TEXT[], -- ['AI/ML', 'Autonomous Systems', 'Cyber', 'Electronics']
  naics_codes TEXT[],
  keywords TEXT[],
  modernization_priorities TEXT[], -- Army modernization priorities
  capability_gaps TEXT[], -- Specific capability gaps being addressed
  
  -- Eligibility & Requirements
  eligibility_requirements TEXT,
  eligible_entities TEXT[], -- ['small_business', 'university', 'individual', 'nonprofit']
  security_clearance_required BOOLEAN DEFAULT false,
  itar_controlled BOOLEAN DEFAULT false,
  us_citizen_required BOOLEAN DEFAULT false,
  team_size_limit INTEGER,
  
  -- Funding & Prizes
  total_prize_pool DECIMAL(12,2),
  prize_structure JSONB, -- {"first": 100000, "second": 50000, "third": 25000}
  number_of_awards INTEGER,
  min_award_amount DECIMAL(12,2),
  max_award_amount DECIMAL(12,2),
  matching_funds_available BOOLEAN DEFAULT false,
  follow_on_funding_potential TEXT, -- SBIR, contracts, additional phases
  
  -- Submission Requirements
  submission_format TEXT, -- 'White Paper', 'Pitch Deck', 'Video', 'Prototype Demo'
  page_limit INTEGER,
  submission_instructions TEXT,
  required_documents TEXT[],
  optional_documents TEXT[],
  
  -- Evaluation Process
  evaluation_stages TEXT[], -- ['Technical Review', 'Panel Evaluation', 'Live Pitch']
  judging_criteria JSONB, -- {"technical_merit": 40, "feasibility": 30, "impact": 30}
  review_process_description TEXT,
  
  -- Points of Contact
  poc_name TEXT,
  poc_email TEXT,
  poc_phone TEXT,
  technical_poc_name TEXT,
  technical_poc_email TEXT,
  questions_allowed BOOLEAN DEFAULT true,
  qa_deadline DATE,
  
  -- Event Information
  pitch_event_date DATE,
  pitch_event_location TEXT,
  pitch_event_virtual BOOLEAN,
  demo_day_date DATE,
  demo_day_location TEXT,
  
  -- Links & Resources
  opportunity_url TEXT,
  registration_url TEXT,
  submission_portal_url TEXT,
  rules_document_url TEXT,
  faq_url TEXT,
  information_session_url TEXT,
  video_url TEXT,
  
  -- Partnership Opportunities
  industry_partners TEXT[], -- Companies partnering on the competition
  government_partners TEXT[], -- Other DoD/Gov entities involved
  academic_partners TEXT[],
  transition_partners TEXT[], -- Potential users/buyers of technology
  
  -- Success Metrics
  expected_participants INTEGER,
  actual_participants INTEGER,
  submissions_received INTEGER,
  finalists_selected INTEGER,
  winners_selected INTEGER,
  
  -- Previous Competition Data (if part of a series)
  previous_competition_id BIGINT,
  competition_series TEXT, -- 'xTechSearch', 'xTechPrime'
  series_iteration INTEGER, -- 1, 2, 3 for versioning
  
  -- Scraping Metadata
  data_source TEXT, -- 'xtech.army.mil', 'fuze.army.mil', 'challenge.gov'
  source_url TEXT,
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_frequency TEXT DEFAULT 'daily', -- How often to check for updates
  
  -- Related SBIR/STTR
  related_sbir_topics TEXT[], -- Topic numbers if related to SBIR
  is_sbir_prize_gateway BOOLEAN DEFAULT false, -- SBIR topics with prize gateway
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_opportunity_number UNIQUE (opportunity_number, program_name)
);

-- ============================================
-- 3. Army Innovation Submissions
-- ============================================
-- Track submissions if public data is available

CREATE TABLE army_innovation_submissions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Links
  opportunity_id BIGINT REFERENCES army_innovation_opportunities(id) ON DELETE CASCADE,
  
  -- Submitter Information (only if public)
  company_name TEXT,
  company_location TEXT,
  company_state TEXT,
  is_small_business BOOLEAN,
  socioeconomic_categories TEXT[], -- '8a', 'WOSB', 'SDVOSB', 'HUBZone'
  
  -- Submission Details
  submission_title TEXT,
  technology_area TEXT,
  
  -- Status
  submission_status TEXT, -- 'Submitted', 'Under Review', 'Selected', 'Not Selected', 'Finalist', 'Winner'
  phase TEXT, -- Which phase this submission is for
  
  -- Awards
  award_amount DECIMAL(12,2),
  award_date DATE,
  
  -- Public Information
  public_abstract TEXT,
  
  -- Metadata
  submission_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Army Innovation Documents
-- ============================================
-- Track documents associated with opportunities

CREATE TABLE army_innovation_documents (
  id BIGSERIAL PRIMARY KEY,
  
  -- Links
  opportunity_id BIGINT REFERENCES army_innovation_opportunities(id) ON DELETE CASCADE,
  
  -- Document Details
  document_type TEXT NOT NULL, -- 'rules', 'faq', 'fact_sheet', 'white_paper_template', 'instructions'
  document_title TEXT NOT NULL,
  document_description TEXT,
  
  -- File Information
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'docx', 'xlsx', 'video'
  file_size_mb DECIMAL(8,2),
  
  -- Content
  document_text TEXT, -- Extracted text if available
  document_summary TEXT,
  
  -- Metadata
  version TEXT,
  published_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Scraper Log
-- ============================================

CREATE TABLE army_innovation_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  scrape_type TEXT NOT NULL, -- 'xtech', 'fuze', 'challenge_gov'
  scrape_target TEXT, -- 'opportunities', 'programs', 'documents'
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  error_message TEXT,
  error_details TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- ============================================
-- INDEXES
-- ============================================

-- Programs
CREATE INDEX idx_ainp_name ON army_innovation_programs(program_name);
CREATE INDEX idx_ainp_status ON army_innovation_programs(program_status);
CREATE INDEX idx_ainp_type ON army_innovation_programs(program_type);

-- Opportunities
CREATE INDEX idx_aino_program ON army_innovation_opportunities(program_id);
CREATE INDEX idx_aino_program_name ON army_innovation_opportunities(program_name);
CREATE INDEX idx_aino_status ON army_innovation_opportunities(status);
CREATE INDEX idx_aino_open_date ON army_innovation_opportunities(open_date);
CREATE INDEX idx_aino_close_date ON army_innovation_opportunities(close_date);
CREATE INDEX idx_aino_competition_name ON army_innovation_opportunities(competition_name);
CREATE INDEX idx_aino_opportunity_number ON army_innovation_opportunities(opportunity_number);
CREATE INDEX idx_aino_tech_areas ON army_innovation_opportunities USING GIN(technology_areas);
CREATE INDEX idx_aino_keywords ON army_innovation_opportunities USING GIN(keywords);
CREATE INDEX idx_aino_title_search ON army_innovation_opportunities USING gin(to_tsvector('english', opportunity_title));
CREATE INDEX idx_aino_description_search ON army_innovation_opportunities USING gin(to_tsvector('english', description));

-- Submissions
CREATE INDEX idx_ains_opportunity ON army_innovation_submissions(opportunity_id);
CREATE INDEX idx_ains_company ON army_innovation_submissions(company_name);
CREATE INDEX idx_ains_status ON army_innovation_submissions(submission_status);

-- Documents
CREATE INDEX idx_aind_opportunity ON army_innovation_documents(opportunity_id);
CREATE INDEX idx_aind_type ON army_innovation_documents(document_type);

-- ============================================
-- VIEWS
-- ============================================

-- View: Active Opportunities
CREATE OR REPLACE VIEW active_army_innovation_opportunities AS
SELECT 
  o.*,
  p.program_full_name,
  p.program_website,
  CASE 
    WHEN o.close_date IS NULL THEN 'Unknown'
    WHEN o.close_date < CURRENT_DATE THEN 'Closed'
    WHEN o.open_date > CURRENT_DATE THEN 'Upcoming'
    ELSE 'Open'
  END as calculated_status,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT s.id) as submission_count
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_programs p ON o.program_id = p.id
LEFT JOIN army_innovation_documents d ON o.id = d.opportunity_id
LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
WHERE o.status IN ('Announced', 'Open', 'In_Review')
GROUP BY o.id, p.program_full_name, p.program_website;

-- View: Competition Statistics
CREATE OR REPLACE VIEW army_innovation_competition_stats AS
SELECT 
  program_name,
  COUNT(DISTINCT id) as total_competitions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'Open') as open_competitions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'Closed') as closed_competitions,
  SUM(total_prize_pool) as total_prize_money,
  SUM(actual_participants) as total_participants,
  AVG(actual_participants) as avg_participants_per_competition,
  MAX(close_date) as most_recent_close_date
FROM army_innovation_opportunities
GROUP BY program_name;

-- View: Upcoming Deadlines
CREATE OR REPLACE VIEW army_innovation_upcoming_deadlines AS
SELECT 
  o.id,
  o.opportunity_title,
  o.program_name,
  o.competition_name,
  o.close_date,
  o.submission_deadline,
  o.total_prize_pool,
  o.opportunity_url,
  (o.close_date - CURRENT_DATE) as days_until_close,
  p.program_website
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_programs p ON o.program_id = p.id
WHERE o.status = 'Open'
  AND o.close_date IS NOT NULL
  AND o.close_date >= CURRENT_DATE
ORDER BY o.close_date ASC;

-- View: Prize Competition Summary
CREATE OR REPLACE VIEW army_innovation_prize_summary AS
SELECT 
  o.id,
  o.opportunity_title,
  o.program_name,
  o.competition_name,
  o.total_prize_pool,
  o.number_of_awards,
  o.max_award_amount,
  o.status,
  o.close_date,
  o.technology_areas,
  o.opportunity_url
FROM army_innovation_opportunities o
WHERE o.total_prize_pool IS NOT NULL
ORDER BY o.total_prize_pool DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update Calculated Date Fields
CREATE OR REPLACE FUNCTION update_army_innovation_date_calculations()
RETURNS void AS $$
BEGIN
  UPDATE army_innovation_opportunities
  SET 
    days_until_close = CASE 
      WHEN close_date IS NOT NULL THEN (close_date - CURRENT_DATE)
      ELSE NULL
    END,
    days_since_open = CASE 
      WHEN open_date IS NOT NULL THEN (CURRENT_DATE - open_date)
      ELSE NULL
    END,
    submission_window_days = CASE 
      WHEN open_date IS NOT NULL AND close_date IS NOT NULL THEN (close_date - open_date)
      ELSE NULL
    END,
    last_updated = NOW()
  WHERE status IN ('Open', 'Announced');
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update Status Based on Dates
CREATE OR REPLACE FUNCTION auto_update_army_innovation_status()
RETURNS void AS $$
BEGIN
  -- Update to Open if past open date
  UPDATE army_innovation_opportunities
  SET status = 'Open', last_updated = NOW()
  WHERE status = 'Announced'
    AND open_date IS NOT NULL
    AND open_date <= CURRENT_DATE;
  
  -- Update to Closed if past close date
  UPDATE army_innovation_opportunities
  SET status = 'Closed', last_updated = NOW()
  WHERE status = 'Open'
    AND close_date IS NOT NULL
    AND close_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA - Common Programs
-- ============================================

INSERT INTO army_innovation_programs (
  program_name,
  program_full_name,
  program_code,
  program_type,
  managing_entity,
  program_status,
  program_description,
  focus_areas,
  target_participants,
  program_website,
  typical_prize_range_min,
  typical_prize_range_max
) VALUES 
(
  'XTECH',
  'Army Expeditionary Technology Search',
  'XTECH',
  'competition',
  'Army Futures Command',
  'Active',
  'The Army xTech Program connects small businesses with the Army to spur innovation and accelerate technology solutions that address Army challenges.',
  ARRAY['AI/ML', 'Autonomous Systems', 'Advanced Materials', 'Biotechnology', 'Cyber', 'Electronics', 'Energy', 'Position, Navigation, Timing'],
  ARRAY['small_business', 'startups', 'entrepreneurs', 'academia'],
  'https://xtech.army.mil',
  25000,
  250000
),
(
  'FUZE',
  'Army FUZE Innovation Program',
  'FUZE',
  'innovation_pilot',
  'Army',
  'Active',
  'Army FUZE serves as the Army''s flagship innovation engine, accelerating the discovery, development, and deployment of emerging technologies.',
  ARRAY['Autonomous Systems', 'AI/ML', 'Sensor Technologies', 'Advanced Manufacturing'],
  ARRAY['small_business', 'startups', 'industry'],
  'https://fuze.army.mil',
  50000,
  500000
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_army_innovation_opportunities_modtime
  BEFORE UPDATE ON army_innovation_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_army_innovation_programs_modtime
  BEFORE UPDATE ON army_innovation_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Army Innovation Tables Created Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - army_innovation_programs';
  RAISE NOTICE '  - army_innovation_opportunities';
  RAISE NOTICE '  - army_innovation_submissions';
  RAISE NOTICE '  - army_innovation_documents';
  RAISE NOTICE '  - army_innovation_scraper_log';
  RAISE NOTICE '';
  RAISE NOTICE 'Seed Data:';
  RAISE NOTICE '  - XTECH program added';
  RAISE NOTICE '  - FUZE program added';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Implement army-innovation-scraper.ts';
  RAISE NOTICE '  2. Create API route for scraping';
  RAISE NOTICE '  3. Add admin dashboard controls';
  RAISE NOTICE '  4. Run initial scrape';
  RAISE NOTICE '============================================';
END $$;

