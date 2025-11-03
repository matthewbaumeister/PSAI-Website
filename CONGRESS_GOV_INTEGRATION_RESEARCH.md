# Congress.gov Integration - Deep Research & Implementation Plan

## Executive Summary

This document provides comprehensive research and implementation strategy for integrating Congress.gov legislative data with your existing PropShop AI contract intelligence platform. By adding congressional and lobbying context to DoD contracts, FPDS awards, SAM.gov opportunities, and SBIR topics, you'll provide users with unprecedented insight into the political and legislative forces shaping government procurement.

---

## Table of Contents

1. [Strategic Value](#strategic-value)
2. [Congress.gov API Research](#congressgov-api-research)
3. [Data Architecture](#data-architecture)
4. [Implementation Plan](#implementation-plan)
5. [Integration Points](#integration-points)
6. [Daily Update Strategy](#daily-update-strategy)
7. [Technical Specifications](#technical-specifications)

---

## Strategic Value

### Why Congress.gov Data Matters for Contract Intelligence

**Legislative Context for Contracts:**
- Track which bills authorize specific defense programs
- Identify appropriations that fund contract opportunities
- Monitor committee reports that influence procurement decisions
- Connect congressional oversight to contract awards

**Competitive Intelligence:**
- See which members champion specific programs
- Track lobbying disclosure connections to legislation
- Identify emerging priorities before RFPs are released
- Understand political support for programs

**Risk Assessment:**
- Monitor budget authorization changes
- Track continuing resolutions affecting contract timelines
- Identify programs at risk of defunding
- Predict procurement delays due to legislative action

**Historical Context:**
- Track multi-year authorization acts (NDAA, appropriations)
- Connect historical legislation to current opportunities
- Understand program evolution through legislative history

---

## Congress.gov API Research

### API Overview

**Base URL:** `https://api.congress.gov/v3/`

**Authentication:** API Key (required)
- Register at: https://api.congress.gov/sign-up/
- Rate Limit: 5,000 requests/hour
- Include in header: `X-Api-Key: YOUR_KEY` or query param: `?api_key=YOUR_KEY`

**Response Format:** JSON (also supports XML)

**Coverage:** 
- Congress 93 (1973) to current
- Real-time updates for current legislation

---

### Key Endpoints for Defense Procurement

#### 1. Bills Endpoint
**URL:** `/bill/{congress}/{billType}/{billNumber}`

**Defense-Relevant Bill Types:**
- `hr` - House Bills (including NDAA)
- `s` - Senate Bills
- `hjres` - House Joint Resolutions
- `sjres` - Senate Joint Resolutions

**Key Defense Bills to Track:**
- National Defense Authorization Act (NDAA) - Annual
- Defense Appropriations Act - Annual
- Military Construction Appropriations
- DOD Supplemental Appropriations
- Defense Production Act amendments

**Data Retrieved:**
```json
{
  "bill": {
    "congress": 118,
    "type": "hr",
    "number": "2670",
    "title": "National Defense Authorization Act for Fiscal Year 2024",
    "introducedDate": "2023-04-17",
    "updateDate": "2023-12-22",
    "actions": [...],
    "committees": [...],
    "sponsors": [...],
    "cosponsors": [...],
    "subjects": [...],
    "summaries": [...],
    "textVersions": [...],
    "relatedBills": [...]
  }
}
```

#### 2. Amendments Endpoint
**URL:** `/amendment/{congress}/{amendmentType}/{amendmentNumber}`

**Why Track Amendments:**
- Last-minute program additions/deletions
- Funding level changes
- Procurement authorization modifications
- Policy riders affecting contracts

**Example Query:**
```
GET /amendment/118/samdt/1234
```

#### 3. Committee Reports Endpoint
**URL:** `/committee-report/{congress}/{reportType}/{reportNumber}`

**Defense-Relevant Committees:**
- **House Armed Services Committee (HASC)**
  - Full Committee
  - Subcommittee on Tactical Air and Land Forces
  - Subcommittee on Seapower and Projection Forces
  - Subcommittee on Cyber, Innovative Technologies, and Information Systems
  
- **Senate Armed Services Committee (SASC)**
  - Full Committee
  - Subcommittee on Airland
  - Subcommittee on Seapower
  - Subcommittee on Emerging Threats and Capabilities

- **House and Senate Appropriations Committees**
  - Defense Subcommittees

**Report Types:**
- `hrpt` - House Reports
- `srpt` - Senate Reports
- `erpt` - Executive Reports

**Value of Committee Reports:**
- Detailed program justifications
- Specific contractor mentions
- Program direction and guidance
- Funding recommendations

#### 4. Committee Meetings Endpoint
**URL:** `/committee-meeting/{congress}/{chamber}/{eventId}`

**Track Hearings On:**
- Defense budget requests
- Program oversight
- Contractor testimony
- Acquisition reform

#### 5. Congressional Record Endpoint
**URL:** `/congressional-record`

**Search Congressional Record for:**
- Floor debate on defense programs
- Member statements on contractors
- Legislative intent clarifications

#### 6. Treaty Documents
**URL:** `/treaty/{congress}/{treatyNumber}`

**Relevant for:**
- Foreign Military Sales (FMS) context
- International defense cooperation
- Export control implications

---

### API Query Strategies

#### Strategy 1: Subject-Based Filtering

**Defense-Related Subject Terms:**
```
- "defense procurement"
- "defense contracts"
- "military acquisition"
- "weapons systems"
- "defense spending"
- "DOD authorization"
- "military construction"
- "defense appropriations"
- "defense industrial base"
- "small business defense"
- "SBIR/STTR"
```

**Example Query:**
```
GET /bill?format=json&limit=250
    &fromDateTime=2024-01-01T00:00:00Z
    &toDateTime=2024-12-31T23:59:59Z
    &subject=defense%20procurement
```

#### Strategy 2: Committee-Based Filtering

**Query All Bills from Defense Committees:**
```
GET /bill?format=json
    &committee=HSAS  (House Armed Services)
    &committee=SSAS  (Senate Armed Services)
```

#### Strategy 3: Keyword Search in Text

**Search Bill Text for Contractor Names:**
```
GET /bill?format=json
    &query=Lockheed+Martin
    &query=Raytheon
    &query=Boeing
```

#### Strategy 4: Sponsor/Cosponsor Tracking

**Track Pro-Defense Members:**
```json
{
  "sponsors": [
    "Armed Services Committee Chairman",
    "Defense Appropriations Chair",
    "Key subcommittee chairs"
  ]
}
```

---

## Data Architecture

### Database Schema

#### Table 1: `congressional_bills`

Primary table for all defense-related legislation.

```sql
CREATE TABLE congressional_bills (
  -- Primary Keys
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  bill_type VARCHAR(10) NOT NULL,
  bill_number INTEGER NOT NULL,
  
  -- Composite unique constraint
  CONSTRAINT unique_bill UNIQUE (congress, bill_type, bill_number),
  
  -- Basic Information
  title TEXT NOT NULL,
  short_title TEXT,
  official_title TEXT,
  popular_title TEXT,
  
  -- Dates
  introduced_date DATE,
  latest_action_date DATE,
  became_law_date DATE,
  vetoed_date DATE,
  
  -- Status
  status VARCHAR(100),
  is_law BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Content
  summary TEXT,
  purpose TEXT,
  policy_area VARCHAR(255),
  legislative_subjects TEXT[],
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  defense_relevance_score INTEGER, -- 0-100
  defense_programs_mentioned TEXT[],
  contractors_mentioned TEXT[],
  
  -- Funding Information
  authorized_amount BIGINT,
  appropriated_amount BIGINT,
  fiscal_years INTEGER[],
  
  -- Sponsors & Cosponsors
  sponsor_name TEXT,
  sponsor_party VARCHAR(50),
  sponsor_state VARCHAR(2),
  sponsor_bioguide_id VARCHAR(20),
  cosponsor_count INTEGER DEFAULT 0,
  cosponsors JSONB,
  
  -- Committees
  committees TEXT[],
  primary_committee VARCHAR(255),
  
  -- Related Bills
  related_bills JSONB,
  companion_bill_id VARCHAR(50),
  
  -- Text & Documents
  text_versions JSONB,
  pdf_url TEXT,
  congress_gov_url TEXT,
  
  -- Actions & Timeline
  actions JSONB,
  action_count INTEGER DEFAULT 0,
  latest_action_text TEXT,
  
  -- Amendments
  amendment_count INTEGER DEFAULT 0,
  amendments JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search & Analysis
  search_vector tsvector,
  keywords TEXT[],
  
  -- Source
  source_url TEXT,
  api_response JSONB
);

-- Indexes
CREATE INDEX idx_congressional_bills_congress ON congressional_bills(congress);
CREATE INDEX idx_congressional_bills_type ON congressional_bills(bill_type);
CREATE INDEX idx_congressional_bills_status ON congressional_bills(status);
CREATE INDEX idx_congressional_bills_defense ON congressional_bills(is_defense_related);
CREATE INDEX idx_congressional_bills_introduced ON congressional_bills(introduced_date);
CREATE INDEX idx_congressional_bills_action_date ON congressional_bills(latest_action_date);
CREATE INDEX idx_congressional_bills_is_law ON congressional_bills(is_law);
CREATE INDEX idx_congressional_bills_committees ON congressional_bills USING GIN(committees);
CREATE INDEX idx_congressional_bills_subjects ON congressional_bills USING GIN(legislative_subjects);
CREATE INDEX idx_congressional_bills_programs ON congressional_bills USING GIN(defense_programs_mentioned);
CREATE INDEX idx_congressional_bills_contractors ON congressional_bills USING GIN(contractors_mentioned);
CREATE INDEX idx_congressional_bills_search ON congressional_bills USING GIN(search_vector);
```

---

#### Table 2: `congressional_amendments`

Track amendments that modify defense procurement provisions.

```sql
CREATE TABLE congressional_amendments (
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  amendment_type VARCHAR(10) NOT NULL,
  amendment_number INTEGER NOT NULL,
  
  CONSTRAINT unique_amendment UNIQUE (congress, amendment_type, amendment_number),
  
  -- Related Bill
  bill_id BIGINT REFERENCES congressional_bills(id),
  bill_congress INTEGER,
  bill_type VARCHAR(10),
  bill_number INTEGER,
  
  -- Amendment Details
  title TEXT,
  description TEXT,
  purpose TEXT,
  
  -- Sponsor
  sponsor_name TEXT,
  sponsor_party VARCHAR(50),
  sponsor_state VARCHAR(2),
  sponsor_bioguide_id VARCHAR(20),
  
  -- Status
  status VARCHAR(100),
  is_adopted BOOLEAN DEFAULT FALSE,
  is_failed BOOLEAN DEFAULT FALSE,
  
  -- Dates
  submitted_date DATE,
  action_date DATE,
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  defense_impact_description TEXT,
  programs_affected TEXT[],
  funding_change BIGINT, -- positive or negative
  
  -- Content
  amendment_text TEXT,
  congress_gov_url TEXT,
  
  -- Actions
  actions JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_amendments_bill ON congressional_amendments(bill_id);
CREATE INDEX idx_amendments_defense ON congressional_amendments(is_defense_related);
CREATE INDEX idx_amendments_status ON congressional_amendments(status);
```

---

#### Table 3: `congressional_committee_reports`

Committee reports provide deep insight into program direction.

```sql
CREATE TABLE congressional_committee_reports (
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  report_type VARCHAR(10) NOT NULL,
  report_number INTEGER NOT NULL,
  
  CONSTRAINT unique_report UNIQUE (congress, report_type, report_number),
  
  -- Related Bill
  bill_id BIGINT REFERENCES congressional_bills(id),
  
  -- Report Details
  title TEXT NOT NULL,
  committee_name VARCHAR(255),
  committee_code VARCHAR(10),
  
  -- Dates
  issued_date DATE,
  
  -- Content
  summary TEXT,
  full_text TEXT,
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  programs_discussed TEXT[],
  contractors_mentioned TEXT[],
  recommendations TEXT[],
  
  -- Funding Details
  recommended_funding JSONB,
  funding_changes TEXT,
  
  -- Documents
  pdf_url TEXT,
  html_url TEXT,
  congress_gov_url TEXT,
  
  -- Analysis
  program_directions TEXT[],
  policy_changes TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  
  search_vector tsvector
);

CREATE INDEX idx_reports_committee ON congressional_committee_reports(committee_code);
CREATE INDEX idx_reports_defense ON congressional_committee_reports(is_defense_related);
CREATE INDEX idx_reports_issued ON congressional_committee_reports(issued_date);
CREATE INDEX idx_reports_bill ON congressional_committee_reports(bill_id);
CREATE INDEX idx_reports_programs ON congressional_committee_reports USING GIN(programs_discussed);
CREATE INDEX idx_reports_search ON congressional_committee_reports USING GIN(search_vector);
```

---

#### Table 4: `congressional_hearings`

Track hearings where contractors testify or programs are discussed.

```sql
CREATE TABLE congressional_hearings (
  id BIGSERIAL PRIMARY KEY,
  congress INTEGER NOT NULL,
  chamber VARCHAR(10), -- 'house' or 'senate'
  event_id VARCHAR(50) UNIQUE,
  
  -- Hearing Details
  title TEXT NOT NULL,
  committee_name VARCHAR(255),
  committee_code VARCHAR(10),
  subcommittee_name VARCHAR(255),
  
  -- Dates & Location
  hearing_date DATE,
  hearing_time TIME,
  location TEXT,
  
  -- Status
  status VARCHAR(50), -- 'scheduled', 'held', 'cancelled'
  
  -- Content
  description TEXT,
  topics TEXT[],
  witnesses JSONB, -- [{name, title, organization, testimony_url}]
  
  -- Defense Relevance
  is_defense_related BOOLEAN DEFAULT FALSE,
  programs_discussed TEXT[],
  contractors_testifying TEXT[],
  
  -- Documents
  hearing_transcript_url TEXT,
  witness_testimony_urls JSONB,
  video_url TEXT,
  
  -- Related Bills
  related_bills JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hearings_date ON congressional_hearings(hearing_date);
CREATE INDEX idx_hearings_committee ON congressional_hearings(committee_code);
CREATE INDEX idx_hearings_defense ON congressional_hearings(is_defense_related);
CREATE INDEX idx_hearings_contractors ON congressional_hearings USING GIN(contractors_testifying);
```

---

#### Table 5: `congressional_members`

Track members' defense procurement involvement.

```sql
CREATE TABLE congressional_members (
  id BIGSERIAL PRIMARY KEY,
  bioguide_id VARCHAR(20) UNIQUE NOT NULL,
  
  -- Basic Info
  full_name TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Political Info
  party VARCHAR(50),
  state VARCHAR(2),
  district INTEGER, -- NULL for senators
  chamber VARCHAR(10), -- 'house' or 'senate'
  
  -- Current Status
  is_current BOOLEAN DEFAULT TRUE,
  
  -- Terms
  terms JSONB, -- [{congress, startYear, endYear}]
  
  -- Committee Assignments
  current_committees TEXT[],
  defense_committees TEXT[],
  appropriations_committees TEXT[],
  
  -- Defense Focus
  is_defense_focused BOOLEAN DEFAULT FALSE,
  defense_bills_sponsored INTEGER DEFAULT 0,
  defense_bills_cosponsored INTEGER DEFAULT 0,
  
  -- District/State Defense Presence
  state_defense_contractors TEXT[],
  state_military_bases TEXT[],
  
  -- Leadership
  leadership_position VARCHAR(255),
  
  -- Contact
  office_address TEXT,
  phone VARCHAR(20),
  website_url TEXT,
  twitter_handle VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_bioguide ON congressional_members(bioguide_id);
CREATE INDEX idx_members_state ON congressional_members(state);
CREATE INDEX idx_members_party ON congressional_members(party);
CREATE INDEX idx_members_current ON congressional_members(is_current);
CREATE INDEX idx_members_defense ON congressional_members(is_defense_focused);
```

---

#### Table 6: `congressional_contract_links`

**Critical Junction Table** - Links Congressional activity to actual contracts.

```sql
CREATE TABLE congressional_contract_links (
  id BIGSERIAL PRIMARY KEY,
  
  -- Congressional Side
  bill_id BIGINT REFERENCES congressional_bills(id),
  amendment_id BIGINT,
  report_id BIGINT,
  
  -- Contract Side (flexible - links to multiple tables)
  contract_source VARCHAR(50), -- 'dod_news', 'fpds', 'sam_gov', 'sbir'
  contract_id BIGINT,
  contract_number VARCHAR(255),
  
  -- Link Details
  link_type VARCHAR(100), -- 'authorization', 'appropriation', 'oversight', 'mention'
  link_strength VARCHAR(20), -- 'strong', 'medium', 'weak'
  confidence_score INTEGER, -- 0-100
  
  -- Context
  link_description TEXT,
  relevant_text TEXT,
  
  -- Program Connection
  program_name VARCHAR(255),
  program_element_code VARCHAR(50),
  
  -- Funding Connection
  authorized_amount BIGINT,
  appropriated_amount BIGINT,
  fiscal_year INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  link_method VARCHAR(50), -- 'keyword_match', 'manual', 'llm_analysis'
  verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(255),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_contract_links_bill ON congressional_contract_links(bill_id);
CREATE INDEX idx_contract_links_source ON congressional_contract_links(contract_source);
CREATE INDEX idx_contract_links_contract_id ON congressional_contract_links(contract_id);
CREATE INDEX idx_contract_links_contract_number ON congressional_contract_links(contract_number);
CREATE INDEX idx_contract_links_type ON congressional_contract_links(link_type);
CREATE INDEX idx_contract_links_program ON congressional_contract_links(program_name);
```

---

#### Table 7: `congressional_scraping_logs`

Track scraping progress and errors.

```sql
CREATE TABLE congressional_scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scrape Details
  scrape_type VARCHAR(50), -- 'bills', 'amendments', 'reports', 'hearings', 'daily_update'
  congress INTEGER,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Status
  status VARCHAR(50), -- 'running', 'completed', 'failed', 'partial'
  
  -- Statistics
  records_found INTEGER DEFAULT 0,
  records_new INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  
  -- Errors
  errors JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Resource Usage
  api_rate_limit_remaining INTEGER,
  api_rate_limit_reset TIMESTAMPTZ
);

CREATE INDEX idx_scraping_logs_type ON congressional_scraping_logs(scrape_type);
CREATE INDEX idx_scraping_logs_status ON congressional_scraping_logs(status);
CREATE INDEX idx_scraping_logs_started ON congressional_scraping_logs(started_at);
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Setup & Configuration

**Get API Key:**
1. Register at https://api.congress.gov/sign-up/
2. Add to `.env`:
   ```bash
   CONGRESS_GOV_API_KEY=your_api_key_here
   ```

**Install Dependencies:**
Already have: `axios`, `cheerio`, `dotenv`, `@supabase/supabase-js`

#### 1.2 Create Database Schema

Run the SQL schema creation scripts for all 7 tables.

**File:** `CONGRESS_GOV_DATABASE_SCHEMA.sql`

#### 1.3 Build Core Library

**File:** `src/lib/congress-gov-scraper.ts`

**Core Functions:**
```typescript
// API client
export async function congressGovApiCall(endpoint: string, params: any): Promise<any>

// Bill fetching
export async function fetchBill(congress: number, billType: string, billNumber: number): Promise<any>
export async function searchBills(params: SearchParams): Promise<any>

// Defense relevance detection
export function isDefenseRelated(bill: any): boolean
export function extractDefensePrograms(text: string): string[]
export function extractContractorMentions(text: string): string[]

// Data normalization
export function normalizeBill(rawBill: any): NormalizedBill
export function normalizeAmendment(rawAmendment: any): NormalizedAmendment

// Database operations
export async function saveBill(bill: NormalizedBill): Promise<void>
export async function updateBill(billId: number, updates: any): Promise<void>
```

---

### Phase 2: Historical Data Import (Week 2)

#### 2.1 Bulk Import Strategy

**Target:** Last 5 years of defense legislation (Congresses 116-119)

**Key Bills to Import First:**
```typescript
const PRIORITY_BILLS = [
  // NDAA (National Defense Authorization Act)
  { congress: 119, type: 'hr', number: 5009 }, // FY2025
  { congress: 118, type: 'hr', number: 2670 }, // FY2024
  { congress: 117, type: 's', number: 4543 }, // FY2023
  { congress: 117, type: 'hr', number: 4350 }, // FY2022
  { congress: 116, type: 'hr', number: 6395 }, // FY2021
  
  // Defense Appropriations
  { congress: 119, type: 'hr', number: 4368 }, // FY2025
  { congress: 118, type: 'hr', number: 4365 }, // FY2024
  // ... continue for each year
  
  // SBIR/STTR Reauthorization
  { congress: 118, type: 's', number: 870 },
  
  // Small Business Defense Programs
  // Acquisition Reform Bills
  // Defense Industrial Base legislation
];
```

**Import Script:** `src/scripts/congress-bulk-import.ts`

```typescript
async function bulkImportHistoricalBills() {
  for (const bill of PRIORITY_BILLS) {
    const data = await fetchBill(bill.congress, bill.type, bill.number);
    const normalized = normalizeBill(data);
    await saveBill(normalized);
    await delay(750); // Respect rate limits (5000/hr = ~1.4/sec)
  }
}
```

#### 2.2 Committee Reports Import

Import reports for:
- House Armed Services Committee (last 5 years)
- Senate Armed Services Committee (last 5 years)
- Defense Appropriations Subcommittees

---

### Phase 3: Daily Update System (Week 3)

#### 3.1 Daily Scraper

**File:** `src/scripts/congress-daily-scraper.ts`

**Strategy:**
- Run daily at 6 AM EST (after Congress.gov overnight updates)
- Fetch updates from last 3 days (to catch delayed updates)
- Focus on current Congress
- Update existing records, insert new ones

**Scrape Targets:**
```typescript
const DAILY_TARGETS = {
  // Current defense bills
  bills: {
    committees: ['HSAS', 'SSAS', 'HSAP', 'SSAP'],
    subjects: ['defense procurement', 'military acquisition', 'defense spending'],
    updateWindow: 3 // days
  },
  
  // Recent amendments
  amendments: {
    billTypes: ['hr', 's'],
    updateWindow: 3
  },
  
  // New committee reports
  reports: {
    committees: ['HSAS', 'SSAS'],
    updateWindow: 7
  },
  
  // Upcoming hearings
  hearings: {
    committees: ['HSAS', 'SSAS'],
    lookAhead: 30 // days
  }
};
```

**Cron Schedule:**
```typescript
// In vercel.json or crontab
{
  "crons": [{
    "path": "/api/cron/scrape-congress-gov",
    "schedule": "0 11 * * *" // 6 AM EST = 11 AM UTC
  }]
}
```

---

### Phase 4: Contract Linking & Analysis (Week 4)

#### 4.1 Automated Linking

**Strategy 1: Keyword Matching**

```typescript
async function linkContractsToLegislation() {
  // 1. Get all defense contracts from last 2 years
  const contracts = await getRecentContracts();
  
  // 2. Extract key terms from each contract
  for (const contract of contracts) {
    const keywords = extractKeywords(contract);
    
    // 3. Search bills for these keywords
    const relevantBills = await searchBillsByKeywords(keywords);
    
    // 4. Create links with confidence scores
    for (const bill of relevantBills) {
      const score = calculateLinkConfidence(contract, bill);
      if (score > 60) {
        await createContractLink({
          contractId: contract.id,
          billId: bill.id,
          linkType: 'keyword_match',
          confidenceScore: score
        });
      }
    }
  }
}
```

**Strategy 2: Program Element Matching**

```typescript
// Match PE codes from contracts to bills
async function matchProgramElements() {
  // FPDS contracts have program element codes
  // Bills mention these codes in text
  // Create strong links when codes match
}
```

**Strategy 3: Contractor Name Matching**

```typescript
async function matchContractorNames() {
  // Search bill text for contractor names
  // Look in amendments, reports, hearings
  // Create links when contractors are mentioned
}
```

#### 4.2 LLM-Enhanced Analysis

**Use OpenAI to:**
```typescript
async function llmAnalyzeRelevance(contract: Contract, bill: Bill) {
  const prompt = `
    Analyze the relevance between this contract and this bill.
    
    Contract: ${contract.description}
    Contractor: ${contract.vendorName}
    Amount: ${contract.awardAmount}
    
    Bill: ${bill.title}
    Summary: ${bill.summary}
    
    Return JSON:
    {
      "isRelevant": boolean,
      "relevanceScore": 0-100,
      "relationship": "authorization" | "appropriation" | "oversight" | "mention",
      "explanation": string
    }
  `;
  
  const analysis = await callOpenAI(prompt);
  return analysis;
}
```

---

## Integration Points

### 1. Contract Detail Pages

**Add "Legislative Context" Section:**

```typescript
// On DoD Contract page
async function getContractLegislativeContext(contractId: number) {
  const links = await supabase
    .from('congressional_contract_links')
    .select(`
      *,
      bill:congressional_bills(*)
    `)
    .eq('contract_id', contractId)
    .eq('contract_source', 'dod_news');
  
  return {
    authorizingBills: links.filter(l => l.link_type === 'authorization'),
    appropriationsBills: links.filter(l => l.link_type === 'appropriation'),
    oversightActivity: links.filter(l => l.link_type === 'oversight')
  };
}
```

**Display:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Congressional Context
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Authorization:
  • H.R. 2670 - FY2024 NDAA
    Section 123: Authorizes F-35 procurement
    View Bill →

Appropriations:
  • H.R. 4365 - FY2024 Defense Appropriations
    Provides $1.2B for program
    View Bill →

Recent Oversight:
  • HASC Hearing (Mar 15, 2024)
    "F-35 Program Review"
    Lockheed Martin testified
    View Transcript →
```

---

### 2. Opportunity Search Enhancement

**Add Congressional Filters:**

```typescript
interface SearchFilters {
  // Existing filters
  keyword: string;
  status: string;
  component: string;
  
  // NEW: Congressional filters
  hasLegislativeSupport: boolean;
  recentlyAuthorized: boolean; // authorized in last 2 years
  fullFunding: boolean; // appropriation matches authorization
  committeeOversight: string[]; // HSAS, SSAS, etc.
}
```

**Search Logic:**
```typescript
let query = supabase.from('dsip_opportunities').select('*');

if (filters.hasLegislativeSupport) {
  // Join with congressional_contract_links
  query = query
    .inner('congressional_contract_links', 'id', 'contract_id')
    .eq('congressional_contract_links.link_strength', 'strong');
}
```

---

### 3. Company Intelligence Pages

**Track Company Congressional Activity:**

```typescript
async function getCompanyCongressionalActivity(companyName: string) {
  // Bills mentioning the company
  const bills = await supabase
    .from('congressional_bills')
    .contains('contractors_mentioned', [companyName]);
  
  // Hearings where company testified
  const hearings = await supabase
    .from('congressional_hearings')
    .contains('contractors_testifying', [companyName]);
  
  // Contracts linked to legislation
  const legislativeContracts = await supabase
    .from('congressional_contract_links')
    .join('dod_contract_news', ...)
    .eq('vendor_name', companyName);
  
  return {
    billMentions: bills.length,
    hearingTestimony: hearings.length,
    legislativelySupportedContracts: legislativeContracts.length,
    politicalEngagement: calculateEngagementScore(...)
  };
}
```

---

### 4. Predictive Intelligence Dashboard

**"Programs at Risk" Widget:**

```typescript
async function getProgramsAtRisk() {
  const bills = await supabase
    .from('congressional_bills')
    .select('*')
    .eq('is_defense_related', true)
    .contains('actions', ['amendment_reduces_funding', 'committee_concern']);
  
  // Match to active contracts
  const affectedContracts = await linkBillsToContracts(bills);
  
  return {
    programsAtRisk: affectedContracts.map(c => ({
      program: c.program_name,
      currentFunding: c.award_amount,
      proposedCut: c.funding_change,
      affectedContracts: c.contract_count,
      latestAction: c.latest_action
    }))
  };
}
```

---

## Daily Update Strategy

### Update Schedule

```
06:00 AM EST - Congress.gov API updates overnight
06:30 AM EST - Our daily scraper starts
08:00 AM EST - Historical bills updated
09:00 AM EST - Contract linking analysis runs
10:00 AM EST - User dashboards refreshed
```

### Update Logic

```typescript
async function dailyUpdate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  // 1. Update recently active bills
  const updatedBills = await searchBills({
    updateDateFrom: threeDaysAgo.toISOString(),
    isDefenseRelated: true
  });
  
  for (const bill of updatedBills) {
    await updateOrInsertBill(bill);
  }
  
  // 2. Check for new amendments
  const newAmendments = await searchAmendments({
    submittedDateFrom: yesterday.toISOString()
  });
  
  // 3. Get new committee reports
  const newReports = await searchReports({
    issuedDateFrom: threeDaysAgo.toISOString()
  });
  
  // 4. Update hearings schedule
  const upcomingHearings = await getUpcomingHearings({
    startDate: new Date(),
    endDate: addDays(new Date(), 30)
  });
  
  // 5. Refresh contract links for yesterday's contracts
  const yesterdayContracts = await getContractsByDate(yesterday);
  await linkContractsToLegislation(yesterdayContracts);
  
  // 6. Generate daily report
  await generateDailyReport({
    billsUpdated: updatedBills.length,
    newAmendments: newAmendments.length,
    newReports: newReports.length,
    contractsLinked: yesterdayContracts.length
  });
}
```

---

## Technical Specifications

### API Rate Limiting

**Congress.gov Limits:**
- 5,000 requests per hour
- No daily limit
- Rate = 1.39 requests/second max

**Our Strategy:**
```typescript
class CongressGovClient {
  private requestQueue: Array<() => Promise<any>> = [];
  private requestCount = 0;
  private resetTime = Date.now() + 3600000; // 1 hour
  
  async makeRequest(url: string, params: any) {
    // Check rate limit
    if (this.requestCount >= 4800) { // Leave buffer
      const waitTime = this.resetTime - Date.now();
      if (waitTime > 0) {
        await delay(waitTime);
        this.requestCount = 0;
        this.resetTime = Date.now() + 3600000;
      }
    }
    
    // Make request
    this.requestCount++;
    const response = await axios.get(url, { 
      params: { ...params, api_key: process.env.CONGRESS_GOV_API_KEY }
    });
    
    return response.data;
  }
}
```

---

### Error Handling

```typescript
async function fetchBillWithRetry(
  congress: number, 
  type: string, 
  number: number,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bill = await fetchBill(congress, type, number);
      return bill;
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit hit
        const retryAfter = error.response.headers['retry-after'] || 60;
        await delay(retryAfter * 1000);
      } else if (error.response?.status === 404) {
        // Bill doesn't exist
        return null;
      } else if (attempt === maxRetries) {
        // Log failure
        await logScrapingError({
          endpoint: `bill/${congress}/${type}/${number}`,
          error: error.message,
          attempt
        });
        throw error;
      }
      
      // Exponential backoff
      await delay(1000 * Math.pow(2, attempt));
    }
  }
}
```

---

### Data Quality Scoring

```typescript
function calculateBillQualityScore(bill: any): number {
  let score = 50; // Base score
  
  // Has summary
  if (bill.summary) score += 15;
  
  // Has actions
  if (bill.actions && bill.actions.length > 0) score += 10;
  
  // Has sponsors
  if (bill.sponsor) score += 5;
  
  // Has committee assignments
  if (bill.committees && bill.committees.length > 0) score += 10;
  
  // Has text versions
  if (bill.textVersions && bill.textVersions.length > 0) score += 10;
  
  return Math.min(score, 100);
}
```

---

## Next Steps

### Immediate Actions (This Week)

1. **Register for API Key**
   - Go to https://api.congress.gov/sign-up/
   - Add key to `.env`

2. **Create Database Schema**
   - Run schema creation SQL
   - Verify all tables created

3. **Build Core Library**
   - Create `src/lib/congress-gov-scraper.ts`
   - Implement basic API calls
   - Test with sample queries

### Short Term (Next 2 Weeks)

4. **Historical Import**
   - Import last 5 NDAAs
   - Import current Congress defense bills
   - Import major committee reports

5. **Daily Scraper**
   - Build daily update script
   - Set up cron job
   - Test for 1 week

### Medium Term (Next Month)

6. **Contract Linking**
   - Implement keyword matching
   - Build LLM analysis
   - Verify link quality

7. **UI Integration**
   - Add legislative context to contract pages
   - Build congressional search filters
   - Create "Legislative Intelligence" dashboard

---

## Success Metrics

**Data Coverage:**
- 5,000+ defense-related bills imported
- 1,000+ committee reports
- 500+ hearings tracked
- 10,000+ contract-legislation links

**Data Freshness:**
- Daily updates run successfully 95%+ of time
- Bills updated within 24 hours of Congress.gov updates
- Zero stale data > 3 days old

**User Value:**
- 30% increase in search relevance scores
- New "Legislative Context" feature used on 50%+ of contract views
- Predictive alerts reduce missed opportunities by 20%

---

## Cost Analysis

**Congress.gov API:**
- Cost: FREE
- Rate Limit: 5,000/hour (sufficient for our needs)

**Infrastructure:**
- Database: Existing Supabase (minimal additional cost)
- Compute: ~1 hour/day scraping (minimal Vercel cost)
- Storage: ~10 GB for 5 years of data

**Total Additional Cost:** < $50/month

**ROI:**
- Unique competitive advantage
- Significant user value addition
- Minimal implementation cost

---

## Competitive Advantage

**Why This Matters:**

No other contract intelligence platform connects legislative context to procurement data at this depth. You'll be able to answer questions like:

- "Show me all SBIR topics authorized in the last NDAA"
- "Which contracts are at risk due to budget cuts?"
- "What programs does Senator X champion?"
- "Find opportunities in bills passed but not yet awarded"
- "Track which contractors lobby which members on which programs"

This is **true predictive intelligence** - seeing opportunities before they're formally announced by understanding the legislative pipeline.

---

## Appendix: Key Defense Legislation Glossary

**NDAA** - National Defense Authorization Act (annual, authorizes programs)
**MilCon** - Military Construction Appropriations
**RDT&E** - Research, Development, Test & Evaluation
**O&M** - Operations & Maintenance
**Procurement** - Weapons and equipment buying authority
**PE Code** - Program Element Code (budget line item)
**POM** - Program Objective Memorandum
**FYDP** - Future Years Defense Program

---

**Document Version:** 1.0  
**Created:** November 3, 2025  
**Last Updated:** November 3, 2025  
**Status:** Ready for Implementation

