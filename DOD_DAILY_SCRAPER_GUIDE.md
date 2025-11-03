# DoD Contract News - Daily Scraper Guide

## Overview

The DoD Contract News scraper automatically checks **defense.gov/News/Contracts/** for new contract announcements and updates to previous days.

**Key Features:**
- ✅ Multi-day checking (catches gov shutdown updates)
- ✅ Detects contract modifications
- ✅ Smart upsert (no duplicates)
- ✅ Article-level tracking
- ✅ Works in Vercel serverless environment

**IMPORTANT NOTE:**
The cron endpoint currently uses the production `scrape-dod-production.ts` scraper, which has a rich parsing engine that extracts 50+ fields per contract (contract types, SBIR status, FMS data, modifications, etc.). The simplified `dod-daily-scraper.ts` needs to be updated to match the full schema before it can be used. For now, the cron calls the production scraper via `parseArticleAndSave()` from `src/lib/dod-news-scraper.ts`.

---

## How It Works

### 1. Multi-Day Strategy

**The scraper checks the last 3 days EVERY day:**

```
Daily run at 12:15 PM UTC:
- Check Nov 2 (yesterday)
- Check Nov 1 (2 days ago)
- Check Oct 31 (3 days ago)
```

**Why?**
- **Gov shutdowns:** During shutdowns (e.g., Sep 30), DoD publishes old articles late
- **Modifications:** Contract mods can appear days after original announcement
- **Data completeness:** Ensures no contracts are missed

### 2. Contract Modifications Detection

**DoD articles may include:**
- New contract awards
- Modifications to existing contracts
- Task orders under parent contracts

**Example from same vendor:**
```
Article: "Contracts For Oct 31, 2024"
- Lockheed Martin - $50M (original award)

Article: "Contracts For Nov 1, 2024"
- Lockheed Martin - $55M (modification - +$5M)
```

The scraper's **upsert logic** updates the database when it sees the same contract updated!

---

## Automated Cron Schedule

**Vercel Cron:** Runs daily at **12:15 PM UTC** (8:15 AM EST / 5:15 AM PST)

- Checks last 3 days
- Sends email notifications with stats
- Handles failures gracefully

**Configured in:** `vercel.json`
```json
{
  "path": "/api/cron/scrape-dod-news",
  "schedule": "15 12 * * *"
}
```

---

## Manual Testing

### Test Single Date
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/dod-daily-scraper.ts --date=2024-11-01
```

### Test Multi-Day (Last 7 Days)
```bash
npx tsx src/scripts/dod-daily-scraper.ts --days=7
```

### Test Cron Endpoint Locally
```bash
curl -X POST "http://localhost:3000/api/cron/scrape-dod-news" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Cron Endpoint on Vercel
```bash
curl -X POST "https://propshop.ai/api/cron/scrape-dod-news" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Output:**
```json
{
  "success": true,
  "message": "DoD contract news scraped for 2024-11-02, 2024-11-01, 2024-10-31",
  "dates_checked": ["2024-11-02", "2024-11-01", "2024-10-31"],
  "stats": {
    "total_articles": 3,
    "total_contracts": 45,
    "new_updated": 12,
    "database_total": 1234
  },
  "duration_seconds": 45
}
```

---

## Check Data Quality

### 1. Recent Contracts
```sql
-- See last 3 days of DoD contracts
SELECT 
  DATE(published_date) as pub_date,
  COUNT(*) as total_contracts,
  COUNT(DISTINCT article_url) as unique_articles,
  COUNT(DISTINCT vendor_name) as unique_vendors
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY DATE(published_date)
ORDER BY pub_date DESC;
```

### 2. Find Modifications
```sql
-- Find vendors with multiple contracts (potential mods)
SELECT 
  vendor_name,
  COUNT(*) as contract_count,
  STRING_AGG(DISTINCT DATE(published_date)::text, ', ') as dates,
  STRING_AGG(contract_value, ', ') as values
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY vendor_name
HAVING COUNT(*) > 1
ORDER BY contract_count DESC
LIMIT 20;
```

### 3. Gov Shutdown Coverage
```sql
-- Check if we have data during Sep 30 shutdown
SELECT 
  DATE(published_date) as pub_date,
  COUNT(*) as contracts,
  MIN(scraped_at) as first_scraped,
  MAX(updated_at) as last_updated
FROM dod_contract_news
WHERE published_date BETWEEN '2024-09-25' AND '2024-10-05'
GROUP BY DATE(published_date)
ORDER BY pub_date DESC;
```

### 4. Top Agencies & Vendors
```sql
-- Most active contracting agencies
SELECT 
  contracting_agency,
  COUNT(*) as total_contracts,
  SUM(CASE WHEN contract_value ~ '\$[\d,]+' THEN 1 ELSE 0 END) as contracts_with_value
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY contracting_agency
ORDER BY total_contracts DESC
LIMIT 10;

-- Top vendors
SELECT 
  vendor_name,
  COUNT(*) as total_contracts,
  STRING_AGG(DISTINCT contracting_agency, ', ') as agencies
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY vendor_name
ORDER BY total_contracts DESC
LIMIT 10;
```

---

## Linking DoD News with FPDS Contracts

### Cross-Reference Query
```sql
-- Find DoD news contracts that match FPDS records
SELECT 
  d.vendor_name as dod_vendor,
  d.award_amount_text as dod_value,
  d.published_date as dod_date,
  f.piid as fpds_contract_id,
  f.current_total_value_of_award as fpds_value,
  f.mod_number,
  f.date_signed as fpds_date,
  ABS(d.published_date - f.date_signed) as days_apart
FROM dod_contract_news d
LEFT JOIN fpds_contracts f 
  ON LOWER(d.vendor_name) = LOWER(f.vendor_name)
  AND ABS(d.published_date - f.date_signed) < 7  -- Within 7 days (DATE - DATE = integer)
WHERE d.published_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY d.published_date DESC
LIMIT 50;
```

**This helps identify:**
- Which DoD announcements have full FPDS details
- Contract modifications across both sources
- Data gaps between DoD and FPDS

---

## Contract Modification Analysis

Use the queries in `ANALYZE_CONTRACT_MODIFICATIONS.sql`:

```bash
# Run all modification analysis queries
psql $DATABASE_URL -f ANALYZE_CONTRACT_MODIFICATIONS.sql
```

**Key Insights:**
1. **Multi-mod contracts:** Which contracts have the most modifications
2. **Value growth:** How contract values change over time
3. **Parent-child:** Task orders linked to parent IDVs
4. **Timing:** How long between original award and mods

---

## Email Notifications

**Success Email Example:**
```
Subject: DoD Contract News Scraper Completed Successfully - 2024-11-02

Job: DoD Contract News Scraper
Status: Success
Date: 2024-11-02
Duration: 45 seconds

Stats:
- dates_checked: 2024-11-02, 2024-11-01, 2024-10-31
- total_contracts: 1,234
- new_updated_contracts: 12
- articles_found: 3
- contracts_inserted: 45
```

**Failure Email Example:**
```
Subject: DoD Contract News Scraper Failed - 2024-11-02

Job: DoD Contract News Scraper
Status: Failed
Date: 2024-11-02
Duration: 120 seconds

Error: fetch failed

This may be due to:
- DoD website temporarily down
- Network timeout
- Parsing error

The scraper will retry tomorrow automatically.
```

---

## Troubleshooting

### No Contracts Found

**Check 1:** Is there actually an article for that date?
```bash
# Visit: https://www.defense.gov/News/Contracts/
# Look for "Contracts For [date]"
```

**Check 2:** Gov shutdown?
```sql
-- Check recent publication dates
SELECT DISTINCT DATE(published_date) as pub_date
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY pub_date DESC;
```

### Duplicate Contracts

**The scraper uses upsert on `(article_url, vendor_name)`:**
- Same vendor in same article → update existing
- Same vendor in different article → new record

```sql
-- Check for duplicates
SELECT 
  article_url,
  vendor_name,
  COUNT(*) as duplicate_count
FROM dod_contract_news
GROUP BY article_url, vendor_name
HAVING COUNT(*) > 1;
```

### Parsing Errors

**The scraper extracts:**
- Vendor name (first line of each section)
- Contract value (searches for `$X million/billion`)
- Agency (searches for Air Force, Army, Navy, etc.)
- Location (City, ST format)
- Description (remaining text)

**If parsing fails:**
1. Check article HTML structure changes
2. Look at `ANALYZE_CONTRACT_MODIFICATIONS.sql` queries
3. Update parser logic in `src/scripts/dod-daily-scraper.ts`

---

## Deployment Checklist

### Before Deploying

1. **Environment Variables in Vercel:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   CRON_SECRET=your_secret_here
   CRON_NOTIFICATION_EMAIL=your_email@example.com
   SENDGRID_API_KEY=SG.xxx
   SENDGRID_FROM_EMAIL=noreply@propshop.ai
   ```

2. **Test Locally:**
   ```bash
   npx tsx src/scripts/dod-daily-scraper.ts --days=3
   ```

3. **Test Cron Endpoint:**
   ```bash
   npm run dev
   curl -X POST "http://localhost:3000/api/cron/scrape-dod-news" \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

### After Deploying

1. **Verify Cron Schedule:**
   - Vercel Dashboard → Project → Cron Jobs
   - Should see: `/api/cron/scrape-dod-news` at `15 12 * * *`

2. **Manual Test on Production:**
   ```bash
   curl -X POST "https://propshop.ai/api/cron/scrape-dod-news" \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. **Check Email:**
   - Should receive success/failure email within 5 minutes

4. **Monitor Logs:**
   - Vercel Dashboard → Logs
   - Look for `[Cron]` prefixed messages

---

## Summary

**Daily Workflow:**
1. 12:15 PM UTC: Cron triggers
2. Scraper checks last 3 days
3. Finds new articles + updates
4. Upserts contracts (no duplicates)
5. Sends email with stats
6. Done! 

**Benefits:**
- Never miss a contract announcement
- Catches modifications and updates
- Handles gov shutdowns automatically
- Full audit trail with email notifications

**Data Sources:**
- `dod_contract_news` table: All DoD announcements
- `fpds_contracts` table: Full FPDS details (link by vendor + date)
- `sam_gov_opportunities` table: Original solicitations (link by solicitation_id)

All 3 sources together = **Complete contract intelligence!** 🚀

