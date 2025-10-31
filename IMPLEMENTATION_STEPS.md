# SBA SBIR Awards Integration - Implementation Steps

## 🚀 Step-by-Step Implementation Guide

Start here and follow in order. Each step builds on the previous one.

---

## PHASE 1: Database Setup (Day 1)

### Step 1.1: Create Database Tables

**File:** `supabase/migrations/create_sbir_awards_tables.sql`

Run this SQL in your Supabase SQL Editor:

```sql
-- ============================================
-- SBIR Awards Integration - Database Schema
-- ============================================

-- 1. Main Awards Table
CREATE TABLE IF NOT EXISTS sbir_awards (
  id BIGSERIAL PRIMARY KEY,
  
  -- Award Identification
  contract_award_number TEXT UNIQUE NOT NULL,
  award_year INTEGER NOT NULL,
  award_date DATE,
  
  -- Topic/Opportunity Linkage (CRITICAL for connecting to sbir_final)
  topic_number TEXT,
  solicitation_id TEXT,
  solicitation_number TEXT,
  
  -- Award Details
  award_title TEXT NOT NULL,
  abstract TEXT,
  phase TEXT NOT NULL, -- "Phase I", "Phase II", "Phase III"
  program TEXT NOT NULL, -- "SBIR", "STTR"
  award_amount DECIMAL(12,2),
  
  -- Agency Information
  agency TEXT NOT NULL, -- "Department of Defense"
  agency_id TEXT NOT NULL, -- "DOD"
  branch_of_service TEXT, -- "Army", "Navy", "Air Force"
  component TEXT, -- "ARMY", "DARPA", etc.
  
  -- Company Information
  company TEXT NOT NULL,
  duns TEXT,
  firm_address TEXT,
  firm_city TEXT,
  firm_state TEXT,
  firm_zip TEXT,
  firm_country TEXT DEFAULT 'USA',
  firm_phone TEXT,
  firm_website TEXT,
  
  -- Diversity Flags
  hubzone_owned BOOLEAN DEFAULT false,
  woman_owned BOOLEAN DEFAULT false,
  socially_economically_disadvantaged BOOLEAN DEFAULT false,
  veteran_owned BOOLEAN DEFAULT false,
  
  -- Research Institution (for STTR)
  research_institution TEXT,
  ri_location TEXT,
  
  -- Program Management
  program_manager TEXT,
  program_manager_email TEXT,
  program_manager_phone TEXT,
  
  -- Technical Details
  keywords TEXT[],
  technology_areas TEXT[],
  
  -- Metadata
  data_source TEXT DEFAULT 'sbir.gov',
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Company Profiles Table
CREATE TABLE IF NOT EXISTS sbir_companies (
  id BIGSERIAL PRIMARY KEY,
  
  -- Company Identification
  company_name TEXT UNIQUE NOT NULL,
  duns TEXT UNIQUE,
  
  -- Company Details
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  phone TEXT,
  website TEXT,
  
  -- Classification
  hubzone_owned BOOLEAN DEFAULT false,
  woman_owned BOOLEAN DEFAULT false,
  socially_economically_disadvantaged BOOLEAN DEFAULT false,
  veteran_owned BOOLEAN DEFAULT false,
  
  -- Statistics (computed)
  total_awards INTEGER DEFAULT 0,
  total_funding DECIMAL(15,2) DEFAULT 0,
  phase_1_count INTEGER DEFAULT 0,
  phase_2_count INTEGER DEFAULT 0,
  phase_3_count INTEGER DEFAULT 0,
  first_award_year INTEGER,
  most_recent_award_year INTEGER,
  
  -- Success Metrics
  phase_1_to_2_conversion_rate DECIMAL(5,2),
  average_award_amount DECIMAL(12,2),
  
  -- Technology Focus
  primary_technology_areas TEXT[],
  primary_agencies TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Topic Awards Summary Table
CREATE TABLE IF NOT EXISTS sbir_topic_awards_summary (
  id BIGSERIAL PRIMARY KEY,
  
  -- Topic Linkage
  topic_number TEXT UNIQUE NOT NULL,
  
  -- Award Statistics
  total_awards INTEGER DEFAULT 0,
  total_funding DECIMAL(15,2) DEFAULT 0,
  phase_1_awards INTEGER DEFAULT 0,
  phase_2_awards INTEGER DEFAULT 0,
  phase_3_awards INTEGER DEFAULT 0,
  
  -- Winner Information (JSON array)
  winners JSONB,
  
  -- Patterns
  average_award_amount_phase_1 DECIMAL(12,2),
  average_award_amount_phase_2 DECIMAL(12,2),
  most_common_winner_state TEXT,
  woman_owned_percentage DECIMAL(5,2),
  
  -- Metadata
  last_computed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Scraper Log Table
CREATE TABLE IF NOT EXISTS sbir_awards_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  scrape_type TEXT NOT NULL,
  agency TEXT,
  year_range TEXT,
  
  records_found INTEGER,
  records_inserted INTEGER,
  records_updated INTEGER,
  records_skipped INTEGER,
  
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_awards_topic_number ON sbir_awards(topic_number);
CREATE INDEX IF NOT EXISTS idx_awards_company ON sbir_awards(company);
CREATE INDEX IF NOT EXISTS idx_awards_agency ON sbir_awards(agency_id);
CREATE INDEX IF NOT EXISTS idx_awards_year ON sbir_awards(award_year);
CREATE INDEX IF NOT EXISTS idx_awards_phase ON sbir_awards(phase);
CREATE INDEX IF NOT EXISTS idx_awards_contract ON sbir_awards(contract_award_number);

CREATE INDEX IF NOT EXISTS idx_companies_name ON sbir_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_state ON sbir_companies(state);
CREATE INDEX IF NOT EXISTS idx_companies_total_awards ON sbir_companies(total_awards DESC);

CREATE INDEX IF NOT EXISTS idx_topic_awards_topic ON sbir_topic_awards_summary(topic_number);

-- ============================================
-- ADD COLUMNS to sbir_final Table
-- ============================================

-- Add award-related columns to existing sbir_final table
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS has_awards BOOLEAN DEFAULT false;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS total_awards INTEGER DEFAULT 0;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS total_award_funding DECIMAL(15,2);
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS award_winners TEXT[];
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS last_award_date DATE;

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Link topic awards summary to sbir_final
-- Note: Only add if sbir_final has topic_number as primary/unique key
-- ALTER TABLE sbir_topic_awards_summary 
-- ADD CONSTRAINT fk_topic_awards_topic 
-- FOREIGN KEY (topic_number) REFERENCES sbir_final(topic_number);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'SBIR Awards tables created successfully!';
  RAISE NOTICE 'Tables: sbir_awards, sbir_companies, sbir_topic_awards_summary, sbir_awards_scraper_log';
  RAISE NOTICE 'Next: Test with sample data, then build scraper';
END $$;
```

**Action:** Copy this SQL and run it in Supabase SQL Editor.

---

## PHASE 2: Test API Access (Day 1)

### Step 2.1: Test SBIR.gov API

Open terminal and test the API:

```bash
# Test 1: Get 10 recent DOD awards
curl "https://api.www.sbir.gov/public/api/awards?agency=DOD&year=2024&rows=10&format=json" | jq .

# Test 2: Get NASA awards
curl "https://api.www.sbir.gov/public/api/awards?agency=NASA&year=2024&rows=10&format=json" | jq .

# Test 3: Search by company
curl "https://api.www.sbir.gov/public/api/awards?company=Acme&rows=5&format=json" | jq .
```

**Expected Result:** JSON response with award data

If you don't have `jq`, install it:
```bash
# Mac
brew install jq

# Or just run without jq to see raw JSON
curl "https://api.www.sbir.gov/public/api/awards?agency=DOD&year=2024&rows=10&format=json"
```

---

## PHASE 3: Build Basic Scraper (Day 2-3)

### Step 3.1: Create Award Type Definitions

**File:** `src/types/sbir-awards.ts`

I'll create this file for you next...

### Step 3.2: Create Scraper Utility

**File:** `src/lib/sbir-awards-scraper.ts`

I'll create this file for you next...

### Step 3.3: Create Test Script

**File:** `test-awards-scraper.ts`

Test with a small dataset first (100 records)

---

## PHASE 4: Create API Endpoints (Day 4-5)

### Step 4.1: Get Awards for Topic
- `GET /api/opportunities/:topicNumber/awards`

### Step 4.2: Browse All Awards
- `GET /api/admin/sbir/awards`

### Step 4.3: Get Company Profile
- `GET /api/companies/:companyName`

---

## PHASE 5: UI Integration (Day 6-7)

### Step 5.1: Add "Past Awards" to Opportunity Pages
- Show awards on `/opportunities/[topicNumber]`

### Step 5.2: Add Award Badges to Search
- Show award count on DSIP search results

### Step 5.3: Create Company Profile Page
- New page: `/companies/[companyName]`

---

## Quick Start Checklist

- [ ] **Day 1 Morning:** Run SQL migration (Step 1.1)
- [ ] **Day 1 Afternoon:** Test API access (Step 2.1)
- [ ] **Day 2:** Build basic scraper (Step 3)
- [ ] **Day 3:** Test scraper with 100 records
- [ ] **Day 4-5:** Create API endpoints (Step 4)
- [ ] **Day 6-7:** UI integration (Step 5)
- [ ] **Week 2:** Bulk historical load
- [ ] **Week 3:** Polish & testing
- [ ] **Week 4:** Production deployment

---

## Next Actions (RIGHT NOW)

1. **Copy the SQL above** and run it in Supabase
2. **Test the API** using curl commands
3. **Tell me when done**, and I'll create the scraper files for you

Ready to start with Step 1?

