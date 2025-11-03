# Vercel Cron Jobs Setup Guide

Automated daily scraping for SAM.gov, FPDS, and DoD contract news on Vercel.

---

## Overview

Three cron jobs run automatically every day:

| Job | Time (UTC) | Time (EST) | Time (PST) | Purpose |
|-----|-----------|------------|------------|---------|
| **FPDS** | 3:00 AM | 11:00 PM (prev day) | 8:00 PM (prev day) | Yesterday's contract awards |
| **DoD News** | 4:00 AM | 12:00 AM (midnight) | 9:00 PM (prev day) | Yesterday's DoD announcements |
| **SAM.gov** | 6:00 AM | 2:00 AM | 11:00 PM (prev day) | Yesterday's opportunities (full details) |

---

## Setup Steps

### 1. Add Cron Secret to Vercel

In your Vercel project:

1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Key:** `CRON_SECRET`
   - **Value:** Generate a secure random string (e.g., `openssl rand -hex 32`)
   - **Environment:** Production, Preview, Development

```bash
# Generate a secure secret
openssl rand -hex 32
```

Example:
```
CRON_SECRET=8f9d2e1a6b3c4f7e9a2d5c8b1e4a7d0f3c6b9e2a5d8c1f4b7e0a3d6c9f2e5b8
```

### 2. Add to Local `.env`

```bash
echo "CRON_SECRET=your-secret-here" >> .env
```

### 3. Deploy to Vercel

```bash
git push origin main
```

Vercel will automatically:
- Read `vercel.json` cron configuration
- Schedule the cron jobs
- Run them at the specified times

---

## Cron Schedule (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-sam-gov",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/scrape-fpds",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/scrape-dod-news",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Cron Syntax

```
 ┌─────────── minute (0 - 59)
 │ ┌───────── hour (0 - 23)
 │ │ ┌─────── day of month (1 - 31)
 │ │ │ ┌───── month (1 - 12)
 │ │ │ │ ┌─── day of week (0 - 6) (Sunday to Saturday)
 │ │ │ │ │
 │ │ │ │ │
 * * * * *
```

Examples:
- `0 6 * * *` = Every day at 6:00 AM UTC
- `0 */4 * * *` = Every 4 hours
- `0 12 * * 1` = Every Monday at noon

---

## Manual Testing

### Test Locally

```bash
# SAM.gov scraper
curl http://localhost:3000/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer your-cron-secret"

# FPDS scraper
curl http://localhost:3000/api/cron/scrape-fpds \
  -H "Authorization: Bearer your-cron-secret"

# DoD news scraper
curl http://localhost:3000/api/cron/scrape-dod-news \
  -H "Authorization: Bearer your-cron-secret"
```

### Test on Vercel (Production)

```bash
# SAM.gov scraper
curl https://your-app.vercel.app/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer your-cron-secret"

# FPDS scraper
curl https://your-app.vercel.app/api/cron/scrape-fpds \
  -H "Authorization: Bearer your-cron-secret"

# DoD news scraper
curl https://your-app.vercel.app/api/cron/scrape-dod-news \
  -H "Authorization: Bearer your-cron-secret"
```

---

## What Each Cron Job Does

### 1. SAM.gov Opportunities (`/api/cron/scrape-sam-gov`)

**Runs:** 6 AM UTC (2 AM EST)

**Actions:**
- Scrapes yesterday's SAM.gov opportunities
- Uses **full-details mode** (complete descriptions, all attachments)
- Links opportunities to FPDS contracts
- Typically 50-200 opportunities per day

**API Usage:**
- ~50-200 API calls per day
- Well within SAM.gov's 1,000 daily limit

**Response:**
```json
{
  "success": true,
  "message": "SAM.gov opportunities scraped for 11/02/2025",
  "date": "11/02/2025",
  "mode": "full-details"
}
```

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "SAM.gov API daily quota reached. Will retry tomorrow.",
  "nextAttempt": "Next day at 6 AM UTC"
}
```

---

### 2. FPDS Contracts (`/api/cron/scrape-fpds`)

**Runs:** 3 AM UTC (11 PM EST previous day)

**Actions:**
- Scrapes yesterday's FPDS contract awards
- Uses the robust page-level scraper
- Auto-retries failed contracts
- Typically 500-2,000 contracts per day

**Response:**
```json
{
  "success": true,
  "message": "FPDS contracts scraped for 2025-11-02",
  "date": "2025-11-02",
  "output": "✅ Completed: 1,234 contracts"
}
```

---

### 3. DoD Contract News (`/api/cron/scrape-dod-news`)

**Runs:** 4 AM UTC (12 AM EST / midnight)

**Actions:**
- Scrapes yesterday's DoD contract announcements
- Article-level scraping with smart resume
- Parses all contracts from announcements
- Typically 5-20 articles per day

**Response:**
```json
{
  "success": true,
  "message": "DoD contract news scraped for 2025-11-02",
  "date": "2025-11-02",
  "output": "✅ Processed 15 articles"
}
```

---

## Monitoring

### Check Cron Job Logs

In Vercel:
1. Go to your project
2. Click **Deployments** → Select latest deployment
3. Click **Functions** → Filter by `/api/cron/`
4. View logs for each cron execution

### Check Database

Run in Supabase SQL Editor:

```sql
-- SAM.gov: Check today's opportunities
SELECT 
  COUNT(*) as opportunities_today,
  MIN(posted_date) as earliest,
  MAX(posted_date) as latest
FROM sam_gov_opportunities
WHERE DATE(posted_date) = CURRENT_DATE - INTERVAL '1 day';

-- FPDS: Check today's contracts
SELECT 
  DATE(last_scraped) as date,
  COUNT(*) as contracts,
  COUNT(DISTINCT vendor_name) as vendors
FROM fpds_contracts
WHERE DATE(last_scraped) = CURRENT_DATE
GROUP BY DATE(last_scraped);

-- DoD: Check today's announcements
SELECT 
  DATE(published_date) as date,
  COUNT(DISTINCT article_url) as articles,
  COUNT(*) as contracts
FROM dod_contract_news
WHERE DATE(published_date) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(published_date);
```

---

## Troubleshooting

### Cron Job Not Running

**Check:**
1. Is `vercel.json` in the root directory?
2. Did you deploy after adding `vercel.json`?
3. Is `CRON_SECRET` set in Vercel environment variables?

**View scheduled crons:**
```bash
vercel crons ls
```

### 401 Unauthorized Error

**Cause:** `CRON_SECRET` mismatch

**Fix:**
1. Make sure `CRON_SECRET` is set in Vercel
2. Redeploy the app
3. Wait 5 minutes for Vercel to register the cron

### 429 Rate Limit (SAM.gov)

**This is normal!** If you've been scraping manually during the day, the daily quota might be reached.

**Solution:**
- Cron will automatically retry tomorrow
- Avoid manual scraping on days when cron is active
- Or use fast mode for manual scraping: `--days=7` (without `--full-details`)

### Timeout Error

**Cause:** Scraper took too long (>10 seconds on Hobby plan, >5 minutes on Pro)

**Solutions:**
1. Upgrade to Vercel Pro (longer function timeout)
2. Use incremental scraping (1 day at a time)
3. For FPDS, use the page-level scraper (most reliable)

### Missing Data

**Check if cron ran:**
```bash
# In Vercel, check function logs
# Or query database
```

**Manual backfill:**
```bash
# If a day was missed, run manually
npx tsx scrape-sam-gov-opportunities.ts --from=2025-11-02 --to=2025-11-02 --full-details
npx tsx src/scripts/fpds-page-level-scraper.ts --from=2025-11-02 --to=2025-11-02
npx tsx scrape-dod-production.ts 2025-11-02 2025-11-02
```

---

## Cost Considerations

### Vercel Pricing

**Hobby Plan (Free):**
- ❌ Cron jobs **NOT included**
- Need Pro plan for cron

**Pro Plan ($20/month):**
- ✅ Unlimited cron jobs
- ✅ 1,000 GB-hours function execution
- ✅ 100 GB bandwidth

### Expected Usage

| Resource | Monthly Usage | Pro Plan Limit | Cost |
|----------|--------------|----------------|------|
| Cron executions | ~90 (3 per day × 30) | Unlimited | Included |
| Function time | ~15-30 minutes/day | 1,000 GB-hours | Included |
| Bandwidth | Minimal | 100 GB | Included |

**Total:** $20/month (Pro plan)

---

## Alternative: Run Cron Jobs Elsewhere

If you don't want to pay for Vercel Pro:

### Option 1: GitHub Actions (Free)

Create `.github/workflows/daily-scraper.yml`:

```yaml
name: Daily Scrapers

on:
  schedule:
    - cron: '0 6 * * *'  # SAM.gov at 6 AM UTC
    - cron: '0 3 * * *'  # FPDS at 3 AM UTC
    - cron: '0 4 * * *'  # DoD at 4 AM UTC

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
          SAM_GOV_API_KEY: ${{ secrets.SAM_GOV_KEY }}
```

### Option 2: Railway (Free Tier)

Railway has cron jobs on free tier. Similar setup to Vercel.

### Option 3: Your Own Server

```bash
# Add to crontab
0 6 * * * cd /path/to/PropShop_AI_Website && npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details
0 3 * * * cd /path/to/PropShop_AI_Website && npx tsx src/scripts/fpds-page-level-scraper.ts --from=$(date -d yesterday +\%Y-\%m-\%d) --to=$(date -d yesterday +\%Y-\%m-\%d)
0 4 * * * cd /path/to/PropShop_AI_Website && npx tsx scrape-dod-production.ts $(date -d yesterday +\%Y-\%m-\%d) $(date -d yesterday +\%Y-\%m-\%d)
```

---

## Best Practices

1. **Monitor daily** (first week)
   - Check logs in Vercel
   - Verify data in Supabase
   - Watch for errors

2. **Set up alerts**
   - Use Vercel's error notifications
   - Or create a monitoring endpoint

3. **Backup strategy**
   - Cron jobs have auto-retry (Vercel retries 3x)
   - Manual backfill if needed
   - Database has full history

4. **Rate limit management**
   - Don't manually scrape SAM.gov on cron days
   - Or use fast mode for manual scraping
   - FPDS and DoD have no daily limits

---

## Summary

✅ **Fully automated** - No manual intervention needed  
✅ **Reliable** - Runs every day at the same time  
✅ **Complete data** - Full details for SAM.gov  
✅ **Cost-effective** - $20/month for everything automated  
✅ **Monitorable** - Vercel logs + Supabase data checks  

**Next Steps:**
1. Deploy to Vercel
2. Set `CRON_SECRET` in Vercel environment
3. Wait for first cron execution (6 AM UTC tomorrow)
4. Check logs and database

Your contract data will now update automatically every single day! 🎉

