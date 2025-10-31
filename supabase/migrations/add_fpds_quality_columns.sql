-- ============================================
-- Add Data Quality Columns to FPDS Contracts
-- ============================================

-- Add data quality tracking columns
ALTER TABLE fpds_contracts
  ADD COLUMN IF NOT EXISTS vendor_name_key TEXT,
  ADD COLUMN IF NOT EXISTS amount_category TEXT,
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS data_quality_issues TEXT[],
  ADD COLUMN IF NOT EXISTS data_quality_warnings TEXT[],
  ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN fpds_contracts.vendor_name_key IS 'Normalized vendor name for fuzzy matching and deduplication';
COMMENT ON COLUMN fpds_contracts.amount_category IS 'Contract size: micro, small, medium, large, major, mega';
COMMENT ON COLUMN fpds_contracts.data_quality_score IS 'Data quality score (0-100)';
COMMENT ON COLUMN fpds_contracts.data_quality_issues IS 'Critical data quality issues';
COMMENT ON COLUMN fpds_contracts.data_quality_warnings IS 'Non-critical data quality warnings';
COMMENT ON COLUMN fpds_contracts.is_suspicious IS 'Flagged as potentially suspicious data';

-- Add indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_fpds_quality_score ON fpds_contracts(data_quality_score);
CREATE INDEX IF NOT EXISTS idx_fpds_suspicious ON fpds_contracts(is_suspicious) WHERE is_suspicious = TRUE;
CREATE INDEX IF NOT EXISTS idx_fpds_amount_category ON fpds_contracts(amount_category);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_key ON fpds_contracts(vendor_name_key);

-- Create view for high-quality contracts
CREATE OR REPLACE VIEW fpds_high_quality_contracts AS
SELECT *
FROM fpds_contracts
WHERE data_quality_score >= 80
  AND (is_suspicious = FALSE OR is_suspicious IS NULL);

-- Create view for suspicious contracts (for review)
CREATE OR REPLACE VIEW fpds_suspicious_contracts AS
SELECT 
  transaction_number,
  piid,
  vendor_name,
  current_total_value_of_award,
  contracting_agency_name,
  data_quality_score,
  data_quality_issues,
  data_quality_warnings,
  is_suspicious,
  last_scraped
FROM fpds_contracts
WHERE is_suspicious = TRUE
ORDER BY current_total_value_of_award DESC NULLS LAST;

-- Create view for data quality summary
CREATE OR REPLACE VIEW fpds_data_quality_summary AS
SELECT
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE data_quality_score >= 80) as high_quality,
  COUNT(*) FILTER (WHERE data_quality_score >= 60 AND data_quality_score < 80) as medium_quality,
  COUNT(*) FILTER (WHERE data_quality_score < 60) as low_quality,
  COUNT(*) FILTER (WHERE is_suspicious = TRUE) as suspicious,
  ROUND(AVG(data_quality_score), 2) as avg_quality_score,
  COUNT(*) FILTER (WHERE amount_category = 'micro') as micro_contracts,
  COUNT(*) FILTER (WHERE amount_category = 'small') as small_contracts,
  COUNT(*) FILTER (WHERE amount_category = 'medium') as medium_contracts,
  COUNT(*) FILTER (WHERE amount_category = 'large') as large_contracts,
  COUNT(*) FILTER (WHERE amount_category = 'major') as major_contracts,
  COUNT(*) FILTER (WHERE amount_category = 'mega') as mega_contracts
FROM fpds_contracts;

-- Grant access to views
GRANT SELECT ON fpds_high_quality_contracts TO authenticated;
GRANT SELECT ON fpds_suspicious_contracts TO authenticated;
GRANT SELECT ON fpds_data_quality_summary TO authenticated;

COMMENT ON VIEW fpds_high_quality_contracts IS 'Contracts with quality score >= 80 and not suspicious';
COMMENT ON VIEW fpds_suspicious_contracts IS 'Contracts flagged for manual review';
COMMENT ON VIEW fpds_data_quality_summary IS 'Overview of data quality metrics';

