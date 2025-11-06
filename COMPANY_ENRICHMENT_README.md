# Company Intelligence Enrichment - Quick Start

## What This Does

Enriches your 50,000+ DoD contractors with FREE company intelligence data:

1. **SAM.gov Entity Management** - Business structure, certifications, contact info (100% coverage)
2. **SEC EDGAR** - Financial data for ~500 public companies (exact revenue, employees, etc.)
3. **Total Cost**: $0/year (vs $60K-$120K for Crunchbase)

## Setup (5 Minutes)

### Step 1: Run Database Migration

In Supabase SQL Editor, run:
```sql
-- Copy/paste contents of:
supabase/migrations/create_company_intelligence_free.sql
```

This creates 4 new tables:
- `company_intelligence` - Main enrichment data
- `sec_filings_cache` - SEC filing storage
- `company_enrichment_queue` - Processing queue
- `company_intel_api_log` - Usage tracking

### Step 2: Add to package.json

Add this script to your `package.json`:
```json
{
  "scripts": {
    "enrich-companies": "tsx enrich-companies.ts"
  }
}
```

### Step 3: Verify Environment Variables

Make sure you have:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SAM_GOV_API_KEY=your_sam_gov_api_key
```

You already have these from your existing scrapers!

## Usage

### Enrich 100 Companies (Test Run)
```bash
npm run enrich-companies
```

### Enrich 500 Companies
```bash
npm run enrich-companies -- 500
```

### Enrich ALL Companies
```bash
npm run enrich-companies -- all
```

**Note**: This processes in batches with rate limiting. For 50,000 companies, expect ~8-10 hours total.

## What You Get

### For Public Companies (e.g., Lockheed Martin, Raytheon)

```sql
SELECT 
  company_name,
  stock_ticker,
  sec_annual_revenue,
  sec_employee_count,
  sec_government_revenue_pct,
  headquarters_city,
  headquarters_state,
  is_small_business
FROM company_intelligence
WHERE is_public_company = TRUE
ORDER BY sec_annual_revenue DESC;
```

Example output:
```
Lockheed Martin Corporation
Ticker: LMT
Revenue: $67,600,000,000
Employees: 122,000
Gov Revenue: ~90%
Location: Bethesda, MD
Small Business: No
```

### For Private Companies (e.g., SBIR Winners)

```sql
SELECT 
  company_name,
  is_small_business,
  is_woman_owned,
  is_8a_program,
  estimated_employee_count,
  headquarters_city,
  headquarters_state,
  website,
  primary_email
FROM company_intelligence
WHERE is_small_business = TRUE
ORDER BY company_name;
```

Example output:
```
Tech Solutions LLC
Small Business: Yes
Woman-Owned: Yes
8(a) Program: No
Location: Arlington, VA
Website: techsolutions.com
Email: contact@techsolutions.com
```

## Check Progress

### Current Status
```sql
SELECT * FROM enrichment_status_summary;
```

### Public Companies Found
```sql
SELECT 
  company_name,
  stock_ticker,
  sec_annual_revenue,
  sec_employee_count
FROM public_companies_summary
ORDER BY sec_annual_revenue DESC
LIMIT 20;
```

### Companies Needing Enrichment
```sql
SELECT * FROM companies_needing_enrichment LIMIT 100;
```

### API Usage Today
```sql
SELECT 
  api_source,
  COUNT(*) as calls,
  COUNT(*) FILTER (WHERE success = TRUE) as successful,
  AVG(response_time_ms) as avg_response_ms
FROM company_intel_api_log
WHERE DATE(called_at) = CURRENT_DATE
GROUP BY api_source;
```

## Performance Expectations

### SAM.gov Entity Enrichment
- **Rate Limit**: 10 requests/second
- **Time**: ~100ms per company
- **100 companies**: ~10 seconds
- **1,000 companies**: ~2 minutes
- **10,000 companies**: ~20 minutes
- **50,000 companies**: ~2 hours

### SEC EDGAR Enrichment
- **Rate Limit**: 10 requests/second
- **Time**: ~150ms per company checked
- **Coverage**: ~1-2% of companies are public (~500 out of 50,000)
- **100 companies checked**: ~15 seconds
- **1,000 companies checked**: ~3 minutes

### Total Time
- **100 companies**: ~30 seconds
- **1,000 companies**: ~5 minutes
- **10,000 companies**: ~30 minutes
- **50,000 companies**: ~2.5 hours

## Data Quality

### Quality Scores

After enrichment, check data quality:
```sql
SELECT 
  confidence_level,
  COUNT(*) as companies,
  AVG(data_quality_score) as avg_score,
  AVG(completeness_pct) as avg_completeness
FROM company_intelligence
GROUP BY confidence_level
ORDER BY 
  CASE confidence_level 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    ELSE 3 
  END;
```

### Update Quality Scores

Recalculate quality scores after enrichment:
```sql
SELECT update_all_quality_scores();
```

## Integration with Existing Data

### Link to FPDS Contracts
```sql
SELECT 
  c.company_name,
  c.is_public_company,
  c.sec_annual_revenue,
  c.estimated_employee_count,
  f.total_contracts,
  f.total_value as fpds_contract_value,
  CASE 
    WHEN c.sec_government_revenue_pct IS NOT NULL 
    THEN CONCAT(c.sec_government_revenue_pct::text, '% gov revenue')
    ELSE 'Private company'
  END as gov_dependency
FROM fpds_company_stats f
JOIN company_intelligence c ON c.id = f.company_intelligence_id
WHERE f.total_value > 10000000
ORDER BY f.total_value DESC
LIMIT 50;
```

### Top DoD Contractors (Public Companies)
```sql
SELECT 
  ci.company_name,
  ci.stock_ticker,
  ci.sec_annual_revenue / 1000000 as revenue_millions,
  ci.sec_employee_count,
  fcs.total_contracts,
  fcs.total_value / 1000000 as fpds_value_millions,
  ROUND(
    (fcs.total_value / NULLIF(ci.sec_annual_revenue, 0) * 100)::numeric, 
    2
  ) as pct_revenue_from_dod
FROM company_intelligence ci
JOIN fpds_company_stats fcs ON fcs.company_intelligence_id = ci.id
WHERE ci.is_public_company = TRUE
  AND ci.sec_annual_revenue IS NOT NULL
ORDER BY fcs.total_value DESC
LIMIT 25;
```

## Troubleshooting

### No Companies Being Enriched

Check if companies have UEIs:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE vendor_uei IS NOT NULL) as with_uei,
  COUNT(*) FILTER (WHERE intelligence_enriched = TRUE) as enriched
FROM fpds_company_stats;
```

### SAM.gov API Errors

Check API logs:
```sql
SELECT *
FROM company_intel_api_log
WHERE api_source = 'sam.gov'
  AND success = FALSE
ORDER BY called_at DESC
LIMIT 10;
```

### SEC API Rate Limit

The script has built-in rate limiting (10 requests/second). If you hit rate limits, the script will automatically slow down.

### Missing Environment Variables

Make sure these are set:
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $SAM_GOV_API_KEY
```

## Next Steps

### 1. Initial Test Run (5 minutes)
```bash
npm run enrich-companies
```

Check results:
```sql
SELECT * FROM company_intelligence LIMIT 10;
SELECT * FROM public_companies_summary;
```

### 2. Enrich Top 1,000 Companies (10 minutes)
```bash
npm run enrich-companies -- 1000
```

### 3. Enrich All Companies (2-3 hours)
```bash
npm run enrich-companies -- all
```

Run this overnight or during off-hours.

### 4. Set Up Automated Updates

Add to your existing cron jobs:
```typescript
// Update company intelligence weekly
export async function updateCompanyIntelligence() {
  // Enrich new companies
  await batchEnrichFromFPDS(500);
  
  // Update public companies (quarterly financials)
  await batchEnrichPublicCompanies(100);
}
```

## Cost Comparison

| Approach | Annual Cost | Coverage | Public Co Data | Private Co Data |
|----------|-------------|----------|----------------|-----------------|
| **FREE (This)** | **$0** | **100%** | **Excellent** | **Basic** |
| Clearbit | $1,200-$3,000 | 100% | Good | Good |
| Crunchbase | $60,000-$120,000 | 5% | Good | Excellent |

## Support

If you run into issues:

1. Check logs: `SELECT * FROM company_intel_api_log ORDER BY called_at DESC LIMIT 20;`
2. Verify environment variables
3. Check rate limits: SAM.gov = 10 req/sec, SEC = 10 req/sec
4. Run smaller batches if needed: `npm run enrich-companies -- 10`

## Files Created

- `create_company_intelligence_free.sql` - Database migration
- `src/lib/company-intelligence/sam-entity-enrichment.ts` - SAM.gov enrichment
- `src/lib/company-intelligence/sec-edgar-enrichment.ts` - SEC EDGAR enrichment
- `enrich-companies.ts` - Master orchestration script
- `COMPANY_ENRICHMENT_README.md` - This file

Ready to start? Run the migration, then:
```bash
npm run enrich-companies
```

Your first 100 companies will be enriched in about 30 seconds!

