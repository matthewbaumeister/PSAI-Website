# Quick Test: Army xTech Daily Cron

## 🧪 Test the Daily Scraper NOW

### 1. Get Your CRON_SECRET

```bash
# From .env.local file
cat .env.local | grep CRON_SECRET
```

### 2. Test Locally (Development)

```bash
# Start dev server
npm run dev

# In another terminal:
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  http://localhost:3000/api/army-innovation/test-cron
```

### 3. Test on Production (Vercel)

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  https://your-domain.vercel.app/api/army-innovation/test-cron
```

Replace:
- `YOUR_CRON_SECRET_HERE` with your actual secret
- `your-domain.vercel.app` with your Vercel URL

---

## ✅ Expected Response

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
    "winners_found": 0,
    "finalists_found": 0,
    "errors": 0
  }
}
```

**Key Stats:**
- `competitions_found` - How many OPEN competitions found
- `competitions_updated` - How many were updated (usually same as found)
- `competitions_inserted` - New competitions (usually 0 for daily runs)
- `winners_found` - New winners detected
- `finalists_found` - New finalists detected

---

## 📊 Verify Results in Database

Run in Supabase SQL Editor:

```sql
-- Check latest scraper run
SELECT * FROM army_innovation_scraper_log
ORDER BY started_at DESC LIMIT 1;

-- Check open competitions
SELECT competition_name, status, last_updated
FROM army_innovation_opportunities
WHERE status = 'Open'
ORDER BY last_updated DESC;

-- Check latest submissions
SELECT 
  o.competition_name,
  s.company_name,
  s.submission_status,
  s.created_at
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
ORDER BY s.created_at DESC
LIMIT 10;
```

---

## 📧 Check Email

You should receive an email at your `NOTIFICATION_EMAIL` with:
- Job status (Success/Failed)
- Statistics
- Duration
- Timestamp

---

## 🔄 Daily Automatic Run

The cron runs automatically every day at **1:00 PM UTC** (13:00).

No action needed - it just works! 🎯

---

## 🚀 Current Status

Based on your latest data:
- ✅ **44 competitions** in database
- ✅ **656 submissions** total
- ✅ **3 open competitions** currently

The daily cron will check these 3 open competitions and update if anything changes!

