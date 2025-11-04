-- ============================================
-- GWAC (Government-Wide Acquisition Contract) Database Schema
-- ============================================
-- This schema tracks GWAC contract vehicles, contract holders,
-- labor rates, task orders, and company performance
--
-- Data Sources:
-- 1. GSA GWAC Sales Dashboard (d2d.gsa.gov)
-- 2. Individual GWAC program sites (GSA, eBuy)
-- 3. FPDS task order data (links via referenced_idv_piid)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. GWAC Programs Master Table
-- ============================================
-- Tracks the contract vehicles themselves

CREATE TABLE IF NOT EXISTS gwac_programs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Program Identification
  program_name TEXT UNIQUE NOT NULL, -- e.g., "8(a) STARS III", "Alliant 2"
  program_code TEXT UNIQUE, -- e.g., "STARS3", "ALLIANT2"
  contract_number TEXT, -- e.g., "GS00Q17GWD4003"
  
  -- Program Details
  program_type TEXT, -- e.g., "IT Services", "Professional Services"
  managing_agency TEXT DEFAULT 'GSA',
  program_status TEXT, -- 'Active', 'Expired', 'Upcoming'
  
  -- Scope & Categories
  scope_description TEXT,
  service_categories TEXT[], -- Array of service areas
  naics_codes TEXT[], -- Eligible NAICS codes
  
  -- Set-Aside Type
  small_business_only BOOLEAN DEFAULT false,
  veteran_owned_only BOOLEAN DEFAULT false,
  eight_a_only BOOLEAN DEFAULT false,
  woman_owned_only BOOLEAN DEFAULT false,
  
  -- Financial
  contract_ceiling DECIMAL(15,2), -- Total program ceiling
  total_obligated DECIMAL(15,2) DEFAULT 0, -- Total spent to date
  
  -- Timeline
  award_date DATE,
  base_period_start DATE,
  base_period_end DATE,
  option_periods INTEGER, -- Number of option periods
  ultimate_expiration_date DATE,
  
  -- Contract Holders
  number_of_contract_holders INTEGER,
  contract_holders_list TEXT[], -- Array of company names
  
  -- Links
  program_website TEXT,
  contractor_list_url TEXT,
  rates_url TEXT,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. GWAC Contract Holders
-- ============================================
-- Companies that hold positions on GWAC vehicles

CREATE TABLE IF NOT EXISTS gwac_contract_holders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identification
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  
  -- Vendor Identifiers (link to fpds_contracts)
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage_code TEXT,
  
  -- Contract Details
  contract_number TEXT, -- Individual contract number under the GWAC
  award_date DATE,
  base_period_end DATE,
  ultimate_completion_date DATE,
  
  -- Contract Ceiling
  individual_contract_ceiling DECIMAL(15,2), -- This company's max under the GWAC
  
  -- Scope
  service_areas TEXT[], -- Specific service areas this company covers
  naics_codes TEXT[], -- NAICS codes this company is certified for
  labor_categories TEXT[], -- Labor categories they can provide
  
  -- Geographic Scope
  geographic_scope TEXT, -- e.g., "CONUS", "OCONUS", "Worldwide"
  states_covered TEXT[],
  
  -- Company Info
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_country TEXT DEFAULT 'USA',
  
  -- Socioeconomic
  small_business BOOLEAN DEFAULT false,
  woman_owned BOOLEAN DEFAULT false,
  veteran_owned BOOLEAN DEFAULT false,
  service_disabled_veteran_owned BOOLEAN DEFAULT false,
  hubzone BOOLEAN DEFAULT false,
  eight_a BOOLEAN DEFAULT false,
  
  -- Performance Metrics (from task orders)
  total_task_orders INTEGER DEFAULT 0,
  total_task_order_value DECIMAL(15,2) DEFAULT 0,
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  -- Top Customers
  top_ordering_agencies TEXT[],
  top_ordering_agencies_count INTEGER[],
  
  -- Timeline
  first_task_order_date DATE,
  most_recent_task_order_date DATE,
  
  -- Links
  company_website TEXT,
  
  -- Status
  status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_gwac_company UNIQUE (gwac_program_id, company_name)
);

-- ============================================
-- 3. GWAC Labor Rates
-- ============================================
-- Tracks pricing/rates for labor categories

CREATE TABLE IF NOT EXISTS gwac_labor_rates (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identification
  contract_holder_id BIGINT REFERENCES gwac_contract_holders(id) ON DELETE CASCADE,
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  
  -- Labor Category
  labor_category TEXT NOT NULL,
  labor_category_code TEXT,
  labor_category_description TEXT,
  
  -- Experience Level
  experience_level TEXT, -- e.g., "Junior", "Senior", "Expert"
  min_years_experience INTEGER,
  education_requirement TEXT,
  
  -- Rates (per hour)
  base_year_rate DECIMAL(10,2), -- Y1 rate
  current_year_rate DECIMAL(10,2), -- Current escalated rate
  max_rate DECIMAL(10,2), -- Ceiling rate
  
  -- Rate Year
  rate_year INTEGER,
  escalation_rate DECIMAL(5,2), -- Annual escalation %
  
  -- Geographic
  location TEXT, -- e.g., "CONUS", "Alaska", "Hawaii"
  locality_adjustment DECIMAL(5,2), -- % adjustment for location
  
  -- Metadata
  rate_sheet_url TEXT,
  rate_effective_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_labor_rate UNIQUE (contract_holder_id, labor_category, location, rate_year)
);

-- ============================================
-- 4. GWAC Task Orders
-- ============================================
-- Links FPDS task orders to their parent GWAC

CREATE TABLE IF NOT EXISTS gwac_task_orders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Links
  fpds_contract_id BIGINT REFERENCES fpds_contracts(id) ON DELETE CASCADE,
  contract_holder_id BIGINT REFERENCES gwac_contract_holders(id) ON DELETE SET NULL,
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE SET NULL,
  
  -- Task Order Identification
  task_order_number TEXT NOT NULL, -- The PIID from FPDS
  parent_gwac_piid TEXT, -- The parent GWAC contract number
  
  -- Ordering Agency
  ordering_agency_name TEXT,
  ordering_agency_id TEXT,
  ordering_office_name TEXT,
  
  -- Financial
  task_order_value DECIMAL(15,2),
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
  CONSTRAINT unique_task_order UNIQUE (task_order_number)
);

-- ============================================
-- 5. GWAC Company Statistics
-- ============================================
-- Aggregated performance metrics per company across all GWACs

CREATE TABLE IF NOT EXISTS gwac_company_stats (
  id BIGSERIAL PRIMARY KEY,
  
  company_name TEXT UNIQUE NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  
  -- GWAC Participation
  total_gwac_positions INTEGER DEFAULT 0, -- How many GWACs they're on
  gwac_programs TEXT[], -- List of GWACs they hold
  
  -- Task Order Performance
  total_task_orders INTEGER DEFAULT 0,
  total_task_order_value DECIMAL(15,2) DEFAULT 0,
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  -- Success Metrics
  avg_task_order_value DECIMAL(15,2),
  median_task_order_value DECIMAL(15,2),
  largest_task_order_value DECIMAL(15,2),
  
  -- Win Rate (if competing against other GWAC holders)
  proposals_submitted INTEGER DEFAULT 0,
  task_orders_won INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  
  -- Customer Base
  unique_ordering_agencies INTEGER DEFAULT 0,
  top_customers TEXT[],
  repeat_customer_rate DECIMAL(5,2),
  
  -- Timeline
  first_gwac_award_date DATE,
  most_recent_task_order_date DATE,
  years_on_gwac INTEGER,
  
  -- Market Position
  market_share DECIMAL(5,2), -- % of total GWAC spending
  rank_by_volume INTEGER,
  rank_by_value INTEGER,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. GWAC Scraper Log
-- ============================================

CREATE TABLE IF NOT EXISTS gwac_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  scrape_type TEXT NOT NULL, -- 'programs', 'contract_holders', 'labor_rates', 'task_orders'
  gwac_program_id BIGINT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
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

-- GWAC Programs
CREATE INDEX IF NOT EXISTS idx_gwac_programs_code ON gwac_programs(program_code);
CREATE INDEX IF NOT EXISTS idx_gwac_programs_status ON gwac_programs(program_status);
CREATE INDEX IF NOT EXISTS idx_gwac_programs_small_business ON gwac_programs(small_business_only) WHERE small_business_only = true;

-- Contract Holders
CREATE INDEX IF NOT EXISTS idx_gwac_holders_program ON gwac_contract_holders(gwac_program_id);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_company ON gwac_contract_holders(company_name);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_uei ON gwac_contract_holders(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_duns ON gwac_contract_holders(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_status ON gwac_contract_holders(status) WHERE status = 'Active';
CREATE INDEX IF NOT EXISTS idx_gwac_holders_small_business ON gwac_contract_holders(small_business) WHERE small_business = true;

-- Labor Rates
CREATE INDEX IF NOT EXISTS idx_gwac_rates_holder ON gwac_labor_rates(contract_holder_id);
CREATE INDEX IF NOT EXISTS idx_gwac_rates_program ON gwac_labor_rates(gwac_program_id);
CREATE INDEX IF NOT EXISTS idx_gwac_rates_category ON gwac_labor_rates(labor_category);
CREATE INDEX IF NOT EXISTS idx_gwac_rates_company ON gwac_labor_rates(company_name);

-- Task Orders
CREATE INDEX IF NOT EXISTS idx_gwac_tasks_fpds ON gwac_task_orders(fpds_contract_id);
CREATE INDEX IF NOT EXISTS idx_gwac_tasks_holder ON gwac_task_orders(contract_holder_id);
CREATE INDEX IF NOT EXISTS idx_gwac_tasks_program ON gwac_task_orders(gwac_program_id);
CREATE INDEX IF NOT EXISTS idx_gwac_tasks_parent ON gwac_task_orders(parent_gwac_piid);
CREATE INDEX IF NOT EXISTS idx_gwac_tasks_ordering_agency ON gwac_task_orders(ordering_agency_id);
CREATE INDEX IF NOT EXISTS idx_gwac_tasks_award_date ON gwac_task_orders(award_date);

-- Company Stats
CREATE INDEX IF NOT EXISTS idx_gwac_company_stats_uei ON gwac_company_stats(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_company_stats_volume ON gwac_company_stats(total_task_orders DESC);
CREATE INDEX IF NOT EXISTS idx_gwac_company_stats_value ON gwac_company_stats(total_task_order_value DESC);

-- ============================================
-- VIEWS for Common Queries
-- ============================================

-- View: Active GWAC Programs with Contract Holder Count
CREATE OR REPLACE VIEW active_gwac_programs AS
SELECT 
  gp.*,
  COUNT(DISTINCT gh.id) as active_contract_holders,
  SUM(gh.total_task_order_value) as total_program_spending
FROM gwac_programs gp
LEFT JOIN gwac_contract_holders gh ON gp.id = gh.gwac_program_id AND gh.status = 'Active'
WHERE gp.program_status = 'Active'
GROUP BY gp.id;

-- View: Top GWAC Performers by Task Order Value
CREATE OR REPLACE VIEW top_gwac_performers AS
SELECT 
  gh.company_name,
  gh.vendor_uei,
  gp.program_name,
  gh.total_task_orders,
  gh.total_task_order_value,
  gh.status,
  RANK() OVER (PARTITION BY gp.id ORDER BY gh.total_task_order_value DESC) as rank_in_gwac
FROM gwac_contract_holders gh
JOIN gwac_programs gp ON gh.gwac_program_id = gp.id
WHERE gh.status = 'Active'
ORDER BY gh.total_task_order_value DESC;

-- View: GWAC Labor Rate Comparison
CREATE OR REPLACE VIEW gwac_rate_comparison AS
SELECT 
  lr.labor_category,
  lr.experience_level,
  gp.program_name,
  lr.company_name,
  lr.current_year_rate,
  AVG(lr.current_year_rate) OVER (PARTITION BY lr.labor_category) as avg_rate,
  MIN(lr.current_year_rate) OVER (PARTITION BY lr.labor_category) as min_rate,
  MAX(lr.current_year_rate) OVER (PARTITION BY lr.labor_category) as max_rate
FROM gwac_labor_rates lr
JOIN gwac_programs gp ON lr.gwac_program_id = gp.id
WHERE lr.location = 'CONUS'
ORDER BY lr.labor_category, lr.current_year_rate;

-- View: Company GWAC Portfolio (All GWACs a company holds)
CREATE OR REPLACE VIEW company_gwac_portfolio AS
SELECT 
  gh.company_name,
  gh.vendor_uei,
  ARRAY_AGG(gp.program_name ORDER BY gp.program_name) as gwac_programs,
  COUNT(DISTINCT gp.id) as number_of_gwacs,
  SUM(gh.total_task_order_value) as total_gwac_revenue,
  SUM(gh.total_task_orders) as total_gwac_task_orders
FROM gwac_contract_holders gh
JOIN gwac_programs gp ON gh.gwac_program_id = gp.id
WHERE gh.status = 'Active'
GROUP BY gh.company_name, gh.vendor_uei;

-- View: Link FPDS Contracts to GWAC Programs
CREATE OR REPLACE VIEW fpds_gwac_linkage AS
SELECT 
  fc.id as fpds_contract_id,
  fc.piid,
  fc.vendor_name,
  fc.base_and_exercised_options_value,
  fc.date_signed,
  fc.referenced_idv_piid,
  gto.gwac_program_id,
  gp.program_name as gwac_program,
  gh.company_name as gwac_holder
FROM fpds_contracts fc
LEFT JOIN gwac_task_orders gto ON fc.id = gto.fpds_contract_id
LEFT JOIN gwac_programs gp ON gto.gwac_program_id = gp.id
LEFT JOIN gwac_contract_holders gh ON gto.contract_holder_id = gh.id
WHERE fc.referenced_idv_piid IS NOT NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update GWAC Company Statistics
CREATE OR REPLACE FUNCTION update_gwac_company_stats()
RETURNS void AS $$
BEGIN
  -- Delete and rebuild stats
  TRUNCATE gwac_company_stats;
  
  INSERT INTO gwac_company_stats (
    company_name,
    vendor_uei,
    vendor_duns,
    total_gwac_positions,
    gwac_programs,
    total_task_orders,
    total_task_order_value,
    total_obligated,
    avg_task_order_value,
    first_gwac_award_date,
    most_recent_task_order_date
  )
  SELECT 
    gh.company_name,
    gh.vendor_uei,
    gh.vendor_duns,
    COUNT(DISTINCT gh.gwac_program_id) as total_gwac_positions,
    ARRAY_AGG(DISTINCT gp.program_name) as gwac_programs,
    SUM(gh.total_task_orders) as total_task_orders,
    SUM(gh.total_task_order_value) as total_task_order_value,
    SUM(gh.total_obligated) as total_obligated,
    AVG(gh.total_task_order_value / NULLIF(gh.total_task_orders, 0)) as avg_task_order_value,
    MIN(gh.award_date) as first_gwac_award_date,
    MAX(gh.most_recent_task_order_date) as most_recent_task_order_date
  FROM gwac_contract_holders gh
  JOIN gwac_programs gp ON gh.gwac_program_id = gp.id
  WHERE gh.status = 'Active'
  GROUP BY gh.company_name, gh.vendor_uei, gh.vendor_duns;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'GWAC Tables Created Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - gwac_programs (GWAC vehicles)';
  RAISE NOTICE '  - gwac_contract_holders (companies on GWACs)';
  RAISE NOTICE '  - gwac_labor_rates (pricing data)';
  RAISE NOTICE '  - gwac_task_orders (task order tracking)';
  RAISE NOTICE '  - gwac_company_stats (performance metrics)';
  RAISE NOTICE '  - gwac_scraper_log (operations log)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  - active_gwac_programs';
  RAISE NOTICE '  - top_gwac_performers';
  RAISE NOTICE '  - gwac_rate_comparison';
  RAISE NOTICE '  - company_gwac_portfolio';
  RAISE NOTICE '  - fpds_gwac_linkage';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Scrape GSA GWAC Sales Dashboard';
  RAISE NOTICE '  2. Scrape contract holder lists';
  RAISE NOTICE '  3. Import labor rate sheets';
  RAISE NOTICE '  4. Link FPDS task orders to GWACs';
  RAISE NOTICE '  5. Build analytics dashboard';
  RAISE NOTICE '============================================';
END $$;

