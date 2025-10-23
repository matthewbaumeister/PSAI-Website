-- ========================================
-- SCRAPING JOBS TABLE FOR PROGRESS TRACKING
-- ========================================
-- This table tracks all scraping jobs and their progress
-- Allows frontend to poll for real-time updates even after HTTP timeout

DROP TABLE IF EXISTS scraping_jobs CASCADE;

CREATE TABLE scraping_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'active' or 'historical'
  status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
  
  -- Progress tracking
  total_topics INTEGER DEFAULT 0,
  processed_topics INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  
  -- Current operation
  current_step TEXT,
  current_topic_code TEXT,
  current_topic_title TEXT,
  
  -- Results
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  preserved_records INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_details TEXT,
  
  -- Metadata
  date_range TEXT, -- For historical scrapes
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Logs (stored as JSONB for efficient querying)
  logs JSONB DEFAULT '[]'::jsonb
);

-- Index for efficient polling queries
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_started_at ON scraping_jobs(started_at DESC);
CREATE INDEX idx_scraping_jobs_last_updated ON scraping_jobs(last_updated DESC);

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_scraping_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scraping_job_timestamp
  BEFORE UPDATE ON scraping_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scraping_job_timestamp();

-- Enable Row Level Security (optional, for security)
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can do everything" ON scraping_jobs;
DROP POLICY IF EXISTS "Authenticated users can read" ON scraping_jobs;

-- Policy to allow service role to do everything
CREATE POLICY "Service role can do everything" ON scraping_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy to allow authenticated users to read
CREATE POLICY "Authenticated users can read" ON scraping_jobs
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE scraping_jobs IS 'Tracks progress of SBIR scraping jobs for real-time frontend updates';

