# Test Army XTECH Daily Cron Job

## Quick Test (Before Deploying)

### Step 1: Local Test (No Email)
```bash
npm run scrape:army-innovation:active
```

**Expected output:**
```
[XTECH Scraper] Starting ACTIVE scrape (open competitions only)...
[XTECH Scraper] Found 3 competition cards
[XTECH Scraper] Processing competition 1/3...
[XTECH Scraper] Updated: xTechCounter Strike (1/3)
...
[XTECH Scraper] Statistics
[XTECH Scraper] Competitions Found: 3
[XTECH Scraper] Competitions Updated: 1
[XTECH Scraper] Winners Found: 2
[XTECH Scraper] Finalists Found: 5
```

### Step 2: Deploy to Vercel
```bash
git add .
git commit -m "Add Army XTECH daily cron with email notifications"
git push origin main
```

Or:
```bash
vercel --prod
```

### Step 3: Test Email Notification
After deployment, trigger the test endpoint:

```bash
curl -X GET "https://YOUR-DOMAIN.vercel.app/api/army-innovation/test-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Replace:**
- `YOUR-DOMAIN` = your Vercel domain
- `YOUR_CRON_SECRET` = from your `.env.local` file

**Expected:** You'll receive an email within 1-2 minutes with:
```
Subject: Army XTECH Innovation Tracker (TEST) - Success

Job: Army XTECH Innovation Tracker (TEST)
Status: ✅ SUCCESS
Duration: 45 seconds

Stats:
- Active Competitions Found: 3
- Competitions Processed: 3
- Updated Competitions: 1
- New Winners: 2
- New Finalists: 5
```

## What to Check

### In Email:
- ✅ Received email notification
- ✅ Subject contains "Army XTECH Innovation Tracker"
- ✅ Shows correct stats (competitions found, updates, winners, finalists)
- ✅ Shows duration in seconds
- ✅ No errors reported

### In Supabase:
1. Open `army_innovation_opportunities` table
2. Check active competitions have latest data
3. Open `army_innovation_submissions` table  
4. Verify new winners/finalists were added (if any)

## Automated Schedule

Once deployed, the cron job runs automatically:
- **Time:** 1:00 PM UTC (8:00 AM EST, 5:00 AM PST)
- **Frequency:** Daily
- **Action:** Checks active XTECH competitions for updates
- **Notification:** Sends you an email with stats

## Troubleshooting

### No Email Received
```bash
# Check Vercel logs
vercel logs --prod

# Look for:
# - "Starting Army Innovation daily scraper"
# - Email sending confirmation
# - Any errors
```

### Email Says 0 Competitions Found
- Check if there are actually any Open/Active competitions
- Most competitions might be Closed
- This is normal if no competitions are currently active

### Scraper Times Out
- Vercel Pro has 5-minute max duration
- Active scraping should take 2-3 minutes
- If timing out, check if too many competitions are active

## Manual Trigger Anytime

You can manually trigger the cron job whenever you want:

**Browser:**
1. Go to: `https://YOUR-DOMAIN.vercel.app/api/army-innovation/test-cron`
2. Enter credentials:
   - Username: (leave blank)
   - Password: YOUR_CRON_SECRET

**Command line:**
```bash
curl -X GET "https://YOUR-DOMAIN.vercel.app/api/army-innovation/test-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Success Criteria

✅ **Test Passed If:**
1. Command completes without errors
2. Email received within 2 minutes
3. Email shows correct stats
4. Supabase data is updated
5. No errors in Vercel logs

## Ready for Production

Once test passes:
- ✅ Cron job will run automatically daily
- ✅ You'll receive email after each run
- ✅ No manual intervention needed
- ✅ Keeps your active competitions up-to-date

The cron job only updates **active/open competitions** - it won't re-scrape historical data.

