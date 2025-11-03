-- =====================================================
-- Scraper Runs Tracker
-- =====================================================
-- Tracks all automated scraper runs with detailed statistics
-- Used by all 4 daily cron jobs (FPDS, DoD, SAM.gov, DSIP)
-- =====================================================

CREATE TABLE IF NOT EXISTS scraper_runs (
  -- Primary Keys
  id BIGSERIAL PRIMARY KEY,
  
  -- Scraper Info
  scraper_name TEXT NOT NULL,  -- 'fpds', 'dod-news', 'sam-gov', 'dsip'
  run_date DATE NOT NULL,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Status
  status TEXT NOT NULL,  -- 'running', 'success', 'failed', 'rate_limited'
  
  -- Statistics (JSONB for flexibility)
  stats JSONB,  -- { total: 123, new: 45, updated: 78, errors: 0 }
  
  -- Error Info
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  triggered_by TEXT DEFAULT 'cron',  -- 'cron' or 'manual'
  vercel_deployment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_scraper_runs_name ON scraper_runs(scraper_name);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_date ON scraper_runs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started ON scraper_runs(started_at DESC);

-- Composite index for latest run by scraper
CREATE INDEX IF NOT EXISTS idx_scraper_runs_name_date ON scraper_runs(scraper_name, run_date DESC);

-- =====================================================
-- Helper Views
-- =====================================================

-- Latest run for each scraper
CREATE OR REPLACE VIEW latest_scraper_runs AS
SELECT DISTINCT ON (scraper_name)
  scraper_name,
  run_date,
  started_at,
  completed_at,
  duration_seconds,
  status,
  stats,
  error_message
FROM scraper_runs
ORDER BY scraper_name, started_at DESC;

-- Today's runs
CREATE OR REPLACE VIEW todays_scraper_runs AS
SELECT 
  scraper_name,
  run_date,
  started_at,
  completed_at,
  duration_seconds,
  status,
  stats
FROM scraper_runs
WHERE DATE(started_at) = CURRENT_DATE
ORDER BY started_at DESC;

-- Failed runs (last 7 days)
CREATE OR REPLACE VIEW recent_failed_runs AS
SELECT 
  scraper_name,
  run_date,
  started_at,
  status,
  error_message
FROM scraper_runs
WHERE status IN ('failed', 'rate_limited')
  AND started_at >= NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Start a new scraper run
CREATE OR REPLACE FUNCTION start_scraper_run(
  p_scraper_name TEXT,
  p_run_date DATE DEFAULT CURRENT_DATE,
  p_triggered_by TEXT DEFAULT 'cron'
)
RETURNS BIGINT AS $$
DECLARE
  v_run_id BIGINT;
BEGIN
  INSERT INTO scraper_runs (
    scraper_name,
    run_date,
    status,
    triggered_by,
    started_at
  ) VALUES (
    p_scraper_name,
    p_run_date,
    'running',
    p_triggered_by,
    NOW()
  )
  RETURNING id INTO v_run_id;
  
  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- Complete a scraper run (success)
CREATE OR REPLACE FUNCTION complete_scraper_run(
  p_run_id BIGINT,
  p_stats JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE scraper_runs
  SET 
    status = 'success',
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    stats = p_stats
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Fail a scraper run
CREATE OR REPLACE FUNCTION fail_scraper_run(
  p_run_id BIGINT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_is_rate_limit BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  UPDATE scraper_runs
  SET 
    status = CASE 
      WHEN p_is_rate_limit THEN 'rate_limited'
      ELSE 'failed'
    END,
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    error_message = p_error_message,
    error_stack = p_error_stack
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Get scraper statistics (last 30 days)
CREATE OR REPLACE FUNCTION get_scraper_statistics(p_scraper_name TEXT)
RETURNS TABLE (
  total_runs BIGINT,
  successful_runs BIGINT,
  failed_runs BIGINT,
  rate_limited_runs BIGINT,
  avg_duration_seconds NUMERIC,
  last_run_date TIMESTAMPTZ,
  last_run_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_runs,
    COUNT(*) FILTER (WHERE status = 'success')::BIGINT as successful_runs,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_runs,
    COUNT(*) FILTER (WHERE status = 'rate_limited')::BIGINT as rate_limited_runs,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(started_at) as last_run_date,
    (SELECT status FROM scraper_runs 
     WHERE scraper_name = p_scraper_name 
     ORDER BY started_at DESC 
     LIMIT 1) as last_run_status
  FROM scraper_runs
  WHERE scraper_name = p_scraper_name
    AND started_at >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE scraper_runs IS 'Tracks all automated scraper runs with timing, status, and statistics';
COMMENT ON COLUMN scraper_runs.scraper_name IS 'Name of the scraper: fpds, dod-news, sam-gov, or dsip';
COMMENT ON COLUMN scraper_runs.run_date IS 'Date being scraped (usually yesterday for most scrapers)';
COMMENT ON COLUMN scraper_runs.stats IS 'JSON object with scraper-specific statistics';
COMMENT ON COLUMN scraper_runs.triggered_by IS 'How the run was triggered: cron (automatic) or manual';

