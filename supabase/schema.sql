-- ============================================
-- PropShop.ai Master Opportunities Schema
-- Consolidates all data sources into unified view
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- MASTER OPPORTUNITIES TABLE
-- This is the single source of truth for all opportunities
-- ============================================

CREATE TABLE IF NOT EXISTS opportunity_master (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Canonical Key (unique identifier across all sources)
  canonical_opportunity_key TEXT UNIQUE NOT NULL,
  
  -- Identifiers
  primary_contract_number TEXT,
  primary_notice_id TEXT,
  primary_award_id TEXT,
  parent_contract_number TEXT,
  external_ids JSONB DEFAULT '{}'::jsonb,
  
  -- Descriptive Information
  title TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  opportunity_type TEXT, -- 'contract_award', 'solicitation', 'sbir', 'grant', 'other'
  domain_category TEXT, -- 'cyber', 'aerospace', 'medical', etc.
  keywords TEXT[],
  
  -- Customer/Organization
  customer_department TEXT, -- 'DoD', 'DHS', 'NASA', etc.
  customer_agency TEXT, -- 'Army', 'Navy', 'Air Force', etc.
  customer_sub_agency TEXT,
  customer_office TEXT,
  customer_location TEXT,
  customer_country TEXT DEFAULT 'USA',
  
  -- Classification
  naics_codes TEXT[],
  psc_codes TEXT[],
  
  -- Financial
  vehicle_type TEXT, -- 'IDIQ', 'BPA', 'Single Award', etc.
  ceiling_value NUMERIC,
  estimated_value NUMERIC,
  obligated_value NUMERIC,
  funding_agency TEXT,
  contract_type TEXT,
  set_aside_type TEXT,
  competition_type TEXT,
  is_small_business_set_aside BOOLEAN DEFAULT false,
  is_sole_source BOOLEAN DEFAULT false,
  
  -- Timeline
  status TEXT, -- 'open', 'awarded', 'closed', 'forecasted', 'cancelled'
  publication_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  period_of_performance_start DATE,
  period_of_performance_end DATE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Suppliers (for awards)
  prime_recipients TEXT[],
  sub_recipients TEXT[],
  cage_codes TEXT[],
  uei_numbers TEXT[],
  
  -- Source tracking
  source_attributes JSONB DEFAULT '{}'::jsonb, -- Nested objects per source
  source_count INTEGER DEFAULT 1,
  data_quality_score INTEGER DEFAULT 0, -- 0-100
  
  -- LLM-generated fields
  llm_summary TEXT,
  llm_notes TEXT,
  embedding vector(1536) -- For semantic search
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opp_master_canonical_key ON opportunity_master(canonical_opportunity_key);
CREATE INDEX IF NOT EXISTS idx_opp_master_status ON opportunity_master(status);
CREATE INDEX IF NOT EXISTS idx_opp_master_customer_agency ON opportunity_master(customer_agency);
CREATE INDEX IF NOT EXISTS idx_opp_master_opportunity_type ON opportunity_master(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opp_master_keywords ON opportunity_master USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_opp_master_publication_date ON opportunity_master(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_opp_master_estimated_value ON opportunity_master(estimated_value DESC);
CREATE INDEX IF NOT EXISTS idx_opp_master_embedding ON opportunity_master USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- OPPORTUNITY SOURCES (Junction Table)
-- Tracks provenance of each opportunity
-- ============================================

CREATE TABLE IF NOT EXISTS opportunity_sources (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys
  opportunity_id BIGINT NOT NULL REFERENCES opportunity_master(id) ON DELETE CASCADE,
  
  -- Source metadata
  source_name TEXT NOT NULL, -- 'dod_contract_news', 'sbir_final', 'fpds', etc.
  source_table TEXT NOT NULL,
  source_primary_key TEXT NOT NULL,
  source_url TEXT,
  
  -- Raw data from source (preserved for audit)
  raw_record JSONB,
  
  -- Ingestion metadata
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  match_confidence NUMERIC DEFAULT 100, -- How confident are we this is the same opportunity?
  match_method TEXT, -- 'direct_scrape', 'api_import', 'manual_link', etc.
  
  -- Unique constraint: one source record can only link to one master opportunity
  UNIQUE(opportunity_id, source_name, source_primary_key)
);

CREATE INDEX IF NOT EXISTS idx_opp_sources_opportunity_id ON opportunity_sources(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_sources_source_name ON opportunity_sources(source_name);

-- ============================================
-- USER OPPORTUNITY TRACKING
-- Track which opportunities users have added to CRM
-- ============================================

CREATE TABLE IF NOT EXISTS user_opportunities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  user_id UUID NOT NULL, -- From auth.users
  opportunity_id BIGINT NOT NULL REFERENCES opportunity_master(id) ON DELETE CASCADE,
  
  -- CRM Stage
  crm_stage TEXT NOT NULL DEFAULT 'discovery', -- 'discovery', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
  
  -- User notes & metadata
  internal_notes TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  tags TEXT[],
  
  -- Tracking
  last_viewed_at TIMESTAMPTZ,
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_opps_user_id ON user_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_opps_opportunity_id ON user_opportunities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_user_opps_crm_stage ON user_opportunities(crm_stage);

-- ============================================
-- CHAT SESSIONS & MESSAGES
-- Track AI chat sessions and messages
-- ============================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  user_id UUID NOT NULL, -- From auth.users
  
  title TEXT, -- Auto-generated from first message
  context_filters JSONB DEFAULT '{}'::jsonb, -- Active filters when chat started
  
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  session_id BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  
  -- Context
  related_opportunity_ids BIGINT[], -- Which opportunities were discussed
  applied_filters JSONB, -- Filters that were applied from this message
  
  -- LLM metadata
  model TEXT,
  tokens_used INTEGER
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opportunity_master_updated_at BEFORE UPDATE ON opportunity_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_opportunities_updated_at BEFORE UPDATE ON user_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE opportunity_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Public read access to opportunities (for now - adjust based on your needs)
CREATE POLICY "Public read access to opportunities" ON opportunity_master
    FOR SELECT USING (true);

CREATE POLICY "Public read access to opportunity sources" ON opportunity_sources
    FOR SELECT USING (true);

-- Users can only see their own CRM opportunities
CREATE POLICY "Users can view own opportunities" ON user_opportunities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own opportunities" ON user_opportunities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own opportunities" ON user_opportunities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own opportunities" ON user_opportunities
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Enriched opportunities with source count
CREATE OR REPLACE VIEW opportunities_enriched AS
SELECT 
    om.*,
    COUNT(DISTINCT os.id) as actual_source_count,
    ARRAY_AGG(DISTINCT os.source_name) as source_names
FROM opportunity_master om
LEFT JOIN opportunity_sources os ON om.id = os.opportunity_id
GROUP BY om.id;

-- User's CRM pipeline view
CREATE OR REPLACE VIEW user_crm_pipeline AS
SELECT 
    uo.*,
    om.title,
    om.short_description,
    om.customer_agency,
    om.estimated_value,
    om.status,
    om.due_date,
    om.opportunity_type
FROM user_opportunities uo
JOIN opportunity_master om ON uo.opportunity_id = om.id;

COMMENT ON TABLE opportunity_master IS 'Master table for all opportunities from all sources';
COMMENT ON TABLE opportunity_sources IS 'Junction table tracking which sources contributed to each opportunity';
COMMENT ON TABLE user_opportunities IS 'User-specific tracking of opportunities in their CRM pipeline';
COMMENT ON TABLE chat_sessions IS 'AI chat sessions for opportunity search and analysis';
COMMENT ON TABLE chat_messages IS 'Messages within chat sessions';

