-- DSIP Scraping Jobs Table
-- Stores information about scraping jobs for resumability and monitoring

CREATE TABLE IF NOT EXISTS dsip_scraping_jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
    type TEXT NOT NULL CHECK (type IN ('full', 'quick')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_topics INTEGER NOT NULL DEFAULT 0,
    processed_topics INTEGER NOT NULL DEFAULT 0,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    error TEXT,
    logs JSONB DEFAULT '[]',
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_completion TIMESTAMPTZ,
    current_page INTEGER DEFAULT 0,
    current_topic_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dsip_scraping_jobs_status ON dsip_scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_dsip_scraping_jobs_type ON dsip_scraping_jobs(type);
CREATE INDEX IF NOT EXISTS idx_dsip_scraping_jobs_last_activity ON dsip_scraping_jobs(last_activity);
CREATE INDEX IF NOT EXISTS idx_dsip_scraping_jobs_created_at ON dsip_scraping_jobs(created_at);

-- Enable Row Level Security
ALTER TABLE dsip_scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view all scraping jobs" ON dsip_scraping_jobs
    FOR SELECT USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'isAdmin' = 'true');

CREATE POLICY "Admin users can insert scraping jobs" ON dsip_scraping_jobs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'isAdmin' = 'true');

CREATE POLICY "Admin users can update scraping jobs" ON dsip_scraping_jobs
    FOR UPDATE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'isAdmin' = 'true');

CREATE POLICY "Admin users can delete scraping jobs" ON dsip_scraping_jobs
    FOR DELETE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'isAdmin' = 'true');

-- Grant permissions
GRANT ALL ON dsip_scraping_jobs TO authenticated;
GRANT ALL ON dsip_scraping_jobs TO service_role;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dsip_scraping_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_dsip_scraping_jobs_updated_at
    BEFORE UPDATE ON dsip_scraping_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_dsip_scraping_jobs_updated_at();

-- Create function to clean up old completed jobs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_dsip_scraping_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM dsip_scraping_jobs 
    WHERE status IN ('completed', 'failed') 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old jobs (optional - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-dsip-jobs', '0 2 * * *', 'SELECT cleanup_old_dsip_scraping_jobs();');

-- Insert sample data for testing (optional)
-- INSERT INTO dsip_scraping_jobs (id, status, type, progress, total_topics, processed_topics, start_time, last_activity)
-- VALUES ('sample_job_001', 'completed', 'quick', 100, 150, 150, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

COMMENT ON TABLE dsip_scraping_jobs IS 'Stores DSIP scraping job information for resumability and monitoring';
COMMENT ON COLUMN dsip_scraping_jobs.id IS 'Unique job identifier';
COMMENT ON COLUMN dsip_scraping_jobs.status IS 'Current job status: pending, running, completed, failed, paused';
COMMENT ON COLUMN dsip_scraping_jobs.type IS 'Job type: full (complete refresh) or quick (recent updates only)';
COMMENT ON COLUMN dsip_scraping_jobs.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN dsip_scraping_jobs.total_topics IS 'Total number of topics to process';
COMMENT ON COLUMN dsip_scraping_jobs.processed_topics IS 'Number of topics already processed';
COMMENT ON COLUMN dsip_scraping_jobs.start_time IS 'When the job started';
COMMENT ON COLUMN dsip_scraping_jobs.end_time IS 'When the job completed or failed';
COMMENT ON COLUMN dsip_scraping_jobs.error IS 'Error message if job failed';
COMMENT ON COLUMN dsip_scraping_jobs.logs IS 'Array of log messages from the scraping process';
COMMENT ON COLUMN dsip_scraping_jobs.last_activity IS 'Last time the job was active (for detecting stalled jobs)';
COMMENT ON COLUMN dsip_scraping_jobs.estimated_completion IS 'Estimated completion time based on current progress';
COMMENT ON COLUMN dsip_scraping_jobs.current_page IS 'Current page being processed (for resuming)';
COMMENT ON COLUMN dsip_scraping_jobs.current_topic_index IS 'Current topic index being processed (for resuming)';
