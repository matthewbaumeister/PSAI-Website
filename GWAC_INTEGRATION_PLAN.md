# GWAC Integration Implementation Plan

## Executive Summary

**Recommendation: YES, this is worth adding to your tool.**

### Value Proposition

1. **Market Intelligence**: Know which companies have access to $200B+ in federal IT/professional services spending
2. **Competitive Analysis**: Track competitor GWAC positions, task order wins, and pricing
3. **Customer Targeting**: Identify agencies using specific GWACs
4. **Pricing Intelligence**: Access labor rates across all major contract vehicles
5. **Complete Picture**: Your tool will have the most comprehensive view of federal contracting

### Return on Investment

**Data Available:**
- 10+ major GWAC programs
- 500+ contract holders across all GWACs
- Thousands of task orders worth billions annually
- Labor rates for 100+ job categories per company

**Effort Required:**
- Database setup: 1 hour (run SQL script)
- Initial scraper development: 8-12 hours
- Data population: 2-4 hours initial load
- Ongoing maintenance: 1-2 hours/week (automated scraping)

**Value Created:**
- Unique market research capability
- Competitive advantage over tools that only track SBIR or prime contracts
- Enables pricing analysis and benchmarking
- Links GWAC vehicles to actual task order spending

---

## Phase 1: Database Setup (1 hour)

### Step 1: Create GWAC Tables
Run the `GWAC_DATABASE_SCHEMA.sql` file in your Supabase database.

This creates:
- 6 core tables
- 5 analytical views
- Indexes for performance
- Helper functions

### Step 2: Verify Integration with Existing Tables
The schema integrates with your existing:
- `fpds_contracts` table (via `referenced_idv_piid`)
- `fpds_company_stats` table (via `vendor_uei`)

Test queries:
```sql
-- Verify FPDS has GWAC task orders
SELECT COUNT(*) FROM fpds_contracts WHERE referenced_idv_piid IS NOT NULL;

-- Check company matching potential
SELECT COUNT(DISTINCT vendor_name) FROM fpds_contracts;
```

---

## Phase 2: Data Collection Strategy

### Data Source 1: GSA GWAC Sales Dashboard (Primary)

**URL**: https://d2d.gsa.gov/report/gsa-fas-gwac-sales-dashboard

**What It Contains:**
- Task orders by GWAC program
- Obligated sales by agency and company
- Updated daily from GSA CPRM

**Collection Method:**
- Web scraping (the dashboard is interactive)
- OR download CSV/Excel exports (if available)
- Frequency: Weekly updates

**Data Fields:**
- GWAC Program Name
- Contract Holder Name
- Ordering Agency
- Task Order Number
- Obligated Amount
- Award Date

### Data Source 2: Individual GWAC Contract Holder Lists

Each GWAC program publishes contract holder lists:

**8(a) STARS III:**
- URL: https://www.gsa.gov/buy-through-us/purchasing-programs/gsa-schedules/gsa-schedule-offerings/8a-stars-iii
- Contains: 86 contract holders, company info, NAICS codes

**Alliant 2:**
- URL: https://www.gsa.gov/buy-through-us/products-and-services/information-technology/alliant-2-governmentwide-acquisition-contract
- Contains: 61 contract holders (Alliant 2), 20 contract holders (Alliant 2 Small Business)

**VETS 2:**
- URL: https://www.gsa.gov/buy-through-us/products-and-services/information-technology/vets-2-gwac
- Contains: 89 contract holders, veteran status

**Polaris:**
- URL: https://www.gsa.gov/buy-through-us/products-and-services/information-technology/polaris
- Contains: Small business contract holders

**Collection Method:**
- Manual download initially (PDF/Excel)
- Web scraping for updates
- Frequency: Quarterly (doesn't change often)

### Data Source 3: Labor Rate Sheets

**Where to Find:**
- GSA eBuy (https://www.ebuy.gsa.gov)
- Individual company rate sheets (publicly posted)
- OR via FOIA request (if not public)

**What It Contains:**
- Labor categories (e.g., "Senior Software Engineer", "Project Manager")
- Hourly rates by year
- Experience requirements
- Geographic adjustments

**Collection Method:**
- Manual download from eBuy (search by GWAC contract number)
- Parse Excel/PDF rate sheets
- Frequency: Annually (or when rates update)

### Data Source 4: FPDS Task Order Linkage (You Already Have This!)

**Method:**
- Query `fpds_contracts` where `referenced_idv_piid` is NOT NULL
- Match PIID patterns to identify GWAC contracts
- GWAC PIIDs typically follow patterns like:
  - STARS III: 47QTCA*
  - Alliant 2: 47QTCA*
  - VETS 2: 36F79*

**Automation:**
- Run nightly after FPDS scraper completes
- Auto-link task orders to GWAC programs

---

## Phase 3: Scraper Development (8-12 hours)

### Scraper 1: GWAC Programs Scraper
**Purpose:** Populate `gwac_programs` table with basic info

**Data to Collect:**
- Program name, code, contract number
- Award date, expiration date, ceiling value
- Service categories, NAICS codes
- Number of contract holders
- Links to websites

**Source:** Manual entry initially (10-15 programs), then maintain

**Files to Create:**
- `src/lib/gwac-programs-scraper.ts`

### Scraper 2: Contract Holders Scraper
**Purpose:** Populate `gwac_contract_holders` table

**Data to Collect:**
- Company name, UEI, DUNS, CAGE code
- Contract number, award date
- Service areas, NAICS codes
- Socioeconomic status
- Geographic scope

**Source:** Individual GWAC program websites

**Files to Create:**
- `src/lib/gwac-contract-holders-scraper.ts`

### Scraper 3: Labor Rates Scraper
**Purpose:** Populate `gwac_labor_rates` table

**Data to Collect:**
- Labor category name and code
- Base year rate, current rate
- Experience requirements
- Location adjustments

**Source:** eBuy rate sheets, company websites

**Files to Create:**
- `src/lib/gwac-labor-rates-scraper.ts`

### Scraper 4: FPDS-GWAC Linker (Critical!)
**Purpose:** Populate `gwac_task_orders` table by linking FPDS to GWACs

**Logic:**
```typescript
// Identify GWAC task orders from FPDS
SELECT * FROM fpds_contracts 
WHERE referenced_idv_piid IS NOT NULL
  AND referenced_idv_piid LIKE '47QTCA%' -- STARS III pattern
  OR referenced_idv_piid LIKE '36F79%'   -- VETS 2 pattern
  OR referenced_idv_piid LIKE '47QTCB%'  -- Alliant 2 pattern

// Match to gwac_contract_holders by vendor name/UEI
// Create gwac_task_orders records
// Update contract holder statistics
```

**Files to Create:**
- `src/lib/gwac-fpds-linker.ts`

---

## Phase 4: Analytics & Insights

### Key Metrics to Track

**Program-Level:**
- Total task orders per GWAC
- Total obligated value per GWAC
- Average task order size
- Top ordering agencies
- Growth trends over time

**Company-Level:**
- Number of GWAC positions held
- Total task order value across all GWACs
- Win rate (if competitive)
- Top customers
- Market share within each GWAC

**Pricing Intelligence:**
- Average rates by labor category
- Rate comparisons across GWACs
- Geographic rate variations
- Company positioning (low-cost vs premium)

### Dashboard Views to Build

1. **GWAC Overview Dashboard**
   - Active programs with spending trends
   - Top performers by task order value
   - Recent task order activity

2. **Company GWAC Portfolio**
   - Which GWACs a company is on
   - Performance across each GWAC
   - Comparison to competitors

3. **Labor Rate Comparison Tool**
   - Compare rates across companies
   - Filter by labor category, location
   - Show min/avg/max rates

4. **Market Intelligence**
   - New task orders by agency
   - Emerging spending patterns
   - Underutilized GWACs (opportunities)

---

## Phase 5: Maintenance & Updates

### Automated Updates
- **Daily:** Link new FPDS task orders to GWACs (runs after FPDS scraper)
- **Weekly:** Scrape GSA GWAC Sales Dashboard for new task orders
- **Monthly:** Recalculate company statistics and rankings
- **Quarterly:** Update contract holder lists
- **Annually:** Update labor rate sheets

### Data Quality Checks
- Verify company name matching (UEI/DUNS linking)
- Validate task order totals against GSA dashboard
- Check for new GWAC programs
- Monitor for expired contracts

---

## Implementation Priority

### Must-Have (MVP)
1. Create database tables (Phase 1)
2. Manual entry of major GWAC programs (10-15 programs)
3. Scrape contract holder lists (500+ companies)
4. Link FPDS task orders to GWACs (automated)
5. Build basic analytics views

### Nice-to-Have (Future)
1. Scrape labor rate sheets (pricing intelligence)
2. Track task order competitions
3. Predict GWAC recompete timing
4. Alert system for new task orders
5. Company GWAC positioning analysis

---

## Integration with Existing Features

### Link to SBIR/STTR Data
Many SBIR Phase III awards come via GWAC task orders:
```sql
-- Find SBIR companies with GWAC positions
SELECT 
  s.company,
  s.topic_number,
  gh.gwac_programs
FROM sbir_awards s
JOIN gwac_contract_holders gh ON s.company = gh.company_name
```

### Link to Congressional Data
Track which Congressional districts benefit from GWAC spending:
```sql
-- GWAC spending by Congressional district
SELECT 
  fc.place_of_performance_congressional_district,
  gp.program_name,
  SUM(fc.base_and_exercised_options_value) as total_value
FROM fpds_contracts fc
JOIN gwac_task_orders gto ON fc.id = gto.fpds_contract_id
JOIN gwac_programs gp ON gto.gwac_program_id = gp.id
GROUP BY fc.place_of_performance_congressional_district, gp.program_name
```

### Link to Company Intelligence
Build complete company profiles:
- SBIR/STTR awards history
- Prime contract awards (FPDS)
- GWAC positions held
- Task order performance
- Labor rates and pricing

---

## Technical Architecture

### Data Flow
```
1. GWAC Program Sites → gwac_programs (manual/scraper)
2. Contract Holder Lists → gwac_contract_holders (scraper)
3. Labor Rate Sheets → gwac_labor_rates (scraper/parser)
4. FPDS Scraper → fpds_contracts (existing)
5. FPDS-GWAC Linker → gwac_task_orders (automated nightly)
6. Statistics Calculator → gwac_company_stats (automated weekly)
```

### File Structure
```
src/lib/
  ├── gwac-programs-scraper.ts      # Scrape GWAC program info
  ├── gwac-contract-holders-scraper.ts  # Scrape contract holder lists
  ├── gwac-labor-rates-scraper.ts   # Parse labor rate sheets
  ├── gwac-fpds-linker.ts           # Link FPDS to GWAC task orders
  ├── gwac-stats-calculator.ts      # Calculate company statistics
  └── gwac-data-cleaner.ts          # Validate and normalize data

src/app/api/cron/
  ├── gwac-daily-linker/route.ts    # Daily task order linking
  └── gwac-weekly-update/route.ts   # Weekly scraper runs

src/app/admin/
  └── gwac-dashboard/
      ├── page.tsx                   # GWAC analytics dashboard
      ├── programs/page.tsx          # Manage GWAC programs
      └── companies/page.tsx         # Company GWAC portfolios
```

---

## Estimated Effort

| Task | Time | Priority |
|------|------|----------|
| Database setup | 1 hour | Critical |
| Manual GWAC program data entry | 2 hours | Critical |
| Contract holders scraper | 4 hours | Critical |
| FPDS-GWAC linker | 3 hours | Critical |
| Statistics calculator | 2 hours | High |
| Labor rates scraper | 4 hours | Medium |
| Dashboard UI | 6 hours | High |
| Testing & refinement | 4 hours | High |
| **TOTAL** | **26 hours** | |

**MVP (Critical + High):** 18 hours
**Full Implementation:** 26 hours

---

## Competitive Advantage

### What This Enables That Competitors Don't Have:

1. **Complete Federal Contracting Picture**
   - Most tools only track SBIR OR prime contracts
   - You'll track SBIR + Primes + GWAC task orders + Opportunities

2. **Pricing Intelligence**
   - No other tool aggregates GWAC labor rates
   - Enables benchmarking and competitive pricing analysis

3. **Market Opportunity Identification**
   - See which agencies use which GWACs
   - Identify underutilized GWACs (less competition)
   - Track competitors' GWAC positions

4. **Complete Company Profiles**
   - SBIR history + Contract history + GWAC positions + Pricing
   - Most comprehensive company intelligence in the market

---

## Sample Queries Enabled

### 1. Find companies on multiple GWACs (diversified)
```sql
SELECT company_name, total_gwac_positions, gwac_programs, total_task_order_value
FROM gwac_company_stats
WHERE total_gwac_positions >= 3
ORDER BY total_task_order_value DESC;
```

### 2. Compare your rates to competitors
```sql
SELECT company_name, labor_category, current_year_rate
FROM gwac_labor_rates
WHERE labor_category = 'Senior Software Engineer'
  AND location = 'CONUS'
ORDER BY current_year_rate;
```

### 3. Find agencies using specific GWACs
```sql
SELECT ordering_agency_name, COUNT(*) as task_orders, SUM(task_order_value) as total_value
FROM gwac_task_orders
WHERE gwac_program_id = (SELECT id FROM gwac_programs WHERE program_code = 'STARS3')
GROUP BY ordering_agency_name
ORDER BY total_value DESC;
```

### 4. Track competitor GWAC performance
```sql
SELECT 
  gh.company_name,
  gp.program_name,
  gh.total_task_orders,
  gh.total_task_order_value,
  gh.most_recent_task_order_date
FROM gwac_contract_holders gh
JOIN gwac_programs gp ON gh.gwac_program_id = gp.id
WHERE gh.company_name IN ('Competitor A', 'Competitor B', 'Competitor C')
ORDER BY gh.total_task_order_value DESC;
```

### 5. Link SBIR Phase III to GWAC task orders
```sql
SELECT 
  sa.company,
  sa.topic_number,
  sa.phase,
  gto.task_order_number,
  gto.task_order_value,
  gp.program_name as gwac_program
FROM sbir_awards sa
JOIN fpds_contracts fc ON sa.company = fc.vendor_name
JOIN gwac_task_orders gto ON fc.id = gto.fpds_contract_id
JOIN gwac_programs gp ON gto.gwac_program_id = gp.id
WHERE sa.phase = 'Phase III';
```

---

## Next Steps

1. **Run `GWAC_DATABASE_SCHEMA.sql` in Supabase** (do this now)
2. **Manual data entry:** Add 10-15 major GWAC programs to `gwac_programs` table
3. **Build FPDS-GWAC linker:** This will auto-populate task orders from existing FPDS data
4. **Test with existing FPDS data:** See how many task orders link to GWACs
5. **Develop contract holders scraper:** Start with STARS III (86 companies)
6. **Build analytics dashboard:** Visualize GWAC performance

---

## Decision Matrix

| Factor | Score (1-10) | Notes |
|--------|--------------|-------|
| Data Availability | 8 | Public but requires scraping |
| Implementation Effort | 7 | 18-26 hours total |
| Value to Users | 10 | Unique market intelligence |
| Competitive Advantage | 10 | No competitors have this |
| Integration Complexity | 9 | Integrates well with existing data |
| Maintenance Burden | 8 | Mostly automated after setup |
| **TOTAL** | **52/60** | **Strong recommendation to add** |

---

## Conclusion

**YES, add GWAC tracking to your tool.**

This will differentiate your product significantly and provide unique market intelligence that no other federal contracting research tool offers. The effort is reasonable (18-26 hours), and the ongoing maintenance can be largely automated.

The ability to track SBIR/STTR opportunities, prime contract awards, AND GWAC task order performance creates the most comprehensive federal contracting intelligence platform available.

