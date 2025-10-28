-- ========================================
-- DSIP SCRAPER RUNS TRACKING TABLE
-- ========================================
-- This table tracks all DSIP scraper executions
-- Allows frontend to display last update time and who ran it

DROP TABLE IF EXISTS dsip_scraper_runs CASCADE;

CREATE TABLE dsip_scraper_runs (
  id BIGSERIAL PRIMARY KEY,
  run_type TEXT NOT NULL, -- 'manual' or 'cron'
  trigger_source TEXT NOT NULL, -- 'admin_ui', 'api', 'vercel_cron'
  
  -- User info (if manual run)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  
  -- Run details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Results
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  total_topics INTEGER DEFAULT 0,
  processed_topics INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  preserved_records INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_details TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_dsip_scraper_runs_started_at ON dsip_scraper_runs(started_at DESC);
CREATE INDEX idx_dsip_scraper_runs_status ON dsip_scraper_runs(status);
CREATE INDEX idx_dsip_scraper_runs_run_type ON dsip_scraper_runs(run_type);
CREATE INDEX idx_dsip_scraper_runs_user_id ON dsip_scraper_runs(user_id);

-- Enable Row Level Security
ALTER TABLE dsip_scraper_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view all scraper runs" ON dsip_scraper_runs;
DROP POLICY IF EXISTS "Service role can do everything" ON dsip_scraper_runs;

-- Policy to allow admin users to read
CREATE POLICY "Admin users can view all scraper runs" ON dsip_scraper_runs
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy to allow service role to do everything (for API/cron writes)
CREATE POLICY "Service role can do everything" ON dsip_scraper_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON dsip_scraper_runs TO authenticated;
GRANT ALL ON dsip_scraper_runs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE dsip_scraper_runs_id_seq TO service_role;

-- Function to get latest successful run
CREATE OR REPLACE FUNCTION get_latest_successful_scraper_run()
RETURNS TABLE (
  last_run_at TIMESTAMPTZ,
  last_run_by TEXT,
  total_records INTEGER,
  new_records INTEGER,
  updated_records INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.completed_at as last_run_at,
    COALESCE(sr.user_email, 'Automated Cron') as last_run_by,
    sr.total_topics as total_records,
    sr.new_records,
    sr.updated_records
  FROM dsip_scraper_runs sr
  WHERE sr.status = 'completed'
  ORDER BY sr.completed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE dsip_scraper_runs IS 'Tracks all DSIP scraper executions for monitoring and audit purposes';
COMMENT ON FUNCTION get_latest_successful_scraper_run IS 'Returns the most recent successful scraper run information';

