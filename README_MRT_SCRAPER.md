# Make Ready Tech - DOD Contract News Scraper

## Overview

Complete, production-ready scraper that extracts DOD contract awards from defense.gov and saves directly to the unified `opportunity_master` table.

**Key Features:**
- ✅ Extracts vehicle types (IDIQ, Sole Source, Multiple Award)
- ✅ Handles modifications, FMS, SBIR contracts
- ✅ Saves directly to `opportunity_master` + `opportunity_sources`
- ✅ Generates canonical keys for cross-source linking
- ✅ Calculates data quality scores
- ✅ Full audit trail and provenance

---

## Quick Start

### 1. Prerequisites

**Install Supabase Schema:**
```sql
-- In Supabase SQL Editor, run these files:
-- 1. /Users/matthewbaumeister/Documents/MRT_WEBSITE/OPPORTUNITY_MASTER_SCHEMA.sql
-- 2. /Users/matthewbaumeister/Documents/MRT_WEBSITE/RUN_THIS_FIRST.sql
```

**Verify Schema:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('opportunity_master', 'opportunity_sources');

SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'make_canonical_opportunity_key';
```

### 2. Environment Setup

Ensure `.env` or `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Scraper

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx make-ready-tech-dod-scraper.ts
```

---

## What It Does

### Scrapes 10 Most Recent Articles
- Finds latest DOD contract news from defense.gov
- Extracts all contract paragraphs
- Parses contract details using regex + pattern matching

### Extracted Fields

**Basic:**
- Vendor name, location (city, state)
- Contract number
- Award amount
- Service branch
- Contracting activity
- Completion date

**Enhanced (THE IMPORTANT STUFF!):**
- **Vehicle type**: IDIQ, Sole Source, Multiple Award
- **Contract types**: Firm-fixed-price, cost-plus, T&M, etc.
- **Competition**: Sole source, full and open, number of offers
- **Set-aside**: 8(a), SDVOSB, WOSB, HUBZone, etc.
- **Modifications**: Identifies mods, option exercises
- **Small business flags**
- **NAICS codes**
- **SBIR/STTR identification**

### Saves to opportunity_master

Each contract becomes one record with:
- **Canonical key**: Deterministic, stable ID for linking
- **All normalized fields**: Direct columns for fast queries
- **Source attributes**: Full provenance in JSONB
- **Quality score**: 0-100 based on completeness

### Also Saves to opportunity_sources

Full audit trail:
- Link to original article
- Raw paragraph text
- Parsing confidence
- Match method

---

## Output Example

```
============================================================
  MAKE READY TECH - DOD CONTRACT NEWS SCRAPER
============================================================

🔍 Finding 10 most recent contract news articles...

✅ Found 10 articles

────────────────────────────────────────────────────────────
📰 Article 1/10
   Contracts For November 20, 2024
   2024-11-20
────────────────────────────────────────────────────────────

   📄 Found 15 contracts

[MRT]   ✅ Lockheed Martin Corp.
[MRT]   💰 $45.2 million
[MRT]   🚗 IDIQ
[MRT]   📊 Quality: 85/100

[MRT]   ✅ Raytheon Company
[MRT]   💰 $12.5 million
[MRT]   🚗 Sole Source
[MRT]   📊 Quality: 80/100

... (more contracts)

============================================================
  SUMMARY
============================================================
  Articles: 10
  Contracts found: 150
  Contracts saved: 148
  Success rate: 99%
============================================================

✅ Scraping complete!
```

---

## Verify Results

After running, check Supabase:

```sql
-- Count opportunities created
SELECT COUNT(*) FROM opportunity_master;

-- View recent opportunities
SELECT 
  id,
  title,
  opportunity_type,
  vehicle_type,        -- 🚗 KEY FIELD!
  status,
  customer_agency,
  estimated_value,
  data_quality_score
FROM opportunity_master
ORDER BY created_at DESC
LIMIT 10;

-- Vehicle types distribution
SELECT 
  vehicle_type,
  COUNT(*) AS count
FROM opportunity_master
WHERE vehicle_type IS NOT NULL
GROUP BY vehicle_type
ORDER BY count DESC;

-- Source provenance
SELECT 
  os.source_name,
  os.match_confidence,
  om.title,
  om.vehicle_type,
  om.estimated_value
FROM opportunity_sources os
JOIN opportunity_master om ON os.opportunity_id = om.id
ORDER BY os.ingested_at DESC
LIMIT 10;
```

**Expected Results:**
- ✅ 100-200 contracts from 10 articles
- ✅ `vehicle_type` populated: "IDIQ", "Sole Source", "Multiple Award", etc.
- ✅ `data_quality_score` between 60-95
- ✅ All contracts in both `opportunity_master` and `opportunity_sources`

---

## Configuration

### Change Number of Articles

Edit the scraper file:

```typescript
// Line ~1014: Change limit
const articles = await findRecentArticles(10);  // Change 10 to desired number
```

### Run Full Historical Scrape

To scrape all 44,000 opportunities, you'll need to:

1. **Test first** (done with 10 articles)
2. **Increase limit** to scrape more pages
3. **Add date range** to scrape historical articles
4. **Run in batches** to avoid timeouts

Example modification:
```typescript
// Instead of recent articles, scrape date range
async function scrapeHistoricalArticles(startDate: Date, endDate: Date) {
  // Implement pagination through all pages
  // Process each article
  // Save to opportunity_master
}
```

---

## Architecture

### Key Functions

1. **`findRecentArticles(limit)`** - Finds N most recent articles
2. **`fetchArticleHTML(url)`** - Fetches HTML with Puppeteer
3. **`parseArticleHTML(html)`** - Extracts contract paragraphs
4. **`extractContractData(text)`** - Parses contract details (regex)
5. **`generateCanonicalKey()`** - Creates unique opportunity ID
6. **`determineVehicleType()`** - Identifies IDIQ, sole source, etc.
7. **`saveToOpportunityMaster()`** - Saves to database

### Data Flow

```
defense.gov articles
    ↓
Fetch HTML (Puppeteer)
    ↓
Parse paragraphs (Cheerio)
    ↓
Extract contract data (Regex)
    ↓
Generate canonical key (Postgres function)
    ↓
Save to opportunity_master
    ↓
Save to opportunity_sources
    ↓
Done!
```

---

## Troubleshooting

### "Function make_canonical_opportunity_key does not exist"
**Solution**: Run `OPPORTUNITY_MASTER_SCHEMA.sql` first

### "Table opportunity_master does not exist"
**Solution**: Run `OPPORTUNITY_MASTER_SCHEMA.sql` first

### "403 Forbidden"
**Solution**: Scraper uses Puppeteer to bypass. Wait and retry.

### "Duplicate key violation"
**Solution**: This is OK! Means the opportunity already exists. The scraper will update it.

### No vehicle types showing
**Check extraction logic**: The scraper looks for "IDIQ", "sole source", "multiple award" in text. Verify these exist in the articles.

---

## Next Steps

1. ✅ **Test with 10 articles** (you'll do this first)
2. ⏳ **Verify results** in Supabase
3. ⏳ **Run for more articles** (increase limit to 100)
4. ⏳ **Run full historical scrape** (all 44,000)
5. ⏳ **Schedule daily runs** (cron job or Vercel cron)

---

## Files

- `make-ready-tech-dod-scraper.ts` - Main scraper (THIS FILE)
- `README_MRT_SCRAPER.md` - This documentation

## Copyright

Copyright © 2024 Make Ready Tech  
All rights reserved.

