# Army XTECH Daily Cron Job - Setup & Testing

## ✅ What Was Created

### 1. Daily Cron Job
**File:** `src/app/api/cron/army-innovation-scraper/route.ts`
- Runs automatically via Vercel Cron
- Only scrapes **active/open competitions** (not historical)
- Sends email with stats when complete
- Sends error email if anything fails

### 2. Manual Test Endpoint
**File:** `src/app/api/army-innovation/test-cron/route.ts`
- Test the scraper before enabling daily cron
- Same functionality as cron job
- Sends test email with results

### 3. Vercel Cron Schedule
**File:** `vercel.json`
- Added: Army Innovation scraper runs daily at **1:00 PM UTC** (8 AM EST / 5 AM PST)
- Schedule: `0 13 * * *`

## 📧 Email Notifications

You'll receive an automated email after each run with:

### Success Email:
```
Job: Army XTECH Innovation Tracker
Status: ✅ SUCCESS
Duration: 45 seconds
Date: 2025-11-04

Stats:
- Active Competitions Found: 3
- Competitions Processed: 3
- New Competitions: 0
- Updated Competitions: 1
- New Winners: 2
- New Finalists: 5
- Errors: 0

Message: Successfully scraped 3 active XTECH competitions. 
Found 1 updates, 2 new winners, and 5 new finalists.
```

### Failure Email:
```
Job: Army XTECH Innovation Tracker
Status: ❌ FAILED
Duration: 15 seconds
Error: Network timeout
Date: 2025-11-04

Message: Army Innovation scraper failed: Network timeout
```

## 🧪 How to Test

### Step 1: Test Locally First
```bash
# Make sure environment variables are loaded
npm run scrape:army-innovation:active
```

This runs the active scraper locally without sending emails.

### Step 2: Test the API Endpoint
Once you deploy to Vercel, test the manual endpoint:

```bash
curl -X GET "https://your-domain.vercel.app/api/army-innovation/test-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Replace:
- `your-domain.vercel.app` with your actual domain
- `YOUR_CRON_SECRET` with your actual secret from `.env.local`

**Expected:** You should receive a test email within 1-2 minutes.

### Step 3: Deploy and Enable Cron
```bash
# Deploy to Vercel
vercel --prod

# Or if using git:
git add .
git commit -m "Add Army XTECH daily cron job"
git push origin main
```

The cron job will automatically run daily at 1:00 PM UTC.

## 📊 What the Daily Scraper Does

### Only Scrapes Active/Open Competitions
- Looks for competitions with status: "Open" or "Active"
- Ignores all "Closed" competitions
- Much faster than historical scrape (2-3 minutes vs 10 minutes)

### Smart Updates
- **Existing competitions:** Updates dates, descriptions, winners, finalists if changed
- **New competitions:** Inserts new active competitions
- **Closed competitions:** Doesn't touch them (already in database from historical scrape)

### What Gets Updated
- ✅ Competition dates (open, close, submission deadline)
- ✅ Competition phase (e.g., "Phase 1: Submissions Open" → "Phase 2: Evaluation")
- ✅ New winners announced
- ✅ New finalists announced
- ✅ Description changes
- ✅ Prize amounts (if updated)

## 🔒 Security

The cron job is protected by:
1. **CRON_SECRET** - Bearer token authorization
2. **x-vercel-cron header** - Vercel's internal verification

Only Vercel can trigger it automatically, or you can trigger it manually with the secret.

## 📅 Schedule Details

| Job | Time (UTC) | Time (EST) | Frequency |
|-----|------------|------------|-----------|
| Army XTECH | 13:00 | 8:00 AM | Daily |
| Congress | 11:30 | 6:30 AM | Daily |
| FPDS | 12:00-14:00 | 7:00-9:00 AM | Every 5 min |
| DoD News | 12:15 | 7:15 AM | Daily |
| SAM.gov | 12:30 | 7:30 AM | Daily |
| SBIR | 12:45 | 7:45 AM | Daily |

## 🛠 Troubleshooting

### No Email Received
1. Check if `sendCronSuccessEmail` function exists in `src/lib/cron-notifications.ts`
2. Verify email service is configured in environment variables
3. Check Vercel logs for errors

### Scraper Timing Out
- The scraper has a 5-minute max duration (Vercel Pro plan limit)
- Active scraping should take 2-3 minutes for 3-5 open competitions
- If it times out, check if there are too many active competitions

### Wrong Data Being Updated
- The scraper only updates competitions with status "Open" or "Active"
- If closed competitions are being updated, check the status filter in `scrapeActive()`

## 📝 Manual Trigger (For Testing)

You can manually trigger the cron job from your browser:

1. Open: `https://your-domain.vercel.app/api/army-innovation/test-cron`
2. When prompted for auth, use:
   - Username: (leave blank)
   - Password: `YOUR_CRON_SECRET`

Or use curl:
```bash
curl -X GET "https://your-domain.vercel.app/api/army-innovation/test-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## ✅ Verification Checklist

- [ ] Deployed to Vercel
- [ ] Environment variables set (`CRON_SECRET`, Supabase credentials)
- [ ] Tested manual endpoint - received email
- [ ] Verified email contains correct stats
- [ ] Checked Supabase for updated data
- [ ] Waited for first automatic run (1:00 PM UTC)
- [ ] Received automated email after cron run

## 🎯 Expected Behavior

### First Run After Historical Scrape
```
Active Competitions Found: 3
Competitions Processed: 3
New Competitions: 0
Updated Competitions: 0 (or 1-3 if dates changed)
New Winners: 0 (or 1-5 if new winners announced)
New Finalists: 0 (or 1-10 if new finalists announced)
```

### Typical Daily Run (No Changes)
```
Active Competitions Found: 3
Competitions Processed: 3
New Competitions: 0
Updated Competitions: 0
New Winners: 0
New Finalists: 0
```

### When New Competition Opens
```
Active Competitions Found: 4
Competitions Processed: 4
New Competitions: 1
Updated Competitions: 0
New Winners: 0
New Finalists: 0
```

## 🚀 You're All Set!

The daily cron job will:
1. ✅ Run automatically every day at 1:00 PM UTC (8 AM EST)
2. ✅ Check only active/open XTECH competitions
3. ✅ Update any changed data (dates, winners, finalists, phases)
4. ✅ Send you an email with complete stats
5. ✅ Complete in 2-3 minutes

No manual intervention needed - just check your email daily for updates!

