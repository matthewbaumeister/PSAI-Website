# Company Intelligence - Complete Game Plan

## Goal
Build a unified company intelligence database with detailed info on ALL government contractors (large & small) using FREE data sources.

## What You'll Get
- **Company profiles** with size, revenue, employees, contact info
- **Public companies**: Exact financials from SEC filings
- **Private companies**: Business structure, certifications, contact from SAM.gov
- **All in ONE table**: `company_intelligence`

## The Plan (3 Steps)

### Step 1: Build Master Company List ✓ (5 minutes)

**What**: Create `fpds_company_stats` table with ALL companies from your data

**Run this in Supabase SQL Editor**:
```
BUILD_MASTER_COMPANY_LIST.sql
```

**This pulls companies from**:
- ✅ FPDS Contracts (47,429 contracts) → ~3,000-5,000 unique companies
- ✅ DoD Contract News (your scraped data) → +500 companies
- ✅ SAM.gov Opportunities (1,057 opportunities) → +200 companies
- ✅ Army Innovation (988 submissions) → +300 companies

**Expected Result**: 4,000-6,000 total unique companies

---

### Step 2: Enrich with FREE Data (2-3 hours for all companies)

**What**: Call FREE APIs to get detailed company info

**Run this in terminal**:
```bash
# Start with 100 companies (test - takes 30 seconds)
npm run enrich-companies

# Then do more
npm run enrich-companies -- 500

# Or do all at once (takes 2-3 hours)
npm run enrich-companies -- all
```

**This calls**:
1. **SAM.gov Entity API** (FREE)
   - Business structure (LLC, Corp, etc.)
   - Small business certifications
   - Contact info (email, phone, website)
   - Address and location
   - NAICS codes

2. **SEC EDGAR** (FREE)
   - Revenue (exact, audited)
   - Employee count (exact)
   - Government revenue %
   - Business description
   - Financial statements
   - Only for public companies (~100-200 out of 5,000)

**Expected Result**: 
- 100% of companies get basic data (SAM.gov)
- ~3-5% get detailed financials (SEC for public companies)
- All stored in `company_intelligence` table

---

### Step 3: Query & Use the Data (ongoing)

**What**: Access your unified company intelligence

**View enriched companies**:
```sql
SELECT 
  company_name,
  headquarters_city,
  headquarters_state,
  website,
  estimated_employee_count,
  estimated_annual_revenue / 1000000 as revenue_millions,
  is_public_company,
  stock_ticker,
  is_small_business,
  is_woman_owned,
  data_quality_score
FROM company_intelligence
ORDER BY estimated_annual_revenue DESC NULLS LAST
LIMIT 100;
```

**Find public companies**:
```sql
SELECT * FROM public_companies_summary
ORDER BY sec_annual_revenue DESC;
```

**Search by criteria**:
```sql
-- Woman-owned small businesses in VA
SELECT 
  company_name,
  website,
  primary_email,
  estimated_employee_count
FROM company_intelligence
WHERE is_woman_owned = TRUE
  AND headquarters_state = 'VA'
ORDER BY estimated_employee_count DESC;
```

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| **Step 1**: Run BUILD_MASTER_COMPANY_LIST.sql | 5 min | ⏳ DO NOW |
| **Step 2a**: Test enrichment (100 companies) | 30 sec | ⏳ NEXT |
| **Step 2b**: Enrich all companies | 2-3 hours | ⏳ THEN |
| **Step 3**: Use the data in your app | Ongoing | ⏳ AFTER |

---

## Cost Breakdown

| Data Source | Companies Covered | Cost |
|-------------|------------------|------|
| SAM.gov Entity API | 100% (all contractors) | **$0** |
| SEC EDGAR | 3-5% (public companies) | **$0** |
| **TOTAL** | **4,000-6,000 companies** | **$0/year** |

Compare to:
- Crunchbase: $60,000-$120,000/year for 3-5% coverage
- Clearbit: $1,200-$3,000/year for better estimates

---

## What You Get Per Company

### For Public Companies (e.g., Lockheed Martin)
```
Company: Lockheed Martin Corporation
Type: Public (NYSE: LMT)

Location: Bethesda, MD
Website: lockheedmartin.com
Email: corporate.communications@lmco.com

Financials (from SEC 10-K):
  Revenue: $67.6 Billion
  Employees: 122,000 (exact)
  Gov Revenue: ~90% of total

Business Description:
  "We are a global security and aerospace company..."
  [Full 10-K business description]

Data Sources: SAM.gov, SEC EDGAR
Quality Score: 95/100
Last Updated: 2024-11-05
```

### For Private Small Businesses (e.g., SBIR Winner)
```
Company: Tech Solutions LLC
Type: Private, Small Business

Location: Arlington, VA
Website: techsolutions.com
Email: contact@techsolutions.com
Phone: (703) 555-1234

Certifications:
  ✓ Small Business
  ✓ Woman-Owned
  ✓ Veteran-Owned

Business Info:
  Structure: LLC
  Employees: 25 (estimated)
  Founded: 2015

Contracts:
  SBIR Phase I: 3 awards
  SBIR Phase II: 1 award
  Total Value: $2.3M

Data Sources: SAM.gov, OpenCorporates
Quality Score: 68/100
Last Updated: 2024-11-05
```

---

## Files You Have

### Database
- ✅ `create_company_intelligence_free.sql` - Main tables (already ran)
- ✅ `BUILD_MASTER_COMPANY_LIST.sql` - Populate companies (run now)

### Scripts
- ✅ `enrich-companies.ts` - Master enrichment script
- ✅ `src/lib/company-intelligence/sam-entity-enrichment.ts` - SAM.gov API
- ✅ `src/lib/company-intelligence/sec-edgar-enrichment.ts` - SEC EDGAR API

### Documentation
- ✅ `COMPANY_ENRICHMENT_README.md` - Detailed guide
- ✅ `UNIFIED_COMPANY_TABLE_GUIDE.md` - How to use the data
- ✅ `AFFORDABLE_COMPANY_INTELLIGENCE.md` - FREE alternatives to Crunchbase
- ✅ `COMPANY_INTELLIGENCE_COMPARISON.md` - Crunchbase vs FREE comparison
- ✅ `COMPANY_INTELLIGENCE_GAMEPLAN.md` - This file

---

## Quick Start (Do This Now)

### 1. Run SQL Script
In Supabase SQL Editor:
```sql
-- Copy/paste contents of: BUILD_MASTER_COMPANY_LIST.sql
```

### 2. Run Enrichment
In terminal:
```bash
npm run enrich-companies
```

### 3. Check Results
In Supabase SQL Editor:
```sql
SELECT * FROM company_intelligence LIMIT 20;
SELECT * FROM enrichment_status_summary;
```

---

## Next Steps After Enrichment

### Build UI to Display Companies

```typescript
// app/companies/page.tsx
export default async function CompaniesPage() {
  const { data: companies } = await supabase
    .from('company_intelligence')
    .select('*')
    .order('estimated_annual_revenue', { ascending: false })
    .limit(100);

  return (
    <div>
      {companies?.map(company => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
```

### Add Search & Filters

```sql
-- Search by name
SELECT * FROM company_intelligence 
WHERE company_name ILIKE '%lockheed%'
OR sam_legal_name ILIKE '%lockheed%';

-- Filter by certifications
SELECT * FROM company_intelligence 
WHERE is_woman_owned = TRUE 
  AND is_small_business = TRUE;

-- Filter by location
SELECT * FROM company_intelligence 
WHERE headquarters_state = 'VA';

-- Filter by size
SELECT * FROM company_intelligence 
WHERE estimated_employee_count BETWEEN 50 AND 200;
```

### Add LinkedIn Later (Future Enhancement)

When you build LinkedIn scraper, just UPDATE the same table:

```sql
UPDATE company_intelligence
SET 
  linkedin_url = 'https://linkedin.com/company/example',
  linkedin_employee_count_range = '201-500',
  linkedin_description = '...',
  data_sources = array_append(data_sources, 'linkedin'),
  last_enriched = NOW()
WHERE company_name = 'Example Company';
```

---

## Troubleshooting

### "No companies found"
- Make sure you ran `BUILD_MASTER_COMPANY_LIST.sql` first
- Check: `SELECT COUNT(*) FROM fpds_company_stats;`

### "SAM.gov API errors"
- Check logs: `SELECT * FROM company_intel_api_log ORDER BY called_at DESC LIMIT 20;`
- Verify API key: `echo $SAM_GOV_API_KEY`

### "Script runs but no data"
- Check if companies have UEIs: `SELECT COUNT(*) FROM fpds_company_stats WHERE vendor_uei IS NOT NULL;`
- UEI is required for SAM.gov API

---

## Summary

✅ **ONE SQL script** → Creates master company list from all your data
✅ **ONE command** → Enriches with FREE APIs (SAM.gov + SEC)
✅ **ONE table** → All company intelligence unified (`company_intelligence`)
✅ **$0 cost** → All data sources are free

**Ready?** 

1. Run `BUILD_MASTER_COMPANY_LIST.sql` in Supabase
2. Run `npm run enrich-companies` in terminal
3. Query `company_intelligence` table

That's it!

