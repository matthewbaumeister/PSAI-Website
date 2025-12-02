-- ============================================
-- PROPSHOP.AI - HYBRID SCHEMA (BEST OF BOTH WORLDS)
-- ============================================
-- ONE row per contract (LLM-friendly)
-- Field-level provenance (know source of each field)
-- Full raw data preservation (audit trail)
-- Multi-source consolidation (automatic)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- SINGLE OPPORTUNITIES TABLE
-- One row per contract, fully enriched from all sources
-- ============================================

CREATE TABLE IF NOT EXISTS opportunities (
  -- Identity
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ============================================
  -- MATCHING KEYS (for finding same contract across sources)
  -- ============================================
  contract_number TEXT, -- Primary matching key
  solicitation_number TEXT,
  notice_id TEXT,
  award_id TEXT,
  modification_number TEXT,
  parent_contract_number TEXT,
  
  -- Secondary identifiers
  cage_code TEXT,
  duns_number TEXT,
  uei_number TEXT,
  
  -- ============================================
  -- SOURCE TRACKING (which sources contributed)
  -- ============================================
  sources TEXT[], -- ['defense_gov', 'fpds', 'sam_gov']
  source_count INTEGER DEFAULT 1,
  primary_source TEXT, -- Which source created this record
  last_source TEXT, -- Which source last updated this
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Field-level provenance (which source provided which field)
  field_sources JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "vendor_name": "defense_gov",
    "award_amount": "fpds",
    "naics_code": "sam_gov",
    "description": "defense_gov"
  }
  */
  
  -- Raw data from each source (preserved for audit)
  source_data JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "defense_gov": {
      "url": "https://...",
      "scraped_at": "2024-12-02T10:00:00Z",
      "vendor": "Lockheed Martin",
      "amount": 1200000000,
      "raw_text": "full paragraph..."
    },
    "fpds": {
      "url": "https://...",
      "scraped_at": "2024-12-02T11:00:00Z",
      "vendor": "LOCKHEED MARTIN CORPORATION",
      "amount": 1200000000,
      "naics": "336411"
    }
  }
  */
  
  -- Quality tracking per source
  source_quality_scores JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "defense_gov": 85,
    "fpds": 92,
    "sam_gov": 78
  }
  */
  
  -- ============================================
  -- CONSOLIDATED DATA (best value from all sources)
  -- ============================================
  
  -- Core Information
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  work_description TEXT,
  scope_of_work TEXT,
  deliverables TEXT[],
  
  -- Vendor Information
  vendor_name TEXT NOT NULL,
  vendor_city TEXT,
  vendor_state TEXT,
  vendor_country TEXT DEFAULT 'United States',
  vendor_zip TEXT,
  vendor_location_full TEXT,
  
  -- Financial Data
  award_amount NUMERIC,
  award_amount_text TEXT,
  base_contract_value NUMERIC,
  options_value NUMERIC,
  cumulative_value NUMERIC,
  obligated_amount NUMERIC,
  incremental_funding NUMERIC,
  modification_value NUMERIC,
  
  -- Contract Structure
  contract_types TEXT[],
  vehicle_type TEXT,
  is_idiq BOOLEAN DEFAULT false,
  is_multiple_award BOOLEAN DEFAULT false,
  is_hybrid_contract BOOLEAN DEFAULT false,
  has_options BOOLEAN DEFAULT false,
  
  -- Modification Details
  is_modification BOOLEAN DEFAULT false,
  is_option_exercise BOOLEAN DEFAULT false,
  modification_type TEXT,
  
  -- Competition & Award
  is_competed BOOLEAN,
  competition_type TEXT,
  number_of_offers INTEGER,
  non_compete_authority TEXT,
  non_compete_justification TEXT,
  
  -- Small Business
  is_small_business BOOLEAN DEFAULT false,
  is_small_business_set_aside BOOLEAN DEFAULT false,
  set_aside_type TEXT,
  socioeconomic_programs TEXT[],
  
  -- Special Programs
  is_sbir BOOLEAN DEFAULT false,
  is_sttr BOOLEAN DEFAULT false,
  sbir_phase TEXT,
  sbir_topic_number TEXT,
  is_fms BOOLEAN DEFAULT false,
  fms_countries TEXT[],
  fms_amount NUMERIC,
  fms_percentage NUMERIC,
  
  -- Agency & Customer
  customer_department TEXT,
  customer_agency TEXT,
  customer_sub_agency TEXT,
  customer_office TEXT,
  contracting_activity TEXT,
  contracting_office TEXT,
  major_command TEXT,
  program_office TEXT,
  
  -- Performance Locations
  performance_locations TEXT[],
  performance_city TEXT,
  performance_state TEXT,
  performance_country TEXT,
  is_conus BOOLEAN,
  is_oconus BOOLEAN,
  
  -- Funding
  fiscal_year INTEGER,
  funding_type TEXT,
  funds_expire BOOLEAN DEFAULT false,
  funds_expire_date DATE,
  
  -- Timeline
  status TEXT,
  opportunity_type TEXT,
  publication_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  completion_date DATE,
  period_of_performance_start DATE,
  period_of_performance_end DATE,
  ordering_period_end DATE,
  
  -- Classification
  naics_codes TEXT[],
  primary_naics TEXT,
  psc_codes TEXT[],
  primary_psc TEXT,
  
  -- Teaming & Subcontracting
  is_teaming BOOLEAN DEFAULT false,
  prime_contractor TEXT,
  subcontractors TEXT[],
  team_members TEXT[],
  has_subcontracting_plan BOOLEAN DEFAULT false,
  subcontracting_goal NUMERIC,
  
  -- Weapon Systems & Programs
  weapon_systems TEXT[],
  platforms TEXT[],
  program_names TEXT[],
  
  -- Auto-Categorization (enriched by scraper)
  domain_category TEXT,
  industry_tags TEXT[],
  technology_tags TEXT[],
  service_tags TEXT[],
  keywords TEXT[],
  
  -- Quality & Confidence
  data_quality_score INTEGER DEFAULT 0, -- Overall score (0-100)
  parsing_confidence NUMERIC DEFAULT 0, -- 0-1
  completeness_score INTEGER DEFAULT 0, -- How many fields are filled
  
  -- LLM Fields
  llm_summary TEXT,
  llm_analysis TEXT,
  llm_key_insights TEXT[],
  embedding vector(1536),
  
  -- URLs & References
  source_urls TEXT[], -- All URLs where this appears
  primary_url TEXT -- Best/most authoritative URL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Matching keys (critical for consolidation)
CREATE INDEX idx_opp_contract_number ON opportunities(contract_number) WHERE contract_number IS NOT NULL;
CREATE INDEX idx_opp_solicitation_number ON opportunities(solicitation_number) WHERE solicitation_number IS NOT NULL;
CREATE INDEX idx_opp_vendor_name ON opportunities(vendor_name);

-- Source tracking
CREATE INDEX idx_opp_sources ON opportunities USING gin(sources);
CREATE INDEX idx_opp_source_count ON opportunities(source_count);
CREATE INDEX idx_opp_primary_source ON opportunities(primary_source);

-- Common filters
CREATE INDEX idx_opp_customer_agency ON opportunities(customer_agency);
CREATE INDEX idx_opp_status ON opportunities(status);
CREATE INDEX idx_opp_opportunity_type ON opportunities(opportunity_type);
CREATE INDEX idx_opp_fiscal_year ON opportunities(fiscal_year);
CREATE INDEX idx_opp_award_date ON opportunities(award_date DESC);

-- Financial
CREATE INDEX idx_opp_award_amount ON opportunities(award_amount DESC) WHERE award_amount IS NOT NULL;
CREATE INDEX idx_opp_set_aside_type ON opportunities(set_aside_type) WHERE set_aside_type IS NOT NULL;

-- Arrays
CREATE INDEX idx_opp_industry_tags ON opportunities USING gin(industry_tags);
CREATE INDEX idx_opp_technology_tags ON opportunities USING gin(technology_tags);
CREATE INDEX idx_opp_keywords ON opportunities USING gin(keywords);

-- Text search
CREATE INDEX idx_opp_title_trgm ON opportunities USING gin(title gin_trgm_ops);
CREATE INDEX idx_opp_description_trgm ON opportunities USING gin(description gin_trgm_ops);

-- Quality
CREATE INDEX idx_opp_quality_score ON opportunities(data_quality_score DESC);
CREATE INDEX idx_opp_completeness ON opportunities(completeness_score DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate completeness score
CREATE OR REPLACE FUNCTION calculate_completeness(opp opportunities)
RETURNS INTEGER AS $$
DECLARE
  filled_count INTEGER := 0;
  total_count INTEGER := 50; -- Key fields to check
BEGIN
  IF opp.contract_number IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.vendor_name IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.award_amount IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.description IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.customer_agency IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.award_date IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.vendor_city IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.vendor_state IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.contract_types IS NOT NULL AND array_length(opp.contract_types, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  IF opp.competition_type IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.set_aside_type IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF opp.naics_codes IS NOT NULL AND array_length(opp.naics_codes, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  IF opp.performance_locations IS NOT NULL AND array_length(opp.performance_locations, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  IF opp.industry_tags IS NOT NULL AND array_length(opp.industry_tags, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  IF opp.technology_tags IS NOT NULL AND array_length(opp.technology_tags, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  
  RETURN (filled_count * 100 / total_count);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update timestamps and scores
CREATE OR REPLACE FUNCTION update_opportunity_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.source_count = array_length(NEW.sources, 1);
  NEW.completeness_score = calculate_completeness(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_metadata 
BEFORE INSERT OR UPDATE ON opportunities
FOR EACH ROW 
EXECUTE FUNCTION update_opportunity_metadata();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Multi-source opportunities (most valuable)
CREATE OR REPLACE VIEW opportunities_multi_source AS
SELECT *
FROM opportunities
WHERE source_count > 1
ORDER BY source_count DESC, data_quality_score DESC;

-- Latest opportunities
CREATE OR REPLACE VIEW opportunities_latest AS
SELECT *
FROM opportunities
ORDER BY first_seen_at DESC
LIMIT 100;

-- High-value contracts
CREATE OR REPLACE VIEW opportunities_high_value AS
SELECT *
FROM opportunities
WHERE award_amount > 10000000
ORDER BY award_amount DESC;

-- Open solicitations
CREATE OR REPLACE VIEW opportunities_open AS
SELECT *
FROM opportunities
WHERE status IN ('open', 'active')
AND (due_date IS NULL OR due_date > NOW())
ORDER BY due_date ASC NULLS LAST;

-- By source quality
CREATE OR REPLACE VIEW opportunities_best_quality AS
SELECT *
FROM opportunities
ORDER BY data_quality_score DESC, completeness_score DESC
LIMIT 1000;

-- ============================================
-- LLM-FRIENDLY QUERY FUNCTIONS
-- ============================================

-- Get opportunity with all source details
CREATE OR REPLACE FUNCTION get_opportunity_details(p_contract_number TEXT)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  vendor_name TEXT,
  award_amount NUMERIC,
  customer_agency TEXT,
  sources TEXT[],
  source_count INTEGER,
  field_sources JSONB,
  source_data JSONB,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.title,
    o.vendor_name,
    o.award_amount,
    o.customer_agency,
    o.sources,
    o.source_count,
    o.field_sources,
    o.source_data,
    o.description
  FROM opportunities o
  WHERE o.contract_number = p_contract_number;
END;
$$ LANGUAGE plpgsql;

-- Search opportunities (simple)
CREATE OR REPLACE FUNCTION search_opportunities(
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF opportunities AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM opportunities
  WHERE 
    title ILIKE '%' || p_query || '%'
    OR description ILIKE '%' || p_query || '%'
    OR vendor_name ILIKE '%' || p_query || '%'
    OR p_query = ANY(keywords)
  ORDER BY 
    CASE 
      WHEN title ILIKE '%' || p_query || '%' THEN 1
      WHEN vendor_name ILIKE '%' || p_query || '%' THEN 2
      ELSE 3
    END,
    data_quality_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get source contribution for a field
CREATE OR REPLACE FUNCTION get_field_source(p_id BIGINT, p_field TEXT)
RETURNS TEXT AS $$
DECLARE
  v_source TEXT;
BEGIN
  SELECT field_sources->>p_field INTO v_source
  FROM opportunities
  WHERE id = p_id;
  
  RETURN COALESCE(v_source, 'unknown');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON opportunities
  FOR SELECT USING (true);

CREATE POLICY "Service role write access" ON opportunities
  FOR ALL USING (true);

-- ============================================
-- EXAMPLE QUERIES (for documentation)
-- ============================================

/*
-- Find contract with multiple sources
SELECT 
  contract_number,
  vendor_name,
  award_amount,
  sources,
  source_count
FROM opportunities
WHERE source_count > 1;

-- See which source provided which field
SELECT 
  contract_number,
  vendor_name,
  field_sources
FROM opportunities
WHERE contract_number = 'W31P4Q-20-C-0123';

-- Get raw data from specific source
SELECT 
  contract_number,
  source_data->'defense_gov' as defense_gov_data,
  source_data->'fpds' as fpds_data
FROM opportunities
WHERE contract_number = 'W31P4Q-20-C-0123';

-- Search for AI contracts
SELECT * FROM search_opportunities('artificial intelligence', 20);

-- High-value Air Force contracts
SELECT 
  contract_number,
  vendor_name,
  award_amount,
  sources,
  source_count
FROM opportunities
WHERE customer_agency = 'Air Force'
AND award_amount > 50000000
ORDER BY award_amount DESC;

-- Contracts with best data quality
SELECT 
  contract_number,
  vendor_name,
  data_quality_score,
  completeness_score,
  source_count
FROM opportunities
WHERE data_quality_score > 90
ORDER BY completeness_score DESC;
*/

-- ============================================
-- COMPLETE!
-- ============================================

COMMENT ON TABLE opportunities IS 'Hybrid schema: ONE row per contract with field-level provenance - PropShop.ai';
COMMENT ON COLUMN opportunities.sources IS 'Array of all sources that contributed data to this opportunity';
COMMENT ON COLUMN opportunities.field_sources IS 'JSONB mapping each field to its source (e.g. {"vendor_name": "defense_gov"})';
COMMENT ON COLUMN opportunities.source_data IS 'JSONB preserving full raw data from each source for audit';
COMMENT ON COLUMN opportunities.contract_number IS 'Primary matching key for consolidating records across sources';

