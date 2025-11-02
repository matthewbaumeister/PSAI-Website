-- =====================================================
-- Fix vendor_state Extraction Issue
-- =====================================================
-- Problem: The auto_extract_location_fields() trigger was
-- overwriting vendor_state with NULL because it expected
-- 2-letter state abbreviations (e.g., "OH") but the scraper
-- provides full state names (e.g., "Ohio").
--
-- Solution:
-- 1. Update extract_state() to handle both formats
-- 2. Modify trigger to NOT overwrite fields already set by scraper
-- =====================================================

-- =====================================================
-- Step 1: Update extract_state() to handle full state names
-- =====================================================
CREATE OR REPLACE FUNCTION extract_state(location TEXT) 
RETURNS VARCHAR(50) AS $$
DECLARE
  state_abbrev TEXT;
  full_state TEXT;
BEGIN
  -- First try to extract 2-letter state abbreviation
  state_abbrev := SUBSTRING(location FROM ', ([A-Z]{2})$');
  IF state_abbrev IS NOT NULL THEN
    RETURN state_abbrev;
  END IF;
  
  -- Fallback: extract full state name (after last comma)
  full_state := TRIM(SUBSTRING(location FROM ',\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$'));
  RETURN full_state;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Step 2: Update trigger to respect scraper-provided values
-- =====================================================
CREATE OR REPLACE FUNCTION auto_extract_location_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only extract vendor city/state if they're NOT already set by the scraper
  IF NEW.vendor_location IS NOT NULL THEN
    IF NEW.vendor_city IS NULL THEN
      NEW.vendor_city := extract_city(NEW.vendor_location);
    END IF;
    IF NEW.vendor_state IS NULL THEN
      NEW.vendor_state := extract_state(NEW.vendor_location);
    END IF;
  END IF;
  
  -- Only extract contracting office location if not already set
  IF NEW.contracting_office_location IS NOT NULL THEN
    IF NEW.contracting_office_city IS NULL THEN
      NEW.contracting_office_city := extract_city(NEW.contracting_office_location);
    END IF;
    IF NEW.contracting_office_state IS NULL THEN
      NEW.contracting_office_state := extract_state(NEW.contracting_office_location);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Step 3: Backfill vendor_state for existing records
-- =====================================================
-- Update existing records where vendor_state is NULL but
-- vendor_location contains the state name
UPDATE dod_contract_news
SET vendor_state = extract_state(vendor_location)
WHERE vendor_state IS NULL
  AND vendor_location IS NOT NULL
  AND vendor_location ~ ',\s*[A-Z][a-z]+';

-- =====================================================
-- Step 4: Update quality scores for fixed records
-- =====================================================
-- Recalculate quality scores for records we just fixed
UPDATE dod_contract_news
SET data_quality_score = calculate_dod_quality_score(
    vendor_name,
    vendor_city,
    vendor_state,
    contract_number,
    award_amount,
    award_amount_text,
    service_branch,
    parsing_confidence
  ),
  has_complete_vendor_info = (
    vendor_name IS NOT NULL 
    AND vendor_name != 'Unknown Vendor'
    AND vendor_city IS NOT NULL 
    AND vendor_state IS NOT NULL
  )
WHERE vendor_state IS NOT NULL
  AND data_quality_score < 70;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the fix worked:
-- SELECT 
--   COUNT(*) as total_contracts,
--   COUNT(vendor_state) as with_state,
--   COUNT(*) FILTER (WHERE vendor_state IS NULL) as missing_state,
--   ROUND(100.0 * COUNT(vendor_state) / COUNT(*), 2) as state_coverage_pct
-- FROM dod_contract_news;

