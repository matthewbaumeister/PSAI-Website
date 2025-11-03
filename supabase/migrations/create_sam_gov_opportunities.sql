-- =====================================================
-- SAM.gov Contract Opportunities Table
-- =====================================================
-- Stores solicitations, RFPs, and contract notices from SAM.gov
-- Links to FPDS contracts via solicitation_number
-- =====================================================

CREATE TABLE IF NOT EXISTS sam_gov_opportunities (
  -- Primary Keys
  id BIGSERIAL PRIMARY KEY,
  notice_id TEXT UNIQUE NOT NULL,  -- SAM.gov's internal ID (UUID format)
  solicitation_number TEXT,         -- External solicitation number (for matching to FPDS)
  
  -- Basic Information
  title TEXT NOT NULL,
  notice_type TEXT,                 -- "Solicitation", "Award Notice", "Sources Sought", etc.
  base_type TEXT,                   -- "Presolicitation", "Combined Synopsis/Solicitation", etc.
  
  -- Opportunity Details
  description TEXT,                 -- Full description/summary
  type_of_set_aside TEXT,           -- Small business set-asides
  type_of_set_aside_description TEXT,
  
  -- Dates
  posted_date TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  archive_date TIMESTAMPTZ,
  original_posted_date TIMESTAMPTZ,
  last_modified_date TIMESTAMPTZ,
  
  -- Classification
  naics_code TEXT,
  naics_description TEXT,
  classification_code TEXT,         -- PSC code
  
  -- Agency Information
  department TEXT,                  -- e.g., "DEPARTMENT OF DEFENSE"
  sub_tier TEXT,                    -- e.g., "DEPT OF THE ARMY"
  office TEXT,                      -- Contracting office
  full_parent_path TEXT,            -- Complete agency hierarchy
  
  -- Point of Contact
  primary_contact JSONB,            -- Name, email, phone
  secondary_contact JSONB,
  
  -- Place of Performance
  place_of_performance_city TEXT,
  place_of_performance_state TEXT,
  place_of_performance_country TEXT,
  place_of_performance_zip TEXT,
  
  -- Award Information (if awarded)
  award_number TEXT,                -- Links to FPDS piid
  award_date DATE,
  award_dollars DECIMAL(15,2),
  awardee_name TEXT,
  awardee_duns TEXT,
  awardee_uei TEXT,
  
  -- Links & Attachments
  ui_link TEXT,                     -- Direct link to SAM.gov page
  attachments JSONB,                -- Array of attachment objects
  resource_links JSONB,             -- Additional links
  
  -- Additional Data
  additional_info_text TEXT,        -- Full additional info section
  
  -- Flags
  active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Link to FPDS Contracts
  fpds_contract_id TEXT,            -- Links to fpds_contracts.transaction_number
  fpds_linked_at TIMESTAMPTZ,
  
  -- Metadata
  data_source TEXT DEFAULT 'sam.gov-api',
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sam_opportunities_notice_id ON sam_gov_opportunities(notice_id);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_solicitation_number ON sam_gov_opportunities(solicitation_number);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_posted_date ON sam_gov_opportunities(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_response_deadline ON sam_gov_opportunities(response_deadline);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_naics ON sam_gov_opportunities(naics_code);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_department ON sam_gov_opportunities(department);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_active ON sam_gov_opportunities(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_fpds_link ON sam_gov_opportunities(fpds_contract_id) WHERE fpds_contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_award_date ON sam_gov_opportunities(award_date) WHERE award_date IS NOT NULL;

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_search ON sam_gov_opportunities USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- =====================================================
-- SAM.gov Scraper Progress Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS sam_gov_scraper_runs (
  id BIGSERIAL PRIMARY KEY,
  run_type TEXT NOT NULL,          -- "initial_load", "daily_update", "backfill"
  date_range_start DATE,
  date_range_end DATE,
  status TEXT NOT NULL,            -- "running", "completed", "failed"
  
  -- Statistics
  opportunities_found INTEGER DEFAULT 0,
  opportunities_inserted INTEGER DEFAULT 0,
  opportunities_updated INTEGER DEFAULT 0,
  opportunities_errors INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Error tracking
  error_message TEXT,
  last_processed_page INTEGER,
  
  CONSTRAINT sam_scraper_runs_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_sam_scraper_runs_status ON sam_gov_scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_sam_scraper_runs_started ON sam_gov_scraper_runs(started_at DESC);

-- =====================================================
-- View: Link SAM.gov Opportunities to FPDS Contracts
-- =====================================================

CREATE OR REPLACE VIEW sam_fpds_linked AS
SELECT 
  s.notice_id,
  s.solicitation_number,
  s.title as opportunity_title,
  s.posted_date,
  s.response_deadline,
  s.naics_code,
  s.type_of_set_aside,
  s.department,
  
  -- FPDS Contract Data
  f.piid,
  f.vendor_name as award_winner,
  f.base_and_exercised_options_value as contract_value,
  f.date_signed as award_date,
  
  -- Links
  s.ui_link as sam_gov_link,
  f.usaspending_contract_url as fpds_link,
  
  -- Match Quality
  CASE 
    WHEN f.piid IS NOT NULL THEN 'Matched'
    WHEN s.solicitation_number IS NOT NULL THEN 'Unmatched - Has Solicitation'
    ELSE 'No Solicitation Number'
  END as match_status

FROM sam_gov_opportunities s
LEFT JOIN fpds_contracts f ON s.solicitation_number = f.solicitation_id
WHERE s.active = TRUE;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE sam_gov_opportunities IS 'Contract opportunities and solicitations from SAM.gov Opportunities API';
COMMENT ON COLUMN sam_gov_opportunities.notice_id IS 'SAM.gov internal UUID - use this for direct links';
COMMENT ON COLUMN sam_gov_opportunities.solicitation_number IS 'External solicitation number - use this to match FPDS contracts';
COMMENT ON COLUMN sam_gov_opportunities.ui_link IS 'Direct link to opportunity on SAM.gov (e.g., https://sam.gov/opp/{notice_id}/view)';
COMMENT ON COLUMN sam_gov_opportunities.fpds_contract_id IS 'Link to awarded contract in fpds_contracts table';

-- =====================================================
-- Initial Stats
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'SAM.gov Opportunities Table Created';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Ready to scrape contract opportunities from SAM.gov';
  RAISE NOTICE 'Next step: Run sam-gov-opportunities-scraper.ts';
  RAISE NOTICE '=================================================';
END $$;

