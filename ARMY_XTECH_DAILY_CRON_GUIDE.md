# Army xTech Daily Cron Job - Complete Guide

## 🎯 Overview

The Army xTech Daily Cron Job automatically checks for updates to **active/open competitions** every day at **1:00 PM UTC**.

### What It Does:
- ✅ Scrapes only **OPEN** competitions (not closed ones)
- ✅ Updates existing competition data if changed
- ✅ Adds new winners/finalists if announced
- ✅ Sends email notifications with statistics
- ✅ Logs all runs to `army_innovation_scraper_log` table

---

## 📅 Schedule

**Time:** Daily at **1:00 PM UTC** (13:00)
- **EST/EDT:** 8:00 AM / 9:00 AM
- **PST/PDT:** 5:00 AM / 6:00 AM

**Configured in:** `vercel.json`
```json
{
  "path": "/api/cron/army-innovation-scraper",
  "schedule": "0 13 * * *"
}
```

---

## 🚀 Deployment Checklist

### 1. Verify Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for writes)
- `CRON_SECRET` - Secret token for cron authorization
- `RESEND_API_KEY` - For email notifications
- `NOTIFICATION_EMAIL` - Email address to receive cron notifications

### 2. Deploy to Production

```bash
# Commit all changes
git add -A
git commit -m "Deploy Army xTech daily cron job"
git push

# Vercel will auto-deploy
# Or manually deploy:
vercel --prod
```

### 3. Verify Deployment

Check that these endpoints exist:
- `https://your-domain.vercel.app/api/cron/army-innovation-scraper`
- `https://your-domain.vercel.app/api/army-innovation/test-cron`

---

## 🧪 Testing the Cron Job

### Option 1: Manual Test Endpoint (Recommended)

Test without waiting for the schedule:

```bash
# Get your CRON_SECRET from Vercel or .env.local
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/army-innovation/test-cron
```

**Expected Response:**
```json
{
  "success": true,
  "test_mode": true,
  "message": "Army Innovation TEST scraper completed",
  "timestamp": "2025-11-04T13:00:00.000Z",
  "duration_seconds": 45,
  "xtech": {
    "competitions_found": 3,
    "competitions_processed": 3,
    "competitions_inserted": 0,
    "competitions_updated": 3,
    "winners_found": 2,
    "finalists_found": 5,
    "errors": 0
  }
}
```

### Option 2: Trigger via Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Find `/api/cron/army-innovation-scraper`
5. Click "Invoke" to manually trigger

### Option 3: Local Testing

```bash
# Run locally with your .env.local file
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Start dev server
npm run dev

# In another terminal, test the endpoint
curl -X GET \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d '=' -f2)" \
  http://localhost:3000/api/army-innovation/test-cron
```

---

## 📊 Monitoring & Verification

### Check Scraper Logs in Supabase

Run this SQL in Supabase SQL Editor:

```sql
-- Recent scraper runs
SELECT 
  scrape_type,
  scrape_target,
  status,
  records_found,
  records_inserted,
  records_updated,
  records_errors,
  duration_seconds,
  started_at,
  completed_at
FROM army_innovation_scraper_log
WHERE scrape_type = 'xtech'
ORDER BY started_at DESC
LIMIT 10;
```

### Check for New Updates

```sql
-- Competitions updated in last 24 hours
SELECT 
  competition_name,
  status,
  last_updated,
  total_prize_pool,
  close_date
FROM army_innovation_opportunities
WHERE last_updated > NOW() - INTERVAL '24 hours'
ORDER BY last_updated DESC;

-- New submissions in last 24 hours
SELECT 
  o.competition_name,
  s.company_name,
  s.submission_status,
  s.created_at
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
WHERE s.created_at > NOW() - INTERVAL '24 hours'
ORDER BY s.created_at DESC;
```

### Email Notifications

You should receive an email after each cron run with:
- ✅ Success/Failure status
- 📊 Statistics (competitions found, updated, errors)
- ⏱️ Duration
- 📅 Date/Time

**Example Email:**
```
Subject: ✅ Cron Success: Army XTECH Innovation Tracker

Job: Army XTECH Innovation Tracker
Status: Success
Date: 2025-11-04
Duration: 45 seconds

Statistics:
- Active Competitions Found: 3
- Competitions Processed: 3
- New Competitions: 0
- Updated Competitions: 3
- New Winners: 2
- New Finalists: 5
- Errors: 0
```

---

## 🔧 How the Daily Cron Works

### 1. Scraper Behavior

**Active Mode vs Historical Mode:**

| Mode | What It Scrapes | When Used |
|------|-----------------|-----------|
| **Historical** | ALL competitions (open + closed) | One-time initial setup |
| **Active** | Only OPEN competitions | Daily cron job |

**Code Location:** `src/lib/army-xtech-scraper.ts`

```typescript
// Historical scrape - gets everything
await scraper.scrapeHistorical();

// Active scrape - only open competitions
await scraper.scrapeActive();
```

### 2. Smart Updating

The cron job intelligently handles updates:

1. **Finds OPEN competitions** on xtech.army.mil
2. **Checks if competition exists** in database
   - If new → INSERT
   - If exists → UPDATE only if data changed
3. **Updates winners/finalists** if new ones announced
4. **Logs the run** to `army_innovation_scraper_log`
5. **Sends email** with results

### 3. What Gets Updated

For existing competitions, the cron updates:
- ✅ Description (if changed)
- ✅ Prize amounts (if changed)
- ✅ Dates (open/close/deadline)
- ✅ Status (if moved to Closed)
- ✅ Phase information
- ✅ New winners/finalists

---

## 🐛 Troubleshooting

### Cron Not Running

**Check Vercel Logs:**
1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by `/api/cron/army-innovation-scraper`
4. Look for errors

**Common Issues:**
- Missing environment variables
- CRON_SECRET not set
- Supabase credentials expired
- Vercel cron disabled

### No Email Notifications

Check:
- `RESEND_API_KEY` is set in Vercel
- `NOTIFICATION_EMAIL` is set
- Check spam folder
- Verify Resend API quota

### Scraper Errors

Check scraper log table:
```sql
SELECT * 
FROM army_innovation_scraper_log 
WHERE status = 'failed' 
ORDER BY started_at DESC;
```

Common errors:
- Network timeouts (xtech.army.mil slow)
- Page structure changed (selectors need update)
- Database permission issues

---

## 📈 Performance Expectations

**Typical Run:**
- Duration: 30-60 seconds
- Competitions checked: 2-5 (only open ones)
- Updates: 0-3 per day (usually minimal)
- New winners/finalists: 0-10 per day

**Resource Usage:**
- Vercel function time: ~1 minute
- Memory: ~256 MB
- Database writes: 5-20 rows per run

---

## 🔄 Manual Re-scrape

If you need to re-scrape everything (not just active):

```bash
# SSH into your server or run locally
npm run scrape:army-innovation:historical
```

Or create a one-time manual trigger endpoint.

---

## 📝 Summary

### ✅ What's Already Set Up:
1. ✅ Daily cron job at 1PM UTC (`/api/cron/army-innovation-scraper`)
2. ✅ Test endpoint (`/api/army-innovation/test-cron`)
3. ✅ Email notifications (success/failure)
4. ✅ Database logging
5. ✅ Smart update logic (only updates changed data)

### 🎯 What You Need to Do:
1. Deploy to Vercel (if not already)
2. Verify environment variables
3. Test using test endpoint
4. Monitor email notifications
5. Check scraper logs after first run

### 🚀 Next Steps:
- Wait for first scheduled run at 1PM UTC
- Check email notification
- Verify data in Supabase
- Celebrate! 🎉

---

## 📞 Support

If issues arise:
1. Check Vercel logs
2. Check scraper log table in Supabase
3. Test manually via test endpoint
4. Verify environment variables
5. Check xtech.army.mil is accessible

**The system is production-ready and will run automatically every day!** 🚀

