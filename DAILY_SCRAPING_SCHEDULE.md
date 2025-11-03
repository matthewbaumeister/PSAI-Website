# Daily Automated Scraping Schedule

All 4 contract data sources scraped automatically every day at noon!

---

## 📅 Daily Schedule (All at Noon UTC)

| Time (UTC) | Time (EST) | Time (PST) | Scraper | What It Gets |
|------------|-----------|-----------|---------|--------------|
| **12:00 PM** | 8:00 AM | 5:00 AM | 🏛️ **FPDS** | Yesterday's contract awards |
| **12:15 PM** | 8:15 AM | 5:15 AM | 🪖 **DoD News** | Yesterday's DoD announcements |
| **12:30 PM** | 8:30 AM | 5:30 AM | 🏢 **SAM.gov** | Yesterday's opportunities (full details) |
| **12:45 PM** | 8:45 AM | 5:45 AM | 🔬 **DSIP** | Active SBIR/STTR opportunities |

**Why this schedule?**
- Noon UTC = 8 AM EST = Morning time when you're available
- 15-minute offsets prevent resource conflicts
- Yesterday's data is complete and ready to scrape
- You get emails around breakfast time! ☕

---

## 📧 Email Notifications

**You'll receive 4 emails every day** with detailed statistics:

### Example Email (FPDS):
```
✅ FPDS Contract Awards Scraper Completed Successfully

Date: 2025-11-02
Duration: 12m 34s
Status: ✓ Success

📊 Statistics:
- Total Contracts: 16,459
- New Contracts: 1,234
- Updated Contracts: 456
- Errors: 0

💡 Tip: Check your Supabase database to view the newly scraped data.
```

### Example Email (SAM.gov):
```
✅ SAM.gov Opportunities Scraper Completed Successfully

Date: 11/02/2025
Duration: 2m 15s
Status: ✓ Success

📊 Statistics:
- Total Opportunities: 650
- New Opportunities: 127
- Mode: full-details
- Includes: descriptions, attachments, contacts

💡 Tip: Check your Supabase database to view the newly scraped data.
```

---

## Setup Checklist

### 1. Environment Variables (Vercel)

Add these to **Vercel** → **Settings** → **Environment Variables**:

```bash
# Already have these
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SAM_GOV_API_KEY=...
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# NEW - Add these
CRON_SECRET=700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec
CRON_NOTIFICATION_EMAIL=your-email@example.com
```

### 2. Verify & Deploy

```bash
# Already pushed to GitHub!
git push origin main
```

Vercel will automatically:
- ✅ Read `vercel.json` cron configuration
- ✅ Create 4 scheduled cron jobs
- ✅ Run them daily at the specified times

---

## What Each Scraper Does

### 1. FPDS Contract Awards (12:00 PM UTC)

**Source:** USASpending.gov API  
**Data:** Awarded federal contracts  

**What it scrapes:**
- Contract awards from yesterday
- Full contract details (vendor, value, dates, etc.)
- Uses robust page-level scraper with 20 retries
- Typically 500-2,000 contracts per day

**Email includes:**
- Total contracts
- New contracts added
- Updated contracts
- Errors (if any)
- Duration

---

### 2. DoD Contract News (12:15 PM UTC)

**Source:** defense.gov/News/Contracts/  
**Data:** DoD contract announcements  

**What it scrapes:**
- DoD press releases from yesterday
- Extracts all contracts from articles
- Article-level scraping with smart resume
- Typically 5-20 articles, 50-200 contracts per day

**Email includes:**
- Total contracts
- New contracts added
- Articles processed
- Duration

---

### 3. SAM.gov Opportunities (12:30 PM UTC)

**Source:** SAM.gov Opportunities API  
**Data:** Contract solicitations (pre-award)  

**What it scrapes:**
- New opportunities posted yesterday
- **FULL DETAILS MODE:**
  - Complete descriptions (not truncated)
  - All attachments with download URLs
  - Primary AND secondary contacts
  - Amendment history
- Typically 50-200 opportunities per day

**Email includes:**
- Total opportunities
- New opportunities added
- Mode (full-details)
- What's included (descriptions, attachments, contacts)
- Duration

**Rate Limit Handling:**
- If SAM.gov daily quota is hit, you get a special "Rate Limited" email
- Explains it's normal and will retry tomorrow
- No action needed!

---

### 4. DSIP Opportunities (12:45 PM UTC)

**Source:** dodsbirsttr.mil API  
**Data:** SBIR/STTR opportunities  

**What it scrapes:**
- Active SBIR/STTR topics
- Full opportunity details
- All 159 columns of data
- Filters for Active/Open/Pre-Release status

**Email includes:**
- Total active opportunities
- New opportunities added
- Total processed
- Topics with full details
- Errors (if any)
- Duration

---

## Monitoring

### Check Daily Emails

You'll receive 4 emails around **8:00-8:45 AM EST** every morning with complete statistics.

### Check Vercel Logs

1. Go to Vercel → Your Project
2. Click **Deployments** → Latest
3. Click **Functions**
4. Filter by `/api/cron/`
5. View execution logs

### Check Supabase Data

Run in **Supabase SQL Editor**:

```sql
-- Yesterday's FPDS contracts
SELECT COUNT(*) as fpds_contracts
FROM fpds_contracts
WHERE DATE(last_modified_date) = CURRENT_DATE - 1;

-- Yesterday's DoD announcements
SELECT COUNT(*) as dod_contracts
FROM dod_contract_news
WHERE DATE(published_date) = CURRENT_DATE - 1;

-- Yesterday's SAM.gov opportunities
SELECT COUNT(*) as sam_opportunities
FROM sam_gov_opportunities
WHERE DATE(posted_date) = CURRENT_DATE - 1;

-- Active DSIP opportunities
SELECT COUNT(*) as dsip_active
FROM dsip_opportunities
WHERE topic_status = 'Active';
```

---

## Manual Testing

Test any scraper manually:

```bash
# FPDS
curl https://your-app.vercel.app/api/cron/scrape-fpds \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec"

# DoD News
curl https://your-app.vercel.app/api/cron/scrape-dod-news \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec"

# SAM.gov
curl https://your-app.vercel.app/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec"

# DSIP
curl https://your-app.vercel.app/api/cron/scrape-dsip \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec"
```

---

## Cost

### Vercel Pro Plan: $20/month

**Includes:**
- ✅ Unlimited cron jobs (4 jobs × 30 days = 120 executions/month)
- ✅ 1,000 GB-hours function execution
- ✅ 100 GB bandwidth

**Expected Usage:**
- ~15-30 minutes of function time per day
- Well within all limits

---

## Troubleshooting

### Not Receiving Emails

**Check:**
1. Is `CRON_NOTIFICATION_EMAIL` set in Vercel?
2. Is `SENDGRID_API_KEY` valid?
3. Check spam folder
4. Verify SendGrid from email

### Cron Not Running

**Check:**
1. Is `CRON_SECRET` set in Vercel?
2. Did you redeploy after adding `vercel.json`?
3. View cron list: `vercel crons ls`

### SAM.gov Rate Limit

**This is normal!**
- SAM.gov API has ~1,000 requests/day limit
- If you manually scrape during the day, the cron might hit the limit
- You'll get a special "Rate Limited" email
- It will retry automatically tomorrow

### Missing Data

**Manual backfill:**
```bash
# If a day was missed, run locally
npx tsx src/scripts/fpds-page-level-scraper.ts --from=2025-11-02 --to=2025-11-02
npx tsx scrape-dod-production.ts 2025-11-02 2025-11-02
npx tsx scrape-sam-gov-opportunities.ts --from=2025-11-02 --to=2025-11-02 --full-details
```

---

## Next Steps

### 1. Add Environment Variables

Add to Vercel:
- `CRON_SECRET=700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec`
- `CRON_NOTIFICATION_EMAIL=your-email@example.com`

### 2. Deploy

Already pushed to GitHub! Vercel will automatically deploy.

### 3. Wait for First Execution

**Tomorrow at noon UTC** (8 AM EST):
- ✅ FPDS scraper runs at 12:00 PM UTC
- ✅ DoD scraper runs at 12:15 PM UTC
- ✅ SAM.gov scraper runs at 12:30 PM UTC
- ✅ DSIP scraper runs at 12:45 PM UTC

### 4. Check Your Inbox

You'll receive 4 beautiful emails with all the stats! 📧

---

## Summary

✅ **4 scrapers** running daily  
✅ **Noon schedule** (8 AM EST) - Perfect timing!  
✅ **Email notifications** with detailed stats  
✅ **Smart upserts** - No duplicates  
✅ **Fully automated** - Zero manual work  
✅ **Already deployed** - Just add env vars  

**Your contract database updates itself every morning!** 🎉

---

## Daily Email Summary Example

**Subject:** 📊 Daily Scraping Digest - 4/4 Successful

```
Daily Scraping Digest
2025-11-02

Summary:
- Total Jobs: 4
- ✓ Success: 4
- ✗ Failed: 0

Job Details:

✅ FPDS Contract Awards Scraper
Status: Success
Stats: total_contracts: 16,459, new_contracts: 1,234, updated_contracts: 456, errors: 0

✅ DoD Contract News Scraper
Status: Success
Stats: total_contracts: 12,342, new_contracts: 127, articles_processed: 15

✅ SAM.gov Opportunities Scraper
Status: Success
Stats: total_opportunities: 650, new_opportunities: 89, mode: full-details

✅ DSIP Opportunities Scraper
Status: Success
Stats: total_active_opportunities: 245, new_opportunities: 12, total_processed: 32,614
```

---

**Wake up to fresh contract data every single day!** ☕📊

