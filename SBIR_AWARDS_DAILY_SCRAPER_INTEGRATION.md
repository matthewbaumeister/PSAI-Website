# SBIR Awards Daily Scraper Integration

## 🔄 IMPORTANT: Daily Updates Required

**Just like the DSIP scraper runs daily to update opportunity data, the SBA awards data MUST also be updated daily.**

---

## Why Daily Updates Are Critical

### **1. New Awards Announced Daily**
- Agencies announce new Phase I and Phase II awards regularly
- Winners are typically posted within 30-60 days after solicitation closes
- Missing recent awards = incomplete competitive intelligence

### **2. Data Synchronization**
- Opportunity data updates daily (DSIP scraper)
- Awards data must stay in sync
- Users expect up-to-date information

### **3. Competitive Analysis**
- Proposers check recent winners before submitting
- Historical patterns change as new awards are added
- Real-time data = better decision making

---

## Integration Plan

### **Phase 1: Initial Bulk Load (One-Time)**

**What:** Import historical data (2020-2024)
**When:** When data arrives from SBIR.gov support
**How:** `npx ts-node src/scripts/import-sbir-awards-bulk.ts`
**Result:** ~60,000+ historical awards in database

---

### **Phase 2: Daily Incremental Updates (Ongoing)**

**What:** Fetch and import new awards daily
**When:** Every day at 3:00 AM ET (after DSIP scraper at 2:00 AM)
**How:** Create dedicated scraper script
**Result:** Always current award data

---

## Implementation Details

### **Daily Scraper Script:**

**File:** `src/scripts/daily-awards-scraper.ts`

**Logic:**
1. **Check last scrape date** from `sbir_awards_scraper_log`
2. **Calculate date range** (last scrape → today)
3. **For each agency** (DOD, NASA, NIH, etc.):
   - Query SBIR.gov API for recent awards
   - Filter by `award_date >= last_scrape_date`
   - Fetch only new/updated records
4. **Normalize and insert** new awards
5. **Update topic summaries** (aggregate statistics)
6. **Update company profiles** (recalculate stats)
7. **Log the run** in `sbir_awards_scraper_log`

**Estimated Runtime:** 5-15 minutes
**API Calls:** ~11 agencies × 1-2 requests = ~20 API calls
**Rate Limiting:** 500ms delay between requests

---

### **Cron Job Configuration:**

**Add to Vercel Cron:**

```json
{
  "crons": [
    {
      "path": "/api/cron/dsip-scraper",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/awards-scraper",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Order:**
1. DSIP scraper runs at 2:00 AM (updates opportunities)
2. Awards scraper runs at 3:00 AM (updates awards)
3. Ensures data consistency

---

### **API Endpoint:**

**File:** `src/app/api/cron/awards-scraper/route.ts`

**Functionality:**
- Verify cron authentication (Vercel secret)
- Call daily scraper function
- Return success/failure status
- Log to database

---

## Data Aggregation Tasks

### **1. Update Topic Awards Summary**

After importing new awards:

```sql
-- Update sbir_topic_awards_summary table
INSERT INTO sbir_topic_awards_summary (
  topic_number,
  total_awards,
  total_funding,
  phase_1_awards,
  phase_2_awards,
  winners
)
SELECT 
  topic_number,
  COUNT(*) as total_awards,
  SUM(award_amount) as total_funding,
  COUNT(*) FILTER (WHERE phase = 'Phase I') as phase_1_awards,
  COUNT(*) FILTER (WHERE phase = 'Phase II') as phase_2_awards,
  json_agg(json_build_object(
    'company', company,
    'phase', phase,
    'award_amount', award_amount,
    'year', award_year
  )) as winners
FROM sbir_awards
WHERE topic_number IS NOT NULL
GROUP BY topic_number
ON CONFLICT (topic_number) DO UPDATE SET
  total_awards = EXCLUDED.total_awards,
  total_funding = EXCLUDED.total_funding,
  phase_1_awards = EXCLUDED.phase_1_awards,
  phase_2_awards = EXCLUDED.phase_2_awards,
  winners = EXCLUDED.winners,
  last_computed = NOW();
```

### **2. Update Company Profiles**

After importing new awards:

```sql
-- Update sbir_companies table
INSERT INTO sbir_companies (
  company_name,
  total_awards,
  total_funding,
  phase_1_count,
  phase_2_count,
  first_award_year,
  most_recent_award_year
)
SELECT 
  company,
  COUNT(*) as total_awards,
  SUM(award_amount) as total_funding,
  COUNT(*) FILTER (WHERE phase = 'Phase I') as phase_1_count,
  COUNT(*) FILTER (WHERE phase = 'Phase II') as phase_2_count,
  MIN(award_year) as first_award_year,
  MAX(award_year) as most_recent_award_year
FROM sbir_awards
WHERE company IS NOT NULL
GROUP BY company
ON CONFLICT (company_name) DO UPDATE SET
  total_awards = EXCLUDED.total_awards,
  total_funding = EXCLUDED.total_funding,
  phase_1_count = EXCLUDED.phase_1_count,
  phase_2_count = EXCLUDED.phase_2_count,
  first_award_year = EXCLUDED.first_award_year,
  most_recent_award_year = EXCLUDED.most_recent_award_year,
  updated_at = NOW();
```

### **3. Update sbir_final Table**

Link awards to opportunities:

```sql
-- Update sbir_final with award statistics
UPDATE sbir_final sf
SET 
  has_awards = CASE WHEN tas.total_awards > 0 THEN true ELSE false END,
  total_awards = tas.total_awards,
  total_award_funding = tas.total_funding,
  award_winners = (
    SELECT array_agg(DISTINCT company)
    FROM sbir_awards
    WHERE topic_number = sf.topic_number
  ),
  last_award_date = (
    SELECT MAX(award_date)
    FROM sbir_awards
    WHERE topic_number = sf.topic_number
  )
FROM sbir_topic_awards_summary tas
WHERE sf.topic_number = tas.topic_number;
```

---

## Monitoring & Alerts

### **Success Metrics:**

- **Daily run completion** (check logs)
- **New awards imported** (track count)
- **Zero errors** (or < 5% error rate)
- **Runtime < 15 minutes**

### **Alert Conditions:**

- ⚠️ **Scraper fails 2+ days in row** → Email alert
- ⚠️ **No new awards for 7+ days** → Review API access
- ⚠️ **Error rate > 10%** → Check data quality
- ⚠️ **Runtime > 30 minutes** → Optimize queries

### **Dashboard Metrics:**

Display on `/admin/dashboard`:
- Last scraper run time
- Awards imported today
- Total awards in database
- Recent errors (if any)

---

## API Status Dependency

### **Current Status:**

SBIR.gov API is under maintenance → Using bulk data files

### **When API Returns:**

1. **Switch to daily scraper** (automated)
2. **Remove manual import** (one-time bulk load only)
3. **Enable cron job** (daily at 3:00 AM)

### **Fallback Plan:**

If API remains down:
- Contact SBIR support weekly for fresh data
- Manual import new awards (weekly/monthly)
- Document manual process

---

## Testing Plan

### **Before Production:**

1. **Test with sample data** (10 records)
2. **Test with larger dataset** (1,000 records)
3. **Test aggregation queries** (topic summaries, company profiles)
4. **Test daily scraper** (run manually, verify results)
5. **Test cron job** (schedule for test time, verify execution)

### **After Production:**

1. **Monitor first 7 days** (check logs daily)
2. **Verify data accuracy** (spot-check random awards)
3. **Check UI display** (awards show correctly on pages)
4. **Measure performance** (page load times with awards data)

---

## Cost Estimates

### **API Calls:**

- **Daily scraper:** ~20 API calls/day
- **Monthly:** ~600 API calls
- **Cost:** FREE (SBIR.gov API is public domain)

### **Database Storage:**

- **Current awards:** ~200,000 records
- **Growth rate:** ~5,000 new awards/year
- **Storage:** ~500 MB (current), ~25 MB/year growth
- **Cost:** Included in Supabase free tier

### **Compute:**

- **Daily scraper:** 5-15 minutes/day
- **Vercel serverless:** Included in Pro plan
- **Cost:** $0 (within limits)

**Total Monthly Cost:** $0 (within free/pro tier limits)

---

## Summary

### **Key Requirements:**

- ✅ Daily scraper (like DSIP scraper)
- ✅ Runs at 3:00 AM ET (after DSIP at 2:00 AM)
- ✅ Updates awards, topics, companies
- ✅ Logs every run
- ✅ Alerts on failures

### **Implementation Timeline:**

- **Week 1:** Bulk import (one-time, when data arrives)
- **Week 2:** Build daily scraper script
- **Week 3:** Create cron job + API endpoint
- **Week 4:** Testing + monitoring
- **Week 5:** Production deployment

### **Dependencies:**

- ⏳ SBIR.gov API restoration (currently under maintenance)
- ✅ Bulk data from support (when received)
- ✅ Database tables (already created)
- ✅ Import script (already created)

---

## Next Steps

**When awards data arrives:**

1. ✅ Run bulk import script
2. ✅ Verify data in Supabase
3. ✅ Build daily scraper script
4. ✅ Create cron job
5. ✅ Test and deploy

**Status:** Ready to proceed when data arrives

---

**REMINDER:** This is a CRITICAL feature - awards data MUST be updated daily, just like opportunities data. Plan for this from the start!

