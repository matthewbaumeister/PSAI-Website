-- ============================================
-- GWAC & GSA MAS Combined Database Schema (FIXED)
-- ============================================
-- This schema tracks BOTH GWACs and GSA MAS
-- Fixed: Removed duplicate constraint names
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- DROP EXISTING TABLES (Clean slate)
-- ============================================

DROP TABLE IF EXISTS vehicle_scraper_log CASCADE;
DROP TABLE IF EXISTS vehicle_company_stats CASCADE;
DROP TABLE IF EXISTS vehicle_task_orders CASCADE;
DROP TABLE IF EXISTS product_pricing CASCADE;
DROP TABLE IF EXISTS labor_rates CASCADE;
DROP TABLE IF EXISTS contract_holders CASCADE;
DROP TABLE IF EXISTS contract_vehicles CASCADE;

-- ============================================
-- 1. Contract Vehicles Master Table
-- ============================================

CREATE TABLE contract_vehicles (
  id BIGSERIAL PRIMARY KEY,
  
  -- Vehicle Identification
  vehicle_type TEXT NOT NULL, -- 'GWAC', 'GSA_MAS', 'IDIQ', 'BPA'
  program_name TEXT, -- e.g., "8(a) STARS III", null for individual MAS contracts
  program_code TEXT, -- e.g., "STARS3", "MAS"
  contract_number TEXT UNIQUE NOT NULL,
  
  -- Contract Details
  contract_type TEXT,
  managing_agency TEXT DEFAULT 'GSA',
  status TEXT DEFAULT 'Active',
  
  -- For GSA MAS: Special Item Numbers (SINs)
  sins TEXT[],
  sin_descriptions TEXT[],
  
  -- Scope & Categories
  scope_description TEXT,
  service_categories TEXT[],
  product_categories TEXT[],
  naics_codes TEXT[],
  psc_codes TEXT[],
  
  -- Set-Aside Type
  small_business_only BOOLEAN DEFAULT false,
  veteran_owned_only BOOLEAN DEFAULT false,
  eight_a_only BOOLEAN DEFAULT false,
  woman_owned_only BOOLEAN DEFAULT false,
  
  -- Financial
  contract_ceiling DECIMAL(15,2),
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  -- Timeline
  award_date DATE,
  base_period_start DATE,
  base_period_end DATE,
  option_periods INTEGER,
  ultimate_expiration_date DATE,
  
  -- Links
  contract_website TEXT,
  elibrary_url TEXT,
  rates_url TEXT,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Contract Holders
-- ============================================

CREATE TABLE contract_holders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identification
  vehicle_id BIGINT REFERENCES contract_vehicles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  
  -- Vendor Identifiers
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage_code TEXT,
  
  -- Contract Details
  contract_number TEXT,
  award_date DATE,
  expiration_date DATE,
  
  -- Contract Ceiling
  individual_contract_ceiling DECIMAL(15,2),
  
  -- For GSA MAS: SINs they hold
  sins_held TEXT[],
  
  -- Scope
  service_areas TEXT[],
  product_offerings TEXT[],
  naics_codes TEXT[],
  labor_categories TEXT[],
  
  -- Geographic Scope
  geographic_scope TEXT,
  states_covered TEXT[],
  
  -- Company Info
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_country TEXT DEFAULT 'USA',
  company_website TEXT,
  
  -- Socioeconomic
  small_business BOOLEAN DEFAULT false,
  woman_owned BOOLEAN DEFAULT false,
  veteran_owned BOOLEAN DEFAULT false,
  service_disabled_veteran_owned BOOLEAN DEFAULT false,
  hubzone BOOLEAN DEFAULT false,
  eight_a BOOLEAN DEFAULT false,
  
  -- Performance Metrics
  total_orders INTEGER DEFAULT 0,
  total_order_value DECIMAL(15,2) DEFAULT 0,
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  -- Top Customers
  top_ordering_agencies TEXT[],
  
  -- Timeline
  first_order_date DATE,
  most_recent_order_date DATE,
  
  -- Status
  status TEXT DEFAULT 'Active',
  
  -- Metadata
  data_source TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_vehicle_company_holder UNIQUE (vehicle_id, company_name)
);

-- ============================================
-- 3. Labor Rates
-- ============================================

CREATE TABLE labor_rates (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identification
  contract_holder_id BIGINT REFERENCES contract_holders(id) ON DELETE CASCADE,
  vehicle_id BIGINT REFERENCES contract_vehicles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  
  -- Source
  data_source TEXT,
  
  -- For GSA MAS: SIN
  sin TEXT,
  sin_description TEXT,
  
  -- Labor Category
  labor_category TEXT NOT NULL,
  labor_category_code TEXT,
  labor_category_description TEXT,
  
  -- Experience & Education
  experience_level TEXT,
  min_years_experience INTEGER,
  education_requirement TEXT,
  degree_requirement TEXT,
  
  -- Rates (per hour)
  base_year_rate DECIMAL(10,2),
  current_year_rate DECIMAL(10,2),
  year1_rate DECIMAL(10,2),
  year2_rate DECIMAL(10,2),
  year3_rate DECIMAL(10,2),
  year4_rate DECIMAL(10,2),
  year5_rate DECIMAL(10,2),
  
  -- Rate Metadata
  rate_year INTEGER,
  rate_period TEXT,
  escalation_rate DECIMAL(5,2),
  
  -- Geographic
  location TEXT,
  locality_adjustment DECIMAL(5,2),
  
  -- CALC+ Specific Fields
  calc_id INTEGER,
  calc_last_updated TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  rate_sheet_url TEXT,
  rate_effective_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints (unique name to avoid conflicts)
  CONSTRAINT unique_cv_labor_rate UNIQUE (contract_number, labor_category, location, rate_year, min_years_experience)
);

-- ============================================
-- 4. Product Pricing
-- ============================================

CREATE TABLE product_pricing (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identification
  contract_holder_id BIGINT REFERENCES contract_holders(id) ON DELETE CASCADE,
  vehicle_id BIGINT REFERENCES contract_vehicles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  
  -- Product/Service Details
  sin TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_code TEXT,
  
  -- Classification
  category TEXT,
  subcategory TEXT,
  naics_code TEXT,
  psc_code TEXT,
  
  -- Pricing
  list_price DECIMAL(12,2),
  gsa_price DECIMAL(12,2),
  discount_percentage DECIMAL(5,2),
  unit_of_measure TEXT,
  
  -- Minimums/Maximums
  minimum_order_quantity INTEGER,
  maximum_order_quantity INTEGER,
  
  -- Availability
  lead_time_days INTEGER,
  geographic_availability TEXT[],
  
  -- Links
  product_url TEXT,
  datasheet_url TEXT,
  
  -- Metadata
  data_source TEXT,
  price_effective_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Task Orders
-- ============================================

CREATE TABLE vehicle_task_orders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Links
  fpds_contract_id BIGINT REFERENCES fpds_contracts(id) ON DELETE CASCADE,
  contract_holder_id BIGINT REFERENCES contract_holders(id) ON DELETE SET NULL,
  vehicle_id BIGINT REFERENCES contract_vehicles(id) ON DELETE SET NULL,
  
  -- Order Identification
  order_number TEXT NOT NULL,
  parent_vehicle_piid TEXT,
  order_type TEXT,
  
  -- Ordering Agency
  ordering_agency_name TEXT,
  ordering_agency_id TEXT,
  ordering_office_name TEXT,
  
  -- Financial
  order_value DECIMAL(15,2),
  obligated_amount DECIMAL(15,2),
  
  -- Timeline
  award_date DATE,
  period_of_performance_start DATE,
  period_of_performance_end DATE,
  
  -- Description
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_vehicle_order UNIQUE (order_number)
);

-- ============================================
-- 6. Company Statistics
-- ============================================

CREATE TABLE vehicle_company_stats (
  id BIGSERIAL PRIMARY KEY,
  
  company_name TEXT UNIQUE NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  
  -- Contract Vehicle Participation
  total_vehicles INTEGER DEFAULT 0,
  gwac_count INTEGER DEFAULT 0,
  mas_count INTEGER DEFAULT 0,
  vehicle_list TEXT[],
  
  -- Order Performance
  total_orders INTEGER DEFAULT 0,
  total_order_value DECIMAL(15,2) DEFAULT 0,
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  -- Success Metrics
  avg_order_value DECIMAL(15,2),
  median_order_value DECIMAL(15,2),
  largest_order_value DECIMAL(15,2),
  
  -- Customer Base
  unique_ordering_agencies INTEGER DEFAULT 0,
  top_customers TEXT[],
  
  -- Timeline
  first_vehicle_award_date DATE,
  most_recent_order_date DATE,
  
  -- Market Position
  market_share DECIMAL(5,2),
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. Scraper Log
-- ============================================

CREATE TABLE vehicle_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  scrape_type TEXT NOT NULL,
  data_source TEXT,
  vehicle_id BIGINT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- ============================================
-- INDEXES
-- ============================================

-- Contract Vehicles
CREATE INDEX idx_cv_type ON contract_vehicles(vehicle_type);
CREATE INDEX idx_cv_contract_number ON contract_vehicles(contract_number);
CREATE INDEX idx_cv_status ON contract_vehicles(status);
CREATE INDEX idx_cv_sins ON contract_vehicles USING GIN(sins);

-- Contract Holders
CREATE INDEX idx_ch_vehicle ON contract_holders(vehicle_id);
CREATE INDEX idx_ch_company ON contract_holders(company_name);
CREATE INDEX idx_ch_uei ON contract_holders(vendor_uei);
CREATE INDEX idx_ch_duns ON contract_holders(vendor_duns);
CREATE INDEX idx_ch_status ON contract_holders(status) WHERE status = 'Active';
CREATE INDEX idx_ch_sins ON contract_holders USING GIN(sins_held);

-- Labor Rates
CREATE INDEX idx_lr_holder ON labor_rates(contract_holder_id);
CREATE INDEX idx_lr_vehicle ON labor_rates(vehicle_id);
CREATE INDEX idx_lr_contract ON labor_rates(contract_number);
CREATE INDEX idx_lr_category ON labor_rates(labor_category);
CREATE INDEX idx_lr_sin ON labor_rates(sin);
CREATE INDEX idx_lr_source ON labor_rates(data_source);
CREATE INDEX idx_lr_company ON labor_rates(company_name);

-- Product Pricing
CREATE INDEX idx_pp_holder ON product_pricing(contract_holder_id);
CREATE INDEX idx_pp_sin ON product_pricing(sin);
CREATE INDEX idx_pp_name ON product_pricing(product_name);

-- Task Orders
CREATE INDEX idx_vto_fpds ON vehicle_task_orders(fpds_contract_id);
CREATE INDEX idx_vto_holder ON vehicle_task_orders(contract_holder_id);
CREATE INDEX idx_vto_vehicle ON vehicle_task_orders(vehicle_id);
CREATE INDEX idx_vto_parent ON vehicle_task_orders(parent_vehicle_piid);
CREATE INDEX idx_vto_agency ON vehicle_task_orders(ordering_agency_id);

-- Company Stats
CREATE INDEX idx_vcs_uei ON vehicle_company_stats(vendor_uei);
CREATE INDEX idx_vcs_value ON vehicle_company_stats(total_order_value DESC);

-- ============================================
-- VIEWS
-- ============================================

-- View: All Active Contract Vehicles
CREATE OR REPLACE VIEW active_contract_vehicles AS
SELECT 
  cv.*,
  COUNT(DISTINCT ch.id) as active_holders,
  SUM(ch.total_order_value) as total_spending
FROM contract_vehicles cv
LEFT JOIN contract_holders ch ON cv.id = ch.vehicle_id AND ch.status = 'Active'
WHERE cv.status = 'Active'
GROUP BY cv.id;

-- View: Labor Rate Comparison
CREATE OR REPLACE VIEW labor_rate_comparison AS
SELECT 
  lr.labor_category,
  lr.min_years_experience,
  lr.education_requirement,
  cv.vehicle_type,
  cv.program_name,
  lr.company_name,
  lr.contract_number,
  lr.current_year_rate,
  lr.sin,
  AVG(lr.current_year_rate) OVER (PARTITION BY lr.labor_category) as avg_rate,
  MIN(lr.current_year_rate) OVER (PARTITION BY lr.labor_category) as min_rate,
  MAX(lr.current_year_rate) OVER (PARTITION BY lr.labor_category) as max_rate
FROM labor_rates lr
JOIN contract_vehicles cv ON lr.vehicle_id = cv.id
WHERE lr.location = 'CONUS' OR lr.location IS NULL
ORDER BY lr.labor_category, lr.current_year_rate;

-- View: Company Vehicle Portfolio
CREATE OR REPLACE VIEW company_vehicle_portfolio AS
SELECT 
  ch.company_name,
  ch.vendor_uei,
  ARRAY_AGG(DISTINCT cv.vehicle_type) as vehicle_types,
  ARRAY_AGG(DISTINCT cv.program_name) FILTER (WHERE cv.program_name IS NOT NULL) as vehicle_programs,
  COUNT(DISTINCT cv.id) as number_of_vehicles,
  SUM(ch.total_order_value) as total_revenue,
  SUM(ch.total_orders) as total_orders
FROM contract_holders ch
JOIN contract_vehicles cv ON ch.vehicle_id = cv.id
WHERE ch.status = 'Active'
GROUP BY ch.company_name, ch.vendor_uei;

-- View: FPDS Vehicle Linkage
CREATE OR REPLACE VIEW fpds_vehicle_linkage AS
SELECT 
  fc.id as fpds_contract_id,
  fc.piid,
  fc.vendor_name,
  fc.base_and_exercised_options_value,
  fc.date_signed,
  fc.referenced_idv_piid,
  vto.vehicle_id,
  cv.vehicle_type,
  cv.program_name,
  ch.company_name as vehicle_holder
FROM fpds_contracts fc
LEFT JOIN vehicle_task_orders vto ON fc.id = vto.fpds_contract_id
LEFT JOIN contract_vehicles cv ON vto.vehicle_id = cv.id
LEFT JOIN contract_holders ch ON vto.contract_holder_id = ch.id
WHERE fc.referenced_idv_piid IS NOT NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_vehicle_company_stats()
RETURNS void AS $$
BEGIN
  TRUNCATE vehicle_company_stats;
  
  INSERT INTO vehicle_company_stats (
    company_name,
    vendor_uei,
    vendor_duns,
    total_vehicles,
    gwac_count,
    mas_count,
    vehicle_list,
    total_orders,
    total_order_value,
    total_obligated
  )
  SELECT 
    ch.company_name,
    ch.vendor_uei,
    ch.vendor_duns,
    COUNT(DISTINCT ch.vehicle_id) as total_vehicles,
    COUNT(DISTINCT ch.vehicle_id) FILTER (WHERE cv.vehicle_type = 'GWAC') as gwac_count,
    COUNT(DISTINCT ch.vehicle_id) FILTER (WHERE cv.vehicle_type = 'GSA_MAS') as mas_count,
    ARRAY_AGG(DISTINCT cv.program_name) FILTER (WHERE cv.program_name IS NOT NULL) as vehicle_list,
    SUM(ch.total_orders) as total_orders,
    SUM(ch.total_order_value) as total_order_value,
    SUM(ch.total_obligated) as total_obligated
  FROM contract_holders ch
  JOIN contract_vehicles cv ON ch.vehicle_id = cv.id
  WHERE ch.status = 'Active'
  GROUP BY ch.company_name, ch.vendor_uei, ch.vendor_duns;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'GWAC & GSA MAS Tables Created Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - contract_vehicles (GWACs + GSA MAS)';
  RAISE NOTICE '  - contract_holders';
  RAISE NOTICE '  - labor_rates';
  RAISE NOTICE '  - product_pricing';
  RAISE NOTICE '  - vehicle_task_orders';
  RAISE NOTICE '  - vehicle_company_stats';
  RAISE NOTICE '  - vehicle_scraper_log';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run: ts-node src/lib/calc-plus-scraper.ts popular';
  RAISE NOTICE '  2. Run: ts-node src/lib/gwac-fpds-linker.ts identify';
  RAISE NOTICE '  3. Populate GWAC programs (see IMPLEMENTATION_STEPS.md)';
  RAISE NOTICE '============================================';
END $$;

