# Army Innovation Tracking System - Implementation Guide

## Overview

This system tracks Army XTECH and FUZE innovation opportunities, competitions, winners, and finalists. It includes automated scraping, database storage, and API access.

## Architecture

### Database Schema

**File**: `ARMY_INNOVATION_DATABASE_SCHEMA.sql`

Five main tables:
1. **army_innovation_programs** - Program definitions (XTECH, FUZE)
2. **army_innovation_opportunities** - Individual competitions
3. **army_innovation_submissions** - Winners and finalists
4. **army_innovation_documents** - Related documents
5. **army_innovation_scraper_log** - Scraping activity logs

### Scraper

**File**: `src/lib/army-xtech-scraper.ts`

Two operational modes:

#### Historical Mode
- **Purpose**: One-time comprehensive scrape of ALL competitions
- **Scope**: Closed and historical competitions with full winner data
- **Run**: Once initially, or when rebuilding database
- **Command**: `ts-node src/lib/army-xtech-scraper.ts historical`
- **Duration**: ~10-30 minutes depending on number of competitions

#### Active Mode
- **Purpose**: Daily updates of open/active competitions only
- **Scope**: Only competitions currently accepting submissions
- **Run**: Daily via cron job
- **Command**: `ts-node src/lib/army-xtech-scraper.ts active`
- **Duration**: ~2-5 minutes

### Data Captured

For each competition:
- **Basic Info**: Title, competition name, year, type, status
- **Dates**: Announced, open, close, winner announcement dates
- **Description**: Problem statement, challenge description, requirements
- **Technology**: Focus areas, keywords, modernization priorities
- **Funding**: Prize pool, award amounts, number of awards
- **Winners**: Company names, award amounts, placement, descriptions
- **Finalists**: Company names, phase information, descriptions
- **Links**: Competition page, registration, submission portals

## Setup Instructions

### 1. Database Setup

```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Run the schema file
\i ARMY_INNOVATION_DATABASE_SCHEMA.sql
```

This creates:
- All necessary tables with indexes
- Views for easy querying
- Functions for date calculations
- Triggers for auto-updates
- Seed data for XTECH and FUZE programs

### 2. Install Dependencies

```bash
npm install cheerio
# or
yarn add cheerio
```

### 3. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_cron_secret
```

### 4. Initial Historical Scrape

Run the historical scraper once to populate the database:

```bash
# Make sure environment variables are loaded
source .env.local

# Run historical scrape
npm run scrape:army-innovation:historical

# OR directly with ts-node
ts-node src/lib/army-xtech-scraper.ts historical
```

This will:
- Scrape all competitions from https://xtech.army.mil/competitions/
- Extract winners and finalists
- Save all data to the database
- Create scraper log entries

**Expected Output:**
```
[XTECH Scraper] 📊 Starting HISTORICAL scrape of all XTECH competitions...
[XTECH Scraper] 📊 Found 25 competition cards to process
[XTECH Scraper] 📊 Processing competition 1/25...
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
[XTECH Scraper] ==========================================
```

## API Endpoints

### 1. Manual Scraper Trigger

**POST** `/api/army-innovation/scrape`

Manually trigger a scrape (requires authentication).

**Request Body:**
```json
{
  "mode": "historical",  // or "active"
  "program": "xtech"     // or "fuze" or "all"
}
```

**Response:**
```json
{
  "success": true,
  "mode": "historical",
  "program": "xtech",
  "scrapers": [
    {
      "program": "xtech",
      "competitionsFound": 25,
      "competitionsProcessed": 25,
      "competitionsInserted": 20,
      "competitionsUpdated": 5,
      "winnersFound": 78,
      "finalistsFound": 142,
      "errors": 0
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST https://your-domain.com/api/army-innovation/scrape \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode": "active", "program": "xtech"}'
```

### 2. Scraper Status

**GET** `/api/army-innovation/scrape`

Get current scraper status and statistics.

**Response:**
```json
{
  "success": true,
  "recentLogs": [
    {
      "id": 1,
      "scrape_type": "xtech",
      "scrape_target": "historical",
      "status": "completed",
      "records_found": 25,
      "records_inserted": 25,
      "started_at": "2025-11-04T12:00:00Z",
      "completed_at": "2025-11-04T12:15:00Z"
    }
  ],
  "stats": {
    "total": 25,
    "byStatus": {
      "Open": 3,
      "Closed": 22
    },
    "byProgram": {
      "XTECH": 25
    }
  }
}
```

### 3. Cron Job Endpoint

**GET** `/api/cron/army-innovation-scraper`

Automated daily scraper (runs in ACTIVE mode only).

**Vercel Cron Configuration** (in `vercel.json`):
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

Runs daily at 6 AM UTC.

## Database Queries

### Get All Active Competitions

```sql
SELECT * FROM active_army_innovation_opportunities
ORDER BY close_date ASC;
```

### Get Upcoming Deadlines

```sql
SELECT * FROM army_innovation_upcoming_deadlines
WHERE days_until_close <= 30
ORDER BY days_until_close ASC;
```

### Get Competitions with Largest Prize Pools

```sql
SELECT * FROM army_innovation_prize_summary
WHERE total_prize_pool IS NOT NULL
ORDER BY total_prize_pool DESC
LIMIT 10;
```

### Get All Winners for a Competition

```sql
SELECT 
  o.opportunity_title,
  o.competition_name,
  s.company_name,
  s.award_amount,
  s.company_location,
  s.public_abstract
FROM army_innovation_opportunities o
JOIN army_innovation_submissions s ON o.id = s.opportunity_id
WHERE o.opportunity_number = 'xtech-search-40'
  AND s.submission_status = 'Winner'
ORDER BY s.award_amount DESC;
```

### Get Competition Statistics by Year

```sql
SELECT 
  competition_year,
  COUNT(*) as total_competitions,
  SUM(total_prize_pool) as total_prize_money,
  COUNT(DISTINCT id) FILTER (WHERE status = 'Open') as open_count,
  AVG(actual_participants) as avg_participants
FROM army_innovation_opportunities
WHERE program_name = 'XTECH'
  AND competition_year IS NOT NULL
GROUP BY competition_year
ORDER BY competition_year DESC;
```

### Find Small Business Winners

```sql
SELECT 
  s.company_name,
  COUNT(DISTINCT s.opportunity_id) as wins,
  SUM(s.award_amount) as total_winnings,
  ARRAY_AGG(DISTINCT o.competition_name) as competitions_won
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
WHERE s.submission_status = 'Winner'
  AND s.is_small_business = true
GROUP BY s.company_name
ORDER BY wins DESC, total_winnings DESC;
```

## Maintenance Functions

### Update Date Calculations

Run daily to keep date-based fields current:

```sql
SELECT update_army_innovation_date_calculations();
```

### Auto-Update Competition Status

Automatically transition competitions based on dates:

```sql
SELECT auto_update_army_innovation_status();
```

### Refresh Company Stats

Update aggregated statistics:

```sql
-- This function will be used when we add company tracking
-- SELECT update_army_innovation_company_stats();
```

## Monitoring & Logging

### Check Recent Scraper Runs

```sql
SELECT 
  scrape_type,
  scrape_target,
  status,
  records_found,
  records_inserted,
  records_updated,
  records_errors,
  started_at,
  completed_at,
  duration_seconds
FROM army_innovation_scraper_log
ORDER BY started_at DESC
LIMIT 10;
```

### Identify Failed Scrapes

```sql
SELECT * FROM army_innovation_scraper_log
WHERE status = 'failed'
ORDER BY started_at DESC;
```

## Troubleshooting

### Scraper Not Finding Competitions

1. **Check website structure**: Visit https://xtech.army.mil/competitions/
2. **Verify selectors**: The scraper looks for `.competition-card` or `.card` classes
3. **Check rate limiting**: Scraper waits 2 seconds between requests
4. **Review logs**: Check `army_innovation_scraper_log` table

### Duplicate Competitions

The scraper uses `UPSERT` with unique constraints on:
- `opportunity_number` + `program_name`

If duplicates occur:
```sql
-- Find duplicates
SELECT opportunity_title, COUNT(*) 
FROM army_innovation_opportunities
GROUP BY opportunity_title
HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
DELETE FROM army_innovation_opportunities a
USING army_innovation_opportunities b
WHERE a.id < b.id
  AND a.opportunity_title = b.opportunity_title;
```

### Missing Winners/Finalists

Winners and finalists are extracted from competition detail pages. If missing:

1. Check if the competition has a detail page URL
2. Manually inspect the competition page structure
3. Update the scraper's `extractWinners()` and `extractFinalists()` methods

## Future Enhancements

### Phase 1 (Current)
- ✅ Database schema
- ✅ XTECH historical scraper
- ✅ XTECH active scraper
- ✅ API endpoints
- ✅ Cron job automation

### Phase 2 (Planned)
- [ ] FUZE program scraper
- [ ] Challenge.gov integration
- [ ] Email notifications for new competitions
- [ ] Admin dashboard UI
- [ ] User favorites/saved searches

### Phase 3 (Future)
- [ ] Machine learning for opportunity matching
- [ ] Historical trend analysis
- [ ] Success rate predictions
- [ ] Automated proposal templates
- [ ] Integration with SBIR data

## Scripts to Add to package.json

```json
{
  "scripts": {
    "scrape:army-innovation:historical": "ts-node src/lib/army-xtech-scraper.ts historical",
    "scrape:army-innovation:active": "ts-node src/lib/army-xtech-scraper.ts active"
  }
}
```

## Testing

### Test Historical Scrape (Dry Run)

```bash
# Test without saving to database
# (Modify scraper to add --dry-run flag)
ts-node src/lib/army-xtech-scraper.ts historical --dry-run
```

### Test API Endpoints

```bash
# Test scraper status
curl https://your-domain.com/api/army-innovation/scrape

# Test manual trigger (with auth)
curl -X POST https://your-domain.com/api/army-innovation/scrape \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode": "active", "program": "xtech"}'
```

## Data Validation

After running the scraper, validate the data:

```sql
-- Check for competitions
SELECT COUNT(*) FROM army_innovation_opportunities;

-- Check for winners
SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Winner';

-- Check for finalists
SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Finalist';

-- Check for missing dates
SELECT opportunity_title, status, open_date, close_date
FROM army_innovation_opportunities
WHERE status = 'Open' AND (open_date IS NULL OR close_date IS NULL);

-- Check for missing prize data
SELECT opportunity_title, status, total_prize_pool
FROM army_innovation_opportunities
WHERE status IN ('Open', 'Closed') AND total_prize_pool IS NULL;
```

## Contact & Support

For issues or enhancements:
1. Check the scraper logs: `army_innovation_scraper_log`
2. Review the implementation files
3. Test manually with `ts-node`
4. Check Vercel cron logs if automated scraping fails

## Summary

This implementation provides:
- **Comprehensive database** for Army innovation opportunities
- **Two-mode scraper** (historical + active)
- **Automated daily updates** via cron
- **API access** for manual triggers and monitoring
- **Robust data model** supporting winners, finalists, and detailed competition info

The system is designed to scale to other innovation programs (FUZE, Challenge.gov) with minimal modifications.

