# Daily Company Update - Action Plan

## Goal
Set up automated daily updates that:
1. Rebuild company stats as FPDS scraper adds more contracts
2. Enrich new companies automatically
3. Keep data fresh with minimal manual work

---

## Phase 1: Initial Setup (Do Today - 15 minutes)

### Step 1: Create SQL Function (5 min)

**Run this in Supabase SQL Editor:**
```
create_rebuild_company_stats_function.sql
```

This creates a stored procedure that makes daily rebuilds fast (30 seconds instead of 5 minutes).

**Expected output:**
```
✅ Stored procedure created successfully!
companies_created | total_value_sum      | duration_seconds
3247              | 12543234567.89       | 4.23
```

---

### Step 2: Run First Diagnostic (2 min)

**Run this in Supabase SQL Editor:**
```
DIAGNOSE_AND_FIX_VALUES.sql
```

This:
- Checks which value columns have data
- Rebuilds company stats using best available data
- Shows you top 20 companies

**Check the results:**
- Are companies showing real dollar values (not $0)?
- What's the total contract value?
- Do the top companies look right?

**If still showing $0**: Your FPDS contracts might not have financial data populated yet. That's OK - continue anyway and values will populate as FPDS scraper continues.

---

### Step 3: Test Enrichment (5 min)

**In terminal:**
```bash
# Test with 10 companies
npm run enrich-companies -- 10
```

**Check quality in Supabase:**
```sql
SELECT 
  company_name,
  headquarters_state,
  is_public_company,
  sam_enriched,
  sec_enriched,
  data_quality_score,
  confidence_level
FROM company_intelligence
ORDER BY id DESC
LIMIT 10;
```

**Expected results:**
- 8-9 out of 10 should have `sam_enriched = true`
- 0-1 might have `sec_enriched = true` (public companies are rare)
- Quality scores: 60-90
- Confidence: medium/high

**If quality looks good**, proceed to Step 4.
**If quality is bad**, let me know what errors you see.

---

### Step 4: Enrich More Companies (Optional - 10 min)

If quality looks good, enrich more:
```bash
# Enrich 100 companies
npm run enrich-companies -- 100

# Or enrich all current companies (2-3 hours)
npm run enrich-companies -- all
```

**Note**: You don't have to enrich all now. Daily cron will catch up over time.

---

## Phase 2: Set Up Daily Automation (Do After Testing)

### Option A: GitHub Actions (Recommended for Testing)

Create `.github/workflows/daily-company-update.yml`:

```yaml
name: Daily Company Update
on:
  schedule:
    - cron: '30 2 * * *'  # 2:30 AM daily (after scrapers finish)
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-companies:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run daily company update
        run: npm run update-companies:daily
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SAM_GOV_API_KEY: ${{ secrets.SAM_GOV_API_KEY }}
      
      - name: Notify on failure
        if: failure()
        run: echo "Daily update failed - check logs"
```

**Add secrets to GitHub**:
1. Go to repo Settings → Secrets → Actions
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SAM_GOV_API_KEY`

---

### Option B: Vercel Cron (For Production)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-companies",
      "schedule": "30 2 * * *"
    }
  ]
}
```

Create `app/api/cron/update-companies/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { dailyCompanyUpdate } from '@/cron/daily-company-update';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dailyCompanyUpdate();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

---

### Option C: Manual (Run Yourself Daily)

Just run this every day:
```bash
npm run update-companies:daily
```

Takes 5-15 minutes depending on how many new companies.

---

## What Happens Daily

### Automatic Workflow (2:30 AM)

```
2:00 AM  → All your contract scrapers finish
           (FPDS, DoD News, SAM.gov, Army xTech)

2:30 AM  → Daily Company Update starts
           ↓
           
Step 1   → Rebuild company stats (30 seconds)
           - Processes new contracts from last 24 hours
           - Updates existing companies with new contract data
           - Adds new companies to stats table
           
Step 2   → Enrich new companies (5-10 minutes)
           - Finds companies in stats but not in intelligence table
           - Calls SAM.gov API for business data
           - Calls SEC EDGAR for public companies
           - Usually 5-50 new companies per day
           
Step 3   → Refresh stale data (Mondays only, 2-5 minutes)
           - Updates public companies with >90 day old data
           - Gets latest SEC quarterly filings
           - Usually 20-50 companies per week

2:45 AM  → Complete! Summary logged
```

---

## Monitoring & Maintenance

### Check Daily Update Status

**In Supabase:**
```sql
-- How many companies do we have?
SELECT 
  'Companies in stats' as metric,
  COUNT(*)::text as value
FROM fpds_company_stats
UNION ALL
SELECT 
  'Companies enriched',
  COUNT(*)::text
FROM company_intelligence
UNION ALL
SELECT 
  'Enrichment rate',
  ROUND(
    (SELECT COUNT(*)::numeric FROM company_intelligence) / 
    (SELECT COUNT(*) FROM fpds_company_stats) * 100, 
    1
  )::text || '%'
FROM (SELECT 1) x;

-- Check last enrichment activity
SELECT 
  DATE(last_enriched) as date,
  COUNT(*) as companies_enriched
FROM company_intelligence
WHERE last_enriched > NOW() - INTERVAL '7 days'
GROUP BY DATE(last_enriched)
ORDER BY date DESC;

-- Check API errors
SELECT 
  api_source,
  DATE(called_at) as date,
  COUNT(*) as calls,
  COUNT(*) FILTER (WHERE success = FALSE) as errors,
  ROUND(COUNT(*) FILTER (WHERE success = FALSE)::numeric / COUNT(*) * 100, 1) as error_rate_pct
FROM company_intel_api_log
WHERE called_at > NOW() - INTERVAL '7 days'
GROUP BY api_source, DATE(called_at)
ORDER BY date DESC, api_source;
```

---

### Manual Trigger (If Daily Cron Misses)

```bash
# Run manually anytime
npm run update-companies:daily
```

---

## Expected Growth Over Time

| Day | FPDS Contracts | Companies | Enriched | Enrichment % |
|-----|----------------|-----------|----------|--------------|
| 1 (Today) | 47,429 | 3,000 | 100 | 3% |
| 2 | 47,650 | 3,015 | 615 | 20% |
| 3 | 47,850 | 3,025 | 1,125 | 37% |
| 7 | 48,500 | 3,080 | 2,580 | 84% |
| 14 | 49,800 | 3,150 | 3,150 | 100% |

**After ~2 weeks**: All historical companies enriched

**Ongoing**: 5-50 new companies enriched daily as scrapers find them

---

## Costs

| Service | Rate Limit | Daily Usage | Cost |
|---------|------------|-------------|------|
| SAM.gov Entity API | 10,000/day | 50-500 calls | $0 |
| SEC EDGAR | 10/second | 5-50 calls | $0 |
| **Total** | - | - | **$0/day** |

No costs, no limits (within rate limits).

---

## Troubleshooting

### "No companies found to enrich"
- Check: `SELECT COUNT(*) FROM fpds_company_stats;`
- If 0: Run `DIAGNOSE_AND_FIX_VALUES.sql` first

### "SAM.gov API errors"
- Check API key: `echo $SAM_GOV_API_KEY`
- Check rate limit: You get 10,000 calls/day
- Check logs: `SELECT * FROM company_intel_api_log WHERE success = FALSE LIMIT 20;`

### "Companies still showing $0 values"
- Your FPDS contracts may not have financial data populated yet
- Wait for FPDS scraper to continue
- Re-run `DIAGNOSE_AND_FIX_VALUES.sql` periodically

### "Enrichment is slow"
- Normal: Takes ~1-2 seconds per company
- 100 companies = 2-3 minutes
- 500 companies = 10-15 minutes
- This is rate-limited to respect API limits

---

## Summary

### Today (15 minutes)
1. ✅ Run `create_rebuild_company_stats_function.sql` in Supabase
2. ✅ Run `DIAGNOSE_AND_FIX_VALUES.sql` in Supabase
3. ✅ Test: `npm run enrich-companies -- 10`
4. ✅ Verify quality looks good
5. ✅ Optional: Enrich more companies

### This Week (30 minutes)
1. Set up GitHub Actions cron (or Vercel cron)
2. Add environment secrets
3. Test manual trigger: `npm run update-companies:daily`
4. Verify it runs automatically tomorrow

### Ongoing (Automatic)
- Daily at 2:30 AM: Rebuild stats + enrich new companies
- Weekly on Monday: Refresh public company data
- No manual work needed
- Check status occasionally

---

## Quick Commands Reference

```bash
# Test enrichment
npm run enrich-companies -- 10

# Enrich more companies
npm run enrich-companies -- 100

# Full daily update (rebuild + enrich)
npm run update-companies:daily

# Check status
# (Run SQL queries in Supabase - see "Monitoring" section above)
```

---

**Ready?** Start with Step 1: Run `create_rebuild_company_stats_function.sql` in Supabase!

