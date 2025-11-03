-- ============================================
-- Fix Database Columns (Handling Views)
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop views that depend on the status column
DROP VIEW IF EXISTS active_defense_bills CASCADE;
DROP VIEW IF EXISTS recent_defense_reports CASCADE;
DROP VIEW IF EXISTS upcoming_defense_hearings CASCADE;
DROP VIEW IF EXISTS contract_legislative_context CASCADE;

-- STEP 2: Alter the columns
ALTER TABLE congressional_bills 
  ALTER COLUMN status TYPE TEXT;

ALTER TABLE congressional_amendments 
  ALTER COLUMN status TYPE TEXT;

ALTER TABLE congressional_members 
  ALTER COLUMN first_name TYPE TEXT,
  ALTER COLUMN last_name TYPE TEXT,
  ALTER COLUMN middle_name TYPE TEXT;

ALTER TABLE congressional_contract_links
  ALTER COLUMN topic_number TYPE TEXT,
  ALTER COLUMN link_type TYPE TEXT;

-- STEP 3: Recreate the views

-- View: Active Defense Bills (Recent)
CREATE OR REPLACE VIEW active_defense_bills AS
SELECT 
  b.*,
  COUNT(DISTINCT ccl.id) as linked_contracts_count
FROM congressional_bills b
LEFT JOIN congressional_contract_links ccl ON ccl.bill_id = b.id
WHERE 
  b.is_defense_related = true 
  AND b.is_active = true
  AND b.congress >= 118  -- Last 2 Congresses
GROUP BY b.id
ORDER BY b.latest_action_date DESC;

-- View: Defense Committee Reports (Recent)
CREATE OR REPLACE VIEW recent_defense_reports AS
SELECT *
FROM congressional_committee_reports
WHERE 
  is_defense_related = true
  AND issued_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY issued_date DESC;

-- View: Upcoming Defense Hearings
CREATE OR REPLACE VIEW upcoming_defense_hearings AS
SELECT *
FROM congressional_hearings
WHERE 
  is_defense_related = true
  AND hearing_date >= CURRENT_DATE
  AND status IN ('scheduled', 'postponed')
ORDER BY hearing_date ASC;

-- View: Contract Legislative Context (for joining)
CREATE OR REPLACE VIEW contract_legislative_context AS
SELECT 
  ccl.contract_source,
  ccl.contract_id,
  ccl.contract_number,
  COUNT(DISTINCT ccl.bill_id) as bills_count,
  COUNT(DISTINCT ccl.report_id) as reports_count,
  COUNT(DISTINCT ccl.hearing_id) as hearings_count,
  array_agg(DISTINCT b.title) FILTER (WHERE b.title IS NOT NULL) as related_bills,
  MAX(ccl.confidence_score) as max_confidence
FROM congressional_contract_links ccl
LEFT JOIN congressional_bills b ON b.id = ccl.bill_id
GROUP BY ccl.contract_source, ccl.contract_id, ccl.contract_number;

-- STEP 4: Clean up broken data
-- Remove the test Social Security bill
DELETE FROM congressional_bills 
WHERE bill_number = 5345 
  AND congress = 119 
  AND title LIKE '%Social Security%';

-- Clear broken cosponsor references (will be re-fetched)
UPDATE congressional_bills
SET cosponsors = NULL
WHERE cosponsors IS NOT NULL 
  AND cosponsors::text LIKE '%"url":%';

-- STEP 5: Verify everything worked
SELECT 
  'congressional_bills' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'congressional_bills'
  AND column_name IN ('status', 'cosponsors')
ORDER BY column_name;

-- Show counts
SELECT 
  COUNT(*) as total_bills,
  COUNT(*) FILTER (WHERE is_defense_related = true) as defense_bills,
  COUNT(*) FILTER (WHERE cosponsors IS NOT NULL) as bills_with_cosponsors
FROM congressional_bills;

