-- ============================================
-- Fix DoD News Scraper Log Table
-- ============================================
-- Adds missing duration_seconds column if it doesn't exist

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS dod_news_scraper_log (
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

-- Add duration_seconds column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dod_news_scraper_log' 
        AND column_name = 'duration_seconds'
    ) THEN
        ALTER TABLE dod_news_scraper_log ADD COLUMN duration_seconds INTEGER;
        RAISE NOTICE 'Added duration_seconds column';
    ELSE
        RAISE NOTICE 'duration_seconds column already exists';
    END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_dod_news_scraper_log_started_at 
ON dod_news_scraper_log(started_at DESC);

-- Verify the table structure
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

