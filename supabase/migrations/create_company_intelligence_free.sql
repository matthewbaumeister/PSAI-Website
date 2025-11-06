-- ============================================
-- COMPANY INTELLIGENCE - FREE DATA SOURCES
-- ============================================
-- This migration creates tables for enriching company data
-- using FREE public data sources instead of expensive APIs
-- 
-- Data Sources:
-- 1. SAM.gov Entity Management API (FREE)
-- 2. SEC EDGAR (FREE - public companies)
-- 3. OpenCorporates (FREE tier)
-- 4. Yahoo Finance (FREE - public companies)
--
-- Cost: $0/year (vs $60K-$120K for Crunchbase)
-- ============================================

-- ============================================
-- TABLE 1: company_intelligence
-- ============================================
-- Main table for all company enrichment data

CREATE TABLE IF NOT EXISTS company_intelligence (
  id BIGSERIAL PRIMARY KEY,
  
  -- Matching (Link to existing tables)
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage TEXT,
  
  -- SAM.gov Entity Data (FREE - covers ALL contractors)
  sam_legal_name TEXT,
  sam_dba_name TEXT,
  sam_business_type TEXT, -- 'Corporation', 'LLC', 'Partnership', etc.
  sam_incorporation_date DATE,
  sam_business_start_date DATE,
  sam_fiscal_year_end TEXT,
  sam_congressional_district TEXT,
  sam_registration_date DATE,
  sam_expiration_date DATE,
  sam_last_update_date DATE,
  sam_registration_status TEXT, -- 'Active', 'Expired', etc.
  
  -- Address (SAM.gov)
  headquarters_address TEXT,
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_zip TEXT,
  headquarters_country TEXT DEFAULT 'USA',
  mailing_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,
  
  -- Contact (SAM.gov)
  primary_contact_name TEXT,
  primary_contact_title TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  alternate_contact_name TEXT,
  alternate_email TEXT,
  alternate_phone TEXT,
  website TEXT,
  
  -- Small Business Classifications (SAM.gov)
  is_small_business BOOLEAN DEFAULT FALSE,
  is_woman_owned BOOLEAN DEFAULT FALSE,
  is_veteran_owned BOOLEAN DEFAULT FALSE,
  is_service_disabled_veteran_owned BOOLEAN DEFAULT FALSE,
  is_8a_program BOOLEAN DEFAULT FALSE,
  is_hubzone BOOLEAN DEFAULT FALSE,
  is_economically_disadvantaged BOOLEAN DEFAULT FALSE,
  small_business_types TEXT[], -- All SBA certifications
  
  -- NAICS Codes (SAM.gov)
  primary_naics TEXT,
  primary_naics_description TEXT,
  all_naics_codes TEXT[],
  naics_count INTEGER,
  
  -- PSC Codes (SAM.gov)
  primary_psc TEXT,
  all_psc_codes TEXT[],
  
  -- Business Size Indicators (SAM.gov)
  annual_revenue_range TEXT, -- From SAM optional fields
  employee_count_range TEXT, -- From SAM optional fields
  
  -- SEC EDGAR Data (PUBLIC COMPANIES ONLY)
  is_public_company BOOLEAN DEFAULT FALSE,
  stock_ticker TEXT,
  stock_exchange TEXT, -- 'NYSE', 'NASDAQ', etc.
  sec_cik TEXT, -- Central Index Key (10-digit)
  
  -- Financial Data (from most recent 10-K)
  sec_annual_revenue DECIMAL(15,2),
  sec_net_income DECIMAL(15,2),
  sec_total_assets DECIMAL(15,2),
  sec_stockholders_equity DECIMAL(15,2),
  sec_employee_count INTEGER,
  sec_fiscal_year INTEGER,
  sec_fiscal_year_end TEXT, -- 'December 31', etc.
  
  -- Government Contract Exposure (from 10-K if disclosed)
  sec_government_revenue DECIMAL(15,2),
  sec_government_revenue_pct DECIMAL(5,2), -- % of total revenue from gov
  sec_top_customer_govt BOOLEAN, -- Is government their top customer?
  
  -- Business Description (from 10-K)
  sec_business_description TEXT,
  sec_business_summary TEXT, -- Shorter version
  sec_industry_segment TEXT,
  sec_geographic_segments TEXT[],
  
  -- SEC Filing Info
  sec_last_filing_date DATE,
  sec_last_filing_type TEXT, -- '10-K', '10-Q', '8-K'
  sec_last_filing_url TEXT,
  
  -- OpenCorporates Data (ALL COMPANIES)
  oc_jurisdiction TEXT, -- 'us_ca', 'us_de', etc.
  oc_incorporation_state TEXT,
  oc_incorporation_date DATE,
  oc_company_number TEXT, -- State registration number
  oc_company_status TEXT, -- 'Active', 'Dissolved', 'Inactive'
  oc_company_type TEXT, -- 'Limited Liability Company', 'Corporation', etc.
  oc_registered_agent TEXT,
  oc_registered_address TEXT,
  oc_opencorporates_url TEXT,
  
  -- Yahoo Finance Data (PUBLIC COMPANIES)
  yf_market_cap DECIMAL(15,2),
  yf_current_price DECIMAL(10,2),
  yf_52_week_high DECIMAL(10,2),
  yf_52_week_low DECIMAL(10,2),
  yf_pe_ratio DECIMAL(10,2),
  yf_dividend_yield DECIMAL(5,2),
  yf_last_updated DATE,
  
  -- LinkedIn Data (Manual/Optional)
  linkedin_url TEXT,
  linkedin_followers INTEGER,
  linkedin_employee_count_range TEXT, -- '51-200', '201-500', etc.
  linkedin_description TEXT,
  linkedin_specialties TEXT[],
  linkedin_headquarters TEXT,
  
  -- Derived/Calculated Fields
  estimated_employee_count INTEGER, -- Best estimate from all sources
  estimated_annual_revenue DECIMAL(15,2), -- Best estimate from all sources
  estimated_revenue_source TEXT, -- Which source provided the estimate
  company_age_years INTEGER, -- Calculated from incorporation date
  years_in_federal_contracting INTEGER, -- From SAM registration date
  
  -- Data Quality Tracking
  data_sources TEXT[], -- ['sam.gov', 'sec', 'opencorporates', 'yahoo']
  data_quality_score INTEGER, -- 0-100 (calculated)
  confidence_level TEXT, -- 'high', 'medium', 'low'
  completeness_pct DECIMAL(5,2), -- % of fields populated
  
  -- Enrichment Status
  enrichment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'partial', 'failed'
  sam_enriched BOOLEAN DEFAULT FALSE,
  sec_enriched BOOLEAN DEFAULT FALSE,
  oc_enriched BOOLEAN DEFAULT FALSE,
  yf_enriched BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  last_enriched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sam_last_checked TIMESTAMP WITH TIME ZONE,
  sec_last_checked TIMESTAMP WITH TIME ZONE,
  oc_last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for company_intelligence
CREATE INDEX IF NOT EXISTS idx_ci_company_name ON company_intelligence(company_name);
CREATE INDEX IF NOT EXISTS idx_ci_uei ON company_intelligence(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_ci_duns ON company_intelligence(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_ci_cage ON company_intelligence(vendor_cage);
CREATE INDEX IF NOT EXISTS idx_ci_public ON company_intelligence(is_public_company) 
  WHERE is_public_company = TRUE;
CREATE INDEX IF NOT EXISTS idx_ci_small_business ON company_intelligence(is_small_business) 
  WHERE is_small_business = TRUE;
CREATE INDEX IF NOT EXISTS idx_ci_quality_score ON company_intelligence(data_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_ci_enrichment_status ON company_intelligence(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_ci_last_enriched ON company_intelligence(last_enriched);
CREATE INDEX IF NOT EXISTS idx_ci_sec_cik ON company_intelligence(sec_cik) WHERE sec_cik IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ci_ticker ON company_intelligence(stock_ticker) WHERE stock_ticker IS NOT NULL;

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_ci_search ON company_intelligence 
  USING GIN(to_tsvector('english', 
    COALESCE(company_name, '') || ' ' || 
    COALESCE(sam_legal_name, '') || ' ' ||
    COALESCE(sec_business_description, '')
  ));

-- ============================================
-- TABLE 2: sec_filings_cache
-- ============================================
-- Cache SEC filings to avoid re-downloading

CREATE TABLE IF NOT EXISTS sec_filings_cache (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  sec_cik TEXT NOT NULL,
  
  -- Filing Identification
  accession_number TEXT UNIQUE NOT NULL, -- Unique filing ID
  filing_type TEXT NOT NULL, -- '10-K', '10-Q', '8-K', 'DEF 14A'
  filing_date DATE NOT NULL,
  report_date DATE, -- Period end date
  fiscal_year INTEGER,
  fiscal_period TEXT, -- 'FY', 'Q1', 'Q2', 'Q3', 'Q4'
  
  -- Financial Data (from XBRL tags)
  revenue DECIMAL(15,2),
  cost_of_revenue DECIMAL(15,2),
  gross_profit DECIMAL(15,2),
  operating_income DECIMAL(15,2),
  net_income DECIMAL(15,2),
  
  -- Balance Sheet
  total_assets DECIMAL(15,2),
  current_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  stockholders_equity DECIMAL(15,2),
  
  -- Cash Flow
  operating_cash_flow DECIMAL(15,2),
  investing_cash_flow DECIMAL(15,2),
  financing_cash_flow DECIMAL(15,2),
  
  -- Employee Count (if disclosed)
  employee_count INTEGER,
  
  -- Government Contract Revenue (if disclosed in filing)
  government_revenue DECIMAL(15,2),
  government_revenue_pct DECIMAL(5,2),
  government_mentioned BOOLEAN DEFAULT FALSE, -- Does filing mention government contracts?
  
  -- Filing URLs
  filing_url TEXT, -- Link to filing on SEC.gov
  document_url TEXT, -- Direct link to HTML document
  xbrl_url TEXT, -- Link to XBRL data
  
  -- Full Text Content (for search)
  business_description TEXT,
  risk_factors TEXT,
  md_and_a TEXT, -- Management Discussion & Analysis
  full_text TEXT, -- Full filing text (large!)
  
  -- Metadata
  file_size_bytes BIGINT,
  processed BOOLEAN DEFAULT FALSE,
  processing_errors TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sec_filings_cache
CREATE INDEX IF NOT EXISTS idx_sec_company_id ON sec_filings_cache(company_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_sec_cik ON sec_filings_cache(sec_cik);
CREATE INDEX IF NOT EXISTS idx_sec_filing_date ON sec_filings_cache(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_sec_filing_type ON sec_filings_cache(filing_type);
CREATE INDEX IF NOT EXISTS idx_sec_fiscal_year ON sec_filings_cache(fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_sec_accession ON sec_filings_cache(accession_number);

-- Full-text search on filings
CREATE INDEX IF NOT EXISTS idx_sec_filing_text ON sec_filings_cache 
  USING GIN(to_tsvector('english', COALESCE(full_text, '')));

-- ============================================
-- TABLE 3: enrichment_queue
-- ============================================
-- Queue for processing company enrichments

CREATE TABLE IF NOT EXISTS company_enrichment_queue (
  id BIGSERIAL PRIMARY KEY,
  
  -- Company to Enrich
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage TEXT,
  source_table TEXT NOT NULL, -- 'fpds_contracts', 'fpds_company_stats', etc.
  source_id BIGINT,
  
  -- Priority (1-10, 10 = highest)
  priority INTEGER DEFAULT 5,
  priority_reason TEXT,
  
  -- Enrichment Type
  enrichment_type TEXT DEFAULT 'full', -- 'full', 'sam_only', 'sec_only', 'update'
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  
  -- Progress Tracking
  sam_completed BOOLEAN DEFAULT FALSE,
  sec_completed BOOLEAN DEFAULT FALSE,
  oc_completed BOOLEAN DEFAULT FALSE,
  yf_completed BOOLEAN DEFAULT FALSE,
  
  -- Results
  company_intelligence_id BIGINT REFERENCES company_intelligence(id),
  
  -- Error Handling
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for enrichment_queue
CREATE INDEX IF NOT EXISTS idx_enrich_queue_status ON company_enrichment_queue(status);
CREATE INDEX IF NOT EXISTS idx_enrich_queue_priority ON company_enrichment_queue(priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_enrich_queue_company ON company_enrichment_queue(company_name);
CREATE INDEX IF NOT EXISTS idx_enrich_queue_uei ON company_enrichment_queue(vendor_uei);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrich_queue_unique ON company_enrichment_queue(vendor_uei, vendor_duns)
  WHERE status IN ('pending', 'in_progress');

-- ============================================
-- TABLE 4: api_usage_log
-- ============================================
-- Track API calls for monitoring (even free APIs have rate limits)

CREATE TABLE IF NOT EXISTS company_intel_api_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- API Details
  api_source TEXT NOT NULL, -- 'sam.gov', 'sec.gov', 'opencorporates', 'yahoo_finance'
  endpoint TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  
  -- Request Details
  company_name TEXT,
  search_param TEXT, -- What we searched for (UEI, CIK, name, etc.)
  
  -- Response
  status_code INTEGER,
  success BOOLEAN,
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Rate Limiting (some free APIs have limits)
  rate_limit_remaining INTEGER,
  rate_limit_reset TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for api_log
CREATE INDEX IF NOT EXISTS idx_api_log_called_at ON company_intel_api_log(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_log_source ON company_intel_api_log(api_source);
CREATE INDEX IF NOT EXISTS idx_api_log_success ON company_intel_api_log(success);

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================
-- Add foreign keys to link to company_intelligence

-- Link fpds_company_stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fpds_company_stats' 
    AND column_name = 'company_intelligence_id'
  ) THEN
    ALTER TABLE fpds_company_stats 
    ADD COLUMN company_intelligence_id BIGINT REFERENCES company_intelligence(id),
    ADD COLUMN intelligence_enriched BOOLEAN DEFAULT FALSE,
    ADD COLUMN intelligence_last_updated TIMESTAMP WITH TIME ZONE;

    CREATE INDEX IF NOT EXISTS idx_fpds_stats_intel_id ON fpds_company_stats(company_intelligence_id);
  END IF;
END $$;

-- Link sam_gov_opportunities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sam_gov_opportunities' 
    AND column_name = 'awardee_intelligence_id'
  ) THEN
    ALTER TABLE sam_gov_opportunities
    ADD COLUMN awardee_intelligence_id BIGINT REFERENCES company_intelligence(id),
    ADD COLUMN awardee_intelligence_enriched BOOLEAN DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS idx_sam_opp_intel_id ON sam_gov_opportunities(awardee_intelligence_id);
  END IF;
END $$;

-- Link army_innovation_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'army_innovation_submissions' 
    AND column_name = 'company_intelligence_id'
  ) THEN
    ALTER TABLE army_innovation_submissions
    ADD COLUMN company_intelligence_id BIGINT REFERENCES company_intelligence(id),
    ADD COLUMN intelligence_enriched BOOLEAN DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS idx_army_sub_intel_id ON army_innovation_submissions(company_intelligence_id);
  END IF;
END $$;

-- ============================================
-- VIEWS
-- ============================================

-- View: Public Companies Summary
CREATE OR REPLACE VIEW public_companies_summary AS
SELECT 
  ci.id,
  ci.company_name,
  ci.stock_ticker,
  ci.sec_cik,
  ci.sec_annual_revenue,
  ci.sec_employee_count,
  ci.sec_government_revenue_pct,
  ci.yf_market_cap,
  ci.yf_current_price,
  fcs.total_contracts,
  fcs.total_value as fpds_contract_value,
  fcs.most_recent_contract_date,
  ROUND((ci.sec_government_revenue / NULLIF(ci.sec_annual_revenue, 0) * 100)::numeric, 2) as gov_revenue_pct_calculated
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
WHERE ci.is_public_company = TRUE
ORDER BY ci.sec_annual_revenue DESC NULLS LAST;

-- View: Small Business Intelligence
CREATE OR REPLACE VIEW small_business_intelligence AS
SELECT 
  ci.id,
  ci.company_name,
  ci.is_small_business,
  ci.is_woman_owned,
  ci.is_veteran_owned,
  ci.is_8a_program,
  ci.is_hubzone,
  ci.small_business_types,
  ci.estimated_employee_count,
  ci.estimated_annual_revenue,
  ci.company_age_years,
  fcs.total_contracts,
  fcs.total_value as total_fpds_value,
  fcs.sbir_contracts,
  ci.headquarters_state
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
WHERE ci.is_small_business = TRUE;

-- View: Enrichment Status Dashboard
CREATE OR REPLACE VIEW enrichment_status_summary AS
SELECT 
  enrichment_status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE sam_enriched = TRUE) as sam_enriched_count,
  COUNT(*) FILTER (WHERE sec_enriched = TRUE) as sec_enriched_count,
  COUNT(*) FILTER (WHERE oc_enriched = TRUE) as oc_enriched_count,
  AVG(data_quality_score) as avg_quality_score,
  MIN(last_enriched) as oldest_enrichment,
  MAX(last_enriched) as newest_enrichment
FROM company_intelligence
GROUP BY enrichment_status;

-- View: Companies Needing Enrichment
CREATE OR REPLACE VIEW companies_needing_enrichment AS
SELECT 
  fcs.company_name,
  fcs.vendor_uei,
  fcs.vendor_duns,
  fcs.total_contracts,
  fcs.total_value,
  fcs.most_recent_contract_date,
  CASE 
    WHEN fcs.total_value > 10000000 THEN 10
    WHEN fcs.total_value > 1000000 THEN 8
    WHEN fcs.total_value > 100000 THEN 6
    WHEN fcs.total_contracts > 10 THEN 5
    ELSE 3
  END as suggested_priority
FROM fpds_company_stats fcs
LEFT JOIN company_intelligence ci ON ci.vendor_uei = fcs.vendor_uei
WHERE ci.id IS NULL
  AND fcs.company_name IS NOT NULL
ORDER BY suggested_priority DESC, fcs.total_value DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate Data Quality Score
CREATE OR REPLACE FUNCTION calculate_data_quality_score(company_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  rec RECORD;
BEGIN
  SELECT * INTO rec FROM company_intelligence WHERE id = company_id;
  
  -- SAM.gov Data (40 points max)
  IF rec.sam_legal_name IS NOT NULL THEN score := score + 5; END IF;
  IF rec.headquarters_city IS NOT NULL THEN score := score + 5; END IF;
  IF rec.primary_email IS NOT NULL THEN score := score + 5; END IF;
  IF rec.website IS NOT NULL THEN score := score + 5; END IF;
  IF rec.primary_naics IS NOT NULL THEN score := score + 5; END IF;
  IF rec.sam_business_type IS NOT NULL THEN score := score + 5; END IF;
  IF rec.sam_incorporation_date IS NOT NULL THEN score := score + 5; END IF;
  IF rec.is_small_business IS NOT NULL THEN score := score + 5; END IF;
  
  -- SEC Data (30 points max - only for public companies)
  IF rec.is_public_company = TRUE THEN
    IF rec.sec_annual_revenue IS NOT NULL THEN score := score + 10; END IF;
    IF rec.sec_employee_count IS NOT NULL THEN score := score + 10; END IF;
    IF rec.sec_business_description IS NOT NULL THEN score := score + 10; END IF;
  END IF;
  
  -- OpenCorporates Data (15 points max)
  IF rec.oc_incorporation_date IS NOT NULL THEN score := score + 5; END IF;
  IF rec.oc_company_status IS NOT NULL THEN score := score + 5; END IF;
  IF rec.oc_company_type IS NOT NULL THEN score := score + 5; END IF;
  
  -- Derived Fields (15 points max)
  IF rec.estimated_employee_count IS NOT NULL THEN score := score + 5; END IF;
  IF rec.estimated_annual_revenue IS NOT NULL THEN score := score + 5; END IF;
  IF rec.company_age_years IS NOT NULL THEN score := score + 5; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function: Update All Quality Scores
CREATE OR REPLACE FUNCTION update_all_quality_scores()
RETURNS void AS $$
BEGIN
  UPDATE company_intelligence
  SET 
    data_quality_score = calculate_data_quality_score(id),
    completeness_pct = calculate_data_quality_score(id)::numeric,
    confidence_level = CASE 
      WHEN calculate_data_quality_score(id) >= 70 THEN 'high'
      WHEN calculate_data_quality_score(id) >= 40 THEN 'medium'
      ELSE 'low'
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_company_intel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_intel_updated_at
  BEFORE UPDATE ON company_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_company_intel_updated_at();

CREATE TRIGGER trigger_update_enrichment_queue_updated_at
  BEFORE UPDATE ON company_enrichment_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_company_intel_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE company_intelligence IS 'Company enrichment data from FREE public sources (SAM.gov, SEC, OpenCorporates)';
COMMENT ON TABLE sec_filings_cache IS 'Cached SEC filings to avoid re-downloading';
COMMENT ON TABLE company_enrichment_queue IS 'Queue for processing company enrichments';
COMMENT ON TABLE company_intel_api_log IS 'API usage log for monitoring rate limits';

COMMENT ON COLUMN company_intelligence.data_quality_score IS 'Calculated score (0-100) based on completeness';
COMMENT ON COLUMN company_intelligence.sec_government_revenue_pct IS 'Percentage of revenue from government contracts (from 10-K if disclosed)';
COMMENT ON COLUMN company_intelligence.estimated_employee_count IS 'Best estimate from all available sources (SEC, SAM, OpenCorporates)';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Company Intelligence Tables Created!';
  RAISE NOTICE 'FREE DATA SOURCES - $0/year cost';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - company_intelligence (main table)';
  RAISE NOTICE '  - sec_filings_cache (SEC filing storage)';
  RAISE NOTICE '  - company_enrichment_queue (processing queue)';
  RAISE NOTICE '  - company_intel_api_log (usage tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Sources Integrated:';
  RAISE NOTICE '  1. SAM.gov Entity Management API (FREE)';
  RAISE NOTICE '  2. SEC EDGAR (FREE)';
  RAISE NOTICE '  3. OpenCorporates (FREE tier)';
  RAISE NOTICE '  4. Yahoo Finance (FREE)';
  RAISE NOTICE '';
  RAISE NOTICE 'Modified Tables:';
  RAISE NOTICE '  - fpds_company_stats (added company_intelligence_id)';
  RAISE NOTICE '  - sam_gov_opportunities (added awardee_intelligence_id)';
  RAISE NOTICE '  - army_innovation_submissions (added company_intelligence_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Build SAM.gov enrichment script';
  RAISE NOTICE '  2. Build SEC EDGAR parser';
  RAISE NOTICE '  3. Add OpenCorporates integration';
  RAISE NOTICE '  4. Process all companies in queue';
  RAISE NOTICE '';
  RAISE NOTICE 'Total Cost: $0/year (vs $60K-$120K for Crunchbase)';
  RAISE NOTICE '============================================';
END $$;

