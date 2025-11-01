-- ============================================
-- CREATE: Failed Contracts Tracking Table
-- ============================================
-- Track individual contract fetch failures for efficient retries

CREATE TABLE IF NOT EXISTS fpds_failed_contracts (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contract identification
  contract_id TEXT NOT NULL, -- The award ID from USASpending.gov
  generated_unique_award_id TEXT, -- Alternative ID if available
  
  -- Error details
  error_message TEXT,
  error_type TEXT, -- 'fetch_failed', 'details_error', 'timeout', etc.
  
  -- Retry tracking
  attempt_count INTEGER DEFAULT 1,
  first_failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Scraper run context
  scrape_run_id BIGINT REFERENCES fpds_scraper_log(id) ON DELETE SET NULL,
  date_range TEXT, -- Which date range this contract was part of
  page_number INTEGER, -- Which page it was on
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_fpds_failed_contracts_id 
ON fpds_failed_contracts(contract_id);

CREATE INDEX IF NOT EXISTS idx_fpds_failed_contracts_unresolved 
ON fpds_failed_contracts(resolved, last_attempted_at DESC) 
WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_fpds_failed_contracts_date_range 
ON fpds_failed_contracts(date_range, resolved);

-- View for easy retry querying
CREATE OR REPLACE VIEW fpds_failed_contracts_to_retry AS
SELECT 
  contract_id,
  generated_unique_award_id,
  error_type,
  error_message,
  attempt_count,
  first_failed_at,
  last_attempted_at,
  date_range,
  page_number,
  EXTRACT(EPOCH FROM (NOW() - last_attempted_at)) / 3600 as hours_since_last_attempt
FROM fpds_failed_contracts
WHERE resolved = FALSE
ORDER BY attempt_count ASC, last_attempted_at ASC;

-- Function to mark a contract as resolved
CREATE OR REPLACE FUNCTION mark_fpds_contract_resolved(
  p_contract_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE fpds_failed_contracts
  SET resolved = TRUE,
      resolved_at = NOW()
  WHERE contract_id = p_contract_id
    AND resolved = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ fpds_failed_contracts tracking table created!';
  RAISE NOTICE '   - Tracks individual contract fetch failures';
  RAISE NOTICE '   - Includes retry count and error details';
  RAISE NOTICE '   - View: fpds_failed_contracts_to_retry';
  RAISE NOTICE '   - Function: mark_fpds_contract_resolved(contract_id)';
END $$;

