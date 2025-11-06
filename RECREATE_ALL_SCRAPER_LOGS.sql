-- ============================================
-- Recreate ALL Scraper Log Tables
-- ============================================
-- Ensures all tables have the correct, consistent schema

-- ============================================
-- 1. Congress.gov Bills Scraper Log
-- ============================================
DROP TABLE IF EXISTS congress_scraper_log CASCADE;

CREATE TABLE congress_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL,
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT congress_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX idx_congress_scraper_log_started_at 
ON congress_scraper_log(started_at DESC);

-- ============================================
-- 2. DoD Contract News Scraper Log
-- ============================================
DROP TABLE IF EXISTS dod_news_scraper_log CASCADE;

CREATE TABLE dod_news_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL,
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT dod_news_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX idx_dod_news_scraper_log_started_at 
ON dod_news_scraper_log(started_at DESC);

-- ============================================
-- 3. SAM.gov Opportunities Scraper Log
-- ============================================
DROP TABLE IF EXISTS sam_gov_scraper_log CASCADE;

CREATE TABLE sam_gov_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL,
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT sam_gov_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX idx_sam_gov_scraper_log_started_at 
ON sam_gov_scraper_log(started_at DESC);

-- ============================================
-- 4. SBIR/STTR Awards Scraper Log
-- ============================================
DROP TABLE IF EXISTS sbir_scraper_log CASCADE;

CREATE TABLE sbir_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL,
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT sbir_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX idx_sbir_scraper_log_started_at 
ON sbir_scraper_log(started_at DESC);

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All scraper log tables recreated with correct schema!';
  RAISE NOTICE '   - congress_scraper_log';
  RAISE NOTICE '   - dod_news_scraper_log';
  RAISE NOTICE '   - sam_gov_scraper_log';
  RAISE NOTICE '   - sbir_scraper_log';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: army_innovation_scraper_log and fpds_scraper_log were NOT recreated';
  RAISE NOTICE '   (They already have the correct schema)';
END $$;

