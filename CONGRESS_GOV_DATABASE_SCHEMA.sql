-- ========================================
-- CONGRESS.GOV INTEGRATION DATABASE SCHEMA
-- ========================================
-- 
-- This schema stores congressional legislative data
-- to provide political and lobbying context for
-- defense contracts, FPDS awards, SAM.gov opportunities,
-- and SBIR topics.
--
-- Created: November 3, 2025
-- Version: 1.0
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ========================================
-- TABLE 1: congressional_bills
-- ========================================
-- Primary table for all defense-related legislation

CREATE TABLE congressional_bills (
  -- Primary Keys
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  bill_type VARCHAR(10) NOT NULL,  -- 'hr', 's', 'hjres', 'sjres', etc.
  bill_number INTEGER NOT NULL,
  
  -- Composite unique constraint
  CONSTRAINT unique_bill UNIQUE (congress, bill_type, bill_number),
  
  -- Basic Information
  title TEXT NOT NULL,
  short_title TEXT,
  official_title TEXT,
  popular_title TEXT,
  
  -- Dates
  introduced_date DATE,
  latest_action_date DATE,
  became_law_date DATE,
  vetoed_date DATE,
  
  -- Status (TEXT to handle long status descriptions)
  status TEXT,
  is_law BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Content
  summary TEXT,
  purpose TEXT,
  policy_area VARCHAR(255),
  legislative_subjects TEXT[],
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  defense_relevance_score INTEGER DEFAULT 0, -- 0-100
  defense_programs_mentioned TEXT[],
  contractors_mentioned TEXT[],
  military_branches TEXT[], -- 'Army', 'Navy', 'Air Force', 'Marine Corps', 'Space Force'
  
  -- Funding Information
  authorized_amount BIGINT,
  appropriated_amount BIGINT,
  fiscal_years INTEGER[],
  
  -- Sponsors & Cosponsors
  sponsor_name TEXT,
  sponsor_party VARCHAR(50),
  sponsor_state VARCHAR(2),
  sponsor_bioguide_id VARCHAR(20),
  cosponsor_count INTEGER DEFAULT 0,
  cosponsors JSONB,
  
  -- Committees
  committees TEXT[],
  primary_committee VARCHAR(255),
  
  -- Related Bills
  related_bills JSONB,
  companion_bill_id VARCHAR(50),
  
  -- Text & Documents
  text_versions JSONB,
  pdf_url TEXT,
  congress_gov_url TEXT,
  
  -- Actions & Timeline
  actions JSONB,
  action_count INTEGER DEFAULT 0,
  latest_action_text TEXT,
  
  -- Amendments
  amendment_count INTEGER DEFAULT 0,
  amendments JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search & Analysis
  search_vector tsvector,
  keywords TEXT[],
  
  -- Source
  source_url TEXT,
  api_response JSONB
);

-- Indexes for congressional_bills
CREATE INDEX idx_congressional_bills_congress ON congressional_bills(congress);
CREATE INDEX idx_congressional_bills_type ON congressional_bills(bill_type);
CREATE INDEX idx_congressional_bills_number ON congressional_bills(bill_number);
CREATE INDEX idx_congressional_bills_status ON congressional_bills(status);
CREATE INDEX idx_congressional_bills_defense ON congressional_bills(is_defense_related) WHERE is_defense_related = true;
CREATE INDEX idx_congressional_bills_introduced ON congressional_bills(introduced_date DESC);
CREATE INDEX idx_congressional_bills_action_date ON congressional_bills(latest_action_date DESC);
CREATE INDEX idx_congressional_bills_is_law ON congressional_bills(is_law) WHERE is_law = true;
CREATE INDEX idx_congressional_bills_committees ON congressional_bills USING GIN(committees);
CREATE INDEX idx_congressional_bills_subjects ON congressional_bills USING GIN(legislative_subjects);
CREATE INDEX idx_congressional_bills_programs ON congressional_bills USING GIN(defense_programs_mentioned);
CREATE INDEX idx_congressional_bills_contractors ON congressional_bills USING GIN(contractors_mentioned);
CREATE INDEX idx_congressional_bills_search ON congressional_bills USING GIN(search_vector);
CREATE INDEX idx_congressional_bills_sponsor ON congressional_bills(sponsor_bioguide_id);

-- ========================================
-- TABLE 2: congressional_amendments
-- ========================================
-- Track amendments that modify defense procurement provisions

CREATE TABLE congressional_amendments (
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  amendment_type VARCHAR(10) NOT NULL,  -- 'hamdt', 'samdt', 'suamdt'
  amendment_number INTEGER NOT NULL,
  
  CONSTRAINT unique_amendment UNIQUE (congress, amendment_type, amendment_number),
  
  -- Related Bill
  bill_id BIGINT REFERENCES congressional_bills(id) ON DELETE SET NULL,
  bill_congress INTEGER,
  bill_type VARCHAR(10),
  bill_number INTEGER,
  
  -- Amendment Details
  title TEXT,
  description TEXT,
  purpose TEXT,
  amendment_text TEXT,
  
  -- Sponsor
  sponsor_name TEXT,
  sponsor_party VARCHAR(50),
  sponsor_state VARCHAR(2),
  sponsor_bioguide_id VARCHAR(20),
  
  -- Status (TEXT to handle long status descriptions)
  status TEXT,
  is_adopted BOOLEAN DEFAULT FALSE,
  is_failed BOOLEAN DEFAULT FALSE,
  is_pending BOOLEAN DEFAULT TRUE,
  
  -- Dates
  submitted_date DATE,
  action_date DATE,
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  defense_impact_description TEXT,
  programs_affected TEXT[],
  contractors_affected TEXT[],
  funding_change BIGINT, -- positive (increase) or negative (decrease)
  
  -- Content
  congress_gov_url TEXT,
  
  -- Actions
  actions JSONB,
  action_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search
  search_vector tsvector
);

-- Indexes for congressional_amendments
CREATE INDEX idx_amendments_bill ON congressional_amendments(bill_id);
CREATE INDEX idx_amendments_congress ON congressional_amendments(congress);
CREATE INDEX idx_amendments_defense ON congressional_amendments(is_defense_related) WHERE is_defense_related = true;
CREATE INDEX idx_amendments_status ON congressional_amendments(status);
CREATE INDEX idx_amendments_submitted ON congressional_amendments(submitted_date DESC);
CREATE INDEX idx_amendments_sponsor ON congressional_amendments(sponsor_bioguide_id);
CREATE INDEX idx_amendments_programs ON congressional_amendments USING GIN(programs_affected);
CREATE INDEX idx_amendments_search ON congressional_amendments USING GIN(search_vector);

-- ========================================
-- TABLE 3: congressional_committee_reports
-- ========================================
-- Committee reports provide deep insight into program direction

CREATE TABLE congressional_committee_reports (
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  report_type VARCHAR(10) NOT NULL,  -- 'hrpt', 'srpt', 'erpt'
  report_number INTEGER NOT NULL,
  
  CONSTRAINT unique_report UNIQUE (congress, report_type, report_number),
  
  -- Related Bill
  bill_id BIGINT REFERENCES congressional_bills(id) ON DELETE SET NULL,
  bill_congress INTEGER,
  bill_type VARCHAR(10),
  bill_number INTEGER,
  
  -- Report Details
  title TEXT NOT NULL,
  committee_name VARCHAR(255),
  committee_code VARCHAR(10),
  subcommittee_name VARCHAR(255),
  
  -- Dates
  issued_date DATE,
  
  -- Content
  summary TEXT,
  full_text TEXT,
  excerpt TEXT, -- Key sections related to defense
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  programs_discussed TEXT[],
  contractors_mentioned TEXT[],
  recommendations TEXT[],
  
  -- Funding Details
  recommended_funding JSONB, -- {program: amount, ...}
  funding_changes TEXT, -- Human-readable description
  total_recommended_amount BIGINT,
  
  -- Documents
  pdf_url TEXT,
  html_url TEXT,
  congress_gov_url TEXT,
  
  -- Analysis
  program_directions TEXT[],
  policy_changes TEXT[],
  oversight_issues TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search
  search_vector tsvector
);

-- Indexes for congressional_committee_reports
CREATE INDEX idx_reports_committee ON congressional_committee_reports(committee_code);
CREATE INDEX idx_reports_congress ON congressional_committee_reports(congress);
CREATE INDEX idx_reports_defense ON congressional_committee_reports(is_defense_related) WHERE is_defense_related = true;
CREATE INDEX idx_reports_issued ON congressional_committee_reports(issued_date DESC);
CREATE INDEX idx_reports_bill ON congressional_committee_reports(bill_id);
CREATE INDEX idx_reports_programs ON congressional_committee_reports USING GIN(programs_discussed);
CREATE INDEX idx_reports_contractors ON congressional_committee_reports USING GIN(contractors_mentioned);
CREATE INDEX idx_reports_search ON congressional_committee_reports USING GIN(search_vector);

-- ========================================
-- TABLE 4: congressional_hearings
-- ========================================
-- Track hearings where contractors testify or programs are discussed

CREATE TABLE congressional_hearings (
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  chamber VARCHAR(10), -- 'house', 'senate', 'joint'
  event_id VARCHAR(50) UNIQUE,
  
  -- Hearing Details
  title TEXT NOT NULL,
  committee_name VARCHAR(255),
  committee_code VARCHAR(10),
  subcommittee_name VARCHAR(255),
  
  -- Dates & Location
  hearing_date DATE,
  hearing_time TIME,
  location TEXT,
  
  -- Status
  status VARCHAR(50), -- 'scheduled', 'held', 'cancelled', 'postponed'
  
  -- Content
  description TEXT,
  topics TEXT[],
  witnesses JSONB, -- [{name, title, organization, testimony_url, affiliation}]
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  programs_discussed TEXT[],
  contractors_testifying TEXT[],
  contractors_mentioned TEXT[],
  
  -- Documents
  hearing_transcript_url TEXT,
  hearing_transcript_text TEXT,
  witness_testimony_urls JSONB,
  video_url TEXT,
  webcast_url TEXT,
  
  -- Related Bills
  related_bills JSONB,
  
  -- Analysis
  key_topics TEXT[],
  member_statements JSONB, -- {member_name: statement_summary}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search
  search_vector tsvector
);

-- Indexes for congressional_hearings
CREATE INDEX idx_hearings_date ON congressional_hearings(hearing_date DESC);
CREATE INDEX idx_hearings_congress ON congressional_hearings(congress);
CREATE INDEX idx_hearings_chamber ON congressional_hearings(chamber);
CREATE INDEX idx_hearings_committee ON congressional_hearings(committee_code);
CREATE INDEX idx_hearings_defense ON congressional_hearings(is_defense_related) WHERE is_defense_related = true;
CREATE INDEX idx_hearings_status ON congressional_hearings(status);
CREATE INDEX idx_hearings_contractors_testifying ON congressional_hearings USING GIN(contractors_testifying);
CREATE INDEX idx_hearings_contractors_mentioned ON congressional_hearings USING GIN(contractors_mentioned);
CREATE INDEX idx_hearings_programs ON congressional_hearings USING GIN(programs_discussed);
CREATE INDEX idx_hearings_search ON congressional_hearings USING GIN(search_vector);

-- ========================================
-- TABLE 5: congressional_members
-- ========================================
-- Track members' defense procurement involvement

CREATE TABLE congressional_members (
  id BIGSERIAL PRIMARY KEY,
  bioguide_id VARCHAR(20) UNIQUE NOT NULL,
  
  -- Basic Info
  full_name TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  suffix VARCHAR(20),
  
  -- Political Info
  party VARCHAR(50),
  state VARCHAR(2),
  district INTEGER, -- NULL for senators
  chamber VARCHAR(10), -- 'house' or 'senate'
  
  -- Current Status
  is_current BOOLEAN DEFAULT TRUE,
  terms_served INTEGER DEFAULT 0,
  
  -- Terms
  terms JSONB, -- [{congress, startYear, endYear, chamber}]
  
  -- Committee Assignments (Current)
  current_committees TEXT[],
  defense_committees TEXT[],
  appropriations_committees TEXT[],
  committee_assignments JSONB, -- Full history
  
  -- Leadership
  leadership_position VARCHAR(255),
  is_committee_chair BOOLEAN DEFAULT FALSE,
  is_ranking_member BOOLEAN DEFAULT FALSE,
  
  -- Defense Focus
  is_defense_focused BOOLEAN DEFAULT FALSE,
  defense_bills_sponsored INTEGER DEFAULT 0,
  defense_bills_cosponsored INTEGER DEFAULT 0,
  defense_amendments_sponsored INTEGER DEFAULT 0,
  
  -- District/State Defense Presence
  state_defense_contractors TEXT[],
  state_military_bases TEXT[],
  state_defense_spending BIGINT,
  district_defense_jobs INTEGER,
  
  -- Contact
  office_address TEXT,
  phone VARCHAR(20),
  website_url TEXT,
  contact_form_url TEXT,
  twitter_handle VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for congressional_members
CREATE INDEX idx_members_bioguide ON congressional_members(bioguide_id);
CREATE INDEX idx_members_state ON congressional_members(state);
CREATE INDEX idx_members_district ON congressional_members(state, district);
CREATE INDEX idx_members_party ON congressional_members(party);
CREATE INDEX idx_members_chamber ON congressional_members(chamber);
CREATE INDEX idx_members_current ON congressional_members(is_current) WHERE is_current = true;
CREATE INDEX idx_members_defense ON congressional_members(is_defense_focused) WHERE is_defense_focused = true;
CREATE INDEX idx_members_name ON congressional_members(last_name, first_name);

-- ========================================
-- TABLE 6: congressional_contract_links
-- ========================================
-- CRITICAL: Links Congressional activity to actual contracts

CREATE TABLE congressional_contract_links (
  id BIGSERIAL PRIMARY KEY,
  
  -- Congressional Side
  bill_id BIGINT REFERENCES congressional_bills(id) ON DELETE CASCADE,
  amendment_id BIGINT REFERENCES congressional_amendments(id) ON DELETE CASCADE,
  report_id BIGINT REFERENCES congressional_committee_reports(id) ON DELETE CASCADE,
  hearing_id BIGINT REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  
  -- Contract Side (flexible - links to multiple tables)
  contract_source VARCHAR(50) NOT NULL, -- 'dod_news', 'fpds', 'sam_gov', 'sbir', 'dsip'
  contract_id BIGINT,
  contract_number VARCHAR(255),
  contract_piid VARCHAR(255), -- FPDS PIID
  topic_number VARCHAR(100), -- SBIR/DSIP topic number
  
  -- Link Details
  link_type VARCHAR(100) NOT NULL, -- 'authorization', 'appropriation', 'oversight', 'mention', 'testimony'
  link_strength VARCHAR(20) DEFAULT 'medium', -- 'strong', 'medium', 'weak'
  confidence_score INTEGER DEFAULT 50, -- 0-100
  
  -- Context
  link_description TEXT,
  relevant_text TEXT,
  context_snippet TEXT,
  
  -- Program Connection
  program_name VARCHAR(255),
  program_element_code VARCHAR(50),
  budget_line_item VARCHAR(50),
  
  -- Funding Connection
  authorized_amount BIGINT,
  appropriated_amount BIGINT,
  fiscal_year INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  link_method VARCHAR(50) DEFAULT 'keyword_match', -- 'keyword_match', 'manual', 'llm_analysis', 'pe_code'
  verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(255),
  verified_at TIMESTAMPTZ,
  
  -- Add constraint: must have at least one congressional reference
  CONSTRAINT chk_congressional_ref CHECK (
    bill_id IS NOT NULL OR 
    amendment_id IS NOT NULL OR 
    report_id IS NOT NULL OR 
    hearing_id IS NOT NULL
  )
);

-- Indexes for congressional_contract_links
CREATE INDEX idx_contract_links_bill ON congressional_contract_links(bill_id);
CREATE INDEX idx_contract_links_amendment ON congressional_contract_links(amendment_id);
CREATE INDEX idx_contract_links_report ON congressional_contract_links(report_id);
CREATE INDEX idx_contract_links_hearing ON congressional_contract_links(hearing_id);
CREATE INDEX idx_contract_links_source ON congressional_contract_links(contract_source);
CREATE INDEX idx_contract_links_contract_id ON congressional_contract_links(contract_source, contract_id);
CREATE INDEX idx_contract_links_contract_number ON congressional_contract_links(contract_number);
CREATE INDEX idx_contract_links_piid ON congressional_contract_links(contract_piid);
CREATE INDEX idx_contract_links_topic ON congressional_contract_links(topic_number);
CREATE INDEX idx_contract_links_type ON congressional_contract_links(link_type);
CREATE INDEX idx_contract_links_program ON congressional_contract_links(program_name);
CREATE INDEX idx_contract_links_pe_code ON congressional_contract_links(program_element_code);
CREATE INDEX idx_contract_links_verified ON congressional_contract_links(verified) WHERE verified = true;
CREATE INDEX idx_contract_links_created ON congressional_contract_links(created_at DESC);

-- ========================================
-- TABLE 7: congressional_scraping_logs
-- ========================================
-- Track scraping progress and errors

CREATE TABLE congressional_scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scrape Details
  scrape_type VARCHAR(50) NOT NULL, -- 'bills', 'amendments', 'reports', 'hearings', 'members', 'daily_update', 'bulk_import'
  congress INTEGER,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  
  -- Statistics
  records_found INTEGER DEFAULT 0,
  records_new INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  
  -- Errors
  errors JSONB,
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Resource Usage
  api_rate_limit_remaining INTEGER,
  api_rate_limit_reset TIMESTAMPTZ,
  
  -- Summary
  summary TEXT,
  notes TEXT
);

-- Indexes for congressional_scraping_logs
CREATE INDEX idx_scraping_logs_type ON congressional_scraping_logs(scrape_type);
CREATE INDEX idx_scraping_logs_status ON congressional_scraping_logs(status);
CREATE INDEX idx_scraping_logs_started ON congressional_scraping_logs(started_at DESC);
CREATE INDEX idx_scraping_logs_congress ON congressional_scraping_logs(congress);

-- ========================================
-- TEXT SEARCH TRIGGERS
-- ========================================

-- Function to update search_vector for bills
CREATE OR REPLACE FUNCTION update_congressional_bills_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.purpose, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.defense_programs_mentioned, ' '), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.contractors_mentioned, ' '), '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_bills_search_vector
  BEFORE INSERT OR UPDATE ON congressional_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_congressional_bills_search_vector();

-- Similar triggers for other tables
CREATE OR REPLACE FUNCTION update_congressional_amendments_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.amendment_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_amendments_search_vector
  BEFORE INSERT OR UPDATE ON congressional_amendments
  FOR EACH ROW
  EXECUTE FUNCTION update_congressional_amendments_search_vector();

CREATE OR REPLACE FUNCTION update_congressional_reports_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_reports_search_vector
  BEFORE INSERT OR UPDATE ON congressional_committee_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_congressional_reports_search_vector();

CREATE OR REPLACE FUNCTION update_congressional_hearings_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.hearing_transcript_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_hearings_search_vector
  BEFORE INSERT OR UPDATE ON congressional_hearings
  FOR EACH ROW
  EXECUTE FUNCTION update_congressional_hearings_search_vector();

-- ========================================
-- AUTO-UPDATE TIMESTAMPS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON congressional_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amendments_updated_at BEFORE UPDATE ON congressional_amendments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON congressional_committee_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hearings_updated_at BEFORE UPDATE ON congressional_hearings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON congressional_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON congressional_contract_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- HELPFUL VIEWS
-- ========================================

-- View: Active Defense Bills
CREATE OR REPLACE VIEW active_defense_bills AS
SELECT 
  b.*,
  COUNT(DISTINCT ccl.id) as linked_contracts_count
FROM congressional_bills b
LEFT JOIN congressional_contract_links ccl ON ccl.bill_id = b.id
WHERE 
  b.is_defense_related = true 
  AND b.is_active = true
  AND b.congress >= 118  -- Last 2 Congresses
GROUP BY b.id
ORDER BY b.latest_action_date DESC;

-- View: Defense Committee Reports (Recent)
CREATE OR REPLACE VIEW recent_defense_reports AS
SELECT *
FROM congressional_committee_reports
WHERE 
  is_defense_related = true
  AND issued_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY issued_date DESC;

-- View: Upcoming Defense Hearings
CREATE OR REPLACE VIEW upcoming_defense_hearings AS
SELECT *
FROM congressional_hearings
WHERE 
  is_defense_related = true
  AND hearing_date >= CURRENT_DATE
  AND status IN ('scheduled', 'postponed')
ORDER BY hearing_date ASC;

-- View: Contract Legislative Context (for joining)
CREATE OR REPLACE VIEW contract_legislative_context AS
SELECT 
  ccl.contract_source,
  ccl.contract_id,
  ccl.contract_number,
  COUNT(DISTINCT ccl.bill_id) as bills_count,
  COUNT(DISTINCT ccl.report_id) as reports_count,
  COUNT(DISTINCT ccl.hearing_id) as hearings_count,
  array_agg(DISTINCT b.title) FILTER (WHERE b.title IS NOT NULL) as related_bills,
  MAX(ccl.confidence_score) as max_confidence
FROM congressional_contract_links ccl
LEFT JOIN congressional_bills b ON b.id = ccl.bill_id
GROUP BY ccl.contract_source, ccl.contract_id, ccl.contract_number;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant SELECT to authenticated users (if using RLS)
-- ALTER TABLE congressional_bills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE congressional_amendments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE congressional_committee_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE congressional_hearings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE congressional_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE congressional_contract_links ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (adjust as needed)
-- CREATE POLICY "Public read access" ON congressional_bills FOR SELECT USING (true);
-- (Repeat for other tables as needed)

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Congress.gov Database Schema Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  • congressional_bills';
  RAISE NOTICE '  • congressional_amendments';
  RAISE NOTICE '  • congressional_committee_reports';
  RAISE NOTICE '  • congressional_hearings';
  RAISE NOTICE '  • congressional_members';
  RAISE NOTICE '  • congressional_contract_links';
  RAISE NOTICE '  • congressional_scraping_logs';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  • active_defense_bills';
  RAISE NOTICE '  • recent_defense_reports';
  RAISE NOTICE '  • upcoming_defense_hearings';
  RAISE NOTICE '  • contract_legislative_context';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Add CONGRESS_GOV_API_KEY to your .env file';
  RAISE NOTICE '  2. Run the core library setup';
  RAISE NOTICE '  3. Start the historical data import';
  RAISE NOTICE '========================================';
END $$;

