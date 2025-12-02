-- ============================================
-- PROPSHOP.AI - SIMPLE ENRICHED SCHEMA
-- ============================================
-- ONE table with ALL enriched data
-- Each source = one row
-- Easy filtering by contract number
-- LLM-friendly flat structure
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- SINGLE ENRICHED OPPORTUNITIES TABLE
-- All data sources, fully enriched, one row per source
-- ============================================

CREATE TABLE IF NOT EXISTS opportunities (
  -- Identity
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source Tracking (which scraper/source created this row)
  source_name TEXT NOT NULL, -- 'defense_gov', 'fpds', 'sam_gov', 'sbir', etc.
  source_url TEXT,
  source_id TEXT, -- Original ID from source system
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core Identifiers (for matching across sources)
  contract_number TEXT, -- Primary matching key
  solicitation_number TEXT,
  notice_id TEXT,
  award_id TEXT,
  modification_number TEXT,
  parent_contract_number TEXT,
  cage_code TEXT,
  duns_number TEXT,
  uei_number TEXT,
  
  -- Vendor Information (fully enriched)
  vendor_name TEXT NOT NULL,
  vendor_city TEXT,
  vendor_state TEXT,
  vendor_country TEXT DEFAULT 'United States',
  vendor_zip TEXT,
  vendor_location_full TEXT, -- "San Diego, California"
  
  -- Contract Details (fully enriched)
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  work_description TEXT,
  scope_of_work TEXT,
  deliverables TEXT[],
  
  -- Financial Data (fully enriched)
  award_amount NUMERIC,
  award_amount_text TEXT, -- "$1.5 million"
  base_contract_value NUMERIC,
  options_value NUMERIC,
  cumulative_value NUMERIC,
  obligated_amount NUMERIC,
  incremental_funding NUMERIC,
  modification_value NUMERIC,
  
  -- Contract Structure (fully enriched)
  contract_types TEXT[], -- ['firm-fixed-price', 'IDIQ']
  vehicle_type TEXT, -- 'IDIQ', 'BPA', 'Single Award', etc.
  is_idiq BOOLEAN DEFAULT false,
  is_multiple_award BOOLEAN DEFAULT false,
  is_hybrid_contract BOOLEAN DEFAULT false,
  has_options BOOLEAN DEFAULT false,
  
  -- Modification Details (fully enriched)
  is_modification BOOLEAN DEFAULT false,
  is_option_exercise BOOLEAN DEFAULT false,
  modification_type TEXT,
  
  -- Competition & Award (fully enriched)
  is_competed BOOLEAN,
  competition_type TEXT, -- 'full and open', 'sole source', 'limited'
  number_of_offers INTEGER,
  non_compete_authority TEXT,
  non_compete_justification TEXT,
  
  -- Small Business (fully enriched)
  is_small_business BOOLEAN DEFAULT false,
  is_small_business_set_aside BOOLEAN DEFAULT false,
  set_aside_type TEXT, -- '8(a)', 'HUBZone', 'SDVOSB', etc.
  socioeconomic_programs TEXT[],
  
  -- Special Programs (fully enriched)
  is_sbir BOOLEAN DEFAULT false,
  is_sttr BOOLEAN DEFAULT false,
  sbir_phase TEXT,
  sbir_topic_number TEXT,
  is_fms BOOLEAN DEFAULT false,
  fms_countries TEXT[],
  fms_amount NUMERIC,
  fms_percentage NUMERIC,
  
  -- Agency & Customer (fully enriched)
  customer_department TEXT, -- 'Department of Defense'
  customer_agency TEXT, -- 'Air Force', 'Navy', 'Army'
  customer_sub_agency TEXT,
  customer_office TEXT,
  contracting_activity TEXT,
  contracting_office TEXT,
  major_command TEXT,
  program_office TEXT,
  
  -- Performance Locations (fully enriched)
  performance_locations TEXT[], -- ['San Diego, CA', 'Arlington, VA']
  performance_city TEXT,
  performance_state TEXT,
  performance_country TEXT,
  is_conus BOOLEAN,
  is_oconus BOOLEAN,
  
  -- Funding (fully enriched)
  fiscal_year INTEGER,
  funding_type TEXT, -- 'O&M', 'RDT&E', 'Procurement'
  funds_expire BOOLEAN DEFAULT false,
  funds_expire_date DATE,
  
  -- Timeline (fully enriched)
  status TEXT, -- 'open', 'awarded', 'closed', 'modified'
  opportunity_type TEXT, -- 'award', 'solicitation', 'modification', 'sbir', 'grant'
  publication_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  completion_date DATE,
  period_of_performance_start DATE,
  period_of_performance_end DATE,
  ordering_period_end DATE,
  
  -- Classification (fully enriched)
  naics_codes TEXT[],
  primary_naics TEXT,
  psc_codes TEXT[],
  primary_psc TEXT,
  
  -- Teaming & Subcontracting (fully enriched)
  is_teaming BOOLEAN DEFAULT false,
  prime_contractor TEXT,
  subcontractors TEXT[],
  team_members TEXT[],
  has_subcontracting_plan BOOLEAN DEFAULT false,
  subcontracting_goal NUMERIC,
  
  -- Weapon Systems & Programs (fully enriched)
  weapon_systems TEXT[], -- ['F-35', 'B-21']
  platforms TEXT[], -- ['Abrams', 'Patriot']
  program_names TEXT[],
  
  -- Auto-Categorization (fully enriched by scraper)
  domain_category TEXT, -- 'Aerospace & Defense', 'Cybersecurity', etc.
  industry_tags TEXT[], -- ['Aerospace & Defense', 'IT Services']
  technology_tags TEXT[], -- ['Artificial Intelligence', 'Cloud Computing']
  service_tags TEXT[], -- ['Engineering Services', 'Maintenance & Repair']
  keywords TEXT[],
  
  -- Quality & Metadata (fully enriched)
  data_quality_score INTEGER DEFAULT 0, -- 0-100
  parsing_confidence NUMERIC DEFAULT 0, -- 0-1
  extraction_method TEXT, -- 'comprehensive_regex_nlp'
  
  -- LLM Fields (can be added later)
  llm_summary TEXT,
  llm_analysis TEXT,
  llm_key_insights TEXT[],
  embedding vector(1536), -- For semantic search
  
  -- Raw Data (for audit/reprocessing)
  raw_text TEXT,
  raw_data JSONB
);

-- ============================================
-- INDEXES FOR FAST QUERIES
-- ============================================

-- Primary matching fields (for finding duplicates across sources)
CREATE INDEX idx_opportunities_contract_number ON opportunities(contract_number) WHERE contract_number IS NOT NULL;
CREATE INDEX idx_opportunities_vendor_name ON opportunities(vendor_name);
CREATE INDEX idx_opportunities_award_date ON opportunities(award_date DESC);

-- Source tracking
CREATE INDEX idx_opportunities_source_name ON opportunities(source_name);
CREATE INDEX idx_opportunities_scraped_at ON opportunities(scraped_at DESC);

-- Common filters
CREATE INDEX idx_opportunities_customer_agency ON opportunities(customer_agency);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_opportunity_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_fiscal_year ON opportunities(fiscal_year);

-- Financial filters
CREATE INDEX idx_opportunities_award_amount ON opportunities(award_amount DESC) WHERE award_amount IS NOT NULL;
CREATE INDEX idx_opportunities_set_aside_type ON opportunities(set_aside_type) WHERE set_aside_type IS NOT NULL;

-- Arrays (for filtering by tags)
CREATE INDEX idx_opportunities_industry_tags ON opportunities USING gin(industry_tags);
CREATE INDEX idx_opportunities_technology_tags ON opportunities USING gin(technology_tags);
CREATE INDEX idx_opportunities_keywords ON opportunities USING gin(keywords);

-- Text search
CREATE INDEX idx_opportunities_title_trgm ON opportunities USING gin(title gin_trgm_ops);
CREATE INDEX idx_opportunities_description_trgm ON opportunities USING gin(description gin_trgm_ops);

-- Quality filtering
CREATE INDEX idx_opportunities_quality_score ON opportunities(data_quality_score DESC);

-- ============================================
-- AUTO-UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER opportunities_updated_at 
BEFORE UPDATE ON opportunities
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Group by contract number (see all sources for same contract)
CREATE OR REPLACE VIEW opportunities_by_contract AS
SELECT 
    contract_number,
    COUNT(*) as source_count,
    ARRAY_AGG(DISTINCT source_name) as sources,
    MAX(award_amount) as max_award_amount,
    MAX(data_quality_score) as best_quality_score,
    MIN(scraped_at) as first_seen,
    MAX(scraped_at) as last_seen,
    ARRAY_AGG(DISTINCT vendor_name) as vendors
FROM opportunities
WHERE contract_number IS NOT NULL
GROUP BY contract_number;

-- Latest opportunities (for homepage/dashboard)
CREATE OR REPLACE VIEW opportunities_latest AS
SELECT *
FROM opportunities
ORDER BY scraped_at DESC
LIMIT 100;

-- High-value opportunities
CREATE OR REPLACE VIEW opportunities_high_value AS
SELECT *
FROM opportunities
WHERE award_amount > 10000000 -- $10M+
ORDER BY award_amount DESC;

-- Open solicitations
CREATE OR REPLACE VIEW opportunities_open AS
SELECT *
FROM opportunities
WHERE status = 'open'
AND due_date > NOW()
ORDER BY due_date ASC;

-- ============================================
-- HELPER FUNCTIONS FOR LLM QUERIES
-- ============================================

-- Find all sources for a contract number
CREATE OR REPLACE FUNCTION get_contract_sources(p_contract_number TEXT)
RETURNS TABLE (
    source_name TEXT,
    vendor_name TEXT,
    award_amount NUMERIC,
    scraped_at TIMESTAMPTZ,
    data_quality_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.source_name,
        o.vendor_name,
        o.award_amount,
        o.scraped_at,
        o.data_quality_score
    FROM opportunities o
    WHERE o.contract_number = p_contract_number
    ORDER BY o.data_quality_score DESC, o.scraped_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Search opportunities (simple text search)
CREATE OR REPLACE FUNCTION search_opportunities(
    p_query TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    vendor_name TEXT,
    award_amount NUMERIC,
    customer_agency TEXT,
    source_name TEXT,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        o.vendor_name,
        o.award_amount,
        o.customer_agency,
        o.source_name,
        GREATEST(
            similarity(o.title, p_query),
            similarity(COALESCE(o.description, ''), p_query),
            similarity(o.vendor_name, p_query)
        ) as similarity
    FROM opportunities o
    WHERE 
        o.title ILIKE '%' || p_query || '%'
        OR o.description ILIKE '%' || p_query || '%'
        OR o.vendor_name ILIKE '%' || p_query || '%'
    ORDER BY similarity DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================

-- Public read access for now
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON opportunities
    FOR SELECT USING (true);

-- Admin insert/update (add auth later)
CREATE POLICY "Admin write access" ON opportunities
    FOR ALL USING (true);

-- ============================================
-- SAMPLE QUERY EXAMPLES (Comments)
-- ============================================

-- Find all sources for a specific contract:
-- SELECT * FROM opportunities WHERE contract_number = 'W31P4Q-20-C-0123';

-- Find contracts with multiple sources:
-- SELECT * FROM opportunities_by_contract WHERE source_count > 1;

-- Search for AI contracts:
-- SELECT * FROM opportunities WHERE 'Artificial Intelligence' = ANY(technology_tags);

-- High-value Air Force contracts:
-- SELECT * FROM opportunities 
-- WHERE customer_agency = 'Air Force' 
-- AND award_amount > 50000000 
-- ORDER BY award_amount DESC;

-- Recent SBIR awards:
-- SELECT * FROM opportunities 
-- WHERE is_sbir = true 
-- AND award_date > NOW() - INTERVAL '90 days';

-- Contracts by vendor:
-- SELECT vendor_name, COUNT(*), SUM(award_amount) 
-- FROM opportunities 
-- WHERE vendor_name ILIKE '%lockheed%'
-- GROUP BY vendor_name;

-- ============================================
-- COMPLETE!
-- ============================================

COMMENT ON TABLE opportunities IS 'Single enriched table with all opportunities from all sources - PropShop.ai';
COMMENT ON COLUMN opportunities.contract_number IS 'Primary key for matching records across sources';
COMMENT ON COLUMN opportunities.source_name IS 'Which scraper/source created this record';
COMMENT ON COLUMN opportunities.data_quality_score IS 'Automated quality score (0-100) based on field completeness';

