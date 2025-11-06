# Company Enrichment Workflow - Historical + Daily Strategy

## How It Works in Theory

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. YOUR CONTRACT SCRAPERS (Daily)                               │
├─────────────────────────────────────────────────────────────────┤
│  - FPDS scraper adds new contracts                             │
│  - DoD news scraper finds new awards                           │
│  - SAM.gov scraper gets new opportunities                      │
│  - Army xTech scraper tracks new winners                       │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRIGGER: New company detected                                │
├─────────────────────────────────────────────────────────────────┤
│  - Check if company exists in company_intelligence             │
│  - If NO → Add to enrichment queue                             │
│  - If YES → Check if data is stale (>90 days old)             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ENRICHMENT QUEUE (Priority-based)                            │
├─────────────────────────────────────────────────────────────────┤
│  High Priority (10):                                            │
│    - New companies with large contracts (>$10M)                │
│    - Public companies needing SEC update                       │
│                                                                  │
│  Medium Priority (5):                                           │
│    - New small businesses                                      │
│    - SBIR/STTR winners                                         │
│    - Existing companies needing refresh (>90 days)             │
│                                                                  │
│  Low Priority (1):                                              │
│    - Companies with <$100K in contracts                        │
│    - Inactive companies (no contracts in 2+ years)             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ENRICHMENT PROCESSOR (Cron Job)                              │
├─────────────────────────────────────────────────────────────────┤
│  Runs: Daily at 2 AM                                           │
│  Processes: Top 500 companies from queue                        │
│  Rate limit: 10 requests/second (SAM.gov + SEC limits)         │
│  Duration: ~10-15 minutes                                       │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DATA ENRICHMENT (FREE APIs)                                  │
├─────────────────────────────────────────────────────────────────┤
│  For EACH company:                                              │
│    1. Call SAM.gov Entity API                                  │
│       - If UEI found: Get full business profile               │
│       - If NOT found: Mark as "not_found"                      │
│    2. Check if public company (SEC EDGAR)                      │
│       - Search by company name                                 │
│       - If found: Get latest 10-K financials                   │
│       - If NOT found: Mark as private                          │
│    3. Store all data in company_intelligence                   │
│    4. Update quality score                                     │
│    5. Mark as "completed" in queue                             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. DATA QUALITY TRACKING                                        │
├─────────────────────────────────────────────────────────────────┤
│  - Quality score: 0-100 based on completeness                  │
│  - Confidence level: high/medium/low                           │
│  - Data sources: ['sam.gov', 'sec', 'linkedin']               │
│  - Last enriched: timestamp for refresh scheduling             │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: Historical Scrape (One-Time Setup)

### Goal
Enrich ALL existing companies from your 47K+ contracts

### Process
```bash
# 1. Build company list from existing data
Run: BUILD_COMPANY_LIST_SIMPLE.sql in Supabase
Result: ~3,000-5,000 unique companies

# 2. Initial enrichment (test with 100 first)
npm run enrich-companies
Result: Verify data quality looks good

# 3. Full historical enrichment
npm run enrich-companies -- all
Duration: 2-3 hours
Result: All companies enriched
```

### What Gets Enriched
- ✅ **Companies with UEI**: Full SAM.gov data (90%+ success rate)
- ⚠️ **Companies without UEI**: Can't enrich via SAM.gov (mark as limited data)
- ✅ **Public companies**: SEC EDGAR data (exact financials)
- ⚠️ **Private companies**: No SEC data (mark as "not publicly available")

### Data Quality Expectations
```sql
-- After historical scrape
SELECT 
  confidence_level,
  COUNT(*) as count,
  AVG(data_quality_score) as avg_score
FROM company_intelligence
GROUP BY confidence_level;

-- Expected results:
-- high:   ~30% (companies with UEI + good SAM.gov data)
-- medium: ~50% (companies with UEI but incomplete data)
-- low:    ~20% (companies without UEI or very limited data)
```

## Phase 2: Daily Enrichment (Automated)

### Goal
Automatically enrich new companies as they appear in your contract scrapers

### Cron Job Strategy

**Frequency**: Daily at 2 AM (after all contract scrapers complete)

**What it does**:
1. Finds new companies added to any table in last 24 hours
2. Adds them to enrichment queue with priority
3. Processes top 500 from queue
4. Refreshes stale data (>90 days old) for active companies

### Implementation

Create: `cron/enrich-companies-daily.ts`

```typescript
/**
 * Daily Company Enrichment Cron Job
 * Runs at 2 AM daily
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { batchEnrichFromFPDS } from '../src/lib/company-intelligence/sam-entity-enrichment';
import { batchEnrichPublicCompanies } from '../src/lib/company-intelligence/sec-edgar-enrichment';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function dailyEnrichment() {
  console.log('🔄 Starting daily company enrichment...');
  
  // Step 1: Find new companies from FPDS (last 24 hours)
  const { data: newContracts } = await supabase
    .from('fpds_contracts')
    .select('vendor_name, vendor_uei, vendor_duns')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .not('vendor_name', 'is', null);

  // Step 2: Add new companies to fpds_company_stats if not exists
  for (const contract of newContracts || []) {
    const { data: existing } = await supabase
      .from('fpds_company_stats')
      .select('id')
      .eq('company_name', contract.vendor_name)
      .single();

    if (!existing) {
      // Company doesn't exist, will be picked up by enrichment
      console.log(`  New company detected: ${contract.vendor_name}`);
    }
  }

  // Step 3: Rebuild company stats (quick - only processes new data)
  // This could be a SQL function that only processes contracts from last 7 days
  
  // Step 4: Enrich new companies (max 500 per day)
  console.log('  Enriching new companies...');
  await batchEnrichFromFPDS(500);
  
  // Step 5: Refresh public companies (quarterly financials)
  console.log('  Refreshing public company data...');
  await refreshStalePublicCompanies(50);
  
  console.log('✅ Daily enrichment complete!');
}

/**
 * Refresh companies with stale data (>90 days old)
 */
async function refreshStalePublicCompanies(limit: number = 50) {
  const { data: staleCompanies } = await supabase
    .from('company_intelligence')
    .select('id, company_name')
    .eq('is_public_company', true)
    .lt('sec_last_checked', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .limit(limit);

  for (const company of staleCompanies || []) {
    const { enrichWithSEC } = await import('../src/lib/company-intelligence/sec-edgar-enrichment');
    await enrichWithSEC(company.id, company.company_name);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}

// Run if executed directly
if (require.main === module) {
  dailyEnrichment()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { dailyEnrichment };
```

Add to `package.json`:
```json
{
  "scripts": {
    "enrich-companies": "tsx enrich-companies.ts",
    "enrich-companies:daily": "tsx cron/enrich-companies-daily.ts"
  }
}
```

Add to your cron setup (Vercel Cron, GitHub Actions, or similar):
```yaml
# .github/workflows/daily-enrichment.yml
name: Daily Company Enrichment
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
jobs:
  enrich:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run enrich-companies:daily
```

## Data Freshness Strategy

### How Stale Data is Handled

**New Companies**:
- Enriched immediately when detected (next daily run)
- Added to queue with high priority if large contract

**Existing Companies**:
- **Public companies**: Refresh every 90 days (quarterly SEC filings)
- **Private companies**: Refresh every 180 days (SAM.gov updates)
- **Inactive companies**: Refresh every 365 days (annual check)

**Trigger-Based Updates**:
- New contract >$10M → Re-enrich immediately
- Company wins SBIR → Re-enrich immediately
- User manually requests update → Add to high-priority queue

### Missing/Unavailable Data

When data can't be found:

```typescript
// Company not found in SAM.gov
{
  enrichment_status: 'not_found',
  sam_enriched: false,
  data_quality_score: 20,
  confidence_level: 'low',
  notes: 'UEI not found in SAM.gov - may be inactive or incorrect identifier'
}

// Private company (no SEC data)
{
  is_public_company: false,
  sec_enriched: false,
  sec_annual_revenue: null,
  estimated_annual_revenue: null,
  estimated_revenue_source: 'Not publicly available',
  data_quality_score: 65,
  confidence_level: 'medium'
}

// Company with full data
{
  enrichment_status: 'completed',
  sam_enriched: true,
  sec_enriched: true,
  data_quality_score: 95,
  confidence_level: 'high',
  data_sources: ['sam.gov', 'sec']
}
```

## Testing Strategy (What You Should Do Now)

### Step 1: Test with 10 Companies (5 minutes)

```bash
# Modify enrich-companies.ts temporarily
npm run enrich-companies -- 10
```

**Check quality**:
```sql
-- See what you got
SELECT 
  company_name,
  is_public_company,
  sam_enriched,
  sec_enriched,
  data_quality_score,
  confidence_level,
  estimated_employee_count,
  estimated_annual_revenue
FROM company_intelligence
ORDER BY id
LIMIT 10;
```

**Expected results**:
- 8-9 out of 10 should have SAM.gov data (if they have valid UEIs)
- 0-1 out of 10 might be public (depends on your contractor mix)
- Quality scores: 60-90

### Step 2: Verify Data Quality (10 minutes)

**Check a known company** (e.g., Lockheed Martin):
```sql
SELECT * FROM company_intelligence 
WHERE company_name ILIKE '%lockheed%';
```

**Verify**:
- ✅ Has stock ticker (LMT)?
- ✅ Has revenue (billions)?
- ✅ Has employee count (100,000+)?
- ✅ Has website?
- ✅ Quality score > 90?

**Check a small business**:
```sql
SELECT * FROM company_intelligence 
WHERE small_business = TRUE
LIMIT 1;
```

**Verify**:
- ✅ Has business structure (LLC, Corp)?
- ✅ Has location?
- ✅ Has certifications (woman-owned, 8(a), etc.)?
- ✅ Quality score > 60?

### Step 3: Check Error Rate (5 minutes)

```sql
-- Check API errors
SELECT 
  api_source,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = FALSE) as errors,
  ROUND(COUNT(*) FILTER (WHERE success = FALSE)::numeric / COUNT(*) * 100, 2) as error_rate_pct
FROM company_intel_api_log
GROUP BY api_source;
```

**Expected error rates**:
- SAM.gov: <5% (some companies have invalid UEIs)
- SEC: <1% (search is very reliable)

**If error rate >10%**: Check your API key, rate limiting, or internet connection

### Step 4: Full Historical Scrape (Only After Quality Verified)

Once you've verified quality looks good:

```bash
# Process all companies (2-3 hours)
npm run enrich-companies -- all
```

**Monitor progress**:
```sql
-- Check every 30 minutes
SELECT 
  COUNT(*) as total_enriched,
  COUNT(*) FILTER (WHERE sam_enriched = TRUE) as with_sam_data,
  COUNT(*) FILTER (WHERE sec_enriched = TRUE) as public_companies,
  AVG(data_quality_score) as avg_quality
FROM company_intelligence;
```

## Summary

### Testing First ✅
1. Run SQL: `BUILD_COMPANY_LIST_SIMPLE.sql`
2. Test: `npm run enrich-companies -- 10`
3. Verify: Check data quality for 10 companies
4. If good: Scale to all companies

### Daily Automation 🔄
1. New companies detected by contract scrapers
2. Added to enrichment queue with priority
3. Daily cron enriches top 500 from queue
4. Stale data refreshed quarterly/annually
5. Missing data marked as "not publicly available"

### What You Get 📊
- **New companies**: Enriched within 24 hours
- **Existing companies**: Kept fresh automatically
- **Public companies**: Updated quarterly (SEC filings)
- **All companies**: Tracked with quality scores

**Ready to test?** 

1. Run `BUILD_COMPANY_LIST_SIMPLE.sql` in Supabase
2. Run `npm run enrich-companies -- 10` to test
3. Check quality
4. If good, run full enrichment!

