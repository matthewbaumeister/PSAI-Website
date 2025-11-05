# DOD ManTech Scraper - Implementation Summary

## What Was Built

A complete scraping system for DOD Manufacturing Technology (ManTech) projects from **dodmantech.mil**.

### Components Created

1. **Database Schema** (`supabase/migrations/create_mantech_projects.sql`)
   - `mantech_projects` - Main projects table (50+ fields)
   - `mantech_company_mentions` - Company involvement tracking
   - `mantech_scraper_log` - Scraper run history
   - Views, functions, and triggers for data quality

2. **Scraper Library** (`src/lib/mantech-scraper.ts`)
   - Puppeteer-based HTML fetching
   - Cheerio-based content parsing
   - Intelligent data extraction (companies, technologies, TRL/MRL, funding, etc.)
   - Database integration
   - Quality scoring

3. **Cron API Endpoint** (`src/app/api/cron/scrape-mantech/route.ts`)
   - Automated daily scraping
   - Email notifications (success/failure)
   - Progress logging
   - Error handling

4. **CLI Scripts**
   - `src/scripts/mantech-news-scraper.ts` - Daily news scraper
   - `src/scripts/mantech-historical-scraper.ts` - Historical backfill
   - `check-mantech-status.ts` - Status checker

5. **NPM Scripts** (added to `package.json`)
   ```bash
   npm run scrape:mantech:news         # Daily news scrape
   npm run scrape:mantech:historical   # Historical backfill
   npm run check:mantech               # Status checker
   ```

6. **Documentation**
   - `MANTECH_SCRAPER_GUIDE.md` - Complete user guide
   - `MANTECH_SCRAPER_SUMMARY.md` - This file
   - Updated `ALL_SCRAPERS_REFERENCE.md`

7. **Cron Schedule** (added to `vercel.json`)
   - Runs daily at 1:15 PM UTC (9:15 AM EST)

---

## What Data It Collects

### From dodmantech.mil News Articles

**Technology Projects:**
- Project names and descriptions
- Technology focus areas (AI, additive manufacturing, composites, etc.)
- Manufacturing processes
- TRL (Technology Readiness Level 1-9)
- MRL (Manufacturing Readiness Level 1-10)

**Companies & Partners:**
- Prime contractors
- Industry partners
- Academic institutions (universities)
- Manufacturing Innovation Institutes (America Makes, MxD, LIFT, etc.)
- Team composition and roles

**Transition Data:**
- Current stage (research → development → prototype → production → fielded)
- Source (e.g., "SBIR Phase II")
- Target program (Program of Record)
- Weapon systems/platforms

**Financial Information:**
- Funding amounts
- Cost savings
- Fiscal year
- Investment type

**Geographic Data:**
- Performance locations (cities, states)
- Facility names

**Cross-References:**
- SBIR/STTR linkages
- Contract numbers
- Related initiatives

---

## How It Works

### Daily Workflow

```
1:15 PM UTC Daily
    ↓
Vercel Cron triggers /api/cron/scrape-mantech
    ↓
Scraper fetches last 10 articles from dodmantech.mil/News/
    ↓
For each article:
  - Download HTML with Puppeteer
  - Parse content with Cheerio
  - Extract 50+ data fields
  - Save to database
    ↓
Email notification sent (success/failure)
    ↓
Done! ✓
```

### Data Extraction Pipeline

```
HTML → Parse Article → Extract Companies → Extract Tech Focus
                    ↓
                Save to DB
                    ↓
      Generate Company Mentions Table
                    ↓
        Calculate Quality Score
                    ↓
          Flag for Review (if needed)
```

---

## Setup Instructions

### 1. Apply Database Migration

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Apply migration to Supabase
psql $DATABASE_URL -f supabase/migrations/create_mantech_projects.sql
```

### 2. Run Initial Historical Scrape

```bash
# Backfill historical articles (one-time)
npm run scrape:mantech:historical
```

This will:
- Fetch up to 200 historical articles
- Take 30-60 minutes
- Create baseline data

### 3. Verify Cron is Scheduled

The cron job is already configured in `vercel.json`:
- **Endpoint:** `/api/cron/scrape-mantech`
- **Schedule:** `15 13 * * *` (1:15 PM UTC daily)

Deploy to activate:
```bash
npm run deploy
```

### 4. Check Status

```bash
npm run check:mantech
```

**Output:**
- Recent scraper runs (last 5)
- Database statistics (total projects, companies)
- Projects by component (Army, Navy, Air Force, DLA, OSD)
- Most recent projects
- Top 10 companies

---

## Usage Examples

### Daily News Scrape

```bash
# Default: last 20 articles
npm run scrape:mantech:news

# Custom limit
tsx src/scripts/mantech-news-scraper.ts 50
```

### Historical Scrape

```bash
# Backfill up to 200 articles
npm run scrape:mantech:historical
```

### Check Status

```bash
npm run check:mantech
```

### Query Data

```sql
-- Recent projects
SELECT 
  article_title,
  mantech_component,
  technology_focus,
  prime_contractor,
  funding_amount,
  transition_stage
FROM mantech_projects
ORDER BY published_date DESC NULLS LAST
LIMIT 20;

-- Top companies
SELECT 
  company_name,
  COUNT(*) as projects,
  STRING_AGG(DISTINCT m.mantech_component, ', ') as components
FROM mantech_company_mentions cm
JOIN mantech_projects m ON cm.project_id = m.id
GROUP BY company_name
ORDER BY projects DESC
LIMIT 20;

-- Technology trends
SELECT 
  unnest(technology_focus) as technology,
  COUNT(*) as projects
FROM mantech_projects
WHERE technology_focus IS NOT NULL
GROUP BY technology
ORDER BY projects DESC;

-- SBIR to ManTech transitions
SELECT 
  m.sbir_company_name,
  m.technology_focus,
  m.transition_stage,
  s.phase,
  s.award_amount
FROM mantech_projects m
JOIN sbir_final s 
  ON LOWER(m.sbir_company_name) = LOWER(s.company_name)
WHERE m.sbir_linked = TRUE;
```

---

## Integration with Existing Scrapers

### Complete Defense Intelligence Pipeline

```
┌─────────────────────────────────────────────────────────┐
│              DEFENSE TECHNOLOGY PIPELINE                │
└─────────────────────────────────────────────────────────┘

Research Phase
    ↓
[SBIR/STTR Scraper]
81,000+ research opportunities
dodsbirsttr.mil
    ↓
Technology Transition
    ↓
[ManTech Scraper] ← YOU ARE HERE
Manufacturing tech projects
dodmantech.mil
    ↓
Contract Awards
    ↓
[DOD Contract News Scraper]
Daily contract announcements
defense.gov/News/Contracts/
    ↓
Fielded Systems
```

### Cross-Reference Queries

**Link ManTech to SBIR:**
```sql
SELECT 
  m.article_title,
  m.technology_focus,
  m.transition_stage,
  s.company_name,
  s.phase,
  s.award_amount
FROM mantech_projects m
JOIN sbir_final s 
  ON s.company_name = ANY(m.companies_involved)
ORDER BY m.published_date DESC;
```

**Link ManTech to Contracts:**
```sql
SELECT 
  m.article_title,
  m.prime_contractor,
  m.funding_amount as mantech_funding,
  c.vendor_name,
  c.award_amount as contract_amount,
  c.contract_number
FROM mantech_projects m
JOIN dod_contract_news c 
  ON LOWER(m.prime_contractor) = LOWER(c.vendor_name)
  AND ABS(m.published_date - c.published_date) < 90
ORDER BY m.published_date DESC;
```

---

## Monitoring & Maintenance

### Email Notifications

**Success Email (Daily):**
- Articles found
- Projects saved
- Total projects in database
- Most recent article

**Failure Email:**
- Error message
- Duration
- Last successful run

### Check Scraper Logs

```sql
SELECT 
  scrape_date,
  status,
  articles_found,
  projects_created,
  companies_extracted,
  duration_seconds
FROM mantech_scraper_log
ORDER BY started_at DESC
LIMIT 10;
```

### Monitor Data Quality

```sql
-- Average quality score over time
SELECT 
  DATE_TRUNC('week', scraped_at) as week,
  AVG(data_quality_score) as avg_quality,
  COUNT(*) as projects
FROM mantech_projects
GROUP BY week
ORDER BY week DESC;

-- Low confidence projects (need review)
SELECT 
  article_title,
  parsing_confidence,
  data_quality_score
FROM mantech_projects
WHERE parsing_confidence < 0.5
  OR data_quality_score < 50
ORDER BY scraped_at DESC;
```

---

## Key Features

### 1. Technology Identification

Automatically detects 10+ technology areas:
- Additive manufacturing / 3D printing
- Advanced composites
- AI/ML
- Robotics & automation
- Advanced materials
- Digital manufacturing
- Supply chain
- Cybersecurity
- Hypersonics
- Microelectronics

### 2. Company Network Analysis

Tracks company roles:
- **Prime contractors** - Lead companies
- **Partners** - Industry collaborators
- **Subcontractors** - Supporting companies
- **Collaborators** - Academic/research partners
- **Suppliers** - Supply chain participants

### 3. Technology Readiness Tracking

**TRL (Technology Readiness Level):**
- 1-3: Basic research
- 4-6: Technology development
- 7-8: System development
- 9: System fielded

**MRL (Manufacturing Readiness Level):**
- 1-3: Manufacturing feasibility
- 4-6: Manufacturing development
- 7-9: Manufacturing capability
- 10: Full-rate production

### 4. Manufacturing Innovation Institutes

Identifies involvement of 14 MIIs:
- America Makes (additive manufacturing)
- MxD (digital manufacturing)
- LIFT (lightweight materials)
- NextFlex (flexible electronics)
- BioFabUSA (biomanufacturing)
- And 9 more...

### 5. Cross-Reference Intelligence

Links to:
- SBIR/STTR projects (technology origin)
- DOD contract awards (funding)
- FPDS contracts (detailed contract data)
- Weapon systems/platforms (applications)

---

## Data Quality Metrics

### Quality Score (0-100)

- **90-100:** Excellent - All key fields extracted
- **70-89:** Good - Most fields extracted
- **50-69:** Fair - Basic fields extracted
- **< 50:** Poor - Minimal data extracted

### Parsing Confidence (0.0-1.0)

- **0.9+:** High confidence
- **0.7-0.9:** Medium confidence
- **0.5-0.7:** Low confidence
- **< 0.5:** Very low confidence (flagged for review)

---

## What's Next?

### Recommended Actions

1. **Run Historical Scrape:**
   ```bash
   npm run scrape:mantech:historical
   ```

2. **Deploy to Vercel:**
   ```bash
   npm run deploy
   ```

3. **Verify Cron is Running:**
   - Check Vercel dashboard
   - Wait for next scheduled run (1:15 PM UTC)
   - Check email for notification

4. **Explore the Data:**
   ```bash
   npm run check:mantech
   ```

5. **Link to SBIR/Contracts:**
   - Run cross-reference queries
   - Identify technology transitions
   - Track companies across pipeline

### Future Enhancements

- **Branch-Specific Scrapers** - Scrape Army, Navy, Air Force, DLA, OSD pages individually
- **Project Deep Dive** - Extract more detailed project information
- **Timeline Tracking** - Track project milestones over time
- **Automatic Linking** - Auto-link to SBIR/contracts based on company names
- **Alert System** - Notify when specific companies/technologies appear

---

## Files Created

```
Database:
✓ supabase/migrations/create_mantech_projects.sql

Scraper Library:
✓ src/lib/mantech-scraper.ts

API Endpoint:
✓ src/app/api/cron/scrape-mantech/route.ts

CLI Scripts:
✓ src/scripts/mantech-news-scraper.ts
✓ src/scripts/mantech-historical-scraper.ts
✓ check-mantech-status.ts

Documentation:
✓ MANTECH_SCRAPER_GUIDE.md
✓ MANTECH_SCRAPER_SUMMARY.md
✓ ALL_SCRAPERS_REFERENCE.md (updated)

Configuration:
✓ package.json (updated)
✓ vercel.json (updated)
```

---

## Summary

You now have a **complete ManTech scraping system** that:

1. Scrapes manufacturing technology news from dodmantech.mil
2. Extracts 50+ fields per project
3. Tracks companies, technologies, and transitions
4. Links to SBIR/STTR and contracts
5. Runs automatically daily
6. Sends email notifications
7. Provides comprehensive data quality metrics

**Next step:** Run the historical scrape and deploy!

```bash
npm run scrape:mantech:historical
npm run deploy
```

---

## Support

For issues or questions:
1. Check `MANTECH_SCRAPER_GUIDE.md` for detailed documentation
2. Run `npm run check:mantech` to diagnose issues
3. Check scraper logs in database: `mantech_scraper_log`
4. Review email notifications for errors

**All done!** The ManTech scraper is ready to use.

