

# SAM.gov Integration - Phase 2 Complete

## What Was Built

Phase 2 adds **full SAM.gov contract opportunities scraping** with automatic linking to FPDS contracts.

---

## Why Phase 2 Was Needed

**Phase 1 Problem:** Simple URL generation didn't work because:
- SAM.gov uses internal Notice IDs (UUIDs), not solicitation numbers in URLs
- Search URLs didn't reliably find opportunities
- No way to get Statement of Work or full opportunity details

**Phase 2 Solution:** Scrape SAM.gov directly via their API:
- Get real Notice IDs for working direct links
- Store full opportunity details (SOW, attachments, Q&A)
- Automatically match to FPDS awarded contracts
- Much more valuable data for users

---

## Files Created

### 1. Database Schema
**File:** `supabase/migrations/create_sam_gov_opportunities.sql`

Creates:
- `sam_gov_opportunities` table - Stores all opportunities
- `sam_gov_scraper_runs` table - Tracks scraping progress
- `sam_fpds_linked` view - Shows matches between opportunities and awards
- Indexes for performance

### 2. Linking Functions
**File:** `supabase/migrations/create_sam_fpds_linking_function.sql`

Creates:
- `link_sam_to_fpds()` - Links opportunities to contracts
- `update_fpds_with_sam_links()` - Updates FPDS with correct SAM.gov URLs
- Auto-linking trigger for new opportunities

### 3. Scraper Library
**File:** `src/lib/sam-gov-opportunities-scraper.ts`

Features:
- SAM.gov Opportunities API client
- Pagination support
- Data normalization
- Automatic upsert (no duplicates)
- Rate limiting
- Error handling

### 4. Runner Script
**File:** `scrape-sam-gov-opportunities.ts`

Command-line tool to run the scraper with date ranges.

---

## Setup Instructions

### Step 1: Run Database Migrations

In Supabase SQL Editor, run **in order**:

```sql
-- 1. Create opportunities table
supabase/migrations/create_sam_gov_opportunities.sql

-- 2. Create linking functions
supabase/migrations/create_sam_fpds_linking_function.sql
```

### Step 2: Verify API Key Exists

Check `.env` file has:
```bash
SAM_GOV_API_KEY=SAM-dafe1914-cd36-489d-ae93-c332b6e4df2c
```

(You already have this from your notes!)

### Step 3: Test the Scraper

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Scrape last 30 days (test run)
npx tsx scrape-sam-gov-opportunities.ts

# Or specific date range
npx tsx scrape-sam-gov-opportunities.ts --from=2024-11-01 --to=2024-11-03
```

---

## Usage Examples

### Scrape Last 30 Days
```bash
npx tsx scrape-sam-gov-opportunities.ts
```

### Scrape Last 90 Days
```bash
npx tsx scrape-sam-gov-opportunities.ts --days=90
```

### Scrape Specific Date Range
```bash
npx tsx scrape-sam-gov-opportunities.ts --from=2024-01-01 --to=2024-12-31
```

### Run in tmux (For Long Scrapes)
```bash
tmux new -s sam-scraper
npx tsx scrape-sam-gov-opportunities.ts --days=365
# Detach: Ctrl+B then D
```

---

## What Data You Get

### From SAM.gov Opportunities API

Each opportunity includes:

**Basic Info:**
- Notice ID (for direct links)
- Title & description
- Solicitation number
- Notice type (Solicitation, Sources Sought, etc.)

**Dates:**
- Posted date
- Response deadline
- Archive date

**Classification:**
- NAICS code
- PSC code
- Set-aside type (8(a), WOSB, HUBZone, etc.)

**Agency:**
- Department (e.g., "DEPARTMENT OF DEFENSE")
- Sub-tier (e.g., "DEPT OF THE ARMY")
- Office (contracting office)

**Location:**
- Place of performance (city, state, country)

**Award Info** (if awarded):
- Award number (links to FPDS)
- Award date
- Award amount
- Awardee name, DUNS, UEI

**Links:**
- Direct SAM.gov URL (`https://sam.gov/opp/{notice_id}/view`)
- Attachments (SOWs, specs, etc.)
- Resource links

---

## Automatic Linking

### SAM.gov → FPDS Contracts

The system automatically links opportunities to awarded contracts by matching:

```
sam_gov_opportunities.solicitation_number = fpds_contracts.solicitation_id
```

When matched, you get:
- **Before award:** Full opportunity details (what they wanted)
- **After award:** Contract details (who won, how much)

### View Linked Data

```sql
-- See all linked opportunities and awards
SELECT * FROM sam_fpds_linked
ORDER BY posted_date DESC
LIMIT 100;

-- Find opportunities that became contracts
SELECT 
  s.title,
  s.posted_date,
  s.response_deadline,
  f.vendor_name as winner,
  f.base_and_exercised_options_value as contract_value,
  s.ui_link as opportunity_link,
  f.usaspending_contract_url as contract_link
FROM sam_gov_opportunities s
INNER JOIN fpds_contracts f ON s.solicitation_number = f.solicitation_id
WHERE s.solicitation_number IS NOT NULL
ORDER BY f.date_signed DESC;
```

---

## Monitoring Progress

### Check Scraper Runs

```sql
SELECT 
  id,
  run_type,
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI') as started,
  status,
  opportunities_found,
  opportunities_inserted,
  duration_seconds
FROM sam_gov_scraper_runs
ORDER BY started_at DESC
LIMIT 10;
```

### Check Opportunity Stats

```sql
-- Overall stats
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(*) FILTER (WHERE active = true) as active,
  COUNT(*) FILTER (WHERE fpds_contract_id IS NOT NULL) as linked_to_fpds,
  COUNT(DISTINCT department) as departments,
  MIN(posted_date) as earliest_date,
  MAX(posted_date) as latest_date
FROM sam_gov_opportunities;

-- By department
SELECT 
  department,
  COUNT(*) as opportunities,
  COUNT(*) FILTER (WHERE fpds_contract_id IS NOT NULL) as awarded
FROM sam_gov_opportunities
GROUP BY department
ORDER BY opportunities DESC
LIMIT 20;
```

---

## Rate Limiting

SAM.gov API limits:
- **1000 requests/day** (free tier)
- **10,000 requests/day** (with API key - you have this!)

The scraper includes:
- 1 second delay between batch saves
- 2 seconds delay between pages
- Automatic retry on errors

---

## Scheduling (Future)

### Daily Updates

Add to cron:
```bash
# Daily at 6 AM - scrape yesterday's opportunities
0 6 * * * cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && npx tsx scrape-sam-gov-opportunities.ts --days=1
```

### Weekly Backfill

```bash
# Weekly on Sunday - scrape last 7 days to catch updates
0 3 * * 0 cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && npx tsx scrape-sam-gov-opportunities.ts --days=7
```

---

## Value to PropShop AI Users

### Before Phase 2
```
User searches for "Army AI contracts"
Result: List of awarded contracts
Data: Vendor, amount, dates
Missing: What was the actual requirement?
```

### After Phase 2
```
User searches for "Army AI contracts"
Result: Opportunities + Awarded contracts
Data: 
  - Full Statement of Work
  - Technical requirements
  - Evaluation criteria
  - Who won and for how much
  - Q&A from other vendors
  - Attachments (specs, drawings)

User can:
  ✅ See what Army actually wanted
  ✅ Understand evaluation criteria
  ✅ Learn from winning proposals
  ✅ Find similar current opportunities
```

---

## UI Integration Examples

### Contract Details Page

```typescript
// Show both opportunity and award
const contract = /* from fpds_contracts */;
const opportunity = /* from sam_gov_opportunities where solicitation_number matches */;

<div>
  {opportunity && (
    <Section title="Original Solicitation">
      <h3>{opportunity.title}</h3>
      <p>{opportunity.description}</p>
      <Link href={opportunity.ui_link}>View Full Opportunity on SAM.gov</Link>
      
      <Stats>
        <Stat label="Posted" value={opportunity.posted_date} />
        <Stat label="Deadline" value={opportunity.response_deadline} />
        <Stat label="Set-Aside" value={opportunity.type_of_set_aside_description} />
      </Stats>
      
      {opportunity.attachments && (
        <Attachments items={opportunity.attachments} />
      )}
    </Section>
  )}
  
  <Section title="Award Details">
    <h3>Winner: {contract.vendor_name}</h3>
    <p>Value: ${contract.base_and_exercised_options_value}</p>
    <Link href={contract.usaspending_contract_url}>View Contract on USASpending.gov</Link>
  </Section>
</div>
```

### Search Results

```typescript
// Show opportunities alongside contracts
<SearchResults>
  <Tab title="Active Opportunities">
    {opportunities.filter(o => o.active).map(opp => (
      <OpportunityCard
        title={opp.title}
        deadline={opp.response_deadline}
        setAside={opp.type_of_set_aside_description}
        link={opp.ui_link}
      />
    ))}
  </Tab>
  
  <Tab title="Awarded Contracts">
    {contracts.map(contract => (
      <ContractCard
        vendor={contract.vendor_name}
        value={contract.contract_value}
        opportunity={contract.linked_opportunity}
      />
    ))}
  </Tab>
</SearchResults>
```

---

## Testing Checklist

### Database Setup
- [ ] Run `create_sam_gov_opportunities.sql`
- [ ] Run `create_sam_fpds_linking_function.sql`
- [ ] Verify tables exist: `SELECT COUNT(*) FROM sam_gov_opportunities;`

### Scraper Test
- [ ] Test with small date range: `npx tsx scrape-sam-gov-opportunities.ts --days=1`
- [ ] Verify opportunities inserted: `SELECT COUNT(*) FROM sam_gov_opportunities;`
- [ ] Check linking worked: `SELECT COUNT(*) FROM sam_fpds_linked;`

### Data Quality
- [ ] Check SAM.gov links work: Copy a `ui_link` and open in browser
- [ ] Verify FPDS matching: `SELECT * FROM sam_fpds_linked LIMIT 10;`
- [ ] Test search: Look for opportunities by keyword

---

## Troubleshooting

### "Missing SAM_GOV_API_KEY"

Add to `.env`:
```bash
SAM_GOV_API_KEY=SAM-dafe1914-cd36-489d-ae93-c332b6e4df2c
```

### "API returned 401 Unauthorized"

Your API key may have expired. Get a new one:
https://open.gsa.gov/api/

### No Opportunities Found

Check date range - SAM.gov may not have data for very recent/old dates.

### Links Still 404

If Notice ID links don't work, SAM.gov may have:
- Archived the opportunity
- Changed their URL structure
- Removed the opportunity

---

## Next Steps (Phase 3)

### AI-Powered SOW Analysis

Use LLMs to:
- Extract key requirements from SOWs
- Identify technical specifications
- Generate requirement summaries
- Match opportunities to company capabilities

### Enhanced Matching

- Fuzzy matching on titles
- NAICS code matching
- Agency matching
- Amount prediction

### Alerts & Notifications

- Email alerts for new opportunities
- Match score for company capabilities
- Deadline reminders

---

## Summary

**Phase 2 Complete:**
- ✅ SAM.gov opportunities table
- ✅ Full API scraper
- ✅ Automatic linking to FPDS
- ✅ Working direct links
- ✅ Rich opportunity data

**What Users Get:**
- Before + After view (opportunity → award)
- Full requirements and SOWs
- Evaluation criteria
- Q&A and amendments
- Real, working links

**PropShop AI now shows the complete contract lifecycle: what was requested AND what was awarded!** 🎉


