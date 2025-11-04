# SAM.gov Daily Scraper Setup & Testing Guide

Complete guide for setting up and testing the SAM.gov contract opportunities daily scraper with dual API key support.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Setup](#environment-setup)
3. [Testing the Scraper](#testing-the-scraper)
4. [Data Quality Verification](#data-quality-verification)
5. [Cron Job Configuration](#cron-job-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The SAM.gov scraper automatically pulls contract opportunities (solicitations) daily with:

- **Full Details Mode**: Complete descriptions, attachments, primary & secondary contacts
- **Dual API Key Support**: Automatic rotation if one key hits rate limit
- **Smart Upsert**: No duplicates, updates existing records
- **Daily Schedule**: Runs at 12:30 PM UTC (8:30 AM EST)
- **Date Range**: Scrapes last 3 days (handles API delays and updates)

---

## Environment Setup

### Step 1: Get Your SAM.gov API Keys

1. Go to https://open.gsa.gov/api/opportunities-api/
2. Click "Get API Key"
3. Register and receive your API key(s)
4. You can request multiple API keys for redundancy

### Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Required: First SAM.gov API key
SAM_GOV_API_KEY=SAM-your-first-api-key-here

# Optional: Second SAM.gov API key (for automatic rotation)
SAM_GOV_API_KEY_2=SAM-your-second-api-key-here

# Already configured (verify these exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Deploy to Vercel

Add the same environment variables to Vercel:

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add `SAM_GOV_API_KEY` (required)
3. Add `SAM_GOV_API_KEY_2` (optional, for rotation)
4. Add `CRON_SECRET` (for cron job security)
5. Add `CRON_NOTIFICATION_EMAIL` (for email notifications)

**Example:**
```
SAM_GOV_API_KEY = SAM-dafe1914-cd36-489d-ae93-c332b6e4df2c
SAM_GOV_API_KEY_2 = SAM-a1b2c3d4-e5f6-7890-abcd-ef1234567890
CRON_SECRET = your-secure-random-string-here
CRON_NOTIFICATION_EMAIL = your-email@example.com
```

---

## Testing the Scraper

### Quick Test (5 minutes)

Run the comprehensive test script:

```bash
npx tsx test-sam-gov-scraper.ts
```

This will:
1. Test API connection
2. Scrape yesterday's opportunities with full details
3. Verify data quality and completeness
4. Check API quota health

**Expected Output:**
```
✅ API Connection
✅ Scraping Functionality
✅ Data Quality
✅ API Quota Health

ALL TESTS PASSED! Scraper is ready for production.
```

### Manual Test (10 minutes)

Test scraping specific dates:

```bash
# Yesterday with full details (recommended)
npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details

# Last 3 days (what the cron job does)
npx tsx scrape-sam-gov-opportunities.ts --days=3 --full-details

# Specific date range
npx tsx scrape-sam-gov-opportunities.ts \
  --from=11/01/2025 \
  --to=11/03/2025 \
  --full-details
```

### Verify API Key Rotation

If you have two API keys, test rotation:

```bash
# Set both keys in .env.local
SAM_GOV_API_KEY=SAM-key-1
SAM_GOV_API_KEY_2=SAM-key-2

# Run test - it will automatically rotate if key 1 hits limit
npx tsx test-sam-gov-scraper.ts
```

The scraper will:
- Start with `SAM_GOV_API_KEY`
- If 429 (rate limit) error occurs, automatically switch to `SAM_GOV_API_KEY_2`
- Log: `[SAM.gov] Rotated to API key 2/2`

---

## Data Quality Verification

### Step 1: Run SQL Queries

Open Supabase SQL Editor and run:

```sql
-- Source file: VERIFY_SAM_GOV_DATA_QUALITY.sql

-- Quick overview
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(DISTINCT notice_id) as unique_notices,
  MIN(posted_date) as earliest,
  MAX(posted_date) as latest
FROM sam_gov_opportunities;

-- Data source distribution (should be mostly 'sam.gov-api-full')
SELECT 
  data_source,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sam_gov_opportunities
GROUP BY data_source;

-- Overall quality score
-- (Run full query from VERIFY_SAM_GOV_DATA_QUALITY.sql query #18)
```

### Step 2: Interpret Results

**Quality Score Guide:**
- **95-100%**: Excellent - Data is complete and rich
- **80-94%**: Good - Most data present, minor gaps
- **60-79%**: Fair - Needs improvement
- **<60%**: Poor - Major issues

**Data Source:**
- `sam.gov-api-full`: Has full details (✅ what you want)
- `sam.gov-api-search`: Only basic info (⚠️ re-scrape with --full-details)

### Step 3: Sample Record Check

```sql
-- View a sample record to verify quality
SELECT 
  notice_id,
  title,
  LENGTH(description) as description_length,
  CASE WHEN primary_contact IS NOT NULL THEN 'Yes' ELSE 'No' END as has_contact,
  CASE WHEN attachments IS NOT NULL THEN 'Yes' ELSE 'No' END as has_attachments,
  data_source,
  ui_link
FROM sam_gov_opportunities
ORDER BY last_scraped DESC
LIMIT 1;
```

**Good Record Example:**
```
description_length: > 500 characters
has_contact: Yes
has_attachments: Yes
data_source: sam.gov-api-full
```

---

## Cron Job Configuration

### Current Configuration

The cron job is already set up in `vercel.json`:

```json
{
  "path": "/api/cron/scrape-sam-gov",
  "schedule": "30 12 * * *"
}
```

**Schedule**: Daily at 12:30 PM UTC (8:30 AM EST)

### What the Cron Job Does

```typescript
// File: src/app/api/cron/scrape-sam-gov/route.ts

1. Checks last 3 days (not just 1-2)
   - Handles API delays
   - Captures updates to existing opportunities
   - Ensures nothing is missed

2. Uses FULL DETAILS mode
   - Complete descriptions
   - All attachments with download URLs
   - Primary AND secondary contacts
   - Amendment history

3. Handles rate limiting
   - Detects 429 errors
   - Automatically rotates API keys if available
   - Sends notification if all keys exhausted

4. Sends email notification
   - Success: Stats summary
   - Failure: Error details
   - Rate Limited: Explanation & next steps
```

### Test the Cron Endpoint

```bash
# From terminal (requires CRON_SECRET)
curl https://prop-shop.ai/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "message": "SAM.gov opportunities scraped for 11/02/2025, 11/01/2025, 10/31/2025",
  "dates_checked": ["11/02/2025", "11/01/2025", "10/31/2025"],
  "mode": "full-details",
  "stats": {
    "total_opportunities": 650,
    "new_updated": 127,
    "rate_limited": false
  },
  "duration_seconds": 134
}
```

### Email Notifications

You'll receive daily emails at 8:30 AM EST:

**Success Email:**
```
✅ SAM.gov Opportunities Scraper Completed Successfully

Date: 11/02/2025
Duration: 2m 14s
Status: ✓ Success

📊 Statistics:
- Dates Checked: 11/02/2025, 11/01/2025, 10/31/2025
- Total Opportunities: 650
- New/Updated: 127
- Mode: full-details
- Includes: descriptions, attachments, contacts

💡 Tip: Check your Supabase database to view the newly scraped data.
```

**Rate Limited Email:**
```
⚠️ SAM.gov Opportunities Scraper - Rate Limited

The SAM.gov API daily quota has been reached. This is normal if you've been doing manual scraping during the day.

The scraper will automatically retry tomorrow at 12:30 PM UTC.

No action needed - this is handled automatically.
```

---

## Troubleshooting

### Issue: "Missing SAM_GOV_API_KEY in environment"

**Solution:**
```bash
# Add to .env.local
SAM_GOV_API_KEY=SAM-your-api-key-here

# Or use numbered format
SAM_GOV_API_KEY_1=SAM-your-api-key-here
```

### Issue: Rate Limit Errors (429)

**Solution:**
1. **If you have one API key:**
   - Wait until midnight UTC (quota resets)
   - Reduce scraping frequency
   - Use fast mode instead of full details for testing

2. **If you have two API keys:**
   - Add second key: `SAM_GOV_API_KEY_2=SAM-your-second-key`
   - Scraper will automatically rotate
   - Doubles your daily quota

3. **Check quota usage:**
   ```bash
   # Each full-details request uses:
   # - 1 search API call per 100 opportunities
   # - 1 details API call per opportunity
   
   # Example: 100 opportunities with full details = 101 API calls
   # Daily limit: ~1,000 calls per key
   # With 2 keys: ~2,000 calls per day
   ```

### Issue: Descriptions are API links, not text

**Cause:** Data was scraped in fast mode

**Solution:**
```bash
# Re-scrape with full details
npx tsx scrape-sam-gov-opportunities.ts \
  --from=11/01/2025 \
  --to=11/03/2025 \
  --full-details

# The scraper will UPDATE existing records with full details
```

### Issue: Data quality score < 80%

**Check:**
1. Are you using `--full-details` flag?
2. Run: `SELECT data_source, COUNT(*) FROM sam_gov_opportunities GROUP BY data_source;`
3. If mostly 'sam.gov-api-search', re-scrape with full details

**Fix:**
```bash
# Re-scrape important date ranges with full details
npx tsx scrape-sam-gov-opportunities.ts --days=30 --full-details
```

### Issue: Cron job not running

**Check:**
1. Is `CRON_SECRET` set in Vercel?
2. Did you redeploy after adding `vercel.json`?
3. View cron list: `vercel crons ls`
4. Check Vercel logs: Deployments → Functions → Filter by `/api/cron/scrape-sam-gov`

### Issue: No email notifications

**Check:**
1. Is `CRON_NOTIFICATION_EMAIL` set in Vercel?
2. Is `SENDGRID_API_KEY` valid?
3. Check spam folder
4. Verify SendGrid from email is verified

---

## Best Practices

### 1. Daily Scraping Strategy

**Cron job configuration (already set up):**
- Runs at 12:30 PM UTC daily
- Checks last 3 days (handles delays)
- Uses full details mode
- Automatic API key rotation

**Manual scraping (for testing/backfill):**
```bash
# Test with yesterday only
npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details

# Backfill specific dates
npx tsx scrape-sam-gov-opportunities.ts \
  --from=10/01/2025 \
  --to=10/31/2025 \
  --full-details
```

### 2. API Key Management

**Single Key:**
- Sufficient for daily cron job (3 days × ~50-200 opps = 150-600 API calls)
- Keep manual scraping to minimum during the day

**Dual Keys:**
- Recommended for redundancy
- Automatic failover on rate limits
- Allows more manual testing without affecting cron job

### 3. Data Quality Monitoring

**Weekly check:**
```sql
-- Run in Supabase SQL Editor
-- Query #18 from VERIFY_SAM_GOV_DATA_QUALITY.sql
-- Verify overall_quality_score > 90%
```

**Monthly check:**
```sql
-- Check for missing descriptions
SELECT COUNT(*) FROM sam_gov_opportunities 
WHERE description IS NULL 
OR description LIKE 'https://api.sam.gov%';
-- Should be 0 or very low
```

### 4. Linking to FPDS Contracts

After scraping, link opportunities to awarded contracts:

```sql
-- Run these functions in Supabase
SELECT link_sam_to_fpds();
SELECT update_fpds_with_sam_links();

-- Check linking results
SELECT COUNT(*) FROM sam_gov_opportunities WHERE fpds_contract_id IS NOT NULL;
```

---

## Summary

### ✅ Setup Checklist

- [ ] Added `SAM_GOV_API_KEY` to `.env.local`
- [ ] (Optional) Added `SAM_GOV_API_KEY_2` for rotation
- [ ] Added environment variables to Vercel
- [ ] Ran test script: `npx tsx test-sam-gov-scraper.ts`
- [ ] Verified data quality > 80% in Supabase
- [ ] Confirmed cron job configuration in `vercel.json`
- [ ] Set up `CRON_SECRET` and `CRON_NOTIFICATION_EMAIL` in Vercel
- [ ] Tested cron endpoint manually
- [ ] Verified email notifications are working

### 📊 Daily Workflow (Automated)

1. **12:30 PM UTC**: Cron job runs automatically
2. **Scrapes**: Last 3 days with full details
3. **Saves**: New/updated opportunities to Supabase
4. **Links**: To FPDS contracts via solicitation number
5. **Notifies**: Email sent to `CRON_NOTIFICATION_EMAIL`

### 🎯 What You Get

Every day, automatically:
- **50-200 new opportunities** from SAM.gov
- **Complete descriptions** (not truncated)
- **All attachments** with download URLs
- **Primary & secondary contacts**
- **Linked to FPDS awards** (when applicable)
- **Zero manual work required**

---

## Next Steps

1. **Test now:**
   ```bash
   npx tsx test-sam-gov-scraper.ts
   ```

2. **Verify data quality:**
   - Run queries from `VERIFY_SAM_GOV_DATA_QUALITY.sql`
   - Check that quality score > 80%

3. **Deploy to production:**
   - Push to GitHub (already configured)
   - Vercel auto-deploys
   - Cron job starts running daily

4. **Monitor:**
   - Check email notifications daily
   - Review Vercel cron logs weekly
   - Run data quality queries monthly

---

**Your SAM.gov contract opportunities database updates itself every morning!** ☕📊

