-- =====================================================
-- Function to Link SAM.gov Opportunities to FPDS Contracts
-- =====================================================
-- Matches opportunities to awarded contracts via solicitation_number
-- =====================================================

CREATE OR REPLACE FUNCTION link_sam_to_fpds()
RETURNS INTEGER AS $$
DECLARE
  linked_count INTEGER;
BEGIN
  -- Update sam_gov_opportunities with FPDS contract links
  WITH matches AS (
    SELECT 
      s.notice_id,
      f.transaction_number as fpds_id
    FROM sam_gov_opportunities s
    INNER JOIN fpds_contracts f ON s.solicitation_number = f.solicitation_id
    WHERE s.solicitation_number IS NOT NULL
      AND s.solicitation_number != ''
      AND s.fpds_contract_id IS NULL  -- Only update unlinked records
  )
  UPDATE sam_gov_opportunities s
  SET 
    fpds_contract_id = m.fpds_id,
    fpds_linked_at = NOW(),
    updated_at = NOW()
  FROM matches m
  WHERE s.notice_id = m.notice_id;

  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  RETURN linked_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to Update FPDS Contracts with SAM.gov Links
-- =====================================================
-- Adds the correct SAM.gov opportunity link to FPDS contracts
-- =====================================================

CREATE OR REPLACE FUNCTION update_fpds_with_sam_links()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update fpds_contracts with correct SAM.gov opportunity URLs
  WITH matches AS (
    SELECT 
      f.transaction_number,
      s.ui_link as sam_url
    FROM fpds_contracts f
    INNER JOIN sam_gov_opportunities s ON f.solicitation_id = s.solicitation_number
    WHERE f.solicitation_id IS NOT NULL
      AND f.solicitation_id != ''
      AND s.ui_link IS NOT NULL
  )
  UPDATE fpds_contracts f
  SET 
    sam_gov_opportunity_url = m.sam_url,
    updated_at = NOW()
  FROM matches m
  WHERE f.transaction_number = m.transaction_number;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger to Auto-Link New Opportunities
-- =====================================================
-- Automatically links SAM opportunities to FPDS when inserted/updated
-- =====================================================

CREATE OR REPLACE FUNCTION auto_link_sam_opportunity()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find matching FPDS contract
  IF NEW.solicitation_number IS NOT NULL AND NEW.solicitation_number != '' THEN
    SELECT transaction_number INTO NEW.fpds_contract_id
    FROM fpds_contracts
    WHERE solicitation_id = NEW.solicitation_number
    LIMIT 1;
    
    IF NEW.fpds_contract_id IS NOT NULL THEN
      NEW.fpds_linked_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_link_sam ON sam_gov_opportunities;
CREATE TRIGGER trigger_auto_link_sam
  BEFORE INSERT OR UPDATE ON sam_gov_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_sam_opportunity();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION link_sam_to_fpds() IS 'Links SAM.gov opportunities to FPDS contracts via solicitation_number. Returns count of linked records.';
COMMENT ON FUNCTION update_fpds_with_sam_links() IS 'Updates FPDS contracts with correct SAM.gov opportunity URLs. Returns count of updated records.';
COMMENT ON FUNCTION auto_link_sam_opportunity() IS 'Trigger function that automatically links new SAM opportunities to FPDS contracts on insert/update.';

