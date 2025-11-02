-- ============================================
-- DoD Contract News Scraper - Database Schema
-- ============================================
-- This table stores daily DoD contract award announcements
-- scraped from defense.gov news releases
-- ============================================

CREATE TABLE dod_contract_news (
  id BIGSERIAL PRIMARY KEY,
  
  -- Article metadata
  article_id INTEGER NOT NULL,
  article_url TEXT NOT NULL,
  article_title TEXT,
  published_date DATE NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Parsed contract data
  vendor_name TEXT NOT NULL,
  vendor_location TEXT,
  vendor_city TEXT,
  vendor_state VARCHAR(2),
  contract_number TEXT,
  modification_number TEXT,
  parent_contract TEXT,
  
  -- Financial
  award_amount NUMERIC(15, 2),
  award_amount_text TEXT, -- "approximately $45 million"
  contract_type TEXT, -- "cost-plus-fixed-fee", "firm-fixed-price", etc.
  
  -- Description
  contract_description TEXT NOT NULL, -- Full paragraph
  work_description TEXT, -- Extracted work description
  program_name TEXT,
  
  -- Performance
  performance_locations TEXT[], -- Array of locations
  performance_cities TEXT[],
  performance_states TEXT[],
  completion_date DATE,
  start_date DATE,
  
  -- Funding
  fiscal_year INTEGER,
  funding_type TEXT,
  obligated_amount NUMERIC(15, 2),
  
  -- Government info
  contracting_activity TEXT,
  contracting_office_location TEXT,
  contracting_office_city TEXT,
  contracting_office_state VARCHAR(2),
  service_branch TEXT, -- Army, Navy, Air Force, etc.
  
  -- Points of contact
  poc_name TEXT,
  poc_title TEXT,
  poc_phone TEXT,
  poc_email TEXT,
  
  -- Business classification
  small_business_type TEXT, -- "small business", "8(a)", "SDVOSB", etc.
  is_small_business BOOLEAN DEFAULT FALSE,
  is_set_aside BOOLEAN DEFAULT FALSE,
  is_woman_owned BOOLEAN DEFAULT FALSE,
  is_veteran_owned BOOLEAN DEFAULT FALSE,
  is_hubzone BOOLEAN DEFAULT FALSE,
  
  -- Raw data
  raw_paragraph TEXT NOT NULL, -- Original paragraph text
  
  -- Cross-reference
  fpds_contract_id TEXT, -- Link to fpds_contracts.transaction_number
  fpds_linked_at TIMESTAMPTZ,
  
  -- Data quality
  parsing_confidence NUMERIC(3, 2), -- 0.00-1.00 confidence in parsing
  parsing_issues TEXT[], -- Any parsing warnings/issues
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  needs_review BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(article_id, contract_number)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_dod_news_published_date ON dod_contract_news(published_date DESC);
CREATE INDEX idx_dod_news_vendor_name ON dod_contract_news(vendor_name);
CREATE INDEX idx_dod_news_vendor_name_trgm ON dod_contract_news USING gin(vendor_name gin_trgm_ops);
CREATE INDEX idx_dod_news_contract_number ON dod_contract_news(contract_number) WHERE contract_number IS NOT NULL;
CREATE INDEX idx_dod_news_service_branch ON dod_contract_news(service_branch) WHERE service_branch IS NOT NULL;
CREATE INDEX idx_dod_news_fpds_link ON dod_contract_news(fpds_contract_id) WHERE fpds_contract_id IS NOT NULL;
CREATE INDEX idx_dod_news_award_amount ON dod_contract_news(award_amount DESC NULLS LAST);
CREATE INDEX idx_dod_news_small_business ON dod_contract_news(is_small_business) WHERE is_small_business = TRUE;
CREATE INDEX idx_dod_news_needs_review ON dod_contract_news(needs_review) WHERE needs_review = TRUE;

-- Full-text search on descriptions
CREATE INDEX idx_dod_news_description_fts ON dod_contract_news USING gin(to_tsvector('english', contract_description));
CREATE INDEX idx_dod_news_program_fts ON dod_contract_news USING gin(to_tsvector('english', program_name)) WHERE program_name IS NOT NULL;

-- ============================================
-- Scraper Progress Tracking
-- ============================================

CREATE TABLE dod_news_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_date DATE NOT NULL,
  article_url TEXT,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'no_article'
  articles_found INTEGER DEFAULT 0,
  contracts_extracted INTEGER DEFAULT 0,
  contracts_inserted INTEGER DEFAULT 0,
  contracts_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(scrape_date)
);

CREATE INDEX idx_dod_news_log_date ON dod_news_scraper_log(scrape_date DESC);
CREATE INDEX idx_dod_news_log_status ON dod_news_scraper_log(status);

-- ============================================
-- Views for Common Queries
-- ============================================

-- Recent awards with full details
CREATE VIEW dod_recent_awards AS
SELECT 
  id,
  vendor_name,
  vendor_location,
  award_amount,
  contract_number,
  contract_description,
  service_branch,
  published_date,
  poc_name,
  poc_phone,
  fpds_contract_id
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY published_date DESC, award_amount DESC;

-- Small business awards
CREATE VIEW dod_small_business_awards AS
SELECT 
  vendor_name,
  vendor_location,
  small_business_type,
  award_amount,
  contract_description,
  published_date,
  service_branch
FROM dod_contract_news
WHERE is_small_business = TRUE
ORDER BY published_date DESC;

-- Awards with FPDS cross-reference
CREATE VIEW dod_fpds_linked_awards AS
SELECT 
  news.vendor_name,
  news.award_amount as announced_amount,
  fpds.base_and_exercised_options_value as fpds_amount,
  news.contract_description as announcement,
  news.poc_name,
  news.poc_phone,
  fpds.naics_description,
  news.published_date,
  fpds.date_signed
FROM dod_contract_news news
INNER JOIN fpds_contracts fpds 
  ON news.fpds_contract_id = fpds.transaction_number
ORDER BY news.published_date DESC;

-- Daily summary statistics
CREATE VIEW dod_daily_award_stats AS
SELECT 
  published_date,
  COUNT(*) as total_awards,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  SUM(award_amount) as total_value,
  AVG(award_amount) as avg_award,
  COUNT(*) FILTER (WHERE is_small_business = TRUE) as small_business_awards,
  COUNT(*) FILTER (WHERE fpds_contract_id IS NOT NULL) as fpds_linked
FROM dod_contract_news
GROUP BY published_date
ORDER BY published_date DESC;

-- ============================================
-- Helper Functions
-- ============================================

-- Extract state from location string
CREATE OR REPLACE FUNCTION extract_state(location TEXT) 
RETURNS VARCHAR(50) AS $$
DECLARE
  state_abbrev TEXT;
  full_state TEXT;
BEGIN
  -- First try to extract 2-letter state abbreviation
  state_abbrev := SUBSTRING(location FROM ', ([A-Z]{2})$');
  IF state_abbrev IS NOT NULL THEN
    RETURN state_abbrev;
  END IF;
  
  -- Fallback: extract full state name (after last comma)
  full_state := TRIM(SUBSTRING(location FROM ',\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$'));
  RETURN full_state;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Extract city from location string
CREATE OR REPLACE FUNCTION extract_city(location TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN SUBSTRING(location FROM '^([^,]+)');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate data quality score
CREATE OR REPLACE FUNCTION calculate_dod_news_quality(record dod_contract_news)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base fields (40 points)
  IF record.vendor_name IS NOT NULL THEN score := score + 10; END IF;
  IF record.contract_number IS NOT NULL THEN score := score + 10; END IF;
  IF record.award_amount IS NOT NULL THEN score := score + 10; END IF;
  IF record.contract_description IS NOT NULL THEN score := score + 10; END IF;
  
  -- Important fields (30 points)
  IF record.vendor_location IS NOT NULL THEN score := score + 10; END IF;
  IF record.contracting_activity IS NOT NULL THEN score := score + 10; END IF;
  IF record.completion_date IS NOT NULL THEN score := score + 10; END IF;
  
  -- Nice-to-have fields (30 points)
  IF record.poc_name IS NOT NULL THEN score := score + 10; END IF;
  IF record.program_name IS NOT NULL THEN score := score + 10; END IF;
  IF record.fpds_contract_id IS NOT NULL THEN score := score + 10; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Triggers
-- ============================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dod_news_updated_at 
  BEFORE UPDATE ON dod_contract_news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-extract city/state from locations
CREATE OR REPLACE FUNCTION auto_extract_location_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only extract vendor city/state if they're NOT already set by the scraper
  IF NEW.vendor_location IS NOT NULL THEN
    IF NEW.vendor_city IS NULL THEN
      NEW.vendor_city := extract_city(NEW.vendor_location);
    END IF;
    IF NEW.vendor_state IS NULL THEN
      NEW.vendor_state := extract_state(NEW.vendor_location);
    END IF;
  END IF;
  
  -- Only extract contracting office location if not already set
  IF NEW.contracting_office_location IS NOT NULL THEN
    IF NEW.contracting_office_city IS NULL THEN
      NEW.contracting_office_city := extract_city(NEW.contracting_office_location);
    END IF;
    IF NEW.contracting_office_state IS NULL THEN
      NEW.contracting_office_state := extract_state(NEW.contracting_office_location);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extract_dod_news_locations
  BEFORE INSERT OR UPDATE ON dod_contract_news
  FOR EACH ROW
  EXECUTE FUNCTION auto_extract_location_fields();

-- ============================================
-- Sample Queries (Commented)
-- ============================================

-- Top vendors by total award value
-- SELECT vendor_name, COUNT(*) as awards, SUM(award_amount) as total_value
-- FROM dod_contract_news
-- WHERE published_date >= CURRENT_DATE - INTERVAL '1 year'
-- GROUP BY vendor_name
-- ORDER BY total_value DESC
-- LIMIT 20;

-- Awards by service branch
-- SELECT service_branch, COUNT(*) as awards, SUM(award_amount) as total_value
-- FROM dod_contract_news
-- WHERE published_date >= CURRENT_DATE - INTERVAL '1 year'
-- GROUP BY service_branch
-- ORDER BY total_value DESC;

-- Awards needing manual review
-- SELECT id, vendor_name, contract_description, parsing_confidence
-- FROM dod_contract_news
-- WHERE needs_review = TRUE OR parsing_confidence < 0.7
-- ORDER BY published_date DESC;

-- Link DoD news to FPDS (run after scraping)
-- UPDATE dod_contract_news news
-- SET fpds_contract_id = fpds.transaction_number, fpds_linked_at = NOW()
-- FROM fpds_contracts fpds
-- WHERE news.contract_number = fpds.piid
--   AND news.fpds_contract_id IS NULL;

