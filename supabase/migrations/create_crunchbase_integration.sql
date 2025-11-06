-- ============================================
-- CRUNCHBASE API INTEGRATION SCHEMA
-- ============================================
-- This migration creates tables for enriching company data
-- with Crunchbase API intelligence (funding, leadership, etc.)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- ============================================
-- TABLE 1: crunchbase_companies
-- ============================================
-- Primary table for enriched company data from Crunchbase

CREATE TABLE IF NOT EXISTS crunchbase_companies (
  id BIGSERIAL PRIMARY KEY,
  
  -- Crunchbase Identifiers
  crunchbase_uuid TEXT UNIQUE NOT NULL,
  crunchbase_permalink TEXT UNIQUE NOT NULL,
  
  -- Company Matching (Link to FPDS/SAM data)
  company_name TEXT NOT NULL,
  legal_name TEXT,
  matched_vendor_names TEXT[], -- Array of vendor names from fpds_contracts
  matched_vendor_uei TEXT[], -- Array of UEIs
  matched_vendor_duns TEXT[], -- Array of DUNS
  
  -- Basic Information
  website TEXT,
  short_description TEXT,
  long_description TEXT,
  
  -- Contact & Social
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  email TEXT,
  phone TEXT,
  
  -- Classification
  category_groups TEXT[],
  industries TEXT[],
  operating_status TEXT, -- 'active', 'closed', 'acquired'
  company_type TEXT, -- 'for_profit', 'non_profit', 'government'
  ipo_status TEXT, -- 'public', 'private', 'acquired', 'closed'
  
  -- Financial Data
  total_funding_amount DECIMAL(15,2),
  total_funding_currency TEXT DEFAULT 'USD',
  last_funding_date DATE,
  last_funding_type TEXT,
  number_of_funding_rounds INTEGER,
  
  -- Valuation
  valuation DECIMAL(15,2),
  valuation_date DATE,
  valuation_currency TEXT DEFAULT 'USD',
  
  -- IPO Information
  ipo_date DATE,
  stock_symbol TEXT,
  stock_exchange TEXT,
  
  -- Acquisition Information
  was_acquired BOOLEAN DEFAULT FALSE,
  acquired_by_name TEXT,
  acquired_by_uuid TEXT,
  acquisition_date DATE,
  acquisition_price DECIMAL(15,2),
  
  -- People
  founder_names TEXT[],
  ceo_name TEXT,
  cto_name TEXT,
  employee_count INTEGER,
  employee_count_range TEXT, -- '1-10', '11-50', '51-200', etc.
  
  -- Location
  headquarters_city TEXT,
  headquarters_region TEXT, -- State/Province
  headquarters_country TEXT DEFAULT 'United States',
  headquarters_postal_code TEXT,
  
  -- Market Intelligence
  number_of_acquisitions INTEGER DEFAULT 0,
  number_of_investments INTEGER DEFAULT 0,
  number_of_exits INTEGER DEFAULT 0,
  
  -- Dates
  founded_date DATE,
  closed_date DATE,
  
  -- API Metadata
  last_enriched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrichment_source TEXT DEFAULT 'crunchbase_api',
  api_call_count INTEGER DEFAULT 1,
  data_quality_score INTEGER, -- 0-100 based on completeness
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Attribution (Required by Crunchbase TOS)
  data_attribution TEXT DEFAULT 'Data provided by Crunchbase'
);

-- Indexes for crunchbase_companies
CREATE INDEX IF NOT EXISTS idx_cb_companies_name ON crunchbase_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_cb_companies_uuid ON crunchbase_companies(crunchbase_uuid);
CREATE INDEX IF NOT EXISTS idx_cb_companies_permalink ON crunchbase_companies(crunchbase_permalink);
CREATE INDEX IF NOT EXISTS idx_cb_companies_uei ON crunchbase_companies USING GIN(matched_vendor_uei);
CREATE INDEX IF NOT EXISTS idx_cb_companies_duns ON crunchbase_companies USING GIN(matched_vendor_duns);
CREATE INDEX IF NOT EXISTS idx_cb_companies_operating_status ON crunchbase_companies(operating_status);
CREATE INDEX IF NOT EXISTS idx_cb_companies_total_funding ON crunchbase_companies(total_funding_amount DESC);
CREATE INDEX IF NOT EXISTS idx_cb_companies_employee_count ON crunchbase_companies(employee_count DESC);
CREATE INDEX IF NOT EXISTS idx_cb_companies_founded_date ON crunchbase_companies(founded_date);
CREATE INDEX IF NOT EXISTS idx_cb_companies_last_enriched ON crunchbase_companies(last_enriched);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_cb_companies_search ON crunchbase_companies 
  USING GIN(to_tsvector('english', 
    COALESCE(company_name, '') || ' ' || 
    COALESCE(short_description, '') || ' ' || 
    COALESCE(long_description, '')
  ));

-- ============================================
-- TABLE 2: crunchbase_funding_rounds
-- ============================================
-- Detailed funding round history for each company

CREATE TABLE IF NOT EXISTS crunchbase_funding_rounds (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id) ON DELETE CASCADE,
  company_uuid TEXT NOT NULL,
  
  -- Round Identifiers
  funding_round_uuid TEXT UNIQUE NOT NULL,
  funding_round_permalink TEXT,
  
  -- Round Details
  round_name TEXT, -- 'Series A', 'Seed', 'Series B', etc.
  round_type TEXT, -- 'seed', 'series_a', 'series_b', 'venture', 'private_equity'
  announced_date DATE,
  closed_date DATE,
  
  -- Funding Amount
  money_raised DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  pre_money_valuation DECIMAL(15,2),
  post_money_valuation DECIMAL(15,2),
  
  -- Investors
  investor_count INTEGER,
  lead_investor_name TEXT,
  lead_investor_uuid TEXT,
  investor_names TEXT[],
  investor_types TEXT[], -- 'venture_capital', 'angel', 'private_equity'
  
  -- Strategic Investors (Important for Gov Contracting)
  has_strategic_investor BOOLEAN DEFAULT FALSE,
  strategic_investor_names TEXT[], -- e.g., In-Q-Tel, strategic corporates
  
  -- Additional Details
  is_equity BOOLEAN,
  target_funding DECIMAL(15,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crunchbase_funding_rounds
CREATE INDEX IF NOT EXISTS idx_cb_funding_company_id ON crunchbase_funding_rounds(crunchbase_company_id);
CREATE INDEX IF NOT EXISTS idx_cb_funding_company_uuid ON crunchbase_funding_rounds(company_uuid);
CREATE INDEX IF NOT EXISTS idx_cb_funding_round_type ON crunchbase_funding_rounds(round_type);
CREATE INDEX IF NOT EXISTS idx_cb_funding_announced_date ON crunchbase_funding_rounds(announced_date DESC);
CREATE INDEX IF NOT EXISTS idx_cb_funding_money_raised ON crunchbase_funding_rounds(money_raised DESC);
CREATE INDEX IF NOT EXISTS idx_cb_funding_lead_investor ON crunchbase_funding_rounds(lead_investor_name);
CREATE INDEX IF NOT EXISTS idx_cb_funding_strategic ON crunchbase_funding_rounds(has_strategic_investor) 
  WHERE has_strategic_investor = TRUE;

-- ============================================
-- TABLE 3: crunchbase_people
-- ============================================
-- Key people at companies (founders, executives)

CREATE TABLE IF NOT EXISTS crunchbase_people (
  id BIGSERIAL PRIMARY KEY,
  
  -- Person Identifiers
  crunchbase_person_uuid TEXT UNIQUE NOT NULL,
  person_permalink TEXT,
  
  -- Basic Info
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Position (Current or Most Recent)
  current_company_uuid TEXT,
  current_company_name TEXT,
  current_title TEXT,
  started_on DATE,
  ended_on DATE,
  is_current BOOLEAN DEFAULT TRUE,
  
  -- Contact
  linkedin_url TEXT,
  twitter_url TEXT,
  email TEXT,
  
  -- Background
  bio TEXT,
  gender TEXT,
  
  -- Education
  education JSONB, -- Array of {school, degree, field, graduated_year}
  
  -- Location
  location_city TEXT,
  location_region TEXT,
  location_country TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crunchbase_people
CREATE INDEX IF NOT EXISTS idx_cb_people_uuid ON crunchbase_people(crunchbase_person_uuid);
CREATE INDEX IF NOT EXISTS idx_cb_people_company_uuid ON crunchbase_people(current_company_uuid);
CREATE INDEX IF NOT EXISTS idx_cb_people_name ON crunchbase_people(full_name);
CREATE INDEX IF NOT EXISTS idx_cb_people_title ON crunchbase_people(current_title);
CREATE INDEX IF NOT EXISTS idx_cb_people_is_current ON crunchbase_people(is_current) WHERE is_current = TRUE;

-- ============================================
-- TABLE 4: crunchbase_acquisitions
-- ============================================
-- Track company acquisitions (important for market intelligence)

CREATE TABLE IF NOT EXISTS crunchbase_acquisitions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Acquisition Identifiers
  acquisition_uuid TEXT UNIQUE NOT NULL,
  
  -- Acquirer
  acquirer_uuid TEXT,
  acquirer_name TEXT NOT NULL,
  acquirer_crunchbase_id BIGINT REFERENCES crunchbase_companies(id),
  
  -- Acquired Company
  acquired_uuid TEXT,
  acquired_name TEXT NOT NULL,
  acquired_crunchbase_id BIGINT REFERENCES crunchbase_companies(id),
  
  -- Deal Details
  announced_date DATE,
  completed_date DATE,
  acquisition_type TEXT, -- 'acquisition', 'merger', 'buyout'
  acquisition_status TEXT, -- 'completed', 'pending', 'cancelled'
  
  -- Financial
  price DECIMAL(15,2),
  price_currency TEXT DEFAULT 'USD',
  
  -- Additional Details
  deal_terms TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crunchbase_acquisitions
CREATE INDEX IF NOT EXISTS idx_cb_acquisitions_acquirer_uuid ON crunchbase_acquisitions(acquirer_uuid);
CREATE INDEX IF NOT EXISTS idx_cb_acquisitions_acquired_uuid ON crunchbase_acquisitions(acquired_uuid);
CREATE INDEX IF NOT EXISTS idx_cb_acquisitions_announced_date ON crunchbase_acquisitions(announced_date DESC);
CREATE INDEX IF NOT EXISTS idx_cb_acquisitions_price ON crunchbase_acquisitions(price DESC);

-- ============================================
-- TABLE 5: crunchbase_enrichment_queue
-- ============================================
-- Queue for managing company enrichment requests

CREATE TABLE IF NOT EXISTS crunchbase_enrichment_queue (
  id BIGSERIAL PRIMARY KEY,
  
  -- Company to Enrich
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  source_table TEXT NOT NULL, -- 'fpds_contracts', 'sam_gov_opportunities', 'army_innovation_submissions'
  source_id BIGINT,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10 (10 = highest priority)
  priority_reason TEXT, -- 'large_contract_winner', 'frequent_contractor', 'new_company'
  
  -- Enrichment Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'not_found'
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Results
  crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id),
  match_confidence DECIMAL(3,2), -- 0.00 - 1.00
  match_method TEXT, -- 'exact_name', 'website', 'manual', 'fuzzy_match'
  
  -- Error Handling
  last_error TEXT,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crunchbase_enrichment_queue
CREATE INDEX IF NOT EXISTS idx_cb_queue_status ON crunchbase_enrichment_queue(status);
CREATE INDEX IF NOT EXISTS idx_cb_queue_priority ON crunchbase_enrichment_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_cb_queue_company_name ON crunchbase_enrichment_queue(company_name);
CREATE INDEX IF NOT EXISTS idx_cb_queue_vendor_uei ON crunchbase_enrichment_queue(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_cb_queue_created_at ON crunchbase_enrichment_queue(created_at);

-- Unique constraint to prevent duplicate enrichment requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_cb_queue_unique_company ON crunchbase_enrichment_queue(company_name, vendor_uei, vendor_duns)
  WHERE status IN ('pending', 'in_progress');

-- ============================================
-- TABLE 6: crunchbase_api_usage
-- ============================================
-- Track API usage for billing and optimization

CREATE TABLE IF NOT EXISTS crunchbase_api_usage (
  id BIGSERIAL PRIMARY KEY,
  
  -- API Call Details
  endpoint TEXT NOT NULL, -- '/entities/organizations/{uuid}', '/searches/organizations'
  request_method TEXT DEFAULT 'GET',
  company_name TEXT,
  company_uuid TEXT,
  
  -- Response
  status_code INTEGER,
  success BOOLEAN,
  response_time_ms INTEGER,
  
  -- Rate Limiting
  rate_limit_remaining INTEGER,
  rate_limit_total INTEGER,
  
  -- Cost Tracking
  api_credits_used INTEGER DEFAULT 1,
  
  -- Error Tracking
  error_message TEXT,
  error_type TEXT,
  
  -- Timestamp
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crunchbase_api_usage
CREATE INDEX IF NOT EXISTS idx_cb_api_usage_called_at ON crunchbase_api_usage(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_cb_api_usage_endpoint ON crunchbase_api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_cb_api_usage_success ON crunchbase_api_usage(success);
CREATE INDEX IF NOT EXISTS idx_cb_api_usage_company_uuid ON crunchbase_api_usage(company_uuid);

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================
-- Add foreign key columns to existing tables to link to Crunchbase data

-- Add to fpds_company_stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fpds_company_stats' 
    AND column_name = 'crunchbase_company_id'
  ) THEN
    ALTER TABLE fpds_company_stats 
    ADD COLUMN crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id),
    ADD COLUMN crunchbase_enriched BOOLEAN DEFAULT FALSE,
    ADD COLUMN crunchbase_last_updated TIMESTAMP WITH TIME ZONE;

    CREATE INDEX IF NOT EXISTS idx_fpds_stats_crunchbase_id ON fpds_company_stats(crunchbase_company_id);
  END IF;
END $$;

-- Add to sam_gov_opportunities (for awardees)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sam_gov_opportunities' 
    AND column_name = 'awardee_crunchbase_id'
  ) THEN
    ALTER TABLE sam_gov_opportunities
    ADD COLUMN awardee_crunchbase_id BIGINT REFERENCES crunchbase_companies(id),
    ADD COLUMN awardee_crunchbase_enriched BOOLEAN DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS idx_sam_opp_crunchbase_id ON sam_gov_opportunities(awardee_crunchbase_id);
  END IF;
END $$;

-- Add to army_innovation_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'army_innovation_submissions' 
    AND column_name = 'crunchbase_company_id'
  ) THEN
    ALTER TABLE army_innovation_submissions
    ADD COLUMN crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id),
    ADD COLUMN crunchbase_enriched BOOLEAN DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS idx_army_sub_crunchbase_id ON army_innovation_submissions(crunchbase_company_id);
  END IF;
END $$;

-- ============================================
-- VIEWS
-- ============================================

-- View: Companies with Crunchbase Data
CREATE OR REPLACE VIEW companies_with_crunchbase AS
SELECT 
  c.id,
  c.company_name,
  c.crunchbase_uuid,
  c.total_funding_amount,
  c.last_funding_date,
  c.employee_count,
  c.founded_date,
  c.headquarters_city,
  c.headquarters_region,
  f.total_contracts,
  f.total_value as fpds_total_value,
  f.most_recent_contract_date
FROM crunchbase_companies c
LEFT JOIN fpds_company_stats f ON f.crunchbase_company_id = c.id
WHERE c.operating_status = 'active';

-- View: Funding Rounds Summary
CREATE OR REPLACE VIEW crunchbase_funding_summary AS
SELECT 
  c.company_name,
  c.crunchbase_uuid,
  COUNT(fr.id) as total_rounds,
  SUM(fr.money_raised) as total_funding,
  MAX(fr.announced_date) as last_funding_date,
  ARRAY_AGG(DISTINCT fr.round_type ORDER BY fr.round_type) as round_types,
  ARRAY_AGG(DISTINCT fr.lead_investor_name) FILTER (WHERE fr.lead_investor_name IS NOT NULL) as lead_investors
FROM crunchbase_companies c
LEFT JOIN crunchbase_funding_rounds fr ON fr.crunchbase_company_id = c.id
GROUP BY c.id, c.company_name, c.crunchbase_uuid;

-- View: Enrichment Queue Status
CREATE OR REPLACE VIEW crunchbase_enrichment_status AS
SELECT 
  status,
  COUNT(*) as count,
  AVG(priority) as avg_priority,
  MIN(created_at) as oldest_request,
  MAX(created_at) as newest_request
FROM crunchbase_enrichment_queue
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'in_progress' THEN 1
    WHEN 'pending' THEN 2
    WHEN 'failed' THEN 3
    WHEN 'not_found' THEN 4
    WHEN 'completed' THEN 5
  END;

-- View: API Usage Today
CREATE OR REPLACE VIEW crunchbase_api_usage_today AS
SELECT 
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = TRUE) as successful_calls,
  COUNT(*) FILTER (WHERE success = FALSE) as failed_calls,
  SUM(api_credits_used) as total_credits_used,
  AVG(response_time_ms) as avg_response_time_ms,
  MIN(called_at) as first_call,
  MAX(called_at) as last_call
FROM crunchbase_api_usage
WHERE DATE(called_at) = CURRENT_DATE;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate Data Quality Score
CREATE OR REPLACE FUNCTION calculate_crunchbase_quality_score(company_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  company_record RECORD;
BEGIN
  SELECT * INTO company_record FROM crunchbase_companies WHERE id = company_id;
  
  -- Basic info (30 points)
  IF company_record.website IS NOT NULL THEN score := score + 5; END IF;
  IF company_record.short_description IS NOT NULL THEN score := score + 5; END IF;
  IF company_record.long_description IS NOT NULL THEN score := score + 5; END IF;
  IF company_record.founded_date IS NOT NULL THEN score := score + 5; END IF;
  IF company_record.headquarters_city IS NOT NULL THEN score := score + 5; END IF;
  IF company_record.employee_count IS NOT NULL THEN score := score + 5; END IF;
  
  -- Financial data (30 points)
  IF company_record.total_funding_amount IS NOT NULL AND company_record.total_funding_amount > 0 THEN score := score + 15; END IF;
  IF company_record.last_funding_date IS NOT NULL THEN score := score + 10; END IF;
  IF company_record.valuation IS NOT NULL THEN score := score + 5; END IF;
  
  -- People data (20 points)
  IF company_record.founder_names IS NOT NULL AND array_length(company_record.founder_names, 1) > 0 THEN score := score + 10; END IF;
  IF company_record.ceo_name IS NOT NULL THEN score := score + 10; END IF;
  
  -- Social/Contact (10 points)
  IF company_record.linkedin_url IS NOT NULL THEN score := score + 5; END IF;
  IF company_record.twitter_url IS NOT NULL THEN score := score + 5; END IF;
  
  -- Classification (10 points)
  IF company_record.category_groups IS NOT NULL AND array_length(company_record.category_groups, 1) > 0 THEN score := score + 5; END IF;
  IF company_record.industries IS NOT NULL AND array_length(company_record.industries, 1) > 0 THEN score := score + 5; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function: Update Company Quality Scores
CREATE OR REPLACE FUNCTION update_all_quality_scores()
RETURNS void AS $$
BEGIN
  UPDATE crunchbase_companies
  SET data_quality_score = calculate_crunchbase_quality_score(id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_crunchbase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crunchbase_companies_updated_at
  BEFORE UPDATE ON crunchbase_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_crunchbase_updated_at();

CREATE TRIGGER trigger_update_crunchbase_funding_rounds_updated_at
  BEFORE UPDATE ON crunchbase_funding_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_crunchbase_updated_at();

CREATE TRIGGER trigger_update_crunchbase_people_updated_at
  BEFORE UPDATE ON crunchbase_people
  FOR EACH ROW
  EXECUTE FUNCTION update_crunchbase_updated_at();

CREATE TRIGGER trigger_update_crunchbase_acquisitions_updated_at
  BEFORE UPDATE ON crunchbase_acquisitions
  FOR EACH ROW
  EXECUTE FUNCTION update_crunchbase_updated_at();

CREATE TRIGGER trigger_update_crunchbase_queue_updated_at
  BEFORE UPDATE ON crunchbase_enrichment_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_crunchbase_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE crunchbase_companies IS 'Enriched company data from Crunchbase API';
COMMENT ON TABLE crunchbase_funding_rounds IS 'Funding round history for companies';
COMMENT ON TABLE crunchbase_people IS 'Key people (founders, executives) at companies';
COMMENT ON TABLE crunchbase_acquisitions IS 'Company acquisition events';
COMMENT ON TABLE crunchbase_enrichment_queue IS 'Queue for managing company enrichment requests';
COMMENT ON TABLE crunchbase_api_usage IS 'API usage tracking for billing and optimization';

COMMENT ON COLUMN crunchbase_companies.data_attribution IS 'Required by Crunchbase TOS - must display on all pages showing Crunchbase data';
COMMENT ON COLUMN crunchbase_companies.data_quality_score IS 'Calculated score (0-100) based on completeness of data fields';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Crunchbase Integration Tables Created!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - crunchbase_companies';
  RAISE NOTICE '  - crunchbase_funding_rounds';
  RAISE NOTICE '  - crunchbase_people';
  RAISE NOTICE '  - crunchbase_acquisitions';
  RAISE NOTICE '  - crunchbase_enrichment_queue';
  RAISE NOTICE '  - crunchbase_api_usage';
  RAISE NOTICE '';
  RAISE NOTICE 'Modified Tables:';
  RAISE NOTICE '  - fpds_company_stats (added crunchbase_company_id)';
  RAISE NOTICE '  - sam_gov_opportunities (added awardee_crunchbase_id)';
  RAISE NOTICE '  - army_innovation_submissions (added crunchbase_company_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Contact Crunchbase Sales for API subscription';
  RAISE NOTICE '  2. Obtain API key and add to environment variables';
  RAISE NOTICE '  3. Build API client library (src/lib/crunchbase/)';
  RAISE NOTICE '  4. Implement enrichment queue processor';
  RAISE NOTICE '  5. Run initial enrichment for top companies';
  RAISE NOTICE '';
  RAISE NOTICE 'Attribution Requirement:';
  RAISE NOTICE '  All pages displaying Crunchbase data MUST include:';
  RAISE NOTICE '  "Data provided by Crunchbase" with link to crunchbase.com';
  RAISE NOTICE '============================================';
END $$;

