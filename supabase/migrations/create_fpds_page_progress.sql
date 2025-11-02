-- ============================================
-- FPDS Page-Level Progress Tracking
-- ============================================
-- 
-- This table tracks progress at the PAGE level (not day level)
-- Allows scraper to resume from exact page on restart
-- Prevents data loss when errors occur mid-day

CREATE TABLE IF NOT EXISTS fpds_page_progress (
  id BIGSERIAL PRIMARY KEY,
  
  -- Page identification
  date DATE NOT NULL,
  page_number INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  
  -- Statistics
  contracts_found INTEGER DEFAULT 0,
  contracts_inserted INTEGER DEFAULT 0,
  contracts_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one record per date+page
  UNIQUE(date, page_number)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_fpds_page_progress_date 
ON fpds_page_progress(date, page_number DESC);

CREATE INDEX IF NOT EXISTS idx_fpds_page_progress_status 
ON fpds_page_progress(status, date DESC);

CREATE INDEX IF NOT EXISTS idx_fpds_page_progress_completed 
ON fpds_page_progress(date, completed_at DESC) 
WHERE status = 'completed';

-- View: Summary by date
CREATE OR REPLACE VIEW fpds_daily_progress_summary AS
SELECT 
  date,
  COUNT(*) as total_pages,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_pages,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_pages,
  SUM(contracts_found) as total_found,
  SUM(contracts_inserted) as total_inserted,
  SUM(contracts_failed) as total_failed,
  MAX(page_number) as highest_page,
  MIN(completed_at) as started_at,
  MAX(completed_at) as last_updated
FROM fpds_page_progress
GROUP BY date
ORDER BY date DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON fpds_page_progress TO authenticated;
GRANT SELECT ON fpds_daily_progress_summary TO authenticated;

-- Comments
COMMENT ON TABLE fpds_page_progress IS 'Page-level progress tracking for FPDS scraper - prevents data loss';
COMMENT ON COLUMN fpds_page_progress.date IS 'Contract date being scraped (YYYY-MM-DD)';
COMMENT ON COLUMN fpds_page_progress.page_number IS 'Page number (1-based) for this date';
COMMENT ON COLUMN fpds_page_progress.status IS 'completed = page successfully scraped, failed = page failed after retries';
COMMENT ON VIEW fpds_daily_progress_summary IS 'Summary of scraping progress by date';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ fpds_page_progress table created!';
  RAISE NOTICE '   - Tracks progress at PAGE level';
  RAISE NOTICE '   - Allows resume from exact page';
  RAISE NOTICE '   - Prevents data loss on errors';
  RAISE NOTICE '   - Includes daily summary view';
END $$;

