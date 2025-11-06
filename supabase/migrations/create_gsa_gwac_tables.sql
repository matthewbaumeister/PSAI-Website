-- ============================================
-- GSA SCHEDULES & GWAC HOLDERS TABLES
-- ============================================
-- This migration creates tables for storing GSA Multiple Award Schedule (MAS)
-- contract holders and Government-Wide Acquisition Contract (GWAC) holders
--
-- Data Sources:
-- 1. GSA eLibrary (https://www.gsaelibrary.gsa.gov)
-- 2. NITAAC GWAC Directories (https://nitaac.nih.gov)
-- 3. GSA GWAC websites (Alliant 2, OASIS, 8(a) STARS, etc.)
--
-- Benefits:
-- - Pre-qualified vendor lists before they win contracts
-- - Identify companies positioned to bid on work
-- - Track pricing per FTE and service offerings
-- - Supplement FPDS contract data
-- ============================================

-- ============================================
-- TABLE 1: gsa_schedule_holders
-- ============================================
-- Stores companies on GSA Multiple Award Schedule (MAS)

CREATE TABLE IF NOT EXISTS gsa_schedule_holders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contract Information
  contract_number TEXT NOT NULL, -- e.g., "47QRAA21D0001"
  schedule_number TEXT, -- e.g., "MAS", "70", "84", etc.
  sin_codes TEXT[], -- Special Item Numbers
  primary_sin TEXT,
  
  -- Company Information
  company_name TEXT NOT NULL,
  vendor_duns TEXT,
  vendor_uei TEXT,
  vendor_cage_code TEXT,
  
  -- Address
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_country TEXT DEFAULT 'USA',
  
  -- Contact
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  primary_contact_email TEXT,
  website TEXT,
  
  -- Contract Dates
  contract_start_date DATE,
  contract_expiration_date DATE,
  option_years INTEGER,
  is_active BOOLEAN DEFAULT true,
  
  -- Business Classification
  small_business BOOLEAN DEFAULT false,
  woman_owned BOOLEAN DEFAULT false,
  veteran_owned BOOLEAN DEFAULT false,
  service_disabled_veteran_owned BOOLEAN DEFAULT false,
  hubzone BOOLEAN DEFAULT false,
  eight_a_program BOOLEAN DEFAULT false,
  
  -- Services & Pricing (stored as JSONB for flexibility)
  service_offerings JSONB, -- Array of services offered
  pricing_data JSONB, -- Pricing per FTE, hourly rates, etc.
  labor_categories JSONB, -- Labor categories and rates
  
  -- Geographic Coverage
  geographic_scope TEXT, -- 'National', 'Regional', specific states
  states_served TEXT[],
  
  -- NAICS Codes
  naics_codes TEXT[],
  primary_naics TEXT,
  
  -- Performance Metrics (if available)
  total_sales_reported DECIMAL(15,2),
  industrial_funding_fee_paid DECIMAL(15,2),
  
  -- Metadata
  data_source TEXT DEFAULT 'gsa_elibrary', -- 'gsa_elibrary', 'gsa_advantage', 'manual'
  source_url TEXT,
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicates
  UNIQUE(contract_number, company_name)
);

-- ============================================
-- TABLE 2: gwac_holders
-- ============================================
-- Stores companies holding Government-Wide Acquisition Contracts

CREATE TABLE IF NOT EXISTS gwac_holders (
  id BIGSERIAL PRIMARY KEY,
  
  -- GWAC Information
  gwac_name TEXT NOT NULL, -- e.g., "Alliant 2", "OASIS", "8(a) STARS III", "CIO-SP3"
  gwac_type TEXT, -- 'IT', 'Professional Services', 'Engineering', etc.
  managing_agency TEXT, -- 'GSA', 'NITAAC', 'NASA', etc.
  
  -- Contract Information
  contract_number TEXT NOT NULL,
  task_order_ceiling DECIMAL(15,2), -- Max task order value
  ordering_period_start DATE,
  ordering_period_end DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Company Information
  company_name TEXT NOT NULL,
  vendor_duns TEXT,
  vendor_uei TEXT,
  vendor_cage_code TEXT,
  
  -- Address
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_country TEXT DEFAULT 'USA',
  
  -- Contact
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  primary_contact_email TEXT,
  website TEXT,
  gwac_program_manager TEXT,
  gwac_pm_email TEXT,
  gwac_pm_phone TEXT,
  
  -- Business Classification
  small_business BOOLEAN DEFAULT false,
  woman_owned BOOLEAN DEFAULT false,
  veteran_owned BOOLEAN DEFAULT false,
  service_disabled_veteran_owned BOOLEAN DEFAULT false,
  hubzone BOOLEAN DEFAULT false,
  eight_a_program BOOLEAN DEFAULT false,
  
  -- Capabilities (stored as JSONB)
  core_competencies JSONB, -- Array of capability areas
  technical_areas JSONB, -- Technical specializations
  labor_categories JSONB, -- Available labor categories
  pricing_data JSONB, -- Pricing information if available
  
  -- Geographic Coverage
  geographic_scope TEXT,
  states_served TEXT[],
  
  -- NAICS Codes
  naics_codes TEXT[],
  primary_naics TEXT,
  
  -- Performance Data
  total_task_orders_awarded INTEGER DEFAULT 0,
  total_task_order_value DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  data_source TEXT DEFAULT 'gwac_website', -- 'nitaac', 'gsa', 'nasa', 'manual'
  source_url TEXT,
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicates
  UNIQUE(gwac_name, contract_number, company_name)
);

-- ============================================
-- TABLE 3: gsa_sin_catalog
-- ============================================
-- Reference table for Special Item Numbers (SINs)

CREATE TABLE IF NOT EXISTS gsa_sin_catalog (
  id BIGSERIAL PRIMARY KEY,
  
  sin_code TEXT UNIQUE NOT NULL, -- e.g., "54151S", "541519ICAM"
  sin_name TEXT NOT NULL,
  sin_description TEXT,
  schedule_number TEXT, -- Parent schedule
  
  category TEXT, -- High-level category
  subcategory TEXT,
  
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  expiration_date DATE,
  
  -- Statistics
  total_contractors INTEGER DEFAULT 0,
  last_contractor_count_update TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 4: gwac_catalog
-- ============================================
-- Reference table for all GWACs

CREATE TABLE IF NOT EXISTS gwac_catalog (
  id BIGSERIAL PRIMARY KEY,
  
  gwac_name TEXT UNIQUE NOT NULL, -- Official GWAC name
  gwac_acronym TEXT, -- Short name/acronym
  gwac_type TEXT, -- 'IT', 'Professional Services', etc.
  managing_agency TEXT, -- 'GSA', 'NITAAC', 'NASA', etc.
  
  description TEXT,
  purpose TEXT,
  scope_of_work TEXT,
  
  -- Contract Details
  ordering_period_start DATE,
  ordering_period_end DATE,
  total_program_ceiling DECIMAL(15,2), -- Total ceiling for all holders
  is_active BOOLEAN DEFAULT true,
  
  -- Holder Information
  total_holders INTEGER DEFAULT 0,
  small_business_holders INTEGER DEFAULT 0,
  large_business_holders INTEGER DEFAULT 0,
  
  -- Website & Resources
  website_url TEXT,
  holder_directory_url TEXT,
  ordering_guide_url TEXT,
  
  -- Statistics
  total_task_orders_issued INTEGER DEFAULT 0,
  total_task_order_value DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  last_holder_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 5: gsa_gwac_scraper_log
-- ============================================
-- Track scraping operations for GSA/GWAC data

CREATE TABLE IF NOT EXISTS gsa_gwac_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  scrape_type TEXT NOT NULL, -- 'gsa_schedule', 'gwac', 'sin_specific', 'gwac_specific'
  target TEXT, -- Specific SIN, GWAC name, or 'all'
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'partial'
  error_message TEXT,
  error_details JSONB,
  
  -- File tracking (if downloaded files)
  files_downloaded INTEGER DEFAULT 0,
  file_paths TEXT[],
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- GSA Schedule Holders indexes
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_company_name ON gsa_schedule_holders(company_name);
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_uei ON gsa_schedule_holders(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_duns ON gsa_schedule_holders(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_contract_number ON gsa_schedule_holders(contract_number);
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_sin_codes ON gsa_schedule_holders USING GIN(sin_codes);
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_state ON gsa_schedule_holders(company_state);
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_active ON gsa_schedule_holders(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gsa_schedule_small_business ON gsa_schedule_holders(small_business) WHERE small_business = true;

-- GWAC Holders indexes
CREATE INDEX IF NOT EXISTS idx_gwac_holders_company_name ON gwac_holders(company_name);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_uei ON gwac_holders(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_duns ON gwac_holders(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_gwac_name ON gwac_holders(gwac_name);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_contract_number ON gwac_holders(contract_number);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_state ON gwac_holders(company_state);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_active ON gwac_holders(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gwac_holders_small_business ON gwac_holders(small_business) WHERE small_business = true;

-- SIN Catalog indexes
CREATE INDEX IF NOT EXISTS idx_sin_catalog_sin_code ON gsa_sin_catalog(sin_code);
CREATE INDEX IF NOT EXISTS idx_sin_catalog_schedule ON gsa_sin_catalog(schedule_number);
CREATE INDEX IF NOT EXISTS idx_sin_catalog_active ON gsa_sin_catalog(is_active) WHERE is_active = true;

-- GWAC Catalog indexes
CREATE INDEX IF NOT EXISTS idx_gwac_catalog_name ON gwac_catalog(gwac_name);
CREATE INDEX IF NOT EXISTS idx_gwac_catalog_agency ON gwac_catalog(managing_agency);
CREATE INDEX IF NOT EXISTS idx_gwac_catalog_active ON gwac_catalog(is_active) WHERE is_active = true;

-- ============================================
-- VIEWS for Common Queries
-- ============================================

-- View: Active GSA Schedule Holders
CREATE OR REPLACE VIEW active_gsa_schedule_holders AS
SELECT * FROM gsa_schedule_holders
WHERE is_active = true
  AND (contract_expiration_date IS NULL OR contract_expiration_date > CURRENT_DATE);

-- View: Active GWAC Holders
CREATE OR REPLACE VIEW active_gwac_holders AS
SELECT * FROM gwac_holders
WHERE is_active = true
  AND (ordering_period_end IS NULL OR ordering_period_end > CURRENT_DATE);

-- View: Small Business GSA Holders
CREATE OR REPLACE VIEW small_business_gsa_holders AS
SELECT * FROM gsa_schedule_holders
WHERE small_business = true
  AND is_active = true;

-- View: Small Business GWAC Holders
CREATE OR REPLACE VIEW small_business_gwac_holders AS
SELECT * FROM gwac_holders
WHERE small_business = true
  AND is_active = true;

-- View: Combined Contract Vehicles (GSA + GWAC)
CREATE OR REPLACE VIEW combined_contract_vehicles AS
SELECT 
  'GSA Schedule' as vehicle_type,
  contract_number,
  company_name,
  vendor_uei,
  vendor_duns,
  company_state,
  small_business,
  woman_owned,
  veteran_owned,
  is_active,
  schedule_number as vehicle_name,
  contract_expiration_date as end_date
FROM gsa_schedule_holders
UNION ALL
SELECT 
  'GWAC' as vehicle_type,
  contract_number,
  company_name,
  vendor_uei,
  vendor_duns,
  company_state,
  small_business,
  woman_owned,
  veteran_owned,
  is_active,
  gwac_name as vehicle_name,
  ordering_period_end as end_date
FROM gwac_holders;

-- View: Company Contract Vehicle Summary
CREATE OR REPLACE VIEW company_vehicle_summary AS
SELECT 
  COALESCE(gsa.company_name, gwac.company_name) as company_name,
  COALESCE(gsa.vendor_uei, gwac.vendor_uei) as vendor_uei,
  COALESCE(gsa.vendor_duns, gwac.vendor_duns) as vendor_duns,
  COUNT(DISTINCT gsa.contract_number) as gsa_schedules_count,
  COUNT(DISTINCT gwac.contract_number) as gwac_count,
  COUNT(DISTINCT gsa.contract_number) + COUNT(DISTINCT gwac.contract_number) as total_vehicles,
  ARRAY_AGG(DISTINCT gsa.schedule_number) FILTER (WHERE gsa.schedule_number IS NOT NULL) as gsa_schedules,
  ARRAY_AGG(DISTINCT gwac.gwac_name) FILTER (WHERE gwac.gwac_name IS NOT NULL) as gwacs,
  BOOL_OR(COALESCE(gsa.small_business, gwac.small_business)) as is_small_business
FROM gsa_schedule_holders gsa
FULL OUTER JOIN gwac_holders gwac 
  ON gsa.vendor_uei = gwac.vendor_uei 
  OR (gsa.vendor_uei IS NULL AND gsa.company_name = gwac.company_name)
WHERE (gsa.is_active = true OR gsa.is_active IS NULL)
  AND (gwac.is_active = true OR gwac.is_active IS NULL)
GROUP BY 
  COALESCE(gsa.company_name, gwac.company_name),
  COALESCE(gsa.vendor_uei, gwac.vendor_uei),
  COALESCE(gsa.vendor_duns, gwac.vendor_duns);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gsa_gwac_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_gsa_schedule_holders_updated_at
  BEFORE UPDATE ON gsa_schedule_holders
  FOR EACH ROW
  EXECUTE FUNCTION update_gsa_gwac_updated_at();

CREATE TRIGGER update_gwac_holders_updated_at
  BEFORE UPDATE ON gwac_holders
  FOR EACH ROW
  EXECUTE FUNCTION update_gsa_gwac_updated_at();

CREATE TRIGGER update_gsa_sin_catalog_updated_at
  BEFORE UPDATE ON gsa_sin_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_gsa_gwac_updated_at();

CREATE TRIGGER update_gwac_catalog_updated_at
  BEFORE UPDATE ON gwac_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_gsa_gwac_updated_at();

-- ============================================
-- SEED DATA: Popular GWACs
-- ============================================

INSERT INTO gwac_catalog (gwac_name, gwac_acronym, gwac_type, managing_agency, description, website_url, holder_directory_url, is_active) VALUES
  ('Alliant 2 Small Business', 'Alliant 2 SB', 'IT', 'GSA', 'IT services and solutions for small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/alliant-2', NULL, true),
  ('Alliant 2 Unrestricted', 'Alliant 2', 'IT', 'GSA', 'IT services and solutions for all business sizes', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/alliant-2', NULL, true),
  ('OASIS Small Business', 'OASIS SB', 'Professional Services', 'GSA', 'Professional services for small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/oasis-and-oasis-small-business', NULL, true),
  ('OASIS Unrestricted', 'OASIS', 'Professional Services', 'GSA', 'Professional services for all business sizes', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/oasis-and-oasis-small-business', NULL, true),
  ('8(a) STARS III', 'STARS III', 'IT', 'GSA', 'IT services for 8(a) small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/8a-stars-iii', NULL, true),
  ('Polaris Small Business', 'Polaris SB', 'IT', 'GSA', 'Next generation IT GWAC for small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/polaris', NULL, true),
  ('Polaris Unrestricted', 'Polaris', 'IT', 'GSA', 'Next generation IT GWAC for all business sizes', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/polaris', NULL, true),
  ('CIO-SP3 Small Business', 'CIO-SP3 SB', 'IT', 'NITAAC', 'IT services and solutions for small businesses', 'https://nitaac.nih.gov/services/cio-sp3', 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac', true),
  ('CIO-SP3 Unrestricted', 'CIO-SP3', 'IT', 'NITAAC', 'IT services and solutions for all business sizes', 'https://nitaac.nih.gov/services/cio-sp3', 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac', true),
  ('CIO-SP4', 'CIO-SP4', 'IT', 'NITAAC', 'Next generation IT services GWAC', 'https://nitaac.nih.gov/services/cio-sp4', 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac', true),
  ('SEWP VI', 'SEWP', 'IT Products', 'NASA', 'IT products and solutions', 'https://www.sewp.nasa.gov/', NULL, true)
ON CONFLICT (gwac_name) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'GSA Schedule & GWAC Tables Created!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - gsa_schedule_holders (GSA MAS contractors)';
  RAISE NOTICE '  - gwac_holders (GWAC contract holders)';
  RAISE NOTICE '  - gsa_sin_catalog (SIN reference data)';
  RAISE NOTICE '  - gwac_catalog (GWAC reference data)';
  RAISE NOTICE '  - gsa_gwac_scraper_log (scraping logs)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  - active_gsa_schedule_holders';
  RAISE NOTICE '  - active_gwac_holders';
  RAISE NOTICE '  - small_business_gsa_holders';
  RAISE NOTICE '  - small_business_gwac_holders';
  RAISE NOTICE '  - combined_contract_vehicles';
  RAISE NOTICE '  - company_vehicle_summary';
  RAISE NOTICE '';
  RAISE NOTICE 'Seed Data:';
  RAISE NOTICE '  - 11 major GWACs added to gwac_catalog';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Build scraper for GSA eLibrary';
  RAISE NOTICE '  2. Build scraper for GWAC holder lists';
  RAISE NOTICE '  3. Schedule periodic updates (monthly/quarterly)';
  RAISE NOTICE '  4. Link to company_intelligence table via UEI/DUNS';
  RAISE NOTICE '============================================';
END $$;

