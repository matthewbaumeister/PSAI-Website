-- =====================================================
-- Add secondary_contact column to sam_gov_opportunities
-- =====================================================
-- Full details API often includes multiple contacts
-- =====================================================

ALTER TABLE sam_gov_opportunities
ADD COLUMN IF NOT EXISTS secondary_contact JSONB;

COMMENT ON COLUMN sam_gov_opportunities.secondary_contact IS 'Secondary point of contact (from full details API)';

