-- ============================================
-- FPDS (Federal Procurement Data System) Tables
-- ============================================
-- This migration creates tables for storing ALL federal contract data
-- from the SAM.gov/FPDS API
--
-- Data Source: https://api.sam.gov (free, public domain)
-- Scale: ~3M small business contracts (5 years)
-- Updates: Daily incremental scraper
-- ============================================

-- ============================================
-- 1. Main Contracts Table
-- ============================================

CREATE TABLE IF NOT EXISTS fpds_contracts (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contract Identification
  piid TEXT NOT NULL, -- Procurement Instrument Identifier
  mod_number TEXT, -- Modification number
  transaction_number TEXT UNIQUE NOT NULL, -- Unique transaction ID
  referenced_idv_piid TEXT, -- Parent contract (for task orders)
  
  -- Dates
  date_signed DATE,
  effective_date DATE,
  current_completion_date DATE,
  ultimate_completion_date DATE,
  period_of_performance_start DATE,
  period_of_performance_end DATE,
  
  -- Financial
  base_and_exercised_options_value DECIMAL(15,2),
  base_and_all_options_value DECIMAL(15,2),
  dollars_obligated DECIMAL(15,2),
  current_total_value_of_award DECIMAL(15,2),
  
  -- Vendor
  vendor_name TEXT NOT NULL,
  vendor_duns TEXT,
  vendor_uei TEXT,
  vendor_cage_code TEXT,
  vendor_address TEXT,
  vendor_city TEXT,
  vendor_state TEXT,
  vendor_zip TEXT,
  vendor_country TEXT DEFAULT 'USA',
  parent_company_name TEXT,
  parent_duns TEXT,
  parent_uei TEXT,
  
  -- Socioeconomic Flags
  small_business BOOLEAN DEFAULT false,
  woman_owned_small_business BOOLEAN DEFAULT false,
  veteran_owned_small_business BOOLEAN DEFAULT false,
  service_disabled_veteran_owned BOOLEAN DEFAULT false,
  hubzone_small_business BOOLEAN DEFAULT false,
  eight_a_program_participant BOOLEAN DEFAULT false,
  historically_black_college BOOLEAN DEFAULT false,
  
  -- Classification
  naics_code TEXT,
  naics_description TEXT,
  psc_code TEXT,
  psc_description TEXT,
  contract_type TEXT,
  type_of_contract_pricing TEXT,
  
  -- Agency
  contracting_agency_name TEXT,
  contracting_agency_id TEXT,
  funding_agency_name TEXT,
  funding_agency_id TEXT,
  contracting_office_name TEXT,
  contracting_office_id TEXT,
  
  -- Competition
  extent_competed TEXT,
  number_of_offers_received INTEGER,
  solicitation_id TEXT,
  type_of_set_aside TEXT,
  fair_opportunity_limited_sources TEXT,
  
  -- Work Details
  description_of_requirement TEXT,
  place_of_performance_city TEXT,
  place_of_performance_state TEXT,
  place_of_performance_country TEXT,
  place_of_performance_zip TEXT,
  place_of_performance_congressional_district TEXT,
  
  -- SBIR/R&D Specific
  is_research BOOLEAN DEFAULT false,
  research_type TEXT,
  sbir_phase TEXT,
  sbir_program TEXT,
  sbir_topic_number TEXT, -- Link to sbir_final table
  
  -- Additional Details
  contract_award_unique_key TEXT,
  award_id_piid TEXT,
  parent_award_id_piid TEXT,
  
  -- Metadata
  data_source TEXT DEFAULT 'fpds-sam.gov',
  fiscal_year INTEGER,
  calendar_year INTEGER,
  last_modified_date TIMESTAMP WITH TIME ZONE,
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Company Performance Aggregations
-- ============================================

CREATE TABLE IF NOT EXISTS fpds_company_stats (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT UNIQUE NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  
  -- Contract Statistics
  total_contracts INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  -- SBIR Specific
  sbir_contracts INTEGER DEFAULT 0,
  sbir_value DECIMAL(15,2) DEFAULT 0,
  phase_1_contracts INTEGER DEFAULT 0,
  phase_2_contracts INTEGER DEFAULT 0,
  phase_3_contracts INTEGER DEFAULT 0,
  
  -- By Agency
  dod_contracts INTEGER DEFAULT 0,
  dod_value DECIMAL(15,2) DEFAULT 0,
  nasa_contracts INTEGER DEFAULT 0,
  nasa_value DECIMAL(15,2) DEFAULT 0,
  dhs_contracts INTEGER DEFAULT 0,
  dhs_value DECIMAL(15,2) DEFAULT 0,
  
  -- Timeline
  first_contract_date DATE,
  most_recent_contract_date DATE,
  years_active INTEGER,
  
  -- Patterns
  top_naics_codes TEXT[],
  top_psc_codes TEXT[],
  top_agencies TEXT[],
  primary_place_of_performance_state TEXT,
  
  -- Socioeconomic
  small_business BOOLEAN,
  woman_owned BOOLEAN,
  veteran_owned BOOLEAN,
  service_disabled_veteran BOOLEAN,
  hubzone BOOLEAN,
  eight_a BOOLEAN,
  
  -- Success Metrics
  avg_contract_value DECIMAL(15,2),
  median_contract_value DECIMAL(15,2),
  largest_contract_value DECIMAL(15,2),
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. NAICS Industry Aggregations
-- ============================================

CREATE TABLE IF NOT EXISTS fpds_naics_stats (
  id BIGSERIAL PRIMARY KEY,
  naics_code TEXT UNIQUE NOT NULL,
  naics_description TEXT,
  
  -- Volume
  total_contracts INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  unique_vendors INTEGER DEFAULT 0,
  
  -- Patterns
  top_agencies TEXT[],
  top_companies TEXT[],
  top_states TEXT[],
  
  -- Financial
  avg_contract_value DECIMAL(15,2),
  median_contract_value DECIMAL(15,2),
  total_obligated DECIMAL(15,2),
  
  -- Set-Asides
  small_business_contracts INTEGER DEFAULT 0,
  woman_owned_contracts INTEGER DEFAULT 0,
  eight_a_contracts INTEGER DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. PSC (Product/Service Code) Aggregations
-- ============================================

CREATE TABLE IF NOT EXISTS fpds_psc_stats (
  id BIGSERIAL PRIMARY KEY,
  psc_code TEXT UNIQUE NOT NULL,
  psc_description TEXT,
  
  total_contracts INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  
  top_agencies TEXT[],
  top_companies TEXT[],
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Agency Spending Aggregations
-- ============================================

CREATE TABLE IF NOT EXISTS fpds_agency_stats (
  id BIGSERIAL PRIMARY KEY,
  agency_id TEXT UNIQUE NOT NULL,
  agency_name TEXT,
  
  total_contracts INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  
  small_business_contracts INTEGER DEFAULT 0,
  small_business_value DECIMAL(15,2) DEFAULT 0,
  
  sbir_contracts INTEGER DEFAULT 0,
  sbir_value DECIMAL(15,2) DEFAULT 0,
  
  top_naics TEXT[],
  top_vendors TEXT[],
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. Scraper Log
-- ============================================

CREATE TABLE IF NOT EXISTS fpds_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'bulk_historical', 'daily_update', 'agency_specific'
  fiscal_year INTEGER,
  agency_id TEXT,
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Contract Identifiers
CREATE INDEX IF NOT EXISTS idx_fpds_piid ON fpds_contracts(piid);
CREATE INDEX IF NOT EXISTS idx_fpds_transaction_number ON fpds_contracts(transaction_number);
CREATE INDEX IF NOT EXISTS idx_fpds_solicitation_id ON fpds_contracts(solicitation_id);

-- Vendor
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_name ON fpds_contracts(vendor_name);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_uei ON fpds_contracts(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_duns ON fpds_contracts(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_state ON fpds_contracts(vendor_state);

-- Classification
CREATE INDEX IF NOT EXISTS idx_fpds_naics ON fpds_contracts(naics_code);
CREATE INDEX IF NOT EXISTS idx_fpds_psc ON fpds_contracts(psc_code);

-- Agency & Dates
CREATE INDEX IF NOT EXISTS idx_fpds_contracting_agency ON fpds_contracts(contracting_agency_id);
CREATE INDEX IF NOT EXISTS idx_fpds_funding_agency ON fpds_contracts(funding_agency_id);
CREATE INDEX IF NOT EXISTS idx_fpds_date_signed ON fpds_contracts(date_signed);
CREATE INDEX IF NOT EXISTS idx_fpds_fiscal_year ON fpds_contracts(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_fpds_calendar_year ON fpds_contracts(calendar_year);

-- Socioeconomic
CREATE INDEX IF NOT EXISTS idx_fpds_small_business ON fpds_contracts(small_business) WHERE small_business = true;
CREATE INDEX IF NOT EXISTS idx_fpds_woman_owned ON fpds_contracts(woman_owned_small_business) WHERE woman_owned_small_business = true;
CREATE INDEX IF NOT EXISTS idx_fpds_veteran_owned ON fpds_contracts(veteran_owned_small_business) WHERE veteran_owned_small_business = true;
CREATE INDEX IF NOT EXISTS idx_fpds_hubzone ON fpds_contracts(hubzone_small_business) WHERE hubzone_small_business = true;
CREATE INDEX IF NOT EXISTS idx_fpds_8a ON fpds_contracts(eight_a_program_participant) WHERE eight_a_program_participant = true;

-- SBIR
CREATE INDEX IF NOT EXISTS idx_fpds_sbir_phase ON fpds_contracts(sbir_phase) WHERE sbir_phase IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fpds_sbir_topic ON fpds_contracts(sbir_topic_number) WHERE sbir_topic_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fpds_is_research ON fpds_contracts(is_research) WHERE is_research = true;

-- Full-text search on description
CREATE INDEX IF NOT EXISTS idx_fpds_description_fts ON fpds_contracts USING GIN (to_tsvector('english', description_of_requirement));

-- Company stats indexes
CREATE INDEX IF NOT EXISTS idx_fpds_company_uei ON fpds_company_stats(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_fpds_company_duns ON fpds_company_stats(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_fpds_company_total_value ON fpds_company_stats(total_value DESC);
CREATE INDEX IF NOT EXISTS idx_fpds_company_small_business ON fpds_company_stats(small_business) WHERE small_business = true;

-- ============================================
-- VIEWS for Common Queries
-- ============================================

-- View: Small Business Contracts Only
CREATE OR REPLACE VIEW fpds_small_business_contracts AS
SELECT * FROM fpds_contracts
WHERE small_business = true;

-- View: SBIR/STTR Contracts Only
CREATE OR REPLACE VIEW fpds_sbir_contracts AS
SELECT * FROM fpds_contracts
WHERE sbir_phase IS NOT NULL;

-- View: Recent Contracts (Last 2 Years)
CREATE OR REPLACE VIEW fpds_recent_contracts AS
SELECT * FROM fpds_contracts
WHERE fiscal_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2;

-- View: Combined SBIR Awards (SBIR.gov + FPDS)
CREATE OR REPLACE VIEW combined_sbir_awards AS
SELECT 
  'SBIR.gov' as source,
  contract_award_number as contract_id,
  company,
  award_amount as contract_value,
  award_year as year,
  phase,
  agency,
  topic_number,
  NULL as naics_code,
  NULL as psc_code
FROM sbir_awards
UNION ALL
SELECT 
  'FPDS' as source,
  piid as contract_id,
  vendor_name as company,
  base_and_exercised_options_value as contract_value,
  fiscal_year as year,
  sbir_phase as phase,
  contracting_agency_name as agency,
  sbir_topic_number as topic_number,
  naics_code,
  psc_code
FROM fpds_contracts
WHERE sbir_phase IS NOT NULL;

-- View: Company Complete History (All Contracts)
CREATE OR REPLACE VIEW company_complete_history AS
SELECT 
  vendor_name as company,
  vendor_uei,
  COUNT(*) as total_contracts,
  SUM(base_and_exercised_options_value) as total_value,
  MIN(date_signed) as first_contract,
  MAX(date_signed) as most_recent_contract,
  ARRAY_AGG(DISTINCT contracting_agency_name) as agencies,
  ARRAY_AGG(DISTINCT naics_code) FILTER (WHERE naics_code IS NOT NULL) as naics_codes
FROM fpds_contracts
GROUP BY vendor_name, vendor_uei;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FPDS Tables Created Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - fpds_contracts (main contracts table)';
  RAISE NOTICE '  - fpds_company_stats (company aggregations)';
  RAISE NOTICE '  - fpds_naics_stats (industry aggregations)';
  RAISE NOTICE '  - fpds_psc_stats (product/service aggregations)';
  RAISE NOTICE '  - fpds_agency_stats (agency spending)';
  RAISE NOTICE '  - fpds_scraper_log (operations log)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  - fpds_small_business_contracts';
  RAISE NOTICE '  - fpds_sbir_contracts';
  RAISE NOTICE '  - fpds_recent_contracts';
  RAISE NOTICE '  - combined_sbir_awards';
  RAISE NOTICE '  - company_complete_history';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Register for SAM.gov API key';
  RAISE NOTICE '  2. Build FPDS scraper service';
  RAISE NOTICE '  3. Test with pilot data (single agency/year)';
  RAISE NOTICE '  4. Run bulk historical load';
  RAISE NOTICE '  5. Set up daily incremental scraper';
  RAISE NOTICE '============================================';
END $$;

