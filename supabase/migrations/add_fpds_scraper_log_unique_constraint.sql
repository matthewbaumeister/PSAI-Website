-- Add unique constraint to fpds_scraper_log for UPSERT to work
-- This allows us to track progress per date range

-- Add unique constraint on scrape_type and date_range
ALTER TABLE fpds_scraper_log 
ADD CONSTRAINT fpds_scraper_log_type_range_unique 
UNIQUE (scrape_type, date_range);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fpds_scraper_log_status 
ON fpds_scraper_log(scrape_type, date_range, status, updated_at DESC);

-- Add comment
COMMENT ON CONSTRAINT fpds_scraper_log_type_range_unique ON fpds_scraper_log 
IS 'Ensures only one active scrape per type/date_range combination';

