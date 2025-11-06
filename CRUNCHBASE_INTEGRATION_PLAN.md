# Crunchbase API Integration Plan for PropShop AI

## Executive Summary

This document outlines a comprehensive plan to integrate Crunchbase API into PropShop AI, enriching your government contracting intelligence platform with deep company intelligence, funding data, and market insights.

## 1. Understanding Crunchbase API

### 1.1 How Crunchbase API Works

**API Type**: RESTful API (Real-time, NOT Historical Scraping)
- **Access Method**: Token-based authentication via API key
- **Data Retrieval**: On-demand API calls for current data
- **Rate Limits**: Based on subscription tier (typically 200-1000+ calls/minute)
- **Response Format**: JSON
- **Base URL**: `https://api.crunchbase.com/api/v4/`

### 1.2 Key Characteristics

**Real-Time vs Historical:**
- Crunchbase API provides **CURRENT DATA** on each API call
- Historical data (funding rounds, acquisitions) is included in the current snapshot
- You make API calls when you need to enrich a company record
- NOT a bulk historical scraping service - you call it on-demand for specific companies

**Pricing Tiers** (as of 2024):
- **Enterprise API**: $2,500-$10,000+/month
  - Higher rate limits
  - Advanced fields
  - Custom data exports
- **Pro API**: $500-$2,500/month
  - Standard company data
  - Funding rounds
  - People data
  - Basic search

**Rate Limit Strategy**:
- You'll need to queue company enrichment requests
- Prioritize high-value companies (large contract winners)
- Cache results to avoid duplicate API calls
- Refresh data quarterly or semi-annually

## 2. What Data Crunchbase Provides

### 2.1 Core Company Information
```json
{
  "uuid": "df6628c1-b54b-4b4f-9c99-c03e5e67c1ee",
  "name": "Example Corp",
  "legal_name": "Example Corporation, Inc.",
  "short_description": "AI-powered defense solutions",
  "long_description": "...",
  "website": "https://example.com",
  "linkedin_url": "https://linkedin.com/company/example",
  "twitter_url": "https://twitter.com/example",
  "facebook_url": "https://facebook.com/example"
}
```

### 2.2 Company Classification
```json
{
  "category_groups": ["Defense", "Software", "Artificial Intelligence"],
  "industries": ["Defense & Security", "Software"],
  "operating_status": "active",
  "company_type": "for_profit",
  "ipo_status": "private"
}
```

### 2.3 Financial Data
```json
{
  "funding_rounds": [
    {
      "round_type": "series_b",
      "announced_on": "2023-06-15",
      "money_raised": {
        "value": 25000000,
        "currency": "USD"
      },
      "investors": ["Sequoia Capital", "Andreessen Horowitz"],
      "lead_investor": "Sequoia Capital"
    }
  ],
  "total_funding_amount": 45000000,
  "last_funding_date": "2023-06-15",
  "last_funding_type": "series_b",
  "number_of_funding_rounds": 3,
  "valuation": 200000000,
  "valuation_date": "2023-06-15"
}
```

### 2.4 People & Leadership
```json
{
  "founders": [
    {
      "name": "John Doe",
      "title": "CEO & Co-Founder",
      "linkedin_url": "https://linkedin.com/in/johndoe"
    }
  ],
  "leadership": [
    {
      "name": "Jane Smith",
      "title": "CTO",
      "started_on": "2020-03-01"
    }
  ],
  "employee_count": 150,
  "employee_count_range": "101-250"
}
```

### 2.5 Location & Demographics
```json
{
  "headquarters_location": {
    "city": "Austin",
    "region": "Texas",
    "country": "United States",
    "postal_code": "78701"
  },
  "locations": [
    {
      "city": "Washington",
      "region": "District of Columbia",
      "location_type": "office"
    }
  ]
}
```

### 2.6 Market Intelligence
```json
{
  "acquisitions": [
    {
      "acquired_company": "SmallTech Inc",
      "announced_on": "2022-09-01",
      "price": 10000000,
      "acquisition_type": "acquisition"
    }
  ],
  "acquired_by": null,
  "ipo_date": null,
  "stock_symbol": null,
  "stock_exchange": null
}
```

### 2.7 Partnerships & Investors
```json
{
  "investors": [
    {
      "name": "In-Q-Tel",
      "type": "venture_capital",
      "lead_investor": true
    }
  ],
  "investor_types": ["venture_capital", "private_equity"],
  "partners": ["AWS", "Microsoft Azure"]
}
```

## 3. Database Schema Design

### 3.1 New Tables

#### Table 1: `crunchbase_companies`
Primary table for enriched company data from Crunchbase.

```sql
CREATE TABLE crunchbase_companies (
  id BIGSERIAL PRIMARY KEY,
  
  -- Crunchbase Identifiers
  crunchbase_uuid TEXT UNIQUE NOT NULL,
  crunchbase_permalink TEXT UNIQUE NOT NULL,
  
  -- Company Matching (Link to FPDS/SAM data)
  company_name TEXT NOT NULL,
  legal_name TEXT,
  matched_vendor_names TEXT[], -- Array of vendor names from fpds_contracts
  matched_vendor_uei TEXT[], -- Array of UEIs
  matched_vendor_duns TEXT[], -- Array of DUNS
  
  -- Basic Information
  website TEXT,
  short_description TEXT,
  long_description TEXT,
  
  -- Contact & Social
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  email TEXT,
  phone TEXT,
  
  -- Classification
  category_groups TEXT[],
  industries TEXT[],
  operating_status TEXT, -- 'active', 'closed', 'acquired'
  company_type TEXT, -- 'for_profit', 'non_profit', 'government'
  ipo_status TEXT, -- 'public', 'private', 'acquired', 'closed'
  
  -- Financial Data
  total_funding_amount DECIMAL(15,2),
  total_funding_currency TEXT DEFAULT 'USD',
  last_funding_date DATE,
  last_funding_type TEXT,
  number_of_funding_rounds INTEGER,
  
  -- Valuation
  valuation DECIMAL(15,2),
  valuation_date DATE,
  valuation_currency TEXT DEFAULT 'USD',
  
  -- IPO Information
  ipo_date DATE,
  stock_symbol TEXT,
  stock_exchange TEXT,
  
  -- Acquisition Information
  was_acquired BOOLEAN DEFAULT FALSE,
  acquired_by_name TEXT,
  acquired_by_uuid TEXT,
  acquisition_date DATE,
  acquisition_price DECIMAL(15,2),
  
  -- People
  founder_names TEXT[],
  ceo_name TEXT,
  cto_name TEXT,
  employee_count INTEGER,
  employee_count_range TEXT, -- '1-10', '11-50', '51-200', etc.
  
  -- Location
  headquarters_city TEXT,
  headquarters_region TEXT, -- State/Province
  headquarters_country TEXT DEFAULT 'United States',
  headquarters_postal_code TEXT,
  
  -- Market Intelligence
  number_of_acquisitions INTEGER DEFAULT 0,
  number_of_investments INTEGER DEFAULT 0,
  number_of_exits INTEGER DEFAULT 0,
  
  -- Dates
  founded_date DATE,
  closed_date DATE,
  
  -- API Metadata
  last_enriched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrichment_source TEXT DEFAULT 'crunchbase_api',
  api_call_count INTEGER DEFAULT 1,
  data_quality_score INTEGER, -- 0-100 based on completeness
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Attribution (Required by Crunchbase TOS)
  data_attribution TEXT DEFAULT 'Data provided by Crunchbase'
);

-- Indexes
CREATE INDEX idx_cb_companies_name ON crunchbase_companies(company_name);
CREATE INDEX idx_cb_companies_uuid ON crunchbase_companies(crunchbase_uuid);
CREATE INDEX idx_cb_companies_permalink ON crunchbase_companies(crunchbase_permalink);
CREATE INDEX idx_cb_companies_uei ON crunchbase_companies USING GIN(matched_vendor_uei);
CREATE INDEX idx_cb_companies_duns ON crunchbase_companies USING GIN(matched_vendor_duns);
CREATE INDEX idx_cb_companies_operating_status ON crunchbase_companies(operating_status);
CREATE INDEX idx_cb_companies_total_funding ON crunchbase_companies(total_funding_amount DESC);
CREATE INDEX idx_cb_companies_employee_count ON crunchbase_companies(employee_count DESC);
CREATE INDEX idx_cb_companies_founded_date ON crunchbase_companies(founded_date);
CREATE INDEX idx_cb_companies_last_enriched ON crunchbase_companies(last_enriched);

-- Full-text search
CREATE INDEX idx_cb_companies_search ON crunchbase_companies 
  USING GIN(to_tsvector('english', 
    COALESCE(company_name, '') || ' ' || 
    COALESCE(short_description, '') || ' ' || 
    COALESCE(long_description, '')
  ));
```

#### Table 2: `crunchbase_funding_rounds`
Detailed funding round history for each company.

```sql
CREATE TABLE crunchbase_funding_rounds (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id) ON DELETE CASCADE,
  company_uuid TEXT NOT NULL,
  
  -- Round Identifiers
  funding_round_uuid TEXT UNIQUE NOT NULL,
  funding_round_permalink TEXT,
  
  -- Round Details
  round_name TEXT, -- 'Series A', 'Seed', 'Series B', etc.
  round_type TEXT, -- 'seed', 'series_a', 'series_b', 'venture', 'private_equity'
  announced_date DATE,
  closed_date DATE,
  
  -- Funding Amount
  money_raised DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  pre_money_valuation DECIMAL(15,2),
  post_money_valuation DECIMAL(15,2),
  
  -- Investors
  investor_count INTEGER,
  lead_investor_name TEXT,
  lead_investor_uuid TEXT,
  investor_names TEXT[],
  investor_types TEXT[], -- 'venture_capital', 'angel', 'private_equity'
  
  -- Strategic Investors (Important for Gov Contracting)
  has_strategic_investor BOOLEAN DEFAULT FALSE,
  strategic_investor_names TEXT[], -- e.g., In-Q-Tel, strategic corporates
  
  -- Additional Details
  is_equity BOOLEAN,
  target_funding DECIMAL(15,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cb_funding_company_id ON crunchbase_funding_rounds(crunchbase_company_id);
CREATE INDEX idx_cb_funding_company_uuid ON crunchbase_funding_rounds(company_uuid);
CREATE INDEX idx_cb_funding_round_type ON crunchbase_funding_rounds(round_type);
CREATE INDEX idx_cb_funding_announced_date ON crunchbase_funding_rounds(announced_date DESC);
CREATE INDEX idx_cb_funding_money_raised ON crunchbase_funding_rounds(money_raised DESC);
CREATE INDEX idx_cb_funding_lead_investor ON crunchbase_funding_rounds(lead_investor_name);
CREATE INDEX idx_cb_funding_strategic ON crunchbase_funding_rounds(has_strategic_investor) 
  WHERE has_strategic_investor = TRUE;
```

#### Table 3: `crunchbase_people`
Key people at companies (founders, executives).

```sql
CREATE TABLE crunchbase_people (
  id BIGSERIAL PRIMARY KEY,
  
  -- Person Identifiers
  crunchbase_person_uuid TEXT UNIQUE NOT NULL,
  person_permalink TEXT,
  
  -- Basic Info
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Position (Current or Most Recent)
  current_company_uuid TEXT,
  current_company_name TEXT,
  current_title TEXT,
  started_on DATE,
  ended_on DATE,
  is_current BOOLEAN DEFAULT TRUE,
  
  -- Contact
  linkedin_url TEXT,
  twitter_url TEXT,
  email TEXT,
  
  -- Background
  bio TEXT,
  gender TEXT,
  
  -- Education
  education JSONB, -- Array of {school, degree, field, graduated_year}
  
  -- Location
  location_city TEXT,
  location_region TEXT,
  location_country TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cb_people_uuid ON crunchbase_people(crunchbase_person_uuid);
CREATE INDEX idx_cb_people_company_uuid ON crunchbase_people(current_company_uuid);
CREATE INDEX idx_cb_people_name ON crunchbase_people(full_name);
CREATE INDEX idx_cb_people_title ON crunchbase_people(current_title);
CREATE INDEX idx_cb_people_is_current ON crunchbase_people(is_current) WHERE is_current = TRUE;
```

#### Table 4: `crunchbase_acquisitions`
Track company acquisitions (important for market intelligence).

```sql
CREATE TABLE crunchbase_acquisitions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Acquisition Identifiers
  acquisition_uuid TEXT UNIQUE NOT NULL,
  
  -- Acquirer
  acquirer_uuid TEXT,
  acquirer_name TEXT NOT NULL,
  acquirer_crunchbase_id BIGINT REFERENCES crunchbase_companies(id),
  
  -- Acquired Company
  acquired_uuid TEXT,
  acquired_name TEXT NOT NULL,
  acquired_crunchbase_id BIGINT REFERENCES crunchbase_companies(id),
  
  -- Deal Details
  announced_date DATE,
  completed_date DATE,
  acquisition_type TEXT, -- 'acquisition', 'merger', 'buyout'
  acquisition_status TEXT, -- 'completed', 'pending', 'cancelled'
  
  -- Financial
  price DECIMAL(15,2),
  price_currency TEXT DEFAULT 'USD',
  
  -- Additional Details
  deal_terms TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cb_acquisitions_acquirer_uuid ON crunchbase_acquisitions(acquirer_uuid);
CREATE INDEX idx_cb_acquisitions_acquired_uuid ON crunchbase_acquisitions(acquired_uuid);
CREATE INDEX idx_cb_acquisitions_announced_date ON crunchbase_acquisitions(announced_date DESC);
CREATE INDEX idx_cb_acquisitions_price ON crunchbase_acquisitions(price DESC);
```

#### Table 5: `crunchbase_enrichment_queue`
Queue for managing company enrichment requests.

```sql
CREATE TABLE crunchbase_enrichment_queue (
  id BIGSERIAL PRIMARY KEY,
  
  -- Company to Enrich
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  source_table TEXT NOT NULL, -- 'fpds_contracts', 'sam_gov_opportunities', 'army_innovation_submissions'
  source_id BIGINT,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10 (10 = highest priority)
  priority_reason TEXT, -- 'large_contract_winner', 'frequent_contractor', 'new_company'
  
  -- Enrichment Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'not_found'
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Results
  crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id),
  match_confidence DECIMAL(3,2), -- 0.00 - 1.00
  match_method TEXT, -- 'exact_name', 'website', 'manual', 'fuzzy_match'
  
  -- Error Handling
  last_error TEXT,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cb_queue_status ON crunchbase_enrichment_queue(status);
CREATE INDEX idx_cb_queue_priority ON crunchbase_enrichment_queue(priority DESC);
CREATE INDEX idx_cb_queue_company_name ON crunchbase_enrichment_queue(company_name);
CREATE INDEX idx_cb_queue_vendor_uei ON crunchbase_enrichment_queue(vendor_uei);
CREATE INDEX idx_cb_queue_created_at ON crunchbase_enrichment_queue(created_at);

-- Unique constraint to prevent duplicate enrichment requests
CREATE UNIQUE INDEX idx_cb_queue_unique_company ON crunchbase_enrichment_queue(company_name, vendor_uei, vendor_duns)
  WHERE status IN ('pending', 'in_progress');
```

#### Table 6: `crunchbase_api_usage`
Track API usage for billing and optimization.

```sql
CREATE TABLE crunchbase_api_usage (
  id BIGSERIAL PRIMARY KEY,
  
  -- API Call Details
  endpoint TEXT NOT NULL, -- '/entities/organizations/{uuid}', '/searches/organizations'
  request_method TEXT DEFAULT 'GET',
  company_name TEXT,
  company_uuid TEXT,
  
  -- Response
  status_code INTEGER,
  success BOOLEAN,
  response_time_ms INTEGER,
  
  -- Rate Limiting
  rate_limit_remaining INTEGER,
  rate_limit_total INTEGER,
  
  -- Cost Tracking
  api_credits_used INTEGER DEFAULT 1,
  
  -- Error Tracking
  error_message TEXT,
  error_type TEXT,
  
  -- Timestamp
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cb_api_usage_called_at ON crunchbase_api_usage(called_at DESC);
CREATE INDEX idx_cb_api_usage_endpoint ON crunchbase_api_usage(endpoint);
CREATE INDEX idx_cb_api_usage_success ON crunchbase_api_usage(success);
CREATE INDEX idx_cb_api_usage_company_uuid ON crunchbase_api_usage(company_uuid);
```

### 3.2 Link Existing Tables

Add foreign key columns to existing tables to link to Crunchbase data.

```sql
-- Add to fpds_company_stats
ALTER TABLE fpds_company_stats 
ADD COLUMN crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id),
ADD COLUMN crunchbase_enriched BOOLEAN DEFAULT FALSE,
ADD COLUMN crunchbase_last_updated TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_fpds_stats_crunchbase_id ON fpds_company_stats(crunchbase_company_id);

-- Add to sam_gov_opportunities (for awardees)
ALTER TABLE sam_gov_opportunities
ADD COLUMN awardee_crunchbase_id BIGINT REFERENCES crunchbase_companies(id),
ADD COLUMN awardee_crunchbase_enriched BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_sam_opp_crunchbase_id ON sam_gov_opportunities(awardee_crunchbase_id);

-- Add to army_innovation_submissions
ALTER TABLE army_innovation_submissions
ADD COLUMN crunchbase_company_id BIGINT REFERENCES crunchbase_companies(id),
ADD COLUMN crunchbase_enriched BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_army_sub_crunchbase_id ON army_innovation_submissions(crunchbase_company_id);
```

## 4. Integration Strategy

### 4.1 Enrichment Workflow

```
1. Identify Companies to Enrich
   ├─ New contract winners from FPDS
   ├─ SAM.gov opportunity awardees
   ├─ Army xTech/FUZE participants
   └─ High-value companies (by contract value)

2. Add to Enrichment Queue
   ├─ Priority calculation based on:
   │  ├─ Total contract value
   │  ├─ Number of contracts
   │  ├─ Recent activity
   │  └─ User interest (manual requests)
   └─ Deduplication

3. Process Queue (Background Job)
   ├─ Check daily API limit
   ├─ Process highest priority first
   ├─ Rate limit management
   └─ Error handling & retry logic

4. Crunchbase API Lookup
   ├─ Search by company name
   ├─ Verify match (domain, location)
   ├─ Fetch full company profile
   ├─ Fetch funding rounds
   └─ Fetch people data

5. Store & Link Data
   ├─ Save to crunchbase_companies
   ├─ Save funding rounds
   ├─ Link to fpds_company_stats
   └─ Update enrichment_queue status

6. Refresh Strategy
   ├─ Quarterly updates for active companies
   ├─ Monthly for high-priority companies
   └─ On-demand for user-requested companies
```

### 4.2 Prioritization Algorithm

```typescript
function calculateEnrichmentPriority(company: CompanyRecord): number {
  let priority = 0;
  
  // Contract value (0-4 points)
  if (company.total_contract_value > 10_000_000) priority += 4;
  else if (company.total_contract_value > 1_000_000) priority += 3;
  else if (company.total_contract_value > 100_000) priority += 2;
  else priority += 1;
  
  // Contract frequency (0-2 points)
  if (company.total_contracts > 20) priority += 2;
  else if (company.total_contracts > 5) priority += 1;
  
  // Recent activity (0-2 points)
  const monthsSinceLastContract = getMonthsSince(company.most_recent_contract);
  if (monthsSinceLastContract <= 3) priority += 2;
  else if (monthsSinceLastContract <= 12) priority += 1;
  
  // SBIR/Innovation participation (0-2 points)
  if (company.sbir_contracts > 0 || company.xtech_participant) priority += 2;
  
  return Math.min(priority, 10); // Cap at 10
}
```

### 4.3 Matching Algorithm

Company name matching is challenging. Use multi-step approach:

```typescript
async function matchCompanyToCrunchbase(companyName: string, website?: string): Promise<Match> {
  // Step 1: Exact name match via Crunchbase Search API
  const searchResults = await crunchbaseSearch(companyName);
  
  // Step 2: If website available, use domain matching
  if (website) {
    const domainMatch = searchResults.find(r => 
      r.website && extractDomain(r.website) === extractDomain(website)
    );
    if (domainMatch) return { company: domainMatch, confidence: 1.0, method: 'domain' };
  }
  
  // Step 3: Fuzzy name matching with location validation
  const fuzzyMatches = searchResults.filter(r => 
    calculateNameSimilarity(companyName, r.name) > 0.85
  );
  
  if (fuzzyMatches.length === 1) {
    return { company: fuzzyMatches[0], confidence: 0.9, method: 'fuzzy' };
  }
  
  // Step 4: Location-based disambiguation
  if (fuzzyMatches.length > 1 && companyLocation) {
    const locationMatch = fuzzyMatches.find(r => 
      r.headquarters_city === companyLocation.city &&
      r.headquarters_region === companyLocation.state
    );
    if (locationMatch) return { company: locationMatch, confidence: 0.85, method: 'location' };
  }
  
  // Step 5: Manual review queue
  if (fuzzyMatches.length > 0) {
    return { company: null, confidence: 0.5, method: 'needs_manual_review', candidates: fuzzyMatches };
  }
  
  return { company: null, confidence: 0, method: 'not_found' };
}
```

## 5. How Crunchbase Enhances PropShop AI

### 5.1 Enhanced Company Intelligence

**Current State**: Basic vendor name, address, NAICS code from FPDS
**With Crunchbase**: 
- Complete company profile with description
- Technology focus areas and industries
- Website and social media presence
- Leadership team information
- Employee count and growth trajectory

### 5.2 Funding & Financial Insights

**Value**: Understand company financial health and growth stage
- Total funding raised (seed, Series A, B, C, etc.)
- Recent funding rounds (timing and amount)
- Investor list (especially strategic investors like In-Q-Tel)
- Valuation trends
- Exit events (acquisitions, IPOs)

**Use Cases**:
- Identify well-funded competitors entering government market
- Track companies transitioning from VC-funded to government contracts
- Find companies with strategic defense/intelligence investors
- Predict which companies are likely to bid on contracts

### 5.3 Competitive Intelligence

**Track Market Dynamics**:
- Which companies are acquiring government contractors?
- What technology areas are attracting VC funding?
- Which startups are pivoting to government contracting?
- Leadership changes at major contractors

### 5.4 Business Development Intelligence

**For PropShop Users**:
- Identify potential partners (similar funding stage, tech focus)
- Find companies to team with on proposals
- Track competitor funding and growth
- Identify acquisition targets or acquirers

### 5.5 Market Trend Analysis

**Macro Insights**:
- Funding trends in defense tech, AI/ML, cybersecurity
- Correlation between VC funding and government contracts
- Geographic clusters of government contractors
- Technology adoption patterns

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Tasks**:
- [ ] Purchase Crunchbase API subscription (Enterprise recommended)
- [ ] Create database migrations for all 6 new tables
- [ ] Add foreign key columns to existing tables
- [ ] Set up environment variables for API key

**Deliverables**:
- Database schema complete
- API credentials configured

### Phase 2: Core API Integration (Week 3-4)

**Tasks**:
- [ ] Build TypeScript SDK for Crunchbase API
  - Organization lookup by UUID
  - Organization search by name
  - Funding rounds retrieval
  - People retrieval
- [ ] Implement rate limiting and retry logic
- [ ] Build error handling and logging
- [ ] Create API usage tracking

**Deliverables**:
- `src/lib/crunchbase-api-client.ts`
- `src/lib/crunchbase-rate-limiter.ts`
- Unit tests for API client

### Phase 3: Enrichment Queue System (Week 5-6)

**Tasks**:
- [ ] Build enrichment queue manager
- [ ] Implement priority calculation algorithm
- [ ] Create background job processor (cron)
- [ ] Build company matching logic
- [ ] Implement deduplication

**Deliverables**:
- `src/lib/crunchbase-enrichment-queue.ts`
- `src/lib/crunchbase-company-matcher.ts`
- Cron job for automated processing

### Phase 4: Data Population (Week 7-8)

**Tasks**:
- [ ] Identify top 1,000 companies by contract value
- [ ] Populate enrichment queue
- [ ] Run initial enrichment batch
- [ ] Manual review of low-confidence matches
- [ ] Link enriched companies to FPDS/SAM records

**Deliverables**:
- 1,000+ companies enriched
- Validation report
- Match accuracy metrics

### Phase 5: User Interface (Week 9-10)

**Tasks**:
- [ ] Add Crunchbase data to company detail pages
- [ ] Create funding timeline visualization
- [ ] Add "Enrich Company" button for manual requests
- [ ] Build Crunchbase insights dashboard
- [ ] Display attribution (required by Crunchbase TOS)

**Deliverables**:
- Enhanced company profile pages
- Funding visualization component
- Admin dashboard for monitoring enrichment

### Phase 6: Advanced Features (Week 11-12)

**Tasks**:
- [ ] Build investor intelligence (track In-Q-Tel, other strategic)
- [ ] Create funding trends report
- [ ] Implement smart alerts (new funding rounds)
- [ ] Build competitive intelligence dashboard
- [ ] Add bulk enrichment API endpoint

**Deliverables**:
- Investor tracking system
- Trend analysis dashboards
- Alert system

### Phase 7: Automation & Optimization (Week 13+)

**Tasks**:
- [ ] Automated enrichment for new contract winners
- [ ] Quarterly refresh for all companies
- [ ] Optimize matching algorithm based on performance
- [ ] Reduce manual review requirements
- [ ] Cost optimization (reduce redundant API calls)

**Deliverables**:
- Fully automated enrichment pipeline
- 95%+ match accuracy
- Cost per enrichment < $0.50

## 7. Technical Architecture

### 7.1 File Structure

```
src/
├── lib/
│   ├── crunchbase/
│   │   ├── api-client.ts              # Core API wrapper
│   │   ├── rate-limiter.ts            # Rate limiting logic
│   │   ├── company-matcher.ts         # Matching algorithm
│   │   ├── enrichment-queue.ts        # Queue management
│   │   ├── enrichment-processor.ts    # Background job processor
│   │   ├── data-mapper.ts             # Map API response to DB schema
│   │   ├── priority-calculator.ts     # Priority algorithm
│   │   └── types.ts                   # TypeScript types
│   └── supabase-crunchbase.ts         # DB queries for Crunchbase tables
├── app/
│   ├── api/
│   │   └── crunchbase/
│   │       ├── enrich/route.ts        # Trigger enrichment
│   │       ├── search/route.ts        # Search Crunchbase
│   │       ├── queue/route.ts         # Queue management
│   │       └── stats/route.ts         # Usage stats
│   └── admin/
│       └── crunchbase/
│           ├── page.tsx               # Admin dashboard
│           ├── queue/page.tsx         # Queue monitor
│           └── usage/page.tsx         # API usage tracking
└── cron/
    └── process-crunchbase-queue.ts    # Scheduled enrichment job
```

### 7.2 API Client Example

```typescript
// src/lib/crunchbase/api-client.ts
export class CrunchbaseClient {
  private apiKey: string;
  private baseURL = 'https://api.crunchbase.com/api/v4';
  private rateLimiter: RateLimiter;

  async searchOrganizations(query: string): Promise<Organization[]> {
    const response = await this.request('/searches/organizations', {
      field_ids: [
        'identifier',
        'name',
        'legal_name',
        'website',
        'short_description',
        'categories',
        'location_identifiers',
      ],
      query: [
        {
          type: 'predicate',
          field_id: 'name',
          operator_id: 'contains',
          values: [query]
        }
      ]
    });
    
    return response.entities;
  }

  async getOrganization(uuid: string): Promise<Organization> {
    const response = await this.request(`/entities/organizations/${uuid}`, {
      card_ids: [
        'fields',
        'funding_rounds',
        'investors',
        'people',
        'acquisitions'
      ]
    });
    
    return response.properties;
  }

  private async request(endpoint: string, params: any): Promise<any> {
    await this.rateLimiter.waitForToken();
    
    const url = new URL(this.baseURL + endpoint);
    url.searchParams.append('user_key', this.apiKey);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    await this.logAPICall(endpoint, response.status);
    
    if (!response.ok) {
      throw new Error(`Crunchbase API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### 7.3 Enrichment Queue Processor

```typescript
// cron/process-crunchbase-queue.ts
export async function processCrunchbaseQueue() {
  const dailyLimit = 1000; // Based on subscription
  const todayUsage = await getAPIUsageToday();
  const remaining = dailyLimit - todayUsage;
  
  if (remaining <= 0) {
    console.log('Daily API limit reached');
    return;
  }
  
  // Fetch highest priority pending items
  const queue = await supabase
    .from('crunchbase_enrichment_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(Math.min(remaining, 100));
  
  for (const item of queue.data) {
    try {
      await enrichCompany(item);
    } catch (error) {
      await handleEnrichmentError(item, error);
    }
  }
}

async function enrichCompany(queueItem: EnrichmentQueueItem) {
  const client = new CrunchbaseClient();
  
  // Step 1: Search for company
  const matches = await client.searchOrganizations(queueItem.company_name);
  
  // Step 2: Match company
  const match = await matchCompany(queueItem, matches);
  
  if (!match || match.confidence < 0.7) {
    await markForManualReview(queueItem, matches);
    return;
  }
  
  // Step 3: Fetch full profile
  const company = await client.getOrganization(match.uuid);
  
  // Step 4: Store data
  const crunchbaseCompanyId = await storeCrunchbaseCompany(company, queueItem);
  
  // Step 5: Link to source records
  await linkCompanyToRecords(crunchbaseCompanyId, queueItem);
  
  // Step 6: Mark complete
  await updateQueueStatus(queueItem.id, 'completed', crunchbaseCompanyId);
}
```

## 8. Cost Estimation

### 8.1 API Subscription

**Recommended Tier**: Enterprise API ($5,000-$10,000/month)
- 1,000-5,000 API calls per day
- Advanced data fields
- Higher rate limits
- Better support

### 8.2 Enrichment Costs

**Assumptions**:
- 10,000 unique companies in your database
- 2 API calls per company (search + full profile)
- Initial enrichment: 20,000 API calls
- Quarterly refresh: 20,000 calls every 3 months
- New companies: ~500/month × 2 = 1,000 calls/month

**Annual API Calls**: 20,000 (initial) + 80,000 (quarterly) + 12,000 (new) = 112,000 calls

**Cost per Call**: $0.05-$0.15 (based on subscription tier)
**Annual API Cost**: $60,000-$120,000

**More Practical Approach**:
- Start with top 1,000 companies: $100-$300
- Enrich 500 new companies/month: $50-$150/month
- Quarterly refresh for active companies: $200-$600/quarter
- **Estimated Annual Cost**: $3,000-$9,000 + subscription fee

## 9. Compliance & Attribution

### 9.1 Crunchbase Terms of Service

**Required Attribution**:
- Display "Data provided by Crunchbase" near all Crunchbase data
- Provide hyperlink to Crunchbase.com
- Use visible link (no "nofollow" tags)
- Attribution must be in close proximity to data

**Usage Restrictions**:
- Do NOT redistribute Crunchbase data to third parties
- Do NOT use data for building competing database
- Use for internal business intelligence and research only
- Cannot scrape or crawl Crunchbase website

### 9.2 Implementation

Add to all pages displaying Crunchbase data:

```tsx
<div className="crunchbase-attribution">
  Data provided by{' '}
  <a href="https://www.crunchbase.com" target="_blank" rel="noopener">
    Crunchbase
  </a>
</div>
```

## 10. Success Metrics

### 10.1 Enrichment Metrics

- **Coverage**: % of companies enriched (target: 80% of top 1,000)
- **Match Accuracy**: % of correct matches (target: 95%+)
- **Match Confidence**: Average confidence score (target: 0.85+)
- **Manual Review Rate**: % requiring manual review (target: <10%)

### 10.2 Data Quality Metrics

- **Completeness**: Average % of fields populated (target: 70%+)
- **Freshness**: Average days since last update (target: <90 days)
- **API Success Rate**: % of successful API calls (target: 99%+)

### 10.3 Business Impact Metrics

- **User Engagement**: Increased time on company profile pages
- **Feature Usage**: % of users viewing Crunchbase data
- **User Feedback**: NPS score for enriched company data
- **Competitive Advantage**: Unique insights vs competitors

## 11. Risk Mitigation

### 11.1 API Risks

**Risk**: Rate limit exceeded
**Mitigation**: Implement queue with daily limit tracking, prioritization

**Risk**: API downtime
**Mitigation**: Retry logic, graceful degradation, cache data locally

**Risk**: Cost overruns
**Mitigation**: Daily usage monitoring, alerts at 80% of budget

### 11.2 Data Quality Risks

**Risk**: Incorrect company matching
**Mitigation**: Multi-step verification, confidence scores, manual review queue

**Risk**: Outdated data
**Mitigation**: Automated quarterly refresh, track last_updated timestamps

### 11.3 Compliance Risks

**Risk**: Attribution violations
**Mitigation**: Automated attribution on all pages, legal review

**Risk**: Data redistribution violations
**Mitigation**: Access control, terms of service for users

## 12. Next Steps

### Immediate Actions (This Week)

1. **Contact Crunchbase Sales** (sales@crunchbase.com)
   - Request API pricing quote
   - Explain use case (government contracting intelligence)
   - Negotiate contract terms

2. **Database Setup**
   - Run database migration SQL
   - Test foreign key relationships
   - Set up staging environment

3. **API Credentials**
   - Obtain API key after contract signed
   - Configure environment variables
   - Test basic API calls

### Next Month

1. **Build Core Infrastructure**
   - API client library
   - Enrichment queue system
   - Background job processor

2. **Initial Enrichment**
   - Identify top 1,000 companies
   - Process enrichment queue
   - Validate data quality

3. **User Interface**
   - Add Crunchbase data to company pages
   - Build admin dashboard
   - Implement attribution

### Long Term (3-6 Months)

1. **Automation**
   - Automated enrichment for new companies
   - Quarterly refresh system
   - Smart alerts for funding events

2. **Advanced Analytics**
   - Funding trends dashboard
   - Competitive intelligence reports
   - Investor tracking system

3. **Optimization**
   - Improve matching algorithm
   - Reduce API costs
   - Enhance data quality

---

## Summary

Crunchbase API integration will transform PropShop AI from a government contracting data platform into a comprehensive business intelligence tool. By combining government contract data (FPDS, SAM.gov, SBIR) with private company intelligence (funding, leadership, acquisitions), you'll provide unique insights that no competitor offers.

**Key Value Proposition**:
- Identify which well-funded startups are entering government contracting
- Track correlation between VC funding and contract wins
- Find companies with strategic investors (In-Q-Tel, defense contractors)
- Predict which companies are likely to bid on contracts
- Provide complete company profiles for due diligence

**Investment**: $5,000-$10,000/month subscription + $3,000-$9,000/year enrichment costs
**Return**: Unique competitive advantage, increased user engagement, premium pricing tier

This is a game-changing enhancement that positions PropShop AI as the definitive intelligence platform for government contracting.

