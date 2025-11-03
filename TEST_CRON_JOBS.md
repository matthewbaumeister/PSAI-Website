# Test Cron Jobs Manually

Step-by-step guide to test each scraper and verify they work.

---

## Prerequisites

1. ✅ Vercel deployment succeeded
2. ✅ Added `CRON_SECRET` to Vercel
3. ✅ Added `CRON_NOTIFICATION_EMAIL` to Vercel
4. ✅ Run scraper tracking migration in Supabase

---

## Setup: Run Migration First

In **Supabase SQL Editor**, run this file:
```
supabase/migrations/create_scraper_runs_tracker.sql
```

This creates:
- `scraper_runs` table to track all runs
- Helper functions to log runs
- Views for easy monitoring

---

## Test 1: DSIP Scraper

### Step 1: Find Your Vercel URL

Go to Vercel → Your Project → Domains

Example URLs:
- `https://psai-website-git-main-matt-baumeisters-projects.vercel.app`
- `https://propshop.ai` (if you have custom domain)

### Step 2: Run the Scraper

```bash
curl https://YOUR-VERCEL-URL.vercel.app/api/cron/scrape-dsip \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec" \
  -H "Content-Type: application/json" \
  -X POST \
  -v
```

**Replace `YOUR-VERCEL-URL` with your actual URL!**

### Step 3: Check the Response

You should see:
```json
{
  "success": true,
  "message": "DSIP opportunities scraped",
  "date": "2025-11-03",
  "stats": {
    "total_active": 245,
    "new": 12,
    "processed": 32614,
    "errors": 0
  }
}
```

### Step 4: Check Your Email

Within 1-2 minutes, you should receive:
```
Subject: ✅ DSIP Opportunities Scraper Completed Successfully

📊 Statistics:
• Total Active Opportunities: 245
• New Opportunities: 12
• Total Processed: 32,614
• With Full Details: 245
• Errors: 0
```

### Step 5: Check Supabase

Run in **Supabase SQL Editor**:

```sql
-- Check DSIP data
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(*) FILTER (WHERE topic_status = 'Active') as active,
  MAX(last_scraped) as last_update
FROM dsip_opportunities;

-- Check scraper run log
SELECT * FROM scraper_runs
WHERE scraper_name = 'dsip'
ORDER BY started_at DESC
LIMIT 1;
```

---

## Test 2: SAM.gov Scraper

```bash
curl https://YOUR-VERCEL-URL.vercel.app/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec" \
  -H "Content-Type: application/json" \
  -X POST \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SAM.gov opportunities scraped for 11/02/2025",
  "date": "11/02/2025",
  "mode": "full-details",
  "stats": {
    "total": 650,
    "inserted": 127
  }
}
```

**Check Supabase:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE DATE(posted_date) = CURRENT_DATE - 1) as yesterday,
  COUNT(*) FILTER (WHERE data_source = 'sam.gov-api-full') as with_full_details
FROM sam_gov_opportunities;
```

---

## Test 3: FPDS Scraper

```bash
curl https://YOUR-VERCEL-URL.vercel.app/api/cron/scrape-fpds \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec" \
  -H "Content-Type: application/json" \
  -X POST \
  -v
```

**⚠️ Warning:** This one takes longer (10-30 minutes) because it scrapes 500-2000 contracts.

**Expected Response:**
```json
{
  "success": true,
  "message": "FPDS contracts scraped for 2025-11-02",
  "date": "2025-11-02",
  "stats": {
    "total": 16459,
    "new": 1234
  }
}
```

**Check Supabase:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE DATE(last_modified_date) = CURRENT_DATE - 1) as yesterday,
  MAX(last_scraped) as last_update
FROM fpds_contracts;
```

---

## Test 4: DoD News Scraper

```bash
curl https://YOUR-VERCEL-URL.vercel.app/api/cron/scrape-dod-news \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec" \
  -H "Content-Type: application/json" \
  -X POST \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "DoD contract news scraped for 2025-11-02",
  "date": "2025-11-02",
  "stats": {
    "total": 12342,
    "new": 127,
    "articles": 15
  }
}
```

**Check Supabase:**
```sql
SELECT 
  COUNT(*) as total_contracts,
  COUNT(DISTINCT article_url) as articles,
  COUNT(*) FILTER (WHERE DATE(published_date) = CURRENT_DATE - 1) as yesterday
FROM dod_contract_news;
```

---

## Monitor All Scrapers

### Quick Status Check

Run in **Supabase SQL Editor**:
```
CHECK_SCRAPER_RUNS.sql
```

This shows:
- ✅ Latest status for all scrapers
- 📊 Statistics (last 30 days)
- 🔍 Recent runs
- ❌ Recent failures
- 📈 Success rates

### Key Queries

**Latest run for each scraper:**
```sql
SELECT * FROM latest_scraper_runs;
```

**Today's runs:**
```sql
SELECT * FROM todays_scraper_runs;
```

**Recent failures:**
```sql
SELECT * FROM recent_failed_runs;
```

**Success rate:**
```sql
SELECT 
  scraper_name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 1) as success_pct
FROM scraper_runs
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY scraper_name;
```

---

## Troubleshooting

### Error: 401 Unauthorized

**Problem:** Wrong `CRON_SECRET`

**Fix:** Check that the secret in Vercel matches your curl command

### Error: 500 Internal Server Error

**Problem:** Scraper error (check logs)

**Fix:** View Vercel logs:
1. Vercel → Your Project
2. Functions → Filter by `/api/cron/`
3. View error details

### No Email Received

**Problem:** SendGrid not configured or wrong email

**Fix:** 
1. Check `CRON_NOTIFICATION_EMAIL` in Vercel
2. Check spam folder
3. Verify SendGrid API key is valid

### Scraper Takes Too Long

**Problem:** Timeout (Vercel Pro has 5-minute limit)

**Expected durations:**
- DSIP: 2-5 minutes
- SAM.gov: 1-3 minutes
- DoD: 5-15 minutes
- FPDS: 10-30 minutes

**Fix:** FPDS is the longest. If it times out, you may need to:
- Run it manually via terminal instead
- Or upgrade Vercel plan for longer timeouts

---

## Daily Automated Schedule

Once testing works, these will run automatically:

| Time (EST) | Scraper | What Happens |
|-----------|---------|-------------|
| 8:00 AM | FPDS | Scrapes yesterday's contracts |
| 8:15 AM | DoD | Scrapes yesterday's announcements |
| 8:30 AM | SAM.gov | Scrapes yesterday's opportunities |
| 8:45 AM | DSIP | Scrapes active SBIR/STTR |

You'll get 4 emails every morning! ☕

---

## Summary

✅ **Test each scraper** using curl commands  
✅ **Check email** for notifications  
✅ **Check Supabase** for data  
✅ **Monitor with** `CHECK_SCRAPER_RUNS.sql`  
✅ **View logs** in Vercel Functions tab  

**Everything tracked automatically!** 📊

