-- ============================================
-- GWAC TRACKING TABLES
-- Government-Wide Acquisition Contracts
-- ============================================
-- This migration creates tables for tracking:
--   - GWAC holder lists (current contractors)
--   - GWAC historical spending (USAspending.gov)
--   - GWAC task orders (FPDS data)
--   - Contractor GWAC participation over time
-- ============================================

-- ============================================
-- TABLE 1: gwac_programs
-- Master list of GWAC programs
-- ============================================

CREATE TABLE IF NOT EXISTS gwac_programs (
  id BIGSERIAL PRIMARY KEY,
  
  -- GWAC Identity
  gwac_key TEXT UNIQUE NOT NULL, -- 'alliant2', 'oasis_sb', 'cio_sp3'
  gwac_name TEXT NOT NULL, -- 'Alliant 2 Unrestricted'
  gwac_short_name TEXT, -- 'Alliant 2'
  
  -- Contract Details
  parent_contract_id TEXT, -- PIID: 'GS00Q17GWD2003'
  managing_agency TEXT, -- 'GSA', 'NIH NITAAC', 'NASA'
  managing_office TEXT, -- 'GSA FAS'
  
  -- GWAC Characteristics
  gwac_type TEXT, -- 'IT Services', 'Professional Services'
  contract_vehicle_type TEXT, -- 'GWAC', 'MAC', 'IDIQ'
  business_size TEXT, -- 'small_business', 'unrestricted', 'both'
  
  -- Contract Period
  award_date DATE,
  start_date DATE,
  end_date DATE,
  base_period_years INTEGER,
  option_periods INTEGER,
  
  -- Ceiling & Scope
  ceiling_value DECIMAL(20,2), -- Total contract ceiling
  ordering_period_end DATE,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'ordering_closed', 'predecessor'
  successor_gwac_key TEXT, -- Links to replacement GWAC
  
  -- URLs
  program_url TEXT,
  holder_list_url TEXT,
  documentation_url TEXT,
  
  -- Scope
  scope_description TEXT,
  naics_codes TEXT[], -- Primary NAICS codes
  psc_codes TEXT[], -- Product/Service codes
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gwac_programs_key ON gwac_programs(gwac_key);
CREATE INDEX IF NOT EXISTS idx_gwac_programs_parent_contract ON gwac_programs(parent_contract_id);
CREATE INDEX IF NOT EXISTS idx_gwac_programs_status ON gwac_programs(status);
CREATE INDEX IF NOT EXISTS idx_gwac_programs_agency ON gwac_programs(managing_agency);

COMMENT ON TABLE gwac_programs IS 'Master list of Government-Wide Acquisition Contracts';
COMMENT ON COLUMN gwac_programs.parent_contract_id IS 'Parent IDV PIID used in FPDS/USAspending';

-- ============================================
-- TABLE 2: gwac_holders
-- Current and historical GWAC holders
-- ============================================

CREATE TABLE IF NOT EXISTS gwac_holders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to GWAC
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE CASCADE,
  gwac_key TEXT NOT NULL,
  gwac_name TEXT NOT NULL,
  
  -- Company Identity
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage_code TEXT,
  
  -- Contract Details
  contract_number TEXT, -- Individual holder's contract #
  vehicle_contract_number TEXT, -- Task order vehicle #
  
  -- Status
  holder_status TEXT DEFAULT 'active', -- 'active', 'inactive', 'terminated', 'expired'
  
  -- Contract Period
  awarded_date DATE,
  start_date DATE,
  end_date DATE,
  
  -- Ceiling (if available)
  contract_ceiling DECIMAL(20,2), -- Individual holder ceiling
  
  -- Company Details (at time of award)
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_country TEXT,
  
  -- Contact Info
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  website TEXT,
  
  -- Business Classifications
  is_small_business BOOLEAN,
  is_8a BOOLEAN,
  is_women_owned BOOLEAN,
  is_veteran_owned BOOLEAN,
  is_hubzone BOOLEAN,
  
  -- Capabilities (if parsed from holder docs)
  capabilities TEXT[],
  scope_areas TEXT[],
  
  -- Data Source Tracking
  data_source TEXT, -- 'gsa_pdf', 'nitaac_website', 'manual_entry', 'sam_gov'
  source_url TEXT,
  source_file TEXT,
  
  -- Scraping Metadata
  last_verified DATE,
  scraped_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gwac_holders_program ON gwac_holders(gwac_program_id);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_company ON gwac_holders(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_company_name ON gwac_holders(company_name);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_uei ON gwac_holders(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_duns ON gwac_holders(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_status ON gwac_holders(holder_status);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_small_business ON gwac_holders(is_small_business) WHERE is_small_business = TRUE;

-- Unique constraint: one active holder record per company per GWAC
CREATE UNIQUE INDEX IF NOT EXISTS idx_gwac_holders_unique_active 
  ON gwac_holders(gwac_program_id, company_name) 
  WHERE holder_status = 'active';

COMMENT ON TABLE gwac_holders IS 'Companies that hold positions on GWAC contracts';
COMMENT ON COLUMN gwac_holders.holder_status IS 'Current status of this company on this GWAC';

-- ============================================
-- TABLE 3: gwac_spending_history
-- Historical spending data from USAspending.gov
-- ============================================

CREATE TABLE IF NOT EXISTS gwac_spending_history (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to GWAC & Company
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE CASCADE,
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE SET NULL,
  gwac_holder_id BIGINT REFERENCES gwac_holders(id) ON DELETE SET NULL,
  
  -- GWAC & Contractor
  gwac_key TEXT NOT NULL,
  gwac_name TEXT NOT NULL,
  gwac_parent_contract TEXT, -- Parent PIID
  contractor_name TEXT NOT NULL,
  contractor_uei TEXT,
  contractor_duns TEXT,
  
  -- Award Details
  award_id TEXT, -- Task order PIID
  award_type TEXT, -- Type code from USAspending
  award_description TEXT,
  
  -- Amounts
  award_amount DECIMAL(20,2),
  total_outlayed DECIMAL(20,2), -- Actual spending
  base_and_all_options_value DECIMAL(20,2),
  
  -- Dates
  award_date DATE,
  start_date DATE,
  end_date DATE,
  action_date DATE,
  
  -- Awarding Info
  awarding_agency TEXT,
  awarding_sub_agency TEXT,
  awarding_office TEXT,
  funding_agency TEXT,
  
  -- Contractor Location (at time of award)
  contractor_city TEXT,
  contractor_state TEXT,
  contractor_country TEXT,
  contractor_congressional_district TEXT,
  
  -- Place of Performance
  pop_city TEXT,
  pop_state TEXT,
  pop_country TEXT,
  pop_congressional_district TEXT,
  
  -- Data Source
  data_source TEXT DEFAULT 'usaspending', -- 'usaspending', 'fpds', 'gsa_dashboard'
  source_url TEXT,
  
  -- Metadata
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gwac_spending_program ON gwac_spending_history(gwac_program_id);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_company ON gwac_spending_history(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_holder ON gwac_spending_history(gwac_holder_id);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_contractor_name ON gwac_spending_history(contractor_name);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_uei ON gwac_spending_history(contractor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_award_id ON gwac_spending_history(award_id);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_award_date ON gwac_spending_history(award_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_amount ON gwac_spending_history(award_amount DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_agency ON gwac_spending_history(awarding_agency);

-- Full-text search on descriptions
CREATE INDEX IF NOT EXISTS idx_gwac_spending_fulltext ON gwac_spending_history 
  USING GIN(to_tsvector('english', COALESCE(award_description, '')));

COMMENT ON TABLE gwac_spending_history IS 'Historical GWAC spending and task order data from USAspending.gov and FPDS';
COMMENT ON COLUMN gwac_spending_history.award_amount IS 'Obligated amount for this award/modification';
COMMENT ON COLUMN gwac_spending_history.total_outlayed IS 'Actual amount spent (paid out)';

-- ============================================
-- TABLE 4: gwac_contractor_summary
-- Aggregated view of contractor GWAC participation
-- ============================================

CREATE TABLE IF NOT EXISTS gwac_contractor_summary (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contractor Identity
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  contractor_uei TEXT,
  contractor_duns TEXT,
  
  -- GWAC Participation
  gwac_count INTEGER DEFAULT 0, -- How many GWACs they hold
  gwac_list TEXT[], -- Array of GWAC names
  
  -- Spending Summary
  total_awards INTEGER DEFAULT 0, -- Number of task orders
  total_award_value DECIMAL(20,2) DEFAULT 0, -- Total $ across all GWACs
  total_outlayed DECIMAL(20,2) DEFAULT 0, -- Total $ actually spent
  
  -- Activity Timeline
  earliest_award_date DATE, -- First GWAC task order
  latest_award_date DATE, -- Most recent task order
  
  -- Top Agencies (JSON array)
  top_agencies JSONB, -- [{"agency": "DoD", "count": 50, "value": 10000000}]
  
  -- Awards by GWAC (JSON)
  awards_by_gwac JSONB, -- {"alliant2": {"count": 25, "value": 5000000}}
  
  -- Calculated Metrics
  avg_award_size DECIMAL(20,2),
  utilization_rate DECIMAL(5,2), -- outlayed / awarded * 100
  
  -- Last Updated
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gwac_summary_company ON gwac_contractor_summary(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_gwac_summary_contractor_name ON gwac_contractor_summary(contractor_name);
CREATE INDEX IF NOT EXISTS idx_gwac_summary_uei ON gwac_contractor_summary(contractor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_summary_gwac_count ON gwac_contractor_summary(gwac_count DESC);
CREATE INDEX IF NOT EXISTS idx_gwac_summary_total_value ON gwac_contractor_summary(total_award_value DESC NULLS LAST);

COMMENT ON TABLE gwac_contractor_summary IS 'Aggregated summary of each contractors GWAC participation and spending';
COMMENT ON COLUMN gwac_contractor_summary.gwac_count IS 'Number of different GWACs this contractor holds';
COMMENT ON COLUMN gwac_contractor_summary.utilization_rate IS 'Percentage of awarded dollars actually spent';

-- ============================================
-- VIEWS
-- ============================================

-- View: Active GWAC Holders with Spending
CREATE OR REPLACE VIEW gwac_holders_with_spending AS
SELECT 
  gh.id,
  gh.company_name,
  gh.vendor_uei,
  gh.gwac_name,
  gh.holder_status,
  gh.awarded_date,
  gh.is_small_business,
  COUNT(DISTINCT gs.id) as total_task_orders,
  SUM(gs.award_amount) as total_awarded,
  SUM(gs.total_outlayed) as total_spent,
  MAX(gs.award_date) as last_task_order_date,
  ROUND(
    CASE 
      WHEN SUM(gs.award_amount) > 0 
      THEN (SUM(gs.total_outlayed) / SUM(gs.award_amount) * 100)::numeric 
      ELSE 0 
    END, 2
  ) as utilization_rate_pct
FROM gwac_holders gh
LEFT JOIN gwac_spending_history gs ON gs.gwac_holder_id = gh.id
GROUP BY gh.id, gh.company_name, gh.vendor_uei, gh.gwac_name, 
         gh.holder_status, gh.awarded_date, gh.is_small_business;

COMMENT ON VIEW gwac_holders_with_spending IS 'GWAC holders with their spending metrics';

-- View: GWAC Programs with Holder Counts
CREATE OR REPLACE VIEW gwac_programs_summary AS
SELECT 
  gp.id,
  gp.gwac_key,
  gp.gwac_name,
  gp.managing_agency,
  gp.status,
  gp.award_date,
  gp.ceiling_value,
  COUNT(DISTINCT gh.id) as total_holders,
  COUNT(DISTINCT gh.id) FILTER (WHERE gh.holder_status = 'active') as active_holders,
  COUNT(DISTINCT gh.id) FILTER (WHERE gh.is_small_business = TRUE) as small_business_holders,
  COUNT(DISTINCT gs.id) as total_task_orders,
  SUM(gs.award_amount) as total_spending
FROM gwac_programs gp
LEFT JOIN gwac_holders gh ON gh.gwac_program_id = gp.id
LEFT JOIN gwac_spending_history gs ON gs.gwac_program_id = gp.id
GROUP BY gp.id, gp.gwac_key, gp.gwac_name, gp.managing_agency, 
         gp.status, gp.award_date, gp.ceiling_value;

COMMENT ON VIEW gwac_programs_summary IS 'GWAC programs with holder and spending summaries';

-- View: Top GWAC Contractors
CREATE OR REPLACE VIEW top_gwac_contractors AS
SELECT 
  contractor_name,
  contractor_uei,
  gwac_count,
  total_awards,
  total_award_value,
  total_outlayed,
  ROUND((total_outlayed / NULLIF(total_award_value, 0) * 100)::numeric, 2) as utilization_pct,
  gwac_list,
  latest_award_date,
  EXTRACT(DAYS FROM (NOW() - latest_award_date))::INTEGER as days_since_last_award
FROM gwac_contractor_summary
WHERE total_award_value > 0
ORDER BY total_award_value DESC;

COMMENT ON VIEW top_gwac_contractors IS 'Top GWAC contractors ranked by total spending';

-- View: Recent GWAC Activity (Last 90 days)
CREATE OR REPLACE VIEW recent_gwac_activity AS
SELECT 
  gs.gwac_name,
  gs.contractor_name,
  gs.contractor_uei,
  gs.award_id,
  gs.award_amount,
  gs.award_date,
  gs.awarding_agency,
  gs.award_description,
  gh.is_small_business
FROM gwac_spending_history gs
LEFT JOIN gwac_holders gh ON gs.gwac_holder_id = gh.id
WHERE gs.award_date >= NOW() - INTERVAL '90 days'
ORDER BY gs.award_date DESC;

COMMENT ON VIEW recent_gwac_activity IS 'GWAC task orders awarded in the last 90 days';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate contractor GWAC summary
CREATE OR REPLACE FUNCTION calculate_gwac_contractor_summary(p_contractor_uei TEXT)
RETURNS TABLE (
  gwac_count INTEGER,
  total_awards BIGINT,
  total_value NUMERIC,
  gwac_list TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT gs.gwac_key)::INTEGER as gwac_count,
    COUNT(gs.id)::BIGINT as total_awards,
    SUM(gs.award_amount)::NUMERIC as total_value,
    ARRAY_AGG(DISTINCT gs.gwac_name)::TEXT[] as gwac_list
  FROM gwac_spending_history gs
  WHERE gs.contractor_uei = p_contractor_uei;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_gwac_contractor_summary IS 'Calculate GWAC participation metrics for a specific contractor';

-- Function: Refresh contractor summary (for all contractors)
-- Simplified version - aggregates basic stats, builds JSON separately
CREATE OR REPLACE FUNCTION refresh_gwac_contractor_summaries()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER := 0;
BEGIN
  -- Truncate and rebuild summary table
  TRUNCATE TABLE gwac_contractor_summary;
  
  -- Build summary without the complex jsonb_object_agg for now
  INSERT INTO gwac_contractor_summary (
    company_intelligence_id,
    contractor_name,
    contractor_uei,
    contractor_duns,
    gwac_count,
    gwac_list,
    total_awards,
    total_award_value,
    total_outlayed,
    earliest_award_date,
    latest_award_date,
    awards_by_gwac,
    avg_award_size,
    utilization_rate,
    last_calculated
  )
  SELECT 
    MAX(company_intelligence_id),
    contractor_name,
    contractor_uei,
    contractor_duns,
    COUNT(DISTINCT gwac_key)::INTEGER,
    ARRAY_AGG(DISTINCT gwac_name ORDER BY gwac_name),
    COUNT(*)::INTEGER,
    SUM(award_amount),
    SUM(total_outlayed),
    MIN(award_date),
    MAX(award_date),
    NULL, -- Will be populated by a separate update if needed
    AVG(award_amount),
    CASE 
      WHEN SUM(award_amount) > 0 
      THEN (SUM(total_outlayed) / SUM(award_amount) * 100)
      ELSE 0 
    END,
    NOW()
  FROM gwac_spending_history
  GROUP BY contractor_name, contractor_uei, contractor_duns;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_gwac_contractor_summaries IS 'Rebuild gwac_contractor_summary table from spending history';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_gwac_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gwac_programs_updated_at
  BEFORE UPDATE ON gwac_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_gwac_updated_at();

CREATE TRIGGER trigger_update_gwac_holders_updated_at
  BEFORE UPDATE ON gwac_holders
  FOR EACH ROW
  EXECUTE FUNCTION update_gwac_updated_at();

-- ============================================
-- SEED DATA: Popular GWACs
-- ============================================

INSERT INTO gwac_programs (gwac_key, gwac_name, parent_contract_id, managing_agency, gwac_type, business_size, award_date, start_date, status, program_url) VALUES
('alliant2', 'Alliant 2 Unrestricted', 'GS00Q17GWD2003', 'General Services Administration', 'IT Services', 'unrestricted', '2017-08-29', '2017-08-29', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2'),
('alliant2_sb', 'Alliant 2 Small Business', 'GS00Q17GWD2015', 'General Services Administration', 'IT Services', 'small_business', '2018-01-31', '2018-01-31', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2/alliant-2-small-business'),
('stars3', '8(a) STARS III', 'GS00Q17GWD2501', 'General Services Administration', 'IT Services', 'small_business', '2021-11-08', '2021-11-08', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/8a-stars-iii'),
('oasis', 'OASIS Unrestricted', 'GS00Q14OADU130', 'General Services Administration', 'Professional Services', 'unrestricted', '2014-09-01', '2014-09-01', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis-unrestricted'),
('oasis_sb', 'OASIS Small Business', 'GS00Q14OADS226', 'General Services Administration', 'Professional Services', 'small_business', '2014-06-26', '2014-06-26', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis-small-business'),
('polaris', 'Polaris', 'GS00Q23GWD0001', 'General Services Administration', 'IT Services', 'both', '2023-08-15', '2023-08-15', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/polaris'),
('cio_sp3', 'CIO-SP3', 'HHSN316201200012W', 'National Institutes of Health', 'IT Services', 'both', '2012-05-17', '2012-05-17', 'active', 'https://nitaac.nih.gov/gwacs/cio-sp3'),
('cio_sp4', 'CIO-SP4', 'HHSN316202100002W', 'National Institutes of Health', 'IT Services', 'both', '2022-04-25', '2022-04-25', 'active', 'https://nitaac.nih.gov/gwacs/cio-sp4')
ON CONFLICT (gwac_key) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'GWAC Tracking Tables Created Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - gwac_programs (8 GWACs seeded)';
  RAISE NOTICE '  - gwac_holders (GWAC contractor lists)';
  RAISE NOTICE '  - gwac_spending_history (USAspending data)';
  RAISE NOTICE '  - gwac_contractor_summary (aggregated metrics)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  - gwac_holders_with_spending';
  RAISE NOTICE '  - gwac_programs_summary';
  RAISE NOTICE '  - top_gwac_contractors';
  RAISE NOTICE '  - recent_gwac_activity';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  - calculate_gwac_contractor_summary(uei)';
  RAISE NOTICE '  - refresh_gwac_contractor_summaries()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run: python scripts/gwac-historical-scraper.py';
  RAISE NOTICE '  2. Import CSV to gwac_spending_history table';
  RAISE NOTICE '  3. Run: SELECT refresh_gwac_contractor_summaries();';
  RAISE NOTICE '  4. Manually add holder lists to gwac_holders table';
  RAISE NOTICE '============================================';
END $$;

