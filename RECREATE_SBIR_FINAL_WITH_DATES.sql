-- ========================================
-- RECREATE sbir_final TABLE WITH PROPER DATE TYPES
-- ========================================
-- 
-- This script will:
-- 1. Drop the old table
-- 2. Create new table with DATE/TIMESTAMP columns (not TEXT)
-- 3. Add all necessary indexes
-- 4. Set up proper constraints
-- ========================================

-- STEP 1: Drop old table (CAREFUL - this deletes all data!)
DROP TABLE IF EXISTS sbir_final CASCADE;

-- STEP 2: Create new table with proper types
CREATE TABLE sbir_final (
  -- Primary identifiers
  id BIGSERIAL PRIMARY KEY,
  topic_number TEXT NOT NULL,
  cycle_name TEXT NOT NULL,
  topic_id TEXT,
  
  -- Basic info
  title TEXT,
  status TEXT,
  sponsor_component TEXT,
  solicitation_branch TEXT,
  
  -- DATES AS PROPER DATE TYPES (not TEXT!)
  open_date DATE,
  close_date DATE,
  open_datetime TIMESTAMPTZ,
  close_datetime TIMESTAMPTZ,
  pre_release_date DATE,
  pre_release_date_close DATE,
  qa_close_date DATE,
  last_activity_date TIMESTAMPTZ,
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  -- Descriptions and content
  description TEXT,
  objective TEXT,
  phase_1_description TEXT,
  phase_2_description TEXT,
  phase_3_description TEXT,
  
  -- Q&A content
  qa_content TEXT,
  qa_content_fetched TEXT,
  qa_last_updated TIMESTAMPTZ,
  topic_question_count INTEGER,
  no_of_published_questions INTEGER,
  qa_response_rate_percentage INTEGER,
  
  -- Technology and keywords
  technology_areas TEXT,
  keywords TEXT,
  modernization_priorities TEXT,
  
  -- TPOCs
  tpoc_names TEXT,
  tpoc_emails TEXT,
  tpoc_centers TEXT,
  tpoc_count INTEGER,
  tpoc_email_domain TEXT,
  show_tpoc TEXT,
  
  -- Links and downloads
  topic_pdf_download TEXT,
  pdf_link TEXT,
  solicitation_instructions_download TEXT,
  solicitation_instructions_version TEXT,
  component_instructions_download TEXT,
  component_instructions_version TEXT,
  baa_instruction_files TEXT,
  
  -- References (quoted because it's a reserved keyword)
  "references" TEXT,
  
  -- Calculated fields (numeric)
  days_since_open INTEGER,
  days_until_close INTEGER,
  days_until_qa_close INTEGER,
  duration_days INTEGER,
  pre_release_duration INTEGER,
  
  -- Status fields
  urgency_level TEXT,
  proposal_window_status TEXT,
  qa_window_active TEXT,
  solicitation_phase TEXT,
  phases_available TEXT,
  
  -- Boolean-like text fields
  is_direct_to_phase_ii TEXT,
  is_xtech TEXT,
  prize_gating TEXT,
  itar_controlled TEXT,
  
  -- Metadata for smart updates
  scraper_source TEXT, -- 'active' or 'historical'
  data_freshness TEXT, -- 'live' or 'archived'
  
  -- Unique constraint on composite key
  UNIQUE(topic_number, cycle_name)
);

-- STEP 3: Create indexes for performance
CREATE INDEX idx_sbir_status ON sbir_final(status);
CREATE INDEX idx_sbir_close_date ON sbir_final(close_date);
CREATE INDEX idx_sbir_open_date ON sbir_final(open_date);
CREATE INDEX idx_sbir_sponsor ON sbir_final(sponsor_component);
CREATE INDEX idx_sbir_topic_number ON sbir_final(topic_number);
CREATE INDEX idx_sbir_cycle_name ON sbir_final(cycle_name);
CREATE INDEX idx_sbir_last_scraped ON sbir_final(last_scraped);
CREATE INDEX idx_sbir_tech_areas ON sbir_final USING gin(to_tsvector('english', technology_areas));
CREATE INDEX idx_sbir_keywords ON sbir_final USING gin(to_tsvector('english', keywords));
CREATE INDEX idx_sbir_description ON sbir_final USING gin(to_tsvector('english', description));

-- STEP 4: Add comments for documentation
COMMENT ON TABLE sbir_final IS 'SBIR/STTR topics with proper date types and smart update logic';
COMMENT ON COLUMN sbir_final.scraper_source IS 'Which scraper last updated this: active or historical';
COMMENT ON COLUMN sbir_final.data_freshness IS 'live = currently active/open, archived = historical/closed';
COMMENT ON COLUMN sbir_final.open_date IS 'Topic open date (DATE type, not TEXT)';
COMMENT ON COLUMN sbir_final.close_date IS 'Topic close date (DATE type, not TEXT)';

-- STEP 5: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sbir_final' 
  AND column_name IN ('open_date', 'close_date', 'open_datetime', 'close_datetime', 'last_scraped')
ORDER BY ordinal_position;

