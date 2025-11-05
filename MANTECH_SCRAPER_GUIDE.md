# DOD ManTech Projects Scraper - Complete Guide

## Overview

The ManTech scraper automatically collects manufacturing technology news and projects from **dodmantech.mil** across all military branches.

**Key Features:**
- Scrapes news articles from the main ManTech site
- Extracts technology projects, companies, and transition data
- Links to SBIR/STTR projects and defense contracts
- Tracks 5 ManTech components: Army, Navy, Air Force, DLA, OSD
- Identifies technology transitions (R&D → Production → Fielded)

**Data Sources:**
- Main News: https://www.dodmantech.mil/News/
- Army ManTech: https://www.dodmantech.mil/JDMTP/Army-ManTech/
- Navy ManTech: https://www.dodmantech.mil/JDMTP/Navy-ManTech/
- Air Force ManTech: https://www.dodmantech.mil/JDMTP/Air-Force-ManTech/
- DLA ManTech: https://www.dodmantech.mil/JDMTP/DLA-ManTech/
- OSD ManTech: https://www.dodmantech.mil/JDMTP/OSD-ManTech/

---

## Quick Start

### Installation

The scraper is already integrated into your system. Dependencies are installed via npm:

```bash
npm install
```

### Run Your First Scrape

```bash
# Scrape recent news (last 20 articles)
npm run scrape:mantech:news

# Check scraper status
npm run check:mantech
```

---

## How It Works

### 1. Article Discovery

The scraper navigates to the ManTech news page and finds all article links:

```
https://www.dodmantech.mil/News/
  ↓
Finds articles: /News/News-Display/Article/3981590/...
  ↓
Converts to full URLs and visits each
```

### 2. Data Extraction

For each article, the scraper extracts:

**Basic Information:**
- Article title, date, content
- ManTech component (Army, Navy, Air Force, etc.)

**Technology Details:**
- Technology focus areas (AI, additive manufacturing, composites, etc.)
- Manufacturing processes
- TRL (Technology Readiness Level: 1-9)
- MRL (Manufacturing Readiness Level: 1-10)

**Companies & Partners:**
- Prime contractors
- Industry partners
- Academic institutions (universities)
- Manufacturing Innovation Institutes (America Makes, MxD, etc.)

**Transition Information:**
- Current stage (research, development, prototype, production, fielded)
- Transition source (e.g., "SBIR Phase II")
- Target program (Program of Record)
- Weapon systems/platforms

**Financial Data:**
- Funding amounts
- Cost savings
- Fiscal year

**Geographic Data:**
- Locations where work is performed
- States involved

**Cross-References:**
- SBIR/STTR linkages
- Related contract numbers

### 3. Database Storage

All extracted data is stored in:
- `mantech_projects` - Main project data
- `mantech_company_mentions` - Company involvement tracking
- `mantech_scraper_log` - Scraper run history

---

## Database Schema

### Main Table: `mantech_projects`

Key fields:

```sql
-- Article metadata
article_id, article_url, article_title, published_date

-- ManTech component
mantech_component (Army, Navy, Air Force, DLA, OSD)

-- Technology
technology_focus[], manufacturing_processes[]
technology_readiness_level (1-9)
manufacturing_readiness_level (1-10)

-- Companies
companies_involved[], prime_contractor
industry_partners[], academic_partners[]
manufacturing_innovation_institutes[]

-- Transition
transition_stage (research, development, prototype, production, fielded)
transition_from, transition_to, program_of_record

-- Funding
funding_amount, fiscal_year, cost_savings_estimated

-- Systems
weapon_systems[], platforms[]

-- Cross-references
sbir_linked, contract_linked
```

### Company Tracking: `mantech_company_mentions`

Links companies to projects with roles:
- `prime` - Prime contractor
- `partner` - Industry partner
- `collaborator` - Academic/research partner
- `subcontractor` - Subcontractor
- `supplier` - Supplier

---

## Usage

### NPM Scripts

```bash
# Daily News Scrape (last 20 articles)
npm run scrape:mantech:news

# Historical Scrape (up to 200 articles)
npm run scrape:mantech:historical

# Check Status
npm run check:mantech
```

### Manual CLI Usage

```bash
# Scrape specific number of articles
tsx src/scripts/mantech-news-scraper.ts 50

# Historical scrape
tsx src/scripts/mantech-historical-scraper.ts
```

### Cron Endpoint (Automated Daily)

The scraper runs automatically via Vercel cron:

**Endpoint:** `/api/cron/scrape-mantech`  
**Schedule:** `30 12 * * *` (12:30 PM UTC = 8:30 AM EST)

**Test manually:**
```bash
curl -X POST "https://propshop.ai/api/cron/scrape-mantech" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Querying the Data

### Recent Projects

```sql
-- Last 10 ManTech projects
SELECT 
  article_title,
  mantech_component,
  technology_focus,
  prime_contractor,
  funding_amount,
  transition_stage,
  published_date
FROM mantech_projects
ORDER BY published_date DESC NULLS LAST
LIMIT 10;
```

### Projects by Component

```sql
-- Count projects by military branch
SELECT 
  mantech_component,
  COUNT(*) as projects,
  COUNT(DISTINCT prime_contractor) as companies,
  SUM(funding_amount) as total_funding
FROM mantech_projects
GROUP BY mantech_component
ORDER BY projects DESC;
```

### Technology Trends

```sql
-- Most common technologies
SELECT 
  unnest(technology_focus) as technology,
  COUNT(*) as projects
FROM mantech_projects
WHERE technology_focus IS NOT NULL
GROUP BY technology
ORDER BY projects DESC
LIMIT 20;
```

### Top Companies

```sql
-- Companies most active in ManTech
SELECT 
  company_name,
  COUNT(*) as projects,
  COUNT(*) FILTER (WHERE mention_type = 'prime') as prime_contracts,
  STRING_AGG(DISTINCT m.mantech_component, ', ') as components
FROM mantech_company_mentions cm
JOIN mantech_projects m ON cm.project_id = m.id
GROUP BY company_name
ORDER BY projects DESC
LIMIT 20;
```

### SBIR to ManTech Transitions

```sql
-- Track SBIR companies transitioning to ManTech
SELECT 
  m.sbir_company_name,
  m.technology_focus,
  m.transition_stage,
  m.funding_amount,
  s.company_name as sbir_company,
  s.phase,
  s.award_amount as sbir_award
FROM mantech_projects m
LEFT JOIN sbir_final s 
  ON LOWER(m.sbir_company_name) = LOWER(s.company_name)
WHERE m.sbir_linked = TRUE
ORDER BY m.published_date DESC;
```

### Transition Pipeline

```sql
-- View the technology transition pipeline
SELECT 
  transition_stage,
  mantech_component,
  COUNT(*) as projects,
  AVG(technology_readiness_level) as avg_trl,
  AVG(manufacturing_readiness_level) as avg_mrl
FROM mantech_projects
WHERE transition_stage IS NOT NULL
GROUP BY transition_stage, mantech_component
ORDER BY 
  CASE transition_stage
    WHEN 'research' THEN 1
    WHEN 'development' THEN 2
    WHEN 'prototype' THEN 3
    WHEN 'production' THEN 4
    WHEN 'fielded' THEN 5
  END;
```

### High-Readiness Projects

```sql
-- Projects ready for production (TRL 7+, MRL 7+)
SELECT 
  article_title,
  mantech_component,
  technology_readiness_level as trl,
  manufacturing_readiness_level as mrl,
  prime_contractor,
  transition_stage
FROM mantech_projects
WHERE technology_readiness_level >= 7 
  AND manufacturing_readiness_level >= 7
ORDER BY technology_readiness_level DESC, manufacturing_readiness_level DESC;
```

---

## Data Quality

### Quality Scoring

Each project gets a **data quality score (0-100)**:

- **Essential fields (40 pts):** Title, description, component, date
- **Important fields (30 pts):** Companies, technology focus, transition stage
- **Enhanced fields (30 pts):** Funding, weapon systems, POC, linkages

**Check quality:**
```sql
SELECT 
  data_quality_score,
  COUNT(*) as projects
FROM mantech_projects
GROUP BY data_quality_score
ORDER BY data_quality_score DESC;
```

### Parsing Confidence

Each project has a **parsing confidence (0.0-1.0)**:
- **0.9+:** Excellent - All key data extracted
- **0.7-0.9:** Good - Most data extracted
- **0.5-0.7:** Fair - Basic data extracted
- **<0.5:** Poor - Minimal data extracted

**Review low-confidence projects:**
```sql
SELECT 
  article_title,
  parsing_confidence,
  mantech_component
FROM mantech_projects
WHERE parsing_confidence < 0.7
ORDER BY parsing_confidence ASC
LIMIT 20;
```

---

## Cross-Referencing with Other Data

### Link to SBIR/STTR Projects

```sql
-- Find SBIR companies that appeared in ManTech
UPDATE mantech_projects m
SET 
  sbir_linked = TRUE,
  sbir_company_name = s.company_name,
  sbir_topic_number = s.topic_number
FROM sbir_final s
WHERE LOWER(s.company_name) = ANY(
  SELECT LOWER(unnest(m.companies_involved))
)
AND m.sbir_linked = FALSE;
```

### Link to DOD Contracts

```sql
-- Find ManTech projects with corresponding contracts
SELECT 
  m.article_title,
  m.prime_contractor,
  m.technology_focus,
  c.vendor_name,
  c.award_amount,
  c.contract_number
FROM mantech_projects m
LEFT JOIN dod_contract_news c 
  ON LOWER(m.prime_contractor) = LOWER(c.vendor_name)
  AND ABS(m.published_date - c.published_date) < 30
WHERE m.prime_contractor IS NOT NULL
ORDER BY m.published_date DESC;
```

### Link to FPDS Contracts

```sql
-- Find FPDS contracts for ManTech companies
SELECT 
  m.article_title,
  m.prime_contractor,
  f.piid as contract_id,
  f.current_total_value_of_award,
  f.naics_description
FROM mantech_projects m
LEFT JOIN fpds_contracts f 
  ON LOWER(m.prime_contractor) = LOWER(f.vendor_name)
  AND ABS(m.published_date - f.date_signed) < 90
WHERE m.prime_contractor IS NOT NULL
ORDER BY m.published_date DESC;
```

---

## Monitoring & Maintenance

### Check Scraper Status

```bash
npm run check:mantech
```

**Output includes:**
- Recent scraper runs (last 5)
- Database statistics
- Projects by component
- Most recent projects
- Top 10 companies

### View Scraper Logs

```sql
-- Recent scraper runs
SELECT 
  scrape_date,
  scrape_type,
  status,
  articles_found,
  projects_created,
  companies_extracted,
  duration_seconds,
  error_message
FROM mantech_scraper_log
ORDER BY started_at DESC
LIMIT 10;
```

### Email Notifications

The cron job sends emails on success/failure:

**Success Email:**
- Articles found
- Projects saved
- Total projects in database
- Most recent article

**Failure Email:**
- Error message
- Duration
- Last successful run

---

## Troubleshooting

### No Articles Found

**Possible causes:**
1. Website structure changed
2. Network issues
3. Rate limiting

**Solutions:**
```bash
# Test manually with smaller limit
tsx src/scripts/mantech-news-scraper.ts 5

# Check if site is accessible
curl -I https://www.dodmantech.mil/News/
```

### Low Parsing Confidence

**Identify issues:**
```sql
SELECT article_title, parsing_confidence, extraction_issues
FROM mantech_projects
WHERE parsing_confidence < 0.5
ORDER BY scraped_at DESC
LIMIT 10;
```

**Common issues:**
- Unstructured content
- Missing key fields
- Non-standard article format

### Browser Launch Failures

**Error:** `Failed to launch browser`

**Solutions:**
```bash
# Install Chromium dependencies (if needed)
npm install puppeteer

# Test browser launch
node -e "require('puppeteer').launch().then(b => b.close())"
```

### Database Connection Issues

**Check environment variables:**
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

## Best Practices

### 1. Run Historical Scrape Once

```bash
# Initial backfill - run once
npm run scrape:mantech:historical
```

### 2. Set Up Daily Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-mantech",
      "schedule": "30 12 * * *"
    }
  ]
}
```

### 3. Monitor Data Quality

```sql
-- Check average quality score weekly
SELECT 
  DATE_TRUNC('week', scraped_at) as week,
  AVG(data_quality_score) as avg_quality,
  COUNT(*) as projects
FROM mantech_projects
GROUP BY week
ORDER BY week DESC;
```

### 4. Review Flagged Projects

```sql
-- Projects that need manual review
SELECT 
  article_title,
  article_url,
  needs_review,
  parsing_confidence
FROM mantech_projects
WHERE needs_review = TRUE
  OR parsing_confidence < 0.5
ORDER BY scraped_at DESC;
```

### 5. Link to Other Data Sources

Run periodically:
```sql
-- Auto-link to SBIR (run weekly)
-- Auto-link to contracts (run weekly)
-- Update company normalization (run monthly)
```

---

## Advanced Features

### Manufacturing Innovation Institutes (MIIs)

The scraper identifies mentions of 14 MIIs:
- America Makes (additive manufacturing)
- MxD (digital manufacturing)
- LIFT (lightweight materials)
- NextFlex (flexible hybrid electronics)
- BioFabUSA (biomanufacturing)
- AIM Photonics (photonics)
- PowerAmerica (power electronics)
- NIIMBL (biopharmaceuticals)
- RAPID (modular chemical processing)
- ARM Institute (robotics)
- BioMADE (bioindustrial manufacturing)
- CESMII (smart manufacturing)

**Query MII involvement:**
```sql
SELECT 
  unnest(manufacturing_innovation_institutes) as mii,
  COUNT(*) as projects,
  STRING_AGG(DISTINCT mantech_component, ', ') as components
FROM mantech_projects
WHERE manufacturing_innovation_institutes IS NOT NULL
GROUP BY mii
ORDER BY projects DESC;
```

### Technology Readiness Levels (TRL)

**TRL Scale:**
- TRL 1-3: Basic research
- TRL 4-6: Technology development
- TRL 7-8: System development
- TRL 9: System fielded

**Query by TRL:**
```sql
SELECT 
  technology_readiness_level as trl,
  COUNT(*) as projects,
  AVG(funding_amount) as avg_funding
FROM mantech_projects
WHERE technology_readiness_level IS NOT NULL
GROUP BY trl
ORDER BY trl;
```

### Export Data

```bash
# Export to CSV
psql $DATABASE_URL -c "\COPY (SELECT * FROM mantech_projects) TO 'mantech_projects.csv' CSV HEADER"

# Export company network
psql $DATABASE_URL -c "\COPY (SELECT * FROM mantech_company_mentions) TO 'company_network.csv' CSV HEADER"
```

---

## Summary

**What You Have:**
- Automated scraper for dodmantech.mil
- Comprehensive data extraction (50+ fields)
- Company tracking and network analysis
- SBIR/STTR and contract linkages
- Technology transition pipeline visibility
- Daily automated updates via cron

**Data You're Collecting:**
- Manufacturing technology projects
- Technology transitions (R&D → Production)
- Industry partnerships
- Defense industrial base insights
- Innovation trends

**How to Use:**
1. Run historical scrape once: `npm run scrape:mantech:historical`
2. Set up daily cron (already configured)
3. Query data for insights
4. Link to SBIR/contracts for full picture

**Complete Defense Intelligence Stack:**
```
Research (SBIR/STTR) → [ManTech Scraper] → Production/Fielding → [DOD Contracts]
```

All three together give you **end-to-end visibility** of the defense technology pipeline!

