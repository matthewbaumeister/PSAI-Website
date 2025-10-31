# SBA SBIR/STTR Awards Integration - Complete Implementation Plan

## Executive Summary

This plan outlines the complete integration of historical and current SBIR/STTR award data from SBA into the Prop Shop AI platform. This will enable users to see **who won which topics**, **award amounts**, **winning company profiles**, **historical success patterns**, and **competitive intelligence** for each SBIR opportunity.

**Data Source:** SBIR.gov API + Bulk Downloads  
**Estimated Records:** 200,000+ awards (1983-present)  
**Update Frequency:** Daily via API  
**Implementation Timeline:** 4-6 weeks

---

## 1. Data Sources & Access

### 1.1 SBIR.gov API

**Base URL:** `https://api.www.sbir.gov/public/api/awards`

**Key Endpoints:**
```
GET /awards?agency={agency}&year={year}
GET /awards?company={company_name}
GET /awards?keyword={keyword}
GET /awards?agency={agency}&phase={phase}&year={year}
```

**Query Parameters:**
- `agency` - Agency acronym (DOD, DOE, NASA, NIH, NSF, etc.)
- `year` - Award year (1983-present)
- `phase` - Phase I, Phase II, Phase III
- `company` - Company/firm name
- `keyword` - Search by keyword
- `ri` - Research Institution
- `rows` - Results per page (default: 100, max: 1000)
- `start` - Pagination offset
- `format` - json or xml (default: json)

**Response Format (JSON):**
```json
{
  "response": {
    "numFound": 45892,
    "start": 0,
    "docs": [
      {
        "agency": "Department of Defense",
        "agency_id": "DOD",
        "award_title": "Advanced Materials for Hypersonic Applications",
        "award_year": "2024",
        "company": "Acme Technologies LLC",
        "duns": "123456789",
        "phase": "Phase I",
        "program": "SBIR",
        "award_amount": "$150,000",
        "contract_award_number": "W911QX-24-C-0001",
        "hubzone_owned": "N",
        "woman_owned": "Y",
        "socially_and_economically_disadvantaged": "N",
        "firm_address": "123 Innovation Dr, Boston, MA 02101",
        "firm_phone": "(617) 555-1234",
        "firm_website": "https://acmetech.com",
        "abstract": "This Phase I project will develop...",
        "ri": "",
        "topic_number": "A24-001",
        "solicitation_id": "DOD SBIR 24.1",
        "branch_of_service": "Army",
        "component": "Army",
        "program_manager": "John Smith",
        "program_manager_email": "john.smith@army.mil"
      }
    ]
  }
}
```

**Rate Limits:**
- Default: 100 rows per request
- Max: 1000 rows per request
- Recommended: 500ms delay between requests

### 1.2 Bulk Data Downloads

**URL:** `https://www.sbir.gov/data-resources`

**Available Files:**
- Award data with abstracts (XLS, JSON, XML)
- Award data without abstracts (XLS, JSON, XML)
- Updated monthly
- Limit: 10,000 records per download

**Use Case:** Initial bulk load of historical data

---

## 2. Database Schema Design

### 2.1 New Tables

#### `sbir_awards`
Primary table for all award records
```sql
CREATE TABLE sbir_awards (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,
  
  -- Award Identification
  contract_award_number TEXT UNIQUE NOT NULL, -- W911QX-24-C-0001
  award_year INTEGER NOT NULL,
  award_date DATE,
  
  -- Topic/Opportunity Linkage (CRITICAL)
  topic_number TEXT, -- Links to sbir_final.topic_number
  solicitation_id TEXT,
  solicitation_number TEXT,
  
  -- Award Details
  award_title TEXT NOT NULL,
  abstract TEXT,
  phase TEXT NOT NULL, -- Phase I, Phase II, Phase III
  program TEXT NOT NULL, -- SBIR, STTR
  award_amount DECIMAL(12,2),
  
  -- Agency Information
  agency TEXT NOT NULL, -- Department of Defense
  agency_id TEXT NOT NULL, -- DOD
  branch_of_service TEXT, -- Army, Navy, Air Force, etc.
  component TEXT, -- Specific component (ARMY, DARPA, etc.)
  
  -- Company Information
  company TEXT NOT NULL,
  duns TEXT,
  firm_address TEXT,
  firm_city TEXT,
  firm_state TEXT,
  firm_zip TEXT,
  firm_country TEXT,
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
  data_source TEXT DEFAULT 'sbir.gov', -- sbir.gov, manual, etc.
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_awards_topic_number (topic_number),
  INDEX idx_awards_company (company),
  INDEX idx_awards_agency (agency_id),
  INDEX idx_awards_year (award_year),
  INDEX idx_awards_phase (phase),
  INDEX idx_awards_contract (contract_award_number)
);
```

#### `sbir_companies`
Aggregated company profiles and statistics
```sql
CREATE TABLE sbir_companies (
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
  phase_1_to_2_conversion_rate DECIMAL(5,2), -- Percentage
  average_award_amount DECIMAL(12,2),
  
  -- Technology Focus
  primary_technology_areas TEXT[],
  primary_agencies TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_companies_name (company_name),
  INDEX idx_companies_state (state),
  INDEX idx_companies_total_awards (total_awards DESC)
);
```

#### `sbir_topic_awards_summary`
Pre-computed summary linking topics to their awards
```sql
CREATE TABLE sbir_topic_awards_summary (
  id BIGSERIAL PRIMARY KEY,
  
  -- Topic Linkage
  topic_number TEXT UNIQUE NOT NULL, -- Links to sbir_final.topic_number
  
  -- Award Statistics
  total_awards INTEGER DEFAULT 0,
  total_funding DECIMAL(15,2) DEFAULT 0,
  phase_1_awards INTEGER DEFAULT 0,
  phase_2_awards INTEGER DEFAULT 0,
  phase_3_awards INTEGER DEFAULT 0,
  
  -- Winner Information (most recent or all)
  winners JSONB, -- Array of {company, phase, award_amount, year}
  
  -- Patterns
  average_award_amount_phase_1 DECIMAL(12,2),
  average_award_amount_phase_2 DECIMAL(12,2),
  most_common_winner_state TEXT,
  woman_owned_percentage DECIMAL(5,2),
  
  -- Metadata
  last_computed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_topic_awards_topic (topic_number),
  FOREIGN KEY (topic_number) REFERENCES sbir_final(topic_number)
);
```

#### `sbir_awards_scraper_log`
Track scraping operations
```sql
CREATE TABLE sbir_awards_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  scrape_type TEXT NOT NULL, -- 'bulk_historical', 'daily_update', 'agency_specific'
  agency TEXT,
  year_range TEXT, -- '2020-2024'
  
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
```

### 2.2 Modifications to Existing Tables

#### Add to `sbir_final`
```sql
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS has_awards BOOLEAN DEFAULT false;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS total_awards INTEGER DEFAULT 0;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS total_award_funding DECIMAL(15,2);
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS award_winners TEXT[]; -- Quick access to winner names
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS last_award_date DATE;
```

---

## 3. Data Ingestion Strategy

### 3.1 Phase 1: Historical Bulk Load (One-time)

**Goal:** Load all historical awards from 1983 to present (~200,000 records)

**Approach:**
1. Use bulk download files for speed (10,000 records at a time)
2. Process in parallel by agency and year ranges
3. Duration: 2-3 days for full historical load

**Implementation:**
```python
# pseudocode for bulk_import_sbir_awards.py

agencies = ['DOD', 'DOE', 'NASA', 'NIH', 'NSF', 'DOT', 'DHS', 'ED', 'EPA', 'USDA', 'DOC']
year_ranges = [
    (1983, 1990),
    (1991, 2000),
    (2001, 2010),
    (2011, 2020),
    (2021, 2024)
]

for agency in agencies:
    for start_year, end_year in year_ranges:
        awards = fetch_awards_api(agency, start_year, end_year)
        
        for award in awards:
            # Parse and normalize
            normalized = normalize_award_data(award)
            
            # Link to topic if possible
            topic_number = extract_topic_number(award)
            normalized['topic_number'] = topic_number
            
            # Insert or update
            upsert_award(normalized)
            
        # Log progress
        log_scraping_progress(agency, start_year, end_year, len(awards))
```

### 3.2 Phase 2: Daily Incremental Updates

**Goal:** Keep award data current with daily scrapes

**Schedule:** Daily at 2 AM ET (via cron job)

**Approach:**
1. Query API for awards from last 7 days (buffer for late updates)
2. Upsert new/updated records
3. Re-compute company and topic statistics

**Cron Job:**
```bash
# /api/cron/sbir-awards-daily
# Runs daily at 2 AM
```

### 3.3 Data Normalization & Enrichment

**Critical Operations:**

1. **Topic Number Extraction**
   - Parse from `topic_number` field (if provided)
   - Extract from `award_title` (e.g., "A24-001: Advanced Materials...")
   - Match via `solicitation_id` and fuzzy title matching
   - Store mapping confidence score

2. **Company Name Standardization**
   - "Acme Tech LLC" = "Acme Technologies, LLC" = "ACME TECH"
   - Build company aliases table
   - Use DUNS number as unique identifier when available

3. **Address Parsing**
   - Extract city, state, ZIP from `firm_address`
   - Geocode for map visualizations
   - Standardize state abbreviations

4. **Amount Parsing**
   - Remove "$", "," from award amounts
   - Convert to decimal
   - Handle "up to $150,000" vs "$150,000"

5. **Phase Standardization**
   - "Phase I" = "Phase 1" = "P1" = "PHASE I"
   - Normalize to: "Phase I", "Phase II", "Phase III"

---

## 4. Topic-to-Award Linking Algorithm

**Challenge:** SBIR.gov awards don't always have reliable `topic_number` fields.

**Multi-Strategy Approach:**

### 4.1 Direct Matching (Highest Confidence)
```sql
-- Match on exact topic_number
UPDATE sbir_awards 
SET topic_number = sbir_final.topic_number
FROM sbir_final
WHERE sbir_awards.topic_number = sbir_final.topic_number;
```

### 4.2 Solicitation + Title Fuzzy Match (High Confidence)
```python
# For awards without topic_number
def link_award_to_topic(award):
    # Step 1: Filter by agency, year, solicitation
    candidates = query_topics(
        agency=award['agency_id'],
        year=award['award_year'],
        solicitation=award['solicitation_id']
    )
    
    # Step 2: Fuzzy match on title
    best_match = None
    best_score = 0
    
    for topic in candidates:
        # Use Levenshtein distance or embeddings
        similarity = fuzzy_match(award['award_title'], topic['title'])
        
        if similarity > 0.85 and similarity > best_score:
            best_match = topic
            best_score = similarity
    
    if best_match and best_score > 0.90:
        return best_match['topic_number'], 'high'
    elif best_match and best_score > 0.85:
        return best_match['topic_number'], 'medium'
    else:
        return None, 'low'
```

### 4.3 Keyword + Abstract Semantic Match (Medium Confidence)
```python
# Use embeddings for semantic matching
from openai import OpenAI

def semantic_match_award_to_topic(award):
    # Get embedding for award abstract
    award_embedding = get_embedding(award['abstract'])
    
    # Find topics with similar technology areas and keywords
    candidate_topics = query_topics_by_tech_area(award['technology_areas'])
    
    # Compare embeddings
    best_match = find_most_similar_embedding(award_embedding, candidate_topics)
    
    if best_match['similarity'] > 0.75:
        return best_match['topic_number'], 'medium'
    else:
        return None, 'low'
```

### 4.4 Manual Review Queue (Low Confidence)
- Awards that can't be auto-linked go to manual review
- Admin interface for manual topic assignment
- Learn from manual assignments to improve algorithm

---

## 5. API Endpoints (Backend)

### 5.1 Award Data Endpoints

#### `GET /api/admin/sbir/awards`
Browse all awards with filters
```typescript
// Query params
{
  company?: string;
  agency?: string;
  year?: number;
  phase?: 'Phase I' | 'Phase II' | 'Phase III';
  topic_number?: string;
  page?: number;
  limit?: number;
}

// Response
{
  total: 45892,
  page: 1,
  limit: 25,
  awards: [
    {
      id: 123,
      contract_award_number: "W911QX-24-C-0001",
      award_title: "Advanced Materials...",
      company: "Acme Technologies LLC",
      award_amount: 150000,
      phase: "Phase I",
      year: 2024,
      agency: "DOD",
      topic_number: "A24-001"
    }
  ]
}
```

#### `GET /api/admin/sbir/awards/:id`
Get single award details

#### `GET /api/opportunities/:topicNumber/awards`
Get all awards for a specific topic
```typescript
// Response
{
  topic_number: "A24-001",
  topic_title: "Advanced Materials for Hypersonic Applications",
  total_awards: 3,
  total_funding: 1250000,
  awards: [
    {
      company: "Acme Technologies LLC",
      phase: "Phase I",
      award_amount: 150000,
      year: 2024,
      contract_number: "W911QX-24-C-0001",
      company_website: "https://acmetech.com",
      woman_owned: true
    },
    {
      company: "Beta Materials Corp",
      phase: "Phase II",
      award_amount: 1100000,
      year: 2023,
      contract_number: "W911QX-23-C-0045",
      company_website: "https://betamaterials.com",
      woman_owned: false
    }
  ],
  statistics: {
    phase_1_count: 2,
    phase_2_count: 1,
    average_phase_1_amount: 150000,
    average_phase_2_amount: 1100000,
    woman_owned_percentage: 33.3
  }
}
```

#### `GET /api/companies/:companyName`
Get company profile and award history
```typescript
// Response
{
  company: "Acme Technologies LLC",
  duns: "123456789",
  location: "Boston, MA",
  website: "https://acmetech.com",
  classification: {
    woman_owned: true,
    hubzone_owned: false,
    veteran_owned: false
  },
  statistics: {
    total_awards: 15,
    total_funding: 8500000,
    phase_1_count: 8,
    phase_2_count: 7,
    phase_1_to_2_rate: 87.5,
    first_award_year: 2015,
    most_recent_award_year: 2024
  },
  awards: [
    // Full award list
  ],
  technology_focus: [
    "Advanced Materials",
    "AI/ML",
    "Quantum Computing"
  ],
  primary_agencies: [
    "DOD",
    "NASA"
  ]
}
```

#### `GET /api/admin/sbir/awards/stats`
Global award statistics for admin dashboard

### 5.2 Scraper Control Endpoints

#### `POST /api/cron/sbir-awards-daily`
Trigger daily award scrape (cron job)

#### `POST /api/admin/sbir/awards/scrape-historical`
Trigger bulk historical load (admin only)

#### `GET /api/admin/sbir/awards/scraper-status`
Check scraper status and logs

---

## 6. UI/UX Integration

### 6.1 Opportunity Page Enhancements

**Add "Past Awards" Section to `/opportunities/[topicNumber]`**

```tsx
// New collapsible section after "Consolidated Instructions"

{data.has_awards && (
  <div style={{ marginBottom: '32px' }}>
    <button
      onClick={() => setExpandedSection('awards')}
      style={{
        width: '100%',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="24" height="24" fill="currentColor" style={{ color: '#10b981' }}>
          {/* Trophy icon */}
        </svg>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ color: '#10b981', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            Past Awards ({data.total_awards})
          </h3>
          <p style={{ color: '#6ee7b7', fontSize: '14px', margin: '4px 0 0 0' }}>
            See who won this topic: {data.award_winners?.join(', ')}
          </p>
        </div>
      </div>
      <svg>{/* Chevron icon */}</svg>
    </button>

    {expandedSection === 'awards' && (
      <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)' }}>
        {/* Award Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard 
            label="Total Awards" 
            value={data.total_awards} 
            icon="🏆"
          />
          <StatCard 
            label="Total Funding" 
            value={formatCurrency(data.total_award_funding)} 
            icon="💰"
          />
          <StatCard 
            label="Phase I" 
            value={awards.filter(a => a.phase === 'Phase I').length} 
            icon="1️⃣"
          />
          <StatCard 
            label="Phase II" 
            value={awards.filter(a => a.phase === 'Phase II').length} 
            icon="2️⃣"
          />
        </div>

        {/* Award List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {awards.map(award => (
            <div key={award.id} style={{
              padding: '20px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ color: '#10b981', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    {award.company}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#94a3b8' }}>
                    <span>{award.phase}</span>
                    <span>•</span>
                    <span>{award.year}</span>
                    <span>•</span>
                    <span>{formatCurrency(award.award_amount)}</span>
                    {award.woman_owned && <span>• Woman Owned</span>}
                  </div>
                  {award.company_website && (
                    <a 
                      href={award.company_website} 
                      target="_blank"
                      style={{ color: '#60a5fa', fontSize: '13px', marginTop: '8px', display: 'inline-block' }}
                    >
                      Visit Company Website →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => viewCompanyProfile(award.company)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '6px',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  View Profile
                </button>
              </div>
              {award.abstract && (
                <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '12px', lineHeight: '1.6' }}>
                  {truncate(award.abstract, 200)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

### 6.2 DSIP Search Results Enhancement

**Add "Has Awards" Badge to Search Results**

```tsx
// In /small-business/dsip-search results table

<td>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {record.title}
    {record.has_awards && (
      <span style={{
        padding: '2px 8px',
        background: 'rgba(16, 185, 129, 0.2)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '4px',
        color: '#10b981',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        🏆 {record.total_awards} AWARDS
      </span>
    )}
  </div>
</td>
```

### 6.3 New Company Profile Page

**Create `/companies/[companyName]` page**

- Company overview (location, website, classifications)
- Award history timeline
- Statistics (win rate, total funding, phase conversion rate)
- Technology focus areas
- Agency relationships
- All awards list (filterable)
- Competitive positioning

### 6.4 New "Winners Database" Page

**Create `/small-business/winners-database`**

- Browse all companies that have won SBIR/STTR awards
- Filter by:
  - State/location
  - Technology area
  - Agency
  - Woman-owned, HUBZone, Veteran-owned
  - Award count (serial winners)
- Sort by total funding, award count, win rate
- Export company lists for BD research

### 6.5 Admin Dashboard Enhancements

**Add to `/admin` dashboard:**

- Award scraper status widget
- Recent awards feed
- Data quality metrics
- Topic-to-award linking statistics
- Manual review queue

---

## 7. Data Intelligence Features

### 7.1 Competitive Intelligence

**For each opportunity, show:**
- Historical competition level (how many awards were given)
- Average award amounts by phase
- Geographic distribution of winners
- Diversity statistics (woman-owned %, veteran-owned %)
- Company size patterns (startup vs established)

### 7.2 Company Intelligence

**For each company:**
- Win rate (% of topics they competed on that they won)
- Phase I to Phase II conversion rate
- Preferred agencies and programs
- Technology specialization
- Growth trajectory (funding over time)
- Team size estimation (based on funding)

### 7.3 Pattern Detection

**LLM-powered insights:**
```python
def generate_award_insights(topic_number):
    """
    Use GPT-4o-mini to analyze award patterns for a topic
    """
    awards = get_topic_awards(topic_number)
    topic = get_topic(topic_number)
    
    prompt = f"""
    Analyze these past awards for SBIR topic {topic_number}:
    
    Topic: {topic.title}
    Description: {topic.description}
    
    Awards:
    {json.dumps(awards, indent=2)}
    
    Provide insights on:
    1. Common characteristics of winning companies
    2. Technology approach patterns
    3. Geographic trends
    4. Phase I to Phase II success factors
    5. Recommended positioning for new applicants
    """
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content
```

### 7.4 Chat Assistant Enhancement

**Update `/api/admin/opportunity-chat` to include award data:**

```typescript
// When user asks "Who won this topic before?"
const awardContext = await fetchTopicAwards(opportunityId);

const enhancedContext = `
...existing opportunity context...

PAST AWARDS:
${JSON.stringify(awardContext, null, 2)}
`;

// AI can now answer:
// - "Who won this topic?"
// - "What companies have won similar topics?"
// - "What's the typical award amount?"
// - "Are there any woman-owned businesses that won?"
```

---

## 8. Implementation Phases

### Phase 1: Database & Scraper Foundation (Week 1-2)
**Deliverables:**
- ✅ Create database tables (`sbir_awards`, `sbir_companies`, etc.)
- ✅ Build historical bulk scraper (`bulk_import_sbir_awards.py`)
- ✅ Build daily incremental scraper
- ✅ Implement topic-to-award linking algorithm
- ✅ Test with 10,000 sample records

**Success Criteria:**
- Successfully load 200,000+ historical awards
- 90%+ topic linking accuracy (for awards with topic_number)
- Daily scraper runs without errors

### Phase 2: API & Backend (Week 2-3)
**Deliverables:**
- ✅ Create award browsing API (`/api/admin/sbir/awards`)
- ✅ Create topic-awards API (`/api/opportunities/:topicNumber/awards`)
- ✅ Create company profile API (`/api/companies/:companyName`)
- ✅ Create scraper control APIs
- ✅ Add computed fields to `sbir_final` table

**Success Criteria:**
- All APIs return data in <500ms
- Proper authentication and rate limiting
- Comprehensive error handling

### Phase 3: UI Integration (Week 3-4)
**Deliverables:**
- ✅ Add "Past Awards" section to opportunity pages
- ✅ Add award badges to search results
- ✅ Create company profile page
- ✅ Update chat assistant to use award data
- ✅ Add admin dashboard widgets

**Success Criteria:**
- Awards display correctly on 100% of opportunities
- No performance degradation on opportunity pages
- Positive user feedback on award visibility

### Phase 4: Intelligence Features (Week 4-5)
**Deliverables:**
- ✅ Implement competitive intelligence analytics
- ✅ Build company intelligence dashboard
- ✅ Add LLM-powered award pattern insights
- ✅ Create "Winners Database" page
- ✅ Build export/reporting features

**Success Criteria:**
- Users can find similar winning companies
- Insights are actionable and accurate
- Export features work for BD research

### Phase 5: Optimization & Launch (Week 5-6)
**Deliverables:**
- ✅ Performance optimization (caching, indexing)
- ✅ Data quality improvements (manual linking queue)
- ✅ User documentation and guides
- ✅ Beta testing with 10 users
- ✅ Production deployment

**Success Criteria:**
- Page load times <2 seconds
- 95%+ data accuracy
- Zero critical bugs
- Launch announcement ready

---

## 9. Technical Architecture

### 9.1 Scraper Architecture

```
┌─────────────────────────────────────────────────┐
│ SBIR.gov API                                    │
│ https://api.www.sbir.gov/public/api/awards     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Scraper Service (Node.js/Python)               │
│ - Bulk Historical Scraper                      │
│ - Daily Incremental Scraper                    │
│ - Data Normalization Pipeline                  │
│ - Topic Linking Algorithm                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Supabase PostgreSQL Database                   │
│ - sbir_awards (200K+ rows)                     │
│ - sbir_companies (50K+ rows)                   │
│ - sbir_topic_awards_summary (30K+ rows)        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Next.js API Routes                              │
│ - /api/admin/sbir/awards                       │
│ - /api/opportunities/:topicNumber/awards       │
│ - /api/companies/:companyName                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Frontend UI                                     │
│ - Opportunity Pages (Past Awards section)      │
│ - Company Profile Pages                        │
│ - Winners Database                              │
│ - Admin Dashboard                               │
└─────────────────────────────────────────────────┘
```

### 9.2 Cron Jobs

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sbir-awards-daily",
      "schedule": "0 2 * * *" // Daily at 2 AM ET
    }
  ]
}
```

### 9.3 Caching Strategy

```typescript
// Cache award data for 24 hours
const CACHE_TTL = 24 * 60 * 60; // 24 hours

// For opportunity page awards
const cacheKey = `awards:topic:${topicNumber}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const awards = await fetchTopicAwards(topicNumber);
await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(awards));

// For company profiles (longer TTL since less frequently updated)
const companyCacheKey = `company:${companyName}`;
const companyTTL = 7 * 24 * 60 * 60; // 7 days
```

---

## 10. Data Quality & Maintenance

### 10.1 Data Quality Checks

**Automated Checks (Run weekly):**
```sql
-- Missing topic links
SELECT COUNT(*) FROM sbir_awards WHERE topic_number IS NULL;

-- Duplicate contract numbers
SELECT contract_award_number, COUNT(*) 
FROM sbir_awards 
GROUP BY contract_award_number 
HAVING COUNT(*) > 1;

-- Invalid award amounts
SELECT COUNT(*) FROM sbir_awards WHERE award_amount <= 0 OR award_amount IS NULL;

-- Orphaned awards (topic doesn't exist in sbir_final)
SELECT COUNT(*) 
FROM sbir_awards 
WHERE topic_number NOT IN (SELECT topic_number FROM sbir_final);
```

### 10.2 Manual Review Queue

**Admin interface for unlinked awards:**
```typescript
// /admin/awards/review
// Shows awards with no topic_number or low confidence links
// Admin can:
// - Manually assign topic_number
// - Mark as "not linkable" (generic research, not topic-specific)
// - Provide feedback to improve linking algorithm
```

### 10.3 Data Updates

**Strategy for handling updates:**
- Awards can change (amount adjustments, phase transitions)
- Use `contract_award_number` as unique identifier
- `UPSERT` logic on every scrape
- Track `updated_at` timestamp
- Keep audit log of changes

---

## 11. Security & Privacy

### 11.1 Data Classification

**Public Data (Safe to display):**
- Company names
- Award amounts
- Phase information
- Award titles
- Abstracts
- Agency information

**Sensitive Data (Handle carefully):**
- Program manager emails/phones (display only to authenticated users)
- DUNS numbers (don't display, use for internal matching only)
- Company phone numbers (display only to authenticated users)

### 11.2 Rate Limiting

```typescript
// Protect company profile pages from scraping
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/companies', limiter);
```

### 11.3 Data Usage Compliance

**From SBIR.gov Terms:**
- Data is public domain
- No restrictions on commercial use
- Attribution recommended but not required
- Keep data reasonably current

**Best Practices:**
- Display "Data source: SBIR.gov" on award sections
- Update data daily to stay current
- Don't claim proprietary ownership of SBA data
- Provide links back to SBIR.gov when possible

---

## 12. Success Metrics

### 12.1 Technical Metrics

- **Data Coverage:** 95%+ of topics have linked award data
- **Scraper Uptime:** 99%+ daily scraper success rate
- **API Performance:** <500ms for award queries
- **Data Freshness:** Awards updated within 24 hours of SBA publication

### 12.2 User Engagement Metrics

- **Usage:** 70%+ of opportunity page views expand "Past Awards" section
- **Time on Page:** +30% increase in avg time on opportunity pages
- **Company Profile Views:** 1000+ unique company profile views/month
- **Search Filter Usage:** 40%+ of searches use "Has Awards" filter

### 12.3 Business Metrics

- **User Retention:** +15% increase in weekly active users
- **Conversion:** +10% increase in free-to-paid conversion
- **User Feedback:** 4.5+/5 rating on award feature utility
- **Competitive Intel:** 50+ BD research exports per month

---

## 13. Future Enhancements

### 13.1 Phase 2 Features (Q2 2025)

**Advanced Analytics:**
- Win probability predictor (ML model based on company profile)
- Competitive landscape heat maps
- Funding trend forecasts
- Success factor analysis

**Integrations:**
- SAM.gov contract data integration
- USASpending.gov contract modifications
- Company financial data (Dun & Bradstreet)
- Patent data (USPTO API)

**Collaboration:**
- Team research boards
- Competitor tracking lists
- Award alerts and notifications
- Export to CRM systems

### 13.2 MATRIX-SB Integration (Q2 2025)

**Full market research tool powered by award data:**
- Historical award analysis dashboards
- Winning proposal pattern analysis
- Market opportunity sizing
- Strategic positioning recommendations
- Teaming partner discovery
- Technology trend forecasting

---

## 14. Cost Estimation

### 14.1 Infrastructure Costs

**Database Storage:**
- 200K awards × 2KB avg = 400MB
- 50K companies × 5KB avg = 250MB
- Total: ~1GB additional storage
- Supabase cost: $0 (within free tier limits)

**API Costs:**
- SBIR.gov API: Free
- No additional API costs

**Compute:**
- Daily scraper: ~5 minutes runtime
- Vercel serverless: $0 (within free tier)
- GPT-4o-mini for insights: ~$10/month (estimated 50K tokens/day)

**Total Monthly Cost:** ~$10-20

### 14.2 Development Time

**Total Estimated Time:** 200-240 hours

**Breakdown:**
- Database design & setup: 16 hours
- Historical scraper development: 32 hours
- Daily scraper development: 16 hours
- Topic linking algorithm: 24 hours
- API development: 32 hours
- UI integration: 40 hours
- Company profile pages: 24 hours
- Testing & QA: 32 hours
- Documentation: 16 hours
- Deployment & optimization: 16 hours

**Timeline:** 4-6 weeks (assuming 40 hours/week)

---

## 15. Risk Mitigation

### 15.1 Identified Risks

**Risk 1: SBIR.gov API Changes**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** 
  - Monitor API documentation regularly
  - Build robust error handling
  - Maintain bulk download fallback
  - Version control API integration code

**Risk 2: Topic Linking Accuracy**
- **Likelihood:** High
- **Impact:** Medium
- **Mitigation:**
  - Multiple linking strategies (fallbacks)
  - Manual review queue
  - Confidence scoring
  - User feedback loop

**Risk 3: Data Quality Issues**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Automated data quality checks
  - Validation rules on ingestion
  - Admin review dashboard
  - User reporting mechanism

**Risk 4: Performance Degradation**
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - Aggressive caching (Redis)
  - Database indexing
  - Lazy loading award sections
  - CDN for static assets

**Risk 5: Scraper Rate Limiting**
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:**
  - Respectful request pacing (500ms delays)
  - Retry logic with exponential backoff
  - Bulk download fallback
  - Monitor scraper logs

---

## 16. Rollout Plan

### 16.1 Beta Phase (Week 5)

**Target Users:** 10 internal beta testers

**Features Enabled:**
- Past awards on opportunity pages
- Award badges in search results
- Basic company profiles
- Admin dashboard

**Feedback Collection:**
- User interviews (30 min each)
- Bug reports via dedicated channel
- Feature request survey
- Usage analytics review

### 16.2 Soft Launch (Week 6)

**Target Users:** All authenticated users (no announcement)

**Monitoring:**
- Error rates
- Page load times
- Database query performance
- User engagement metrics

**Success Criteria:**
- Zero critical bugs
- <2 second page load times
- 50%+ user engagement with award features

### 16.3 Full Launch (Week 7)

**Announcement Strategy:**
- Email to all users
- Blog post explaining features
- Social media announcement
- In-app notification banner

**Launch Checklist:**
- [ ] All data quality checks passing
- [ ] Performance benchmarks met
- [ ] User documentation complete
- [ ] Admin training complete
- [ ] Monitoring dashboards live
- [ ] Support team briefed

---

## 17. Documentation Requirements

### 17.1 User Documentation

**Create guides for:**
- "Understanding Past Awards Data"
- "How to Research Winning Companies"
- "Using Awards to Position Your Proposal"
- "Company Profile Deep Dive Tutorial"
- "Export and Research Workflows"

### 17.2 Technical Documentation

**Create docs for:**
- Database schema reference
- API endpoint documentation (OpenAPI/Swagger)
- Scraper architecture and maintenance
- Topic linking algorithm details
- Data quality procedures
- Deployment and monitoring

### 17.3 Admin Documentation

**Create guides for:**
- Running manual scrapes
- Reviewing unlinked awards
- Data quality dashboard
- Handling user feedback
- Emergency procedures

---

## 18. Next Steps (Immediate Actions)

### Week 1: Get Started Now

**Day 1-2: Database Setup**
1. Create SQL migration file for all new tables
2. Run migration on staging database
3. Create sample data (100 records) for testing
4. Verify schema with team

**Day 3-4: Scraper Prototype**
1. Build basic API client for SBIR.gov
2. Test fetching 1000 records from DOD 2024
3. Parse and normalize data structure
4. Insert test data into database

**Day 5: Topic Linking Test**
1. Implement direct topic_number matching
2. Test with 100 sample awards
3. Measure accuracy
4. Plan fuzzy matching algorithm

**Weekend: Review & Plan**
1. Review progress with team
2. Adjust timeline if needed
3. Assign Phase 2 tasks

---

## Conclusion

This comprehensive plan provides a complete roadmap for integrating SBA SBIR/STTR award data into Prop Shop AI. The integration will:

✅ **Add 200,000+ historical award records** to the database  
✅ **Link awards to specific topics** for competitive intelligence  
✅ **Create company profiles** showing win rates and patterns  
✅ **Enable BD research** with winners database and exports  
✅ **Enhance opportunity pages** with past award context  
✅ **Power AI insights** with historical success patterns  
✅ **Differentiate the platform** with proprietary intelligence  

**Total Investment:** 200-240 hours, $10-20/month operational cost  
**Expected ROI:** 15% increase in user retention, 10% increase in conversions  
**Timeline:** 4-6 weeks from start to production launch  

**Status:** Ready for implementation. All technical details, database schemas, API endpoints, and UI mockups are defined. Development can begin immediately.

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025  
**Author:** Make Ready MATRIX AI  
**Review Status:** Ready for Approval  


