-- ============================================
-- Recreate DoD News Scraper Log Table
-- ============================================
-- The old table had a different schema, we need to recreate it

-- Drop the old table
DROP TABLE IF EXISTS dod_news_scraper_log CASCADE;

-- Recreate with correct schema
CREATE TABLE dod_news_scraper_log (
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

CREATE INDEX idx_dod_news_scraper_log_started_at 
ON dod_news_scraper_log(started_at DESC);

-- Verify the new schema
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'dod_news_scraper_log'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ dod_news_scraper_log table recreated with correct schema!';
END $$;

