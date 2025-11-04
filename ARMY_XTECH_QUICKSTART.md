# Army XTECH Tracker - Quick Start Guide

## What This Does

Automatically scrapes and tracks Army XTECH competitions, including:
- Competition details (title, dates, descriptions, status)
- Winners and their award amounts
- Finalists and phase information
- Prize pools and funding information
- Technology focus areas

## Quick Start (3 Steps)

### 1. Set Up Database

```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Run the schema (creates all tables, indexes, views)
\i ARMY_INNOVATION_DATABASE_SCHEMA.sql
```

**This creates:**
- `army_innovation_programs` - Program definitions
- `army_innovation_opportunities` - Competition data
- `army_innovation_submissions` - Winners & finalists
- `army_innovation_documents` - Related files
- `army_innovation_scraper_log` - Tracking logs

### 2. Install Dependencies

```bash
npm install cheerio
# or
yarn add cheerio
```

### 3. Run Initial Scrape

```bash
# Historical mode: Scrapes ALL competitions (including closed ones with winners)
npm run scrape:army-innovation:historical

# OR directly with ts-node
ts-node src/lib/army-xtech-scraper.ts historical
```

**First run takes ~10-20 minutes** to scrape all historical data.

## Two Scraper Modes

### HISTORICAL Mode
- **When**: Run once initially, or when rebuilding database
- **What**: Scrapes ALL competitions (open + closed)
- **Captures**: Complete winner lists, finalists, all historical data
- **Command**: `ts-node src/lib/army-xtech-scraper.ts historical`
- **Duration**: 10-20 minutes

### ACTIVE Mode
- **When**: Run daily (automated via cron)
- **What**: Only scrapes currently open/active competitions
- **Captures**: Latest finalists, phase updates, deadline changes
- **Command**: `ts-node src/lib/army-xtech-scraper.ts active`
- **Duration**: 2-5 minutes

## Daily Automation

The system includes a cron job that runs automatically:

**File**: `src/app/api/cron/army-innovation-scraper/route.ts`

**Schedule**: Daily at 6 AM UTC

**What it does**:
- Checks all active/open XTECH competitions
- Updates finalists lists
- Tracks phase progressions
- Updates deadlines if extended

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/army-innovation-scraper",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## Manual API Control

### Trigger a Scrape

```bash
curl -X POST https://your-domain.com/api/army-innovation/scrape \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode": "active", "program": "xtech"}'
```

### Check Status

```bash
curl https://your-domain.com/api/army-innovation/scrape
```

Returns:
- Recent scraper runs
- Competition statistics
- Status by program

## Useful Database Queries

### See All Active Competitions

```sql
SELECT 
  opportunity_title,
  competition_name,
  status,
  close_date,
  total_prize_pool,
  opportunity_url
FROM army_innovation_opportunities
WHERE status = 'Open'
ORDER BY close_date ASC;
```

### View All Winners

```sql
SELECT 
  o.competition_name,
  s.company_name,
  s.award_amount,
  s.company_location
FROM army_innovation_opportunities o
JOIN army_innovation_submissions s ON o.id = s.opportunity_id
WHERE s.submission_status = 'Winner'
ORDER BY s.award_amount DESC;
```

### Get Upcoming Deadlines

```sql
SELECT * FROM army_innovation_upcoming_deadlines
WHERE days_until_close <= 30;
```

### Competition Stats by Year

```sql
SELECT * FROM army_innovation_competition_stats;
```

## File Structure

```
ARMY_INNOVATION_DATABASE_SCHEMA.sql          # Database setup
src/lib/army-xtech-scraper.ts                # Main scraper
src/app/api/army-innovation/scrape/route.ts  # Manual API endpoint
src/app/api/cron/army-innovation-scraper/route.ts  # Daily cron
ARMY_INNOVATION_IMPLEMENTATION.md            # Full documentation
ARMY_XTECH_QUICKSTART.md                     # This file
```

## Example Output

When you run the historical scrape:

```
[XTECH Scraper] 📊 Starting HISTORICAL scrape of all XTECH competitions...
[XTECH Scraper] 📊 Found 25 competition cards to process
[XTECH Scraper] 📊 Processing competition 1/25...
[XTECH Scraper] 📊 Fetching details from: https://xtech.army.mil/xtech-search-40/
[XTECH Scraper] 📊 Saved 12 winners
[XTECH Scraper] 📊 Saved 24 finalists
[XTECH Scraper] ✅ Saved: xTechSearch 4.0 (1/25)
...
[XTECH Scraper] ✅ Historical scrape completed successfully!
[XTECH Scraper] ==========================================
[XTECH Scraper] XTECH Scraper Statistics
[XTECH Scraper] ==========================================
[XTECH Scraper] Competitions Found: 25
[XTECH Scraper] Competitions Processed: 25
[XTECH Scraper] Competitions Inserted: 25
[XTECH Scraper] Winners Found: 78
[XTECH Scraper] Finalists Found: 142
[XTECH Scraper] Errors: 0
[XTECH Scraper] ==========================================
```

## Data You Get

For each competition:
- Title and competition name
- Status (Open, Closed, Announced)
- All important dates
- Full descriptions and problem statements
- Technology focus areas
- Prize pools and award amounts
- Complete winner lists with company names
- Finalist information
- Links to competition pages

For each winner/finalist:
- Company name
- Award amount (for winners)
- Location
- Phase information
- Technology area
- Description/abstract

## Next Steps

1. ✅ Run database setup script
2. ✅ Install dependencies
3. ✅ Run historical scrape
4. ⏭️ Set up daily cron (automatic with Vercel)
5. ⏭️ Add admin dashboard controls (optional)
6. ⏭️ Integrate with your existing tools

## Troubleshooting

**No competitions found?**
- Check https://xtech.army.mil/competitions/ is accessible
- Website structure may have changed (update selectors in scraper)

**Duplicates in database?**
- Scraper uses UPSERT, so duplicates shouldn't happen
- Check `opportunity_number` generation logic

**Missing winners?**
- Some competitions may not have public winner lists yet
- Check individual competition pages manually

**Scraper errors?**
- Check `army_innovation_scraper_log` table for details
- Verify environment variables are set
- Check network connectivity

## Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_secret_for_cron_auth
```

## That's It!

You now have a fully automated Army XTECH competition tracker that:
- Captures all historical competition data
- Tracks winners and finalists
- Updates daily with active competition changes
- Provides API access for integration
- Stores everything in a structured database

For more details, see `ARMY_INNOVATION_IMPLEMENTATION.md`

