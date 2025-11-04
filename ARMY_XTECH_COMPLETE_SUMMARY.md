# Army XTECH Innovation Tracker - Complete System

## 🎉 What You Have Now

A fully automated Army XTECH competition tracking system that:
- ✅ **Scrapes all 44 historical competitions** (one-time)
- ✅ **Tracks 325+ winners and 384+ finalists**
- ✅ **Updates daily automatically** (only active competitions)
- ✅ **Sends email notifications** with stats
- ✅ **Smart updates** - no duplicates, preserves data

## 📊 Database Structure

### Tables
1. **`army_innovation_opportunities`** (44 competitions)
   - All competition data: dates, phases, descriptions, prizes
   - Competition phase tracking
   - Status: Open/Closed/Active

2. **`army_innovation_submissions`** (720+ rows)
   - Winners and finalists
   - Linked to competitions via `opportunity_id`
   - Company names, locations, award amounts

3. **Views (run `ADD_WINNER_VIEW.sql`)**
   - `army_innovation_winners_with_details`
   - `army_innovation_finalists_with_details`
   - Easy JOIN queries without writing SQL

## 🔧 Key Components

### Scraper
**File:** `src/lib/army-xtech-scraper.ts`
- **Historical mode:** Scrapes all 44 competitions (10 min)
- **Active mode:** Only scrapes open/active competitions (2-3 min)
- Load More button automation (loads all 44 competitions)
- Smart winner/finalist extraction from H2/H3 headings
- Date filtering (no more dates as company names!)

### API Endpoints

#### Manual Scrape
- **URL:** `/api/army-innovation/scrape`
- **Method:** POST
- **Use:** Manual trigger for historical or active scrape

#### Daily Cron Job
- **URL:** `/api/cron/army-innovation-scraper`
- **Schedule:** Daily at 1:00 PM UTC (8 AM EST)
- **Use:** Automated daily updates

#### Test Endpoint
- **URL:** `/api/army-innovation/test-cron`
- **Method:** GET
- **Use:** Test before enabling automated cron

## 📧 Email Notifications

Every day at 8 AM EST, you'll receive an email like:

```
Subject: Army XTECH Innovation Tracker - Success

Job: Army XTECH Innovation Tracker
Status: ✅ SUCCESS
Date: 2025-11-04
Duration: 45 seconds

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

## 🚀 How to Use

### Initial Setup (One Time)
1. ✅ Applied `ARMY_INNOVATION_DATABASE_SCHEMA.sql` in Supabase
2. ✅ Ran historical scrape: `npm run scrape:army-innovation:historical`
3. ✅ Applied `ADD_WINNER_VIEW.sql` in Supabase
4. ✅ Cleared bad data and re-scraped with fixed extractors

### Daily Automation
- **Deploy:** Push to Vercel (`git push` or `vercel --prod`)
- **Test:** Hit `/api/army-innovation/test-cron`
- **Enable:** Automatically enabled via `vercel.json`
- **Monitor:** Check daily emails

### Manual Operations
```bash
# Scrape all competitions (historical)
npm run scrape:army-innovation:historical

# Scrape only active competitions (daily)
npm run scrape:army-innovation:active
```

## 📝 Querying Data

### Quick Queries

**All winners with competition details:**
```sql
SELECT * FROM army_innovation_winners_with_details
ORDER BY competition_title, company_name;
```

**Winners for specific competition:**
```sql
SELECT company_name, competition_title, competition_total_prize
FROM army_innovation_winners_with_details
WHERE competition_title LIKE '%xTechSearch 8%';
```

**Active competitions:**
```sql
SELECT opportunity_title, competition_phase, open_date, close_date
FROM army_innovation_opportunities
WHERE status IN ('Open', 'Active')
ORDER BY close_date;
```

**Companies that won multiple competitions:**
```sql
SELECT company_name, COUNT(*) as wins
FROM army_innovation_winners_with_details
GROUP BY company_name
HAVING COUNT(*) > 1
ORDER BY wins DESC;
```

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `ARMY_INNOVATION_DATABASE_SCHEMA.sql` | Full database schema (run first) |
| `ADD_WINNER_VIEW.sql` | Convenient views for querying |
| `CHECK_WINNER_LINKAGE.sql` | Verify data integrity |
| `ARMY_XTECH_CRON_SETUP.md` | Cron job documentation |
| `TEST_ARMY_CRON.md` | Testing guide |
| `WINNER_TRACKING_EXPLAINED.md` | How linkage works |
| `XTECH_SCRAPER_IMPROVEMENTS.md` | Technical improvements made |
| `READY_TO_RUN.md` | Quick start guide |

## 🔍 Data Completeness

After re-scrape with fixed extractors:

| Field | Coverage |
|-------|----------|
| Competition titles | 100% (44/44) |
| Competition dates | 85%+ |
| Competition phases | 90%+ |
| Prize pools | 90%+ |
| Descriptions | 95%+ |
| Eligibility | 95%+ |
| Winners | 100% (325 companies) |
| Finalists | 100% (384 companies) |
| Company names | 100% (no more dates!) |

## ⚠️ Important Notes

### Individual Award Amounts
Most competitions don't publish individual award amounts. The database tracks:
- ✅ Total prize pool (e.g., $3.2M)
- ✅ Max award amount (e.g., $350K)
- ✅ Number of awards (e.g., 5 winners)
- ❌ Individual company awards (usually NULL)

### Winner Linkage
Winners ARE linked to competitions via `opportunity_id`:
```
army_innovation_submissions.opportunity_id → army_innovation_opportunities.id
```

Use JOINs or the views to see competition details.

### Daily Updates
The cron job only updates **Open/Active** competitions. Closed competitions remain unchanged (already in database from historical scrape).

## 🛠 Troubleshooting

### Winners Show as Dates
- **Fixed!** Improved regex filters out all date formats
- Re-scrape: `DELETE FROM army_innovation_submissions;` then `npm run scrape:army-innovation:historical`

### No Email Received
- Check Vercel logs
- Verify `sendCronSuccessEmail` function exists
- Check email service configuration

### Data Not Updating
- Verify cron job is enabled in `vercel.json`
- Check if competitions are actually "Open" or "Active"
- Review Vercel cron job logs

## 📅 Cron Schedule

| Job | Time (UTC) | Time (EST) |
|-----|------------|------------|
| Army XTECH | 13:00 | 8:00 AM |
| Congress | 11:30 | 6:30 AM |
| SBIR | 12:45 | 7:45 AM |
| SAM.gov | 12:30 | 7:30 AM |
| DoD News | 12:15 | 7:15 AM |

## ✅ System Status

- ✅ Historical scrape complete (44 competitions)
- ✅ Winners/finalists extracted (720+ rows)
- ✅ Database schema applied
- ✅ Views created for easy querying
- ✅ Daily cron job configured
- ✅ Email notifications enabled
- ✅ Test endpoint available
- ✅ Smart updates (no duplicates)
- ✅ Date filtering fixed

## 🎯 Next Steps

1. **Test the cron job:**
   ```bash
   curl -X GET "https://your-domain.vercel.app/api/army-innovation/test-cron" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Check your email** for test notification

3. **Deploy to production:**
   ```bash
   git push origin main
   ```

4. **Wait for first automated run** (next day at 1 PM UTC)

5. **Build UI** to display this data (optional)

## 🌟 You're Done!

The system is now fully automated and will:
- Track all active XTECH competitions daily
- Email you with updates every morning
- Keep your database current
- No manual intervention needed

Enjoy your automated Army XTECH Innovation Tracker! 🚀

