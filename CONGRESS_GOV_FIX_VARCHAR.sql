-- ============================================
-- Fix VARCHAR(100) Columns That Are Too Short
-- ============================================
-- 
-- Error: value too long for type character varying(100)
-- 
-- Run this in Supabase SQL Editor to fix the issue
-- ============================================

-- Fix congressional_bills.status (100 -> TEXT)
ALTER TABLE congressional_bills 
  ALTER COLUMN status TYPE TEXT;

-- Fix congressional_amendments.status (100 -> TEXT)
ALTER TABLE congressional_amendments 
  ALTER COLUMN status TYPE TEXT;

-- Fix congressional_members columns while we're at it
ALTER TABLE congressional_members 
  ALTER COLUMN first_name TYPE TEXT,
  ALTER COLUMN last_name TYPE TEXT,
  ALTER COLUMN middle_name TYPE TEXT;

-- Fix congressional_contract_links.topic_number and link_type
ALTER TABLE congressional_contract_links
  ALTER COLUMN topic_number TYPE TEXT,
  ALTER COLUMN link_type TYPE TEXT;

-- Verify changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('congressional_bills', 'congressional_amendments', 'congressional_members', 'congressional_contract_links')
  AND column_name IN ('status', 'first_name', 'last_name', 'middle_name', 'topic_number', 'link_type')
ORDER BY table_name, column_name;

