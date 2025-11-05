-- ============================================
-- Create Scraper Log Tables for All Cron Jobs
-- ============================================
-- This adds missing scraper_log tables so admin dashboard
-- can accurately show when each cron job last ran

-- ============================================
-- Congress.gov Bills Scraper Log
-- ============================================
CREATE TABLE IF NOT EXISTS congress_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'daily', 'backfill', 'manual'
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT congress_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_congress_scraper_log_started_at 
ON congress_scraper_log(started_at DESC);

-- ============================================
-- DoD Contract News Scraper Log
-- ============================================
CREATE TABLE IF NOT EXISTS dod_news_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'daily', 'backfill', 'manual'
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT dod_news_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_dod_news_scraper_log_started_at 
ON dod_news_scraper_log(started_at DESC);

-- ============================================
-- SAM.gov Opportunities Scraper Log
-- ============================================
CREATE TABLE IF NOT EXISTS sam_gov_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'daily', 'backfill', 'manual'
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT sam_gov_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_sam_gov_scraper_log_started_at 
ON sam_gov_scraper_log(started_at DESC);

-- ============================================
-- SBIR/STTR Awards Scraper Log
-- ============================================
CREATE TABLE IF NOT EXISTS sbir_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'daily', 'backfill', 'manual'
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT sbir_scraper_log_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_sbir_scraper_log_started_at 
ON sbir_scraper_log(started_at DESC);

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Scraper log tables created successfully!';
  RAISE NOTICE '   - congress_scraper_log';
  RAISE NOTICE '   - dod_news_scraper_log';
  RAISE NOTICE '   - sam_gov_scraper_log';
  RAISE NOTICE '   - sbir_scraper_log';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update each cron job to write to its scraper_log table';
  RAISE NOTICE '2. Update admin dashboard API to query these tables';
END $$;

