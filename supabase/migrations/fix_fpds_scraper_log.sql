-- ============================================
-- FIX: Add missing columns and constraints to fpds_scraper_log
-- ============================================
-- The scraper needs these columns for resume logic and a unique constraint for upsert

-- Add missing columns
ALTER TABLE fpds_scraper_log 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_page_processed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_processed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_inserted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_errors INTEGER DEFAULT 0;

-- Add unique constraint for upsert to work
-- This allows the scraper to update existing records or insert new ones
ALTER TABLE fpds_scraper_log 
ADD CONSTRAINT fpds_scraper_log_unique_scrape 
UNIQUE (scrape_type, date_range);

-- Update existing records to have updated_at = started_at if null
UPDATE fpds_scraper_log 
SET updated_at = started_at 
WHERE updated_at IS NULL;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_fpds_scraper_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_fpds_scraper_log_updated_at ON fpds_scraper_log;

CREATE TRIGGER set_fpds_scraper_log_updated_at
  BEFORE UPDATE ON fpds_scraper_log
  FOR EACH ROW
  EXECUTE FUNCTION update_fpds_scraper_log_updated_at();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fpds_scraper_log_lookup 
ON fpds_scraper_log(scrape_type, date_range, status, updated_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ fpds_scraper_log table fixed!';
  RAISE NOTICE '   - Added updated_at column';
  RAISE NOTICE '   - Added last_page_processed column';
  RAISE NOTICE '   - Added total_processed, total_inserted, total_errors columns';
  RAISE NOTICE '   - Created auto-update trigger';
  RAISE NOTICE '   - Added performance index';
END $$;

