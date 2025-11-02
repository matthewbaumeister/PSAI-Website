-- =====================================================
-- DoD Contract News - Quality Scoring & Outlier Detection
-- =====================================================
-- This migration adds quality scoring, outlier detection, and data normalization
-- to the DoD contract news system. NO data is discarded - outliers are flagged for review.

-- Add quality and review fields
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 50 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  ADD COLUMN IF NOT EXISTS quality_flags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_reasons TEXT[],
  ADD COLUMN IF NOT EXISTS is_outlier BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS outlier_type TEXT,
  ADD COLUMN IF NOT EXISTS amount_percentile NUMERIC,
  ADD COLUMN IF NOT EXISTS has_complete_vendor_info BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_complete_contract_info BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_normalized_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- Create index for quality queries
CREATE INDEX IF NOT EXISTS idx_dod_quality_score ON dod_contract_news(data_quality_score);
CREATE INDEX IF NOT EXISTS idx_dod_needs_review ON dod_contract_news(needs_review) WHERE needs_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_dod_outliers ON dod_contract_news(is_outlier) WHERE is_outlier = TRUE;

-- =====================================================
-- Quality Scoring Function
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_dod_quality_score(
  p_vendor_name TEXT,
  p_vendor_city TEXT,
  p_vendor_state TEXT,
  p_contract_number TEXT,
  p_award_amount NUMERIC,
  p_award_amount_text TEXT,
  p_service_branch TEXT,
  p_parsing_confidence NUMERIC
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 50; -- Base score
BEGIN
  -- Vendor information (30 points max)
  IF p_vendor_name IS NOT NULL AND p_vendor_name != 'Unknown Vendor' THEN
    v_score := v_score + 10;
  END IF;
  
  IF p_vendor_city IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  IF p_vendor_state IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  -- Contract information (30 points max)
  IF p_contract_number IS NOT NULL AND LENGTH(p_contract_number) >= 10 THEN
    v_score := v_score + 15;
  END IF;
  
  IF p_award_amount IS NOT NULL AND p_award_amount > 0 THEN
    v_score := v_score + 15;
  END IF;
  
  -- Service branch (10 points)
  IF p_service_branch IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  -- Parsing confidence (10 points max)
  IF p_parsing_confidence IS NOT NULL THEN
    v_score := v_score + (p_parsing_confidence * 10)::INTEGER;
  END IF;
  
  -- Cap at 100
  IF v_score > 100 THEN
    v_score := 100;
  END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Outlier Detection Function
-- =====================================================
CREATE OR REPLACE FUNCTION detect_dod_outliers() RETURNS VOID AS $$
DECLARE
  v_p95 NUMERIC;
  v_p99 NUMERIC;
  v_median NUMERIC;
BEGIN
  -- Calculate percentiles for award amounts
  SELECT 
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY award_amount),
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY award_amount),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY award_amount)
  INTO v_p95, v_p99, v_median
  FROM dod_contract_news
  WHERE award_amount IS NOT NULL;
  
  -- Flag extreme high values (>99th percentile)
  UPDATE dod_contract_news
  SET 
    is_outlier = TRUE,
    outlier_type = 'extreme_high_value',
    amount_percentile = 99,
    needs_review = TRUE,
    review_reasons = ARRAY_APPEND(COALESCE(review_reasons, ARRAY[]::TEXT[]), 'Award amount in top 1% - verify accuracy')
  WHERE award_amount > v_p99
    AND (is_outlier IS NULL OR is_outlier = FALSE);
  
  -- Flag very high values (95-99th percentile) - informational only
  UPDATE dod_contract_news
  SET 
    amount_percentile = 95
  WHERE award_amount > v_p95 AND award_amount <= v_p99
    AND amount_percentile IS NULL;
  
  -- Flag suspiciously low values for large contractors
  UPDATE dod_contract_news
  SET 
    is_outlier = TRUE,
    outlier_type = 'suspiciously_low',
    needs_review = TRUE,
    review_reasons = ARRAY_APPEND(COALESCE(review_reasons, ARRAY[]::TEXT[]), 'Low amount for major contractor - verify unit')
  WHERE award_amount < 10000
    AND (
      vendor_name ILIKE '%Lockheed Martin%' OR
      vendor_name ILIKE '%Boeing%' OR
      vendor_name ILIKE '%Raytheon%' OR
      vendor_name ILIKE '%Northrop Grumman%' OR
      vendor_name ILIKE '%General Dynamics%'
    )
    AND (is_outlier IS NULL OR is_outlier = FALSE);
  
  -- Flag missing critical information
  UPDATE dod_contract_news
  SET 
    needs_review = TRUE,
    review_reasons = ARRAY_APPEND(COALESCE(review_reasons, ARRAY[]::TEXT[]), 'Missing vendor location - manual lookup needed')
  WHERE (vendor_city IS NULL OR vendor_state IS NULL)
    AND award_amount > v_median
    AND NOT needs_review;
  
  -- Mark complete vendor info
  UPDATE dod_contract_news
  SET has_complete_vendor_info = TRUE
  WHERE vendor_name IS NOT NULL 
    AND vendor_name != 'Unknown Vendor'
    AND vendor_city IS NOT NULL 
    AND vendor_state IS NOT NULL;
  
  -- Mark complete contract info
  UPDATE dod_contract_news
  SET has_complete_contract_info = TRUE
  WHERE contract_number IS NOT NULL 
    AND LENGTH(contract_number) >= 10
    AND award_amount IS NOT NULL
    AND service_branch IS NOT NULL;
  
  -- Update normalized timestamp
  UPDATE dod_contract_news
  SET data_normalized_at = NOW()
  WHERE data_normalized_at IS NULL;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger to Calculate Quality Score on Insert/Update
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_calculate_dod_quality() RETURNS TRIGGER AS $$
BEGIN
  NEW.data_quality_score := calculate_dod_quality_score(
    NEW.vendor_name,
    NEW.vendor_city,
    NEW.vendor_state,
    NEW.contract_number,
    NEW.award_amount,
    NEW.award_amount_text,
    NEW.service_branch,
    NEW.parsing_confidence
  );
  
  -- Auto-flag low quality contracts for review
  IF NEW.data_quality_score < 60 THEN
    NEW.needs_review := TRUE;
    NEW.review_reasons := ARRAY_APPEND(COALESCE(NEW.review_reasons, ARRAY[]::TEXT[]), 'Low quality score - missing key fields');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dod_quality_score ON dod_contract_news;
CREATE TRIGGER trigger_dod_quality_score
  BEFORE INSERT OR UPDATE ON dod_contract_news
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_dod_quality();

-- =====================================================
-- Views for Quality Monitoring
-- =====================================================

-- High-quality contracts ready for analysis
CREATE OR REPLACE VIEW dod_contracts_high_quality AS
SELECT *
FROM dod_contract_news
WHERE data_quality_score >= 80
  AND NOT needs_review
ORDER BY award_amount DESC NULLS LAST;

-- Contracts needing review
CREATE OR REPLACE VIEW dod_contracts_needing_review AS
SELECT 
  contract_number,
  vendor_name,
  vendor_city,
  vendor_state,
  award_amount_text,
  service_branch,
  data_quality_score,
  review_reasons,
  outlier_type,
  is_outlier,
  article_url,
  published_date
FROM dod_contract_news
WHERE needs_review = TRUE
  AND reviewed_at IS NULL
ORDER BY 
  CASE WHEN is_outlier THEN 1 ELSE 2 END,
  award_amount DESC NULLS LAST;

-- Outliers by type
CREATE OR REPLACE VIEW dod_outliers_by_type AS
SELECT 
  outlier_type,
  COUNT(*) as count,
  AVG(award_amount) as avg_amount,
  MIN(award_amount) as min_amount,
  MAX(award_amount) as max_amount,
  AVG(data_quality_score) as avg_quality_score
FROM dod_contract_news
WHERE is_outlier = TRUE
GROUP BY outlier_type
ORDER BY count DESC;

-- Quality distribution
CREATE OR REPLACE VIEW dod_quality_distribution AS
SELECT 
  CASE 
    WHEN data_quality_score >= 90 THEN '90-100 (Excellent)'
    WHEN data_quality_score >= 80 THEN '80-89 (Good)'
    WHEN data_quality_score >= 70 THEN '70-79 (Fair)'
    WHEN data_quality_score >= 60 THEN '60-69 (Low)'
    ELSE '0-59 (Poor)'
  END as quality_tier,
  COUNT(*) as contract_count,
  AVG(award_amount) as avg_award_amount,
  COUNT(*) FILTER (WHERE needs_review) as needs_review_count
FROM dod_contract_news
GROUP BY quality_tier
ORDER BY quality_tier;

-- =====================================================
-- Helper Function: Mark Contract as Reviewed
-- =====================================================
CREATE OR REPLACE FUNCTION mark_dod_contract_reviewed(
  p_contract_number TEXT,
  p_reviewed_by TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE dod_contract_news
  SET 
    needs_review = FALSE,
    reviewed_at = NOW(),
    reviewed_by = p_reviewed_by,
    review_reasons = CASE 
      WHEN p_notes IS NOT NULL 
      THEN ARRAY_APPEND(review_reasons, 'REVIEWED: ' || p_notes)
      ELSE review_reasons
    END
  WHERE contract_number = p_contract_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN dod_contract_news.data_quality_score IS 'Automated quality score (0-100) based on completeness and accuracy';
COMMENT ON COLUMN dod_contract_news.needs_review IS 'TRUE if contract flagged for manual review';
COMMENT ON COLUMN dod_contract_news.is_outlier IS 'TRUE if contract identified as statistical outlier';
COMMENT ON COLUMN dod_contract_news.outlier_type IS 'Type: extreme_high_value, suspiciously_low, etc.';
COMMENT ON COLUMN dod_contract_news.review_reasons IS 'Array of reasons why review is needed';

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT SELECT ON dod_contracts_high_quality TO anon, authenticated;
GRANT SELECT ON dod_contracts_needing_review TO authenticated;
GRANT SELECT ON dod_outliers_by_type TO authenticated;
GRANT SELECT ON dod_quality_distribution TO anon, authenticated;

