# Affordable Company Intelligence - Alternative to Crunchbase

## TL;DR - Budget-Friendly Options

**Instead of Crunchbase ($60K-$120K/year)**, use these alternatives:

1. **FREE**: SEC EDGAR + SAM.gov Entity Data = $0/year
2. **CHEAP**: Clearbit Enrichment API = $99-$499/month ($1,188-$5,988/year)
3. **HYBRID**: Free sources + web scraping = <$100/month ($1,200/year)
4. **DIY**: Build your own with public data = $0 (just dev time)

**Best Approach for DoD Contractors**: Combine multiple free sources

## Part 1: FREE Data Sources (Start Here!)

### Option 1: SEC EDGAR (Public Companies) - 100% FREE

**What You Get**:
- Company financials (revenue, profit, assets)
- Annual reports (10-K) with business descriptions
- Quarterly reports (10-Q)
- Officer and director information
- Ownership data (who owns >5% of stock)
- Material events (acquisitions, contracts, etc.)

**Coverage**: All publicly traded companies (~4,500 in defense/aerospace)

**API**: Completely free, no rate limits
- Endpoint: `https://data.sec.gov/submissions/CIK{cik}.json`
- Documentation: https://www.sec.gov/edgar/sec-api-documentation

**Example Companies You Can Track**:
- Lockheed Martin, Raytheon, Boeing (Tier 1)
- SAIC, Booz Allen, ManTech (Tier 2)
- Parsons, Jacobs Engineering, etc.

**Data Quality**: Excellent (legally required, audited)

**Update Frequency**: Quarterly filings

**Cost**: $0

---

### Option 2: SAM.gov Entity Management API - 100% FREE

**What You Get** (already available to you):
- Company legal name
- CAGE code, UEI, DUNS
- Business size (small business status)
- NAICS codes
- Address and contact info
- Socioeconomic categories (8(a), WOSB, VOSB, etc.)
- Registration status and expiration
- Exclusions/debarments

**Coverage**: Every company registered to do federal contracting (~400,000+)

**API**: Free SAM.gov API (you already have access)
- Endpoint: `https://api.sam.gov/entity-information/v3/entities`
- Rate Limit: 10 requests/second

**What's Missing**: Financial data, employee counts, leadership

**Cost**: $0

---

### Option 3: USAspending.gov API - 100% FREE

**What You Get**:
- Historical contract awards (what you already scrape from FPDS)
- Parent company relationships
- Transaction history
- Award descriptions
- Contracting office relationships

**Coverage**: All federal spending

**API**: Free, unlimited
- Endpoint: `https://api.usaspending.gov/`

**You Already Have This Data** - Just need to parse it better for company intelligence

**Cost**: $0

---

### Option 4: LinkedIn Company Pages (Limited Free Data)

**What You Get** (via web scraping or limited API):
- Company descriptions
- Employee count ranges
- Headquarters location
- Company size category
- Industry classifications
- Website and social media links
- Recent posts/news

**Coverage**: Most DoD contractors have LinkedIn pages

**API**: LinkedIn API is restricted, but you can:
- Use unofficial scrapers (legally gray area)
- Manual lookup for high-value companies
- Public profile data only

**Free Tools**:
- Phantombuster (free tier: 100 profiles/month)
- Apify LinkedIn scrapers (free tier available)

**Cost**: $0 (free tier) to $99/month (paid scrapers)

---

### Option 5: OpenCorporates - FREE/Cheap

**What You Get**:
- Company registration data
- Business structure (LLC, Corp, etc.)
- Incorporation date
- Registered agent
- Status (active, dissolved)
- Officers and directors (for some states)

**Coverage**: 200+ million companies worldwide

**API**: 
- Free tier: 500 calls/month
- Paid: $14/month for 10,000 calls

**Endpoint**: `https://api.opencorporates.com/v0.4/companies/search`

**Best For**: Verifying company legitimacy, incorporation details

**Cost**: $0 (free tier) or $14/month

---

### Option 6: Yahoo Finance / Alpha Vantage (Public Companies) - FREE

**What You Get**:
- Stock prices (for public companies)
- Market cap
- P/E ratio
- 52-week high/low
- Trading volume
- Basic financials

**Coverage**: All publicly traded companies

**APIs**:
- Yahoo Finance (unofficial): Free, unlimited
- Alpha Vantage: Free tier (5 calls/minute, 500/day)
- Financial Modeling Prep: $15/month for 250 calls/day

**Cost**: $0 (Yahoo) or $15/month (FMP)

---

## Part 2: Affordable Paid Options (<$500/month)

### Option 7: Clearbit Enrichment API - $99-$499/month

**What You Get**:
- Company description
- Employee count
- Industry and tags
- Website and social media
- Tech stack (what technologies they use)
- Annual revenue estimates
- Location and address
- Founded year

**Coverage**: 50+ million companies

**API**: RESTful, 600 calls/minute
- Endpoint: `https://company.clearbit.com/v2/companies/find?domain={domain}`
- Requires domain name (can get from SAM.gov)

**Pricing**:
- $99/month: 2,500 enrichments
- $249/month: 10,000 enrichments
- $499/month: 50,000 enrichments

**Best For**: Small-medium businesses (works better than Crunchbase for non-VC companies)

**Match Method**: Domain-based (very accurate)

**Cost**: $99-$499/month ($1,188-$5,988/year)

---

### Option 8: PeopleDataLabs - $200/month

**What You Get**:
- Company information (size, industry, location)
- Employee data (titles, seniority, departments)
- Technographics (technology usage)
- Contact information
- Social profiles

**Coverage**: 10+ million companies, 1.5+ billion people

**API**: RESTful, 100 requests/second
- Company enrichment
- Person enrichment
- Job title standardization

**Pricing**:
- $200/month: 1,000 company enrichments + 5,000 person lookups
- $500/month: 5,000 companies + 25,000 people

**Best For**: Leadership team information, org structure

**Cost**: $200-$500/month

---

### Option 9: Apollo.io - $49-$149/month

**What You Get**:
- Company database access
- Employee counts
- Revenue estimates
- Industry classifications
- Technologies used
- Contact information (emails, phones)

**Coverage**: 270+ million contacts, 70+ million companies

**Pricing**:
- Free: 60 mobile credits/year
- Basic: $49/month (1,200 mobile credits)
- Professional: $99/month (12,000 mobile credits)
- Organization: $149/month (unlimited)

**Best For**: Contact discovery, sales intelligence

**Interface**: Web UI + API

**Cost**: $49-$149/month

---

### Option 10: Web Scraping (DIY) - <$100/month

**What You Can Scrape**:
- Company websites (About Us, Team pages)
- LinkedIn company pages
- Google News (company announcements)
- Press releases
- Industry publications

**Tools**:
- Apify: $49/month for 100 hours
- Bright Data: $500/month (expensive)
- Custom scrapers (AWS Lambda): ~$20/month

**Coverage**: Any company with web presence

**Legal**: Gray area - check Terms of Service

**Cost**: $20-$100/month (infrastructure + tools)

---

## Part 3: RECOMMENDED STRATEGY (Budget: <$2,000/year)

### Tier 1: Free Data Foundation (Do This First!)

**Step 1: Enhance SAM.gov Entity Data**
```typescript
// You already have vendor names from FPDS
// Enrich each with SAM.gov Entity API

const response = await fetch(
  `https://api.sam.gov/entity-information/v3/entities?ueiSAM=${uei}`,
  { headers: { 'X-Api-Key': process.env.SAM_GOV_API_KEY } }
);

// Get: business size, NAICS codes, socioeconomic status, address
```

**What This Gives You**:
- Business structure and size
- Small business classifications
- Location and contact details
- CAGE/UEI for tracking

**Cost**: $0

---

**Step 2: Add SEC EDGAR for Public Companies**
```typescript
// For public contractors, fetch SEC filings

const cik = await getCIKFromName(companyName);
const filings = await fetch(
  `https://data.sec.gov/submissions/CIK${cik}.json`
);

// Parse 10-K for:
// - Annual revenue
// - Employee count
// - Business description
// - Risk factors
// - Government contract revenue percentage
```

**What This Gives You**:
- Accurate financials
- Business descriptions
- Employee counts
- Government revenue exposure

**Coverage**: ~500 public DoD contractors

**Cost**: $0

---

**Step 3: Add OpenCorporates for Private Companies**
```typescript
// For private companies, get basic corporate data

const company = await fetch(
  `https://api.opencorporates.com/v0.4/companies/search?q=${name}&jurisdiction_code=us`
);

// Get: incorporation date, status, structure
```

**What This Gives You**:
- Company age (founded date)
- Legal structure
- Registration status

**Cost**: $0 (free tier) or $14/month

---

### Tier 2: Add Clearbit for Missing Data (Optional)

**For companies not in SEC/SAM.gov**:
```typescript
// Clearbit works well for small-medium businesses

const domain = extractDomainFromSAM(company);
const enrichment = await fetch(
  `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
  { headers: { Authorization: `Bearer ${CLEARBIT_KEY}` } }
);

// Get: employee count estimate, description, revenue estimate
```

**Use Cases**:
- Small businesses without SEC filings
- Startups and mid-size companies
- Companies with websites but limited public data

**Budget**: $99/month for 2,500 companies

**Prioritize**: High-value contract winners, frequent contractors

**Cost**: $99-$249/month

---

## Part 4: Database Schema (Free Sources)

### New Tables for Free Data

```sql
-- ============================================
-- Company Intelligence (Free Sources)
-- ============================================

CREATE TABLE company_intelligence (
  id BIGSERIAL PRIMARY KEY,
  
  -- Matching
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage TEXT,
  
  -- SAM.gov Entity Data (FREE)
  sam_legal_name TEXT,
  sam_dba_name TEXT,
  sam_business_type TEXT, -- 'Corporation', 'LLC', 'Partnership'
  sam_incorporation_date DATE,
  sam_business_start_date DATE,
  sam_fiscal_year_end TEXT,
  sam_annual_revenue_range TEXT, -- From SAM registration
  sam_employee_count_range TEXT,
  
  -- Address (SAM.gov)
  headquarters_address TEXT,
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_zip TEXT,
  headquarters_country TEXT DEFAULT 'USA',
  
  -- Contact (SAM.gov)
  primary_email TEXT,
  primary_phone TEXT,
  website TEXT,
  
  -- Small Business (SAM.gov)
  is_small_business BOOLEAN,
  is_woman_owned BOOLEAN,
  is_veteran_owned BOOLEAN,
  is_8a_program BOOLEAN,
  is_hubzone BOOLEAN,
  is_sdvosb BOOLEAN,
  
  -- NAICS (SAM.gov)
  primary_naics TEXT,
  all_naics_codes TEXT[],
  
  -- SEC EDGAR Data (Public Companies Only)
  is_public_company BOOLEAN DEFAULT FALSE,
  stock_ticker TEXT,
  sec_cik TEXT,
  sec_annual_revenue DECIMAL(15,2),
  sec_employee_count INTEGER,
  sec_fiscal_year INTEGER,
  sec_business_description TEXT,
  sec_government_revenue_pct DECIMAL(5,2), -- % of revenue from gov
  sec_last_filing_date DATE,
  
  -- OpenCorporates Data
  oc_incorporation_state TEXT,
  oc_incorporation_date DATE,
  oc_company_number TEXT,
  oc_company_status TEXT, -- 'Active', 'Dissolved', etc.
  oc_company_type TEXT, -- 'Limited Liability Company', 'Corporation'
  oc_registered_agent TEXT,
  
  -- LinkedIn Data (Manual/Scraped)
  linkedin_url TEXT,
  linkedin_followers INTEGER,
  linkedin_employee_count_range TEXT,
  linkedin_description TEXT,
  linkedin_specialties TEXT[],
  
  -- Derived/Calculated Fields
  estimated_employee_count INTEGER, -- Best estimate from all sources
  estimated_annual_revenue DECIMAL(15,2), -- Best estimate
  company_age_years INTEGER, -- Calculated from incorporation date
  
  -- Data Quality
  data_sources TEXT[], -- ['sam.gov', 'sec', 'opencorporates']
  data_quality_score INTEGER, -- 0-100
  confidence_level TEXT, -- 'high', 'medium', 'low'
  
  -- Metadata
  last_enriched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_company_intel_uei ON company_intelligence(vendor_uei);
CREATE INDEX idx_company_intel_name ON company_intelligence(company_name);
CREATE INDEX idx_company_intel_public ON company_intelligence(is_public_company) 
  WHERE is_public_company = TRUE;
CREATE INDEX idx_company_intel_quality ON company_intelligence(data_quality_score DESC);

-- ============================================
-- SEC Filings Cache
-- ============================================

CREATE TABLE sec_filings_cache (
  id BIGSERIAL PRIMARY KEY,
  company_intelligence_id BIGINT REFERENCES company_intelligence(id),
  
  sec_cik TEXT NOT NULL,
  filing_type TEXT, -- '10-K', '10-Q', '8-K'
  filing_date DATE,
  fiscal_year INTEGER,
  fiscal_period TEXT, -- 'FY', 'Q1', 'Q2', 'Q3', 'Q4'
  
  -- Key Financial Data
  revenue DECIMAL(15,2),
  net_income DECIMAL(15,2),
  total_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  stockholders_equity DECIMAL(15,2),
  employee_count INTEGER,
  
  -- Government Contract Revenue (if disclosed)
  government_revenue DECIMAL(15,2),
  government_revenue_pct DECIMAL(5,2),
  
  -- Filing URLs
  filing_url TEXT,
  document_url TEXT,
  
  -- Full Text (for search)
  business_description TEXT,
  risk_factors TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sec_filings_company ON sec_filings_cache(company_intelligence_id);
CREATE INDEX idx_sec_filings_cik ON sec_filings_cache(sec_cik);
CREATE INDEX idx_sec_filings_date ON sec_filings_cache(filing_date DESC);
```

---

## Part 5: Implementation Plan (Budget-Friendly)

### Phase 1: SAM.gov Entity Enrichment (Week 1-2)

**Goal**: Enrich all companies with SAM.gov entity data

**Steps**:
1. Extract unique vendor UEIs from `fpds_contracts`
2. Call SAM.gov Entity API for each UEI
3. Store in `company_intelligence` table
4. Link back to `fpds_company_stats`

**Code**:
```typescript
async function enrichWithSAM(uei: string) {
  const response = await fetch(
    `https://api.sam.gov/entity-information/v3/entities?ueiSAM=${uei}`,
    { headers: { 'X-Api-Key': process.env.SAM_GOV_API_KEY } }
  );
  
  const data = await response.json();
  const entity = data.entityData[0];
  
  return {
    sam_legal_name: entity.legalBusinessName,
    sam_dba_name: entity.dbaName,
    sam_business_type: entity.businessTypes,
    is_small_business: entity.businessTypeList.includes('2X'),
    is_woman_owned: entity.businessTypeList.includes('2R'),
    website: entity.companyWebsite,
    // ... map all fields
  };
}
```

**Coverage**: 100% of companies with UEIs

**Cost**: $0

**Timeline**: 1-2 weeks (rate limit: 10 req/sec)

---

### Phase 2: SEC EDGAR Integration (Week 3-4)

**Goal**: Add financial data for public companies

**Steps**:
1. Identify public companies (match names against SEC company list)
2. Get CIK (Central Index Key) for each
3. Fetch latest 10-K filing
4. Parse financial data
5. Store in `sec_filings_cache`

**Code**:
```typescript
async function enrichWithSEC(companyName: string) {
  // Step 1: Find CIK
  const cik = await searchCIK(companyName);
  
  // Step 2: Get company submissions
  const submissions = await fetch(
    `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`,
    { headers: { 'User-Agent': 'PropShop AI info@propshop.ai' } }
  );
  
  const data = await submissions.json();
  
  // Step 3: Find most recent 10-K
  const tenK = data.filings.recent.find(f => f.form === '10-K');
  
  // Step 4: Parse financial data (from XBRL or HTML)
  const financials = await parse10K(tenK.accessionNumber);
  
  return {
    is_public_company: true,
    stock_ticker: data.tickers[0],
    sec_cik: cik,
    sec_annual_revenue: financials.revenue,
    sec_employee_count: financials.employees,
    // ... more fields
  };
}
```

**Coverage**: ~500 public DoD contractors

**Cost**: $0

**Timeline**: 1-2 weeks

---

### Phase 3: OpenCorporates Integration (Week 5)

**Goal**: Add incorporation data for private companies

**Code**:
```typescript
async function enrichWithOpenCorporates(companyName: string, state: string) {
  const response = await fetch(
    `https://api.opencorporates.com/v0.4/companies/search?` +
    `q=${encodeURIComponent(companyName)}&` +
    `jurisdiction_code=us_${state.toLowerCase()}`
  );
  
  const data = await response.json();
  const company = data.results.companies[0]?.company;
  
  return {
    oc_incorporation_date: company.incorporation_date,
    oc_company_status: company.current_status,
    oc_company_type: company.company_type,
    // ... more fields
  };
}
```

**Cost**: $0 (free tier) or $14/month

---

### Phase 4: Optional Clearbit (If Budget Allows)

**Goal**: Fill gaps for companies missing from free sources

**Use Cases**:
- Private companies with no SEC filings
- Startups and small businesses
- Companies with limited public info

**Prioritization**:
```typescript
function shouldEnrichWithClearbit(company: Company): boolean {
  return (
    company.total_contract_value > 1_000_000 && // High-value contractors
    !company.is_public_company && // Not already in SEC
    !company.sam_employee_count_range && // Missing basic data
    company.website // Has website (required for Clearbit)
  );
}
```

**Budget**: $99/month for top 2,500 companies

---

## Part 6: Cost Comparison

### Crunchbase vs Free Approach

| Feature | Crunchbase | Free Sources | Clearbit (Optional) |
|---------|-----------|--------------|---------------------|
| **Public Companies** | ✅ Good | ✅ Excellent (SEC) | ✅ Good |
| **Private Companies** | ✅ Excellent | ⚠️ Limited | ✅ Good |
| **Funding Rounds** | ✅ Excellent | ❌ None | ❌ None |
| **Leadership** | ✅ Good | ✅ Good (SEC filings) | ✅ Limited |
| **Employee Count** | ✅ Good | ✅ Good (SEC, estimates) | ✅ Good |
| **Financials** | ⚠️ Limited | ✅ Excellent (SEC) | ⚠️ Estimates |
| **Contact Info** | ⚠️ Limited | ✅ Good (SAM.gov) | ✅ Good |
| | | | |
| **Annual Cost** | $60K-$120K | **$0** | **$1,188-$2,988** |

---

## Part 7: What You'll Get (Free Approach)

### For Public Companies (e.g., Lockheed Martin):
```
✅ Legal name (SAM.gov)
✅ Business structure (SAM.gov)
✅ Small business status (SAM.gov)
✅ Address and contact (SAM.gov)
✅ Annual revenue (SEC 10-K)
✅ Employee count (SEC 10-K)
✅ Government revenue % (SEC 10-K)
✅ Business description (SEC 10-K)
✅ Stock ticker and price (Yahoo Finance)
✅ Market cap (Yahoo Finance)
✅ Incorporation date (OpenCorporates)

❌ Funding rounds (N/A for public)
❌ Private investors (N/A for public)
❌ Recent acquisitions (unless in SEC filings)
```

### For Private Companies (e.g., Small SBIR Winner):
```
✅ Legal name (SAM.gov)
✅ Business structure (SAM.gov)
✅ Small business status (SAM.gov)
✅ Address and contact (SAM.gov)
✅ NAICS codes (SAM.gov)
✅ Incorporation date (OpenCorporates)
✅ Company status (OpenCorporates)

⚠️ Employee count estimate (from Clearbit if added)
⚠️ Revenue estimate (from Clearbit if added)

❌ Exact financials (not public)
❌ Funding rounds (would need Crunchbase)
❌ Investors (would need Crunchbase)
```

---

## Part 8: RECOMMENDATION

### Best Approach: Hybrid Model

**Tier 1 (FREE) - Do This First**:
1. SAM.gov Entity API → Business structure, classifications, contact
2. SEC EDGAR → Financial data for public companies (~500 contractors)
3. OpenCorporates → Incorporation data for all companies
4. Yahoo Finance → Stock data for public companies

**Tier 2 (CHEAP) - Add If Needed**:
5. Clearbit ($99/month) → Fill gaps for high-value private contractors

**Total Cost**: $0-$1,200/year (vs $60K-$120K for Crunchbase)

**Coverage**:
- 100% of public DoD contractors: Excellent data
- 100% of contractors: Basic data (SAM.gov)
- Top 2,500 private contractors: Enhanced data (if using Clearbit)

---

## Part 9: Next Steps

### This Week:
1. **Create database tables** (use SQL above)
2. **Build SAM.gov enrichment script**
3. **Test with 10 companies**

### Next Week:
4. **Add SEC EDGAR parser**
5. **Process all public companies** (~500)
6. **Add OpenCorporates integration**

### Week 3:
7. **Evaluate data quality**
8. **Decide if Clearbit is needed** for private companies
9. **Build UI to display enriched data**

---

## Summary: Your Best Options

### Option A: 100% Free (Recommended to Start)
- SAM.gov + SEC EDGAR + OpenCorporates
- Cost: $0/year
- Coverage: Excellent for public companies, basic for private
- **Start here, see if it's enough**

### Option B: Mostly Free + Clearbit
- SAM.gov + SEC + OpenCorporates + Clearbit
- Cost: $1,188-$2,988/year
- Coverage: Good for public, good for high-value private
- **Best balance of cost/value**

### Option C: Add Web Scraping
- Above + custom scrapers (LinkedIn, etc.)
- Cost: $1,200-$2,000/year
- Coverage: Best possible without Crunchbase
- **Most comprehensive on a budget**

**Bottom Line**: Start with FREE sources (SAM.gov + SEC). This will cover 80% of your needs for <1% of Crunchbase's cost. Add Clearbit later only if needed.

Want me to build the SAM.gov + SEC integration? It's all free and will give you excellent data for DoD contractors!

