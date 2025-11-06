# Unified Company Intelligence Table - How It All Works

## Overview

**ONE TABLE to rule them all**: `company_intelligence`

This table aggregates data from ALL free sources into a single unified view of each company.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR EXISTING DATA                            │
├─────────────────────────────────────────────────────────────────┤
│  fpds_contracts (50,000+ companies)                             │
│  sam_gov_opportunities (5,000+ companies)                       │
│  army_innovation_submissions (1,000+ companies)                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Enrich with FREE APIs
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FREE DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SAM.gov Entity API                                             │
│  ├─ Legal name, business structure                              │
│  ├─ Small business certifications                               │
│  ├─ Contact info (email, phone)                                 │
│  ├─ Address and location                                        │
│  └─ NAICS codes, CAGE code                                      │
│                                                                  │
│  SEC EDGAR (Public Companies ~500)                              │
│  ├─ Exact revenue (audited)                                     │
│  ├─ Exact employee count                                        │
│  ├─ Government revenue %                                        │
│  ├─ Financial statements                                        │
│  └─ Business description                                        │
│                                                                  │
│  OpenCorporates (Coming Soon)                                   │
│  ├─ Incorporation date                                          │
│  ├─ Company status (Active/Dissolved)                           │
│  └─ Company structure                                           │
│                                                                  │
│  LinkedIn (Your Future Addition)                                │
│  ├─ Employee count estimate                                     │
│  ├─ Company description                                         │
│  └─ Recent updates                                              │
│                                                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ ALL DATA GOES INTO
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│            company_intelligence TABLE                            │
│                   (ONE UNIFIED VIEW)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Company Basics:                                                │
│    ✓ Legal name                                                 │
│    ✓ DBA/Trade name                                             │
│    ✓ Business structure (LLC, Corp, etc.)                       │
│    ✓ Location (HQ address, state, city)                         │
│                                                                  │
│  Financials:                                                    │
│    ✓ Revenue (exact from SEC or estimate)                       │
│    ✓ Employee count (exact from SEC or estimate)                │
│    ✓ Government revenue % (from SEC if public)                  │
│                                                                  │
│  Contact:                                                       │
│    ✓ Website                                                    │
│    ✓ Email                                                      │
│    ✓ Phone                                                      │
│    ✓ Primary contact name                                       │
│                                                                  │
│  Certifications:                                                │
│    ✓ Small business status                                      │
│    ✓ Woman-owned                                                │
│    ✓ Veteran-owned                                              │
│    ✓ 8(a) program                                               │
│    ✓ HUBZone                                                    │
│                                                                  │
│  Public Company Data (if applicable):                           │
│    ✓ Stock ticker                                               │
│    ✓ Market cap                                                 │
│    ✓ SEC filings                                                │
│                                                                  │
│  Data Quality:                                                  │
│    ✓ Data sources used                                          │
│    ✓ Quality score (0-100)                                      │
│    ✓ Confidence level                                           │
│    ✓ Last enriched date                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## The Unified Table Schema

### Key Fields in `company_intelligence`

```sql
-- IDENTIFICATION
company_name                    -- Primary name
vendor_uei                      -- Unique Entity Identifier
vendor_duns                     -- DUNS number
vendor_cage                     -- CAGE code

-- BASIC INFO (from SAM.gov)
sam_legal_name                  -- Official legal name
sam_business_type               -- LLC, Corporation, etc.
headquarters_city               -- HQ location
headquarters_state              -- HQ state
website                         -- Company website
primary_email                   -- Contact email

-- SIZE & REVENUE
estimated_employee_count        -- Best estimate from all sources
estimated_annual_revenue        -- Best estimate from all sources
estimated_revenue_source        -- Which source provided it

-- PUBLIC COMPANY DATA (from SEC)
is_public_company               -- TRUE/FALSE
stock_ticker                    -- If public
sec_annual_revenue              -- Exact revenue from 10-K
sec_employee_count              -- Exact count from 10-K
sec_government_revenue_pct      -- % of revenue from gov

-- CERTIFICATIONS (from SAM.gov)
is_small_business               -- Small business?
is_woman_owned                  -- Woman-owned?
is_veteran_owned                -- Veteran-owned?
is_8a_program                   -- 8(a) certified?
is_hubzone                      -- HUBZone certified?

-- DATA TRACKING
data_sources                    -- ['sam.gov', 'sec', 'linkedin']
data_quality_score              -- 0-100
confidence_level                -- high/medium/low
last_enriched                   -- When last updated
```

## Example: What You'll See

### For a Public Company (Lockheed Martin)

```sql
SELECT * FROM company_intelligence WHERE company_name = 'Lockheed Martin Corporation';
```

**Result**:
```
company_name: Lockheed Martin Corporation
vendor_uei: J6TJVPPLSMG6
is_public_company: TRUE
stock_ticker: LMT

-- From SAM.gov:
sam_legal_name: Lockheed Martin Corporation
sam_business_type: Corporation
headquarters_city: Bethesda
headquarters_state: MD
website: lockheedmartin.com
primary_email: corporate.communications@lmco.com
is_small_business: FALSE

-- From SEC EDGAR:
sec_annual_revenue: $67,600,000,000
sec_employee_count: 122,000
sec_government_revenue_pct: 89.5
sec_business_description: "We are a global security and aerospace company..."

-- Estimated Fields (best available):
estimated_employee_count: 122,000
estimated_annual_revenue: $67,600,000,000
estimated_revenue_source: SEC 10-K

-- Data Quality:
data_sources: ['sam.gov', 'sec']
data_quality_score: 95
confidence_level: high
last_enriched: 2024-01-15
```

### For a Small Business (SBIR Winner)

```sql
SELECT * FROM company_intelligence WHERE company_name = 'Tech Solutions LLC';
```

**Result**:
```
company_name: Tech Solutions LLC
vendor_uei: ABC123XYZ789
is_public_company: FALSE

-- From SAM.gov:
sam_legal_name: Tech Solutions, LLC
sam_business_type: Limited Liability Company
headquarters_city: Arlington
headquarters_state: VA
website: techsolutions.com
primary_email: contact@techsolutions.com
is_small_business: TRUE
is_woman_owned: TRUE
is_8a_program: FALSE

-- No SEC data (private company):
sec_annual_revenue: NULL
sec_employee_count: NULL

-- Estimated Fields (from SAM.gov if available):
estimated_employee_count: 25
estimated_annual_revenue: $3,500,000
estimated_revenue_source: SAM.gov registration

-- For Future LinkedIn enrichment:
linkedin_url: NULL (will add later)
linkedin_employee_count_range: NULL (will add later)

-- Data Quality:
data_sources: ['sam.gov']
data_quality_score: 65
confidence_level: medium
last_enriched: 2024-01-15
```

## Easy-to-Use Views

### View 1: Company Overview (Simple)

```sql
CREATE OR REPLACE VIEW company_overview AS
SELECT 
  company_name,
  
  -- Location
  headquarters_city,
  headquarters_state,
  
  -- Size
  COALESCE(sec_employee_count, estimated_employee_count) as employees,
  COALESCE(sec_annual_revenue, estimated_annual_revenue) as revenue,
  
  -- Type
  CASE 
    WHEN is_public_company THEN stock_ticker
    WHEN is_small_business THEN 'Small Business'
    ELSE 'Private Company'
  END as company_type,
  
  -- Certifications
  CASE 
    WHEN is_woman_owned THEN 'Woman-Owned, '
    ELSE ''
  END ||
  CASE 
    WHEN is_veteran_owned THEN 'Veteran-Owned, '
    ELSE ''
  END ||
  CASE 
    WHEN is_8a_program THEN '8(a), '
    ELSE ''
  END as certifications,
  
  -- Contact
  website,
  primary_email,
  
  -- Quality
  data_quality_score,
  confidence_level,
  last_enriched
  
FROM company_intelligence
WHERE enrichment_status = 'completed'
ORDER BY revenue DESC NULLS LAST;
```

**Usage**:
```sql
-- Top companies by revenue
SELECT * FROM company_overview LIMIT 50;

-- Small businesses in Virginia
SELECT * FROM company_overview 
WHERE certifications LIKE '%Woman-Owned%'
  AND headquarters_state = 'VA'
ORDER BY employees DESC;
```

### View 2: Company with Contract Data

```sql
CREATE OR REPLACE VIEW company_complete_profile AS
SELECT 
  ci.company_name,
  ci.headquarters_city,
  ci.headquarters_state,
  ci.website,
  
  -- Size & Revenue
  COALESCE(ci.sec_employee_count, ci.estimated_employee_count) as employees,
  COALESCE(ci.sec_annual_revenue, ci.estimated_annual_revenue) as annual_revenue,
  
  -- Government Business
  ci.sec_government_revenue_pct,
  fcs.total_contracts,
  fcs.total_value as fpds_contract_value,
  fcs.most_recent_contract_date,
  
  -- Calculate gov dependency
  CASE 
    WHEN ci.sec_government_revenue_pct IS NOT NULL 
    THEN ci.sec_government_revenue_pct
    WHEN ci.sec_annual_revenue IS NOT NULL AND fcs.total_value IS NOT NULL
    THEN ROUND((fcs.total_value / NULLIF(ci.sec_annual_revenue, 0) * 100)::numeric, 2)
    ELSE NULL
  END as calculated_gov_dependency,
  
  -- Certifications
  ci.is_small_business,
  ci.is_woman_owned,
  ci.is_veteran_owned,
  ci.is_8a_program,
  
  -- Public company info
  ci.is_public_company,
  ci.stock_ticker,
  
  -- Data quality
  ci.data_quality_score,
  ci.confidence_level
  
FROM company_intelligence ci
LEFT JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
WHERE ci.enrichment_status = 'completed'
ORDER BY fcs.total_value DESC NULLS LAST;
```

**Usage**:
```sql
-- Top contractors with full details
SELECT * FROM company_complete_profile LIMIT 100;

-- Public companies that rely heavily on government
SELECT 
  company_name,
  stock_ticker,
  annual_revenue / 1000000 as revenue_millions,
  employees,
  calculated_gov_dependency as pct_gov_revenue,
  fpds_contract_value / 1000000 as contracts_millions
FROM company_complete_profile
WHERE is_public_company = TRUE
  AND calculated_gov_dependency > 50
ORDER BY annual_revenue DESC;
```

### View 3: Data Source Summary

```sql
CREATE OR REPLACE VIEW company_data_sources AS
SELECT 
  company_name,
  
  -- What sources enriched this company
  sam_enriched,
  sec_enriched,
  oc_enriched,
  
  -- Future sources (for your LinkedIn tracker)
  CASE WHEN linkedin_url IS NOT NULL THEN TRUE ELSE FALSE END as linkedin_enriched,
  
  -- Data quality
  data_quality_score,
  array_length(data_sources, 1) as source_count,
  
  -- What we know
  CASE WHEN sec_employee_count IS NOT NULL THEN 'Exact' ELSE 'Estimate' END as employee_data_quality,
  CASE WHEN sec_annual_revenue IS NOT NULL THEN 'Exact (SEC)' 
       WHEN estimated_annual_revenue IS NOT NULL THEN 'Estimate'
       ELSE 'Unknown' 
  END as revenue_data_quality,
  
  last_enriched
  
FROM company_intelligence;
```

## How to Use Your Unified Table

### 1. Get Complete Company Profile

```sql
-- Single company lookup
SELECT 
  company_name,
  headquarters_city || ', ' || headquarters_state as location,
  website,
  COALESCE(sec_employee_count, estimated_employee_count) as employees,
  COALESCE(sec_annual_revenue, estimated_annual_revenue) / 1000000 as revenue_millions,
  is_small_business,
  is_woman_owned,
  is_public_company,
  stock_ticker,
  data_quality_score
FROM company_intelligence
WHERE company_name ILIKE '%Lockheed Martin%';
```

### 2. Filter by Company Characteristics

```sql
-- Find woman-owned small businesses in cybersecurity
SELECT 
  ci.company_name,
  ci.headquarters_state,
  ci.estimated_employee_count,
  ci.website,
  fcs.total_contracts,
  fcs.total_value
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
WHERE ci.is_small_business = TRUE
  AND ci.is_woman_owned = TRUE
  AND fcs.primary_naics LIKE '541512%' -- Cybersecurity NAICS
ORDER BY fcs.total_value DESC;
```

### 3. Compare Public vs Private Contractors

```sql
SELECT 
  CASE WHEN is_public_company THEN 'Public' ELSE 'Private' END as company_type,
  COUNT(*) as count,
  AVG(estimated_employee_count) as avg_employees,
  AVG(estimated_annual_revenue) as avg_revenue,
  SUM(CASE WHEN is_small_business THEN 1 ELSE 0 END) as small_business_count
FROM company_intelligence
GROUP BY company_type;
```

### 4. Find Companies for Partnership/Teaming

```sql
-- Small businesses similar size to yours
SELECT 
  company_name,
  headquarters_state,
  estimated_employee_count,
  website,
  primary_email,
  ARRAY_TO_STRING(small_business_types, ', ') as certifications
FROM company_intelligence
WHERE is_small_business = TRUE
  AND estimated_employee_count BETWEEN 20 AND 100
  AND headquarters_state IN ('VA', 'MD', 'DC')
ORDER BY data_quality_score DESC
LIMIT 50;
```

## Adding LinkedIn Data Later

When you build your LinkedIn tracker, just add to the same table:

```sql
-- Your LinkedIn enrichment will UPDATE the same records
UPDATE company_intelligence
SET 
  linkedin_url = 'https://linkedin.com/company/example',
  linkedin_employee_count_range = '201-500',
  linkedin_description = '...',
  linkedin_followers = 12500,
  linkedin_enriched = TRUE,
  data_sources = array_append(data_sources, 'linkedin'),
  last_enriched = NOW()
WHERE company_name = 'Example Company';
```

The `company_intelligence` table is designed to accommodate ANY enrichment source you add in the future!

## Next Steps

### Step 1: Run the Migration

In Supabase SQL Editor:
```sql
-- Run this file:
supabase/migrations/create_company_intelligence_free.sql
```

### Step 2: Enrich Your Companies

```bash
# Start with 100 companies (test)
npm run enrich-companies

# Once verified, enrich more
npm run enrich-companies -- 1000

# Or enrich all
npm run enrich-companies -- all
```

### Step 3: Query Your Unified Data

```sql
-- See what you have
SELECT * FROM company_overview LIMIT 100;

-- Check data quality
SELECT * FROM enrichment_status_summary;

-- View public companies
SELECT * FROM public_companies_summary;
```

### Step 4: Build UI to Display

Create company profile pages that pull from `company_intelligence`:

```tsx
// app/companies/[id]/page.tsx
async function CompanyProfilePage({ params }: { params: { id: string } }) {
  const company = await supabase
    .from('company_intelligence')
    .select('*')
    .eq('id', params.id)
    .single();

  return (
    <div>
      <h1>{company.company_name}</h1>
      <p>Location: {company.headquarters_city}, {company.headquarters_state}</p>
      <p>Employees: {company.estimated_employee_count?.toLocaleString()}</p>
      <p>Revenue: ${company.estimated_annual_revenue?.toLocaleString()}</p>
      {company.is_public_company && (
        <p>Stock: {company.stock_ticker}</p>
      )}
      {company.website && (
        <a href={company.website}>Visit Website</a>
      )}
    </div>
  );
}
```

## Summary

✅ **ONE table** (`company_intelligence`) with ALL company data
✅ **Multiple FREE sources** feeding into it (SAM.gov, SEC, OpenCorporates)
✅ **Easy to query** with pre-built views
✅ **Ready for LinkedIn** enrichment when you add it later
✅ **Links to your existing data** (FPDS contracts, SAM opportunities)

Everything flows into this single unified table, making it simple to:
- Display complete company profiles
- Filter and search companies
- Compare companies
- Track data quality
- Add new enrichment sources

Ready to start? Run the migration and then:
```bash
npm run enrich-companies
```

Your unified company intelligence table will be populated in minutes!

