# Test SAM.gov Scraper NOW - Quick Commands

Quick reference for testing the SAM.gov scraper with your two API keys.

---

## 1. Check Environment Variables

```bash
# Make sure you have API keys set
cat .env.local | grep SAM_GOV
```

**Expected output:**
```
SAM_GOV_API_KEY=SAM-dafe1914-cd36-489d-ae93-c332b6e4df2c
SAM_GOV_API_KEY_2=SAM-your-second-key-here
```

If missing, add them to `.env.local`:
```bash
echo "SAM_GOV_API_KEY=SAM-your-first-key" >> .env.local
echo "SAM_GOV_API_KEY_2=SAM-your-second-key" >> .env.local
```

---

## 2. Run Comprehensive Test Script

This tests everything: API connection, scraping, data quality, and quota.

```bash
npx tsx test-sam-gov-scraper.ts
```

**What it does:**
- ✅ Tests API connection with both keys
- ✅ Scrapes yesterday's opportunities (full details)
- ✅ Verifies data completeness (descriptions, contacts, attachments)
- ✅ Checks API quota health
- ✅ Shows quality score

**Takes:** ~5 minutes  
**API calls used:** ~50-200 (depends on yesterday's volume)

---

## 3. Manual Scraping Tests

### Test Today's Data
```bash
# Scrape today's opportunities with full details
npx tsx scrape-sam-gov-opportunities.ts --days=0 --full-details
```

### Test Yesterday's Data
```bash
# Scrape yesterday's opportunities (what the cron job does)
npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details
```

### Test Last 3 Days (Full Cron Job Simulation)
```bash
# This is exactly what runs at 12:30 PM UTC daily
npx tsx scrape-sam-gov-opportunities.ts --days=3 --full-details
```

### Test Specific Date Range
```bash
# Scrape specific dates
npx tsx scrape-sam-gov-opportunities.ts \
  --from=11/01/2025 \
  --to=11/03/2025 \
  --full-details
```

---

## 4. Verify Data in Supabase

After running the scraper, check the data:

```sql
-- 1. How many opportunities do we have?
SELECT COUNT(*) as total FROM sam_gov_opportunities;

-- 2. Data from today/yesterday
SELECT 
  DATE(posted_date) as posted_date,
  COUNT(*) as count
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY DATE(posted_date)
ORDER BY posted_date DESC;

-- 3. Check data quality
SELECT 
  data_source,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sam_gov_opportunities
GROUP BY data_source;

-- Should show mostly 'sam.gov-api-full' if using --full-details

-- 4. Sample recent record
SELECT 
  notice_id,
  title,
  LENGTH(description) as desc_length,
  CASE WHEN primary_contact IS NOT NULL THEN 'Yes' ELSE 'No' END as has_contact,
  CASE WHEN attachments IS NOT NULL THEN 'Yes' ELSE 'No' END as has_attachments,
  data_source
FROM sam_gov_opportunities
ORDER BY last_scraped DESC
LIMIT 5;
```

---

## 5. Test API Key Rotation

If you have two API keys, test that rotation works:

```bash
# The scraper will automatically use key 2 if key 1 hits rate limit
# You'll see in the logs:
# [SAM.gov] Initialized with 2 API key(s)
# [SAM.gov] Rate limit hit (429). Attempting API key rotation...
# [SAM.gov] Rotated to API key 2/2

npx tsx test-sam-gov-scraper.ts
```

---

## 6. Test the Cron Job Endpoint

Test the actual cron endpoint (requires CRON_SECRET):

```bash
# Get your CRON_SECRET from .env.local
grep CRON_SECRET .env.local

# Test locally (if running dev server)
curl http://localhost:3000/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test production (Vercel)
curl https://prop-shop.ai/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "message": "SAM.gov opportunities scraped for 11/03/2025, 11/02/2025, 11/01/2025",
  "dates_checked": ["11/03/2025", "11/02/2025", "11/01/2025"],
  "mode": "full-details",
  "stats": {
    "total_opportunities": 650,
    "new_updated": 127,
    "rate_limited": false
  },
  "duration_seconds": 134
}
```

---

## 7. Check Data Quality Score

Run the comprehensive SQL quality check:

```sql
-- File: VERIFY_SAM_GOV_DATA_QUALITY.sql
-- Run query #18 (Quality Score Calculation)

WITH quality_metrics AS (
  SELECT 
    COUNT(*) as total,
    COUNT(notice_id)::float / COUNT(*) as notice_id_score,
    COUNT(title)::float / COUNT(*) as title_score,
    COUNT(CASE WHEN description IS NOT NULL AND description NOT LIKE 'https://api.sam.gov%' AND LENGTH(description) > 50 THEN 1 END)::float / COUNT(*) as description_score,
    COUNT(posted_date)::float / COUNT(*) as posted_date_score,
    COUNT(ui_link)::float / COUNT(*) as ui_link_score,
    COUNT(primary_contact)::float / COUNT(*) as contact_score,
    COUNT(attachments)::float / COUNT(*) as attachments_score
  FROM sam_gov_opportunities
)
SELECT 
  total as total_records,
  ROUND((notice_id_score + title_score + description_score + posted_date_score + ui_link_score) / 5 * 100, 2) as required_fields_score,
  ROUND((contact_score + attachments_score) / 2 * 100, 2) as optional_fields_score,
  ROUND(((notice_id_score + title_score + description_score + posted_date_score + ui_link_score + contact_score + attachments_score) / 7) * 100, 2) as overall_quality_score
FROM quality_metrics;
```

**Target:** overall_quality_score > 90%

---

## 8. Verify Cron Job Schedule

Check that the cron job is configured:

```bash
# View vercel.json
cat vercel.json | grep -A 3 "scrape-sam-gov"
```

**Expected:**
```json
{
  "path": "/api/cron/scrape-sam-gov",
  "schedule": "30 12 * * *"
}
```

**Schedule:** Daily at 12:30 PM UTC (8:30 AM EST)

---

## Quick Test Sequence (5 minutes)

Run these commands in order:

```bash
# 1. Check env vars
cat .env.local | grep SAM_GOV

# 2. Run test script
npx tsx test-sam-gov-scraper.ts

# 3. Check Supabase
# Open Supabase SQL Editor and run:
# SELECT COUNT(*) FROM sam_gov_opportunities;

# 4. If all good, the cron job is ready!
echo "✅ Setup complete! Cron job runs daily at 12:30 PM UTC"
```

---

## Expected Test Results

### ✅ Successful Test

```
╔════════════════════════════════════════════════════════════╗
║          SAM.gov Scraper Testing & Verification            ║
╚════════════════════════════════════════════════════════════╝

STEP 1: Testing SAM.gov API Connection
API Key: SAM-dafe1914...
Response Status: 200 OK
Total Records Available: 127
API Connection: SUCCESS

STEP 2: Testing Scraping for Today and Previous Day
Today: 11/04/2025
Yesterday: 11/03/2025

Scraping yesterday's opportunities (FULL DETAILS MODE)...
[SAM.gov] Found 127 opportunities
[SAM.gov] Fetching full details for 127 opportunities...
[SAM.gov] ✅ Linked 23 opportunities to FPDS contracts

Records in database AFTER scraping: 650
NEW/UPDATED records: 127

STEP 3: Verifying Data Quality and Completeness
Analyzing 10 most recent records...

Field Completeness Analysis:
✅ notice_id                    10/10 (100%) [REQUIRED]
✅ title                        10/10 (100%) [REQUIRED]
✅ description                  10/10 (100%) [REQUIRED]
✅ posted_date                  10/10 (100%) [REQUIRED]
✅ ui_link                      10/10 (100%) [REQUIRED]
✅ primary_contact               9/10 (90%) [OPTIONAL]
✅ attachments                   8/10 (80%) [OPTIONAL]

Data Source Distribution:
sam.gov-api-full: 10

Quality Score: 98% (Required fields filled)
✅ EXCELLENT - Data is complete and rich

STEP 4: Checking API Quota Status
✅ Request 1: OK
✅ Request 2: OK
✅ Request 3: OK
✅ Request 4: OK
✅ Request 5: OK

✅ Successfully made 5 requests without rate limiting
API quota appears healthy

FINAL TEST SUMMARY
✅ API Connection
✅ Scraping Functionality
✅ Data Quality
✅ API Quota Health

✅ ALL TESTS PASSED! Scraper is ready for production.
```

---

## Troubleshooting

### "Missing SAM_GOV_API_KEY"
```bash
# Add to .env.local
echo "SAM_GOV_API_KEY=SAM-your-key-here" >> .env.local
```

### Rate Limit (429) Errors
```bash
# Add second API key
echo "SAM_GOV_API_KEY_2=SAM-your-second-key" >> .env.local

# Or wait until midnight UTC for quota reset
```

### Low Quality Score (<80%)
```bash
# Re-scrape with --full-details
npx tsx scrape-sam-gov-opportunities.ts --days=7 --full-details
```

### Descriptions are API links
```bash
# You scraped in fast mode - re-scrape with full details
npx tsx scrape-sam-gov-opportunities.ts --days=7 --full-details
```

---

## Next Steps

1. **Run the test:**
   ```bash
   npx tsx test-sam-gov-scraper.ts
   ```

2. **Verify quality in Supabase:**
   - Run queries from `VERIFY_SAM_GOV_DATA_QUALITY.sql`

3. **If tests pass:**
   - Cron job is ready to run automatically
   - Daily at 12:30 PM UTC (8:30 AM EST)
   - You'll get email notifications

4. **Deploy to Vercel:**
   - Add API keys to Vercel environment variables
   - Push to GitHub
   - Vercel auto-deploys with cron job

---

**Your SAM.gov scraper is ready! 🚀**

