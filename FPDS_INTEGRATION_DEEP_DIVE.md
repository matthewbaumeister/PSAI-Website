# FPDS Integration - Complete Deep Dive

## 🏛️ What is FPDS?

**Federal Procurement Data System (FPDS)** is the **official government repository** for all federal contract actions. It's managed by the General Services Administration (GSA).

### **Scale & Scope:**

- **~100 million+ contract records** (historical)
- **~5-10 million active contracts** (last 5 years)
- **ALL federal agencies** (not just DOD)
- **ALL contract types** (not just SBIR/STTR):
  - SBIR Phase I, II, III
  - STTR Phase I, II
  - Standard contracts (FAR)
  - IDIQs (Indefinite Delivery/Indefinite Quantity)
  - BPAs (Blanket Purchase Agreements)
  - Grants
  - Task Orders
  - Delivery Orders
  - Purchase Orders

### **Data Richness:**

FPDS contains **FAR MORE detail** than SBIR.gov:
- Full contract values (base + options + modifications)
- Modification history (amendments, extensions)
- Vendor details (DUNS, UEI, CAGE codes)
- NAICS codes (industry classification)
- PSC codes (product/service codes)
- Place of performance (where work is done)
- Subcontracting data
- Socioeconomic flags (8(a), HUBZone, WOSB, SDVOSB)
- Competition type (sole source, competitive, set-aside)
- Contract vehicles
- Parent company relationships

---

## 🔌 FPDS API Access

### **Primary API: SAM.gov API**

FPDS data is now accessed through **SAM.gov** (System for Award Management).

**Base URL:** `https://api.sam.gov/prod/opportunities/v2/search`

**Alternative:** `https://api.sam.gov/opportunities/v1/search` (older)

### **Authentication:**

✅ **FREE API KEY** (public data)

**How to Get:**
1. Visit: https://open.gsa.gov/api/get-opportunities-public-api/
2. Sign up for SAM.gov account
3. Request API key (instant approval for public data)
4. Rate limit: **10 requests/second** (very generous)

### **API Endpoints:**

1. **Search Contracts** - `/prod/opportunities/v2/search`
2. **Get Contract Details** - `/prod/opportunities/v2/contracts/{id}`
3. **Search by NAICS** - Filter by industry codes
4. **Search by PSC** - Filter by product/service codes
5. **Search by Agency** - Filter by agency/sub-agency
6. **Search by Vendor** - Filter by company (DUNS/UEI)

---

## 📊 Data Structure

### **Core Fields (100+ available):**

**Contract Identification:**
- `piid` - Procurement Instrument Identifier (unique contract ID)
- `mod_number` - Modification number
- `transaction_number` - Transaction ID
- `referenced_idv_piid` - Parent contract (for task orders)

**Dates:**
- `date_signed` - Contract signing date
- `effective_date` - When contract starts
- `current_completion_date` - Current end date
- `ultimate_completion_date` - Final end date (with options)
- `period_of_performance_start`
- `period_of_performance_end`

**Financial:**
- `base_and_exercised_options_value` - Current value
- `base_and_all_options_value` - Total potential value
- `dollars_obligated` - Amount actually obligated
- `current_total_value_of_award`

**Vendor Information:**
- `vendor_name` - Company name
- `vendor_duns` - DUNS number
- `vendor_uei` - Unique Entity Identifier (new)
- `vendor_cage_code` - CAGE code
- `vendor_address_street`
- `vendor_city`, `vendor_state`, `vendor_zip`
- `vendor_country`
- `parent_duns` - Parent company DUNS
- `parent_uei` - Parent company UEI

**Socioeconomic:**
- `small_business` - Boolean
- `woman_owned_small_business` - Boolean
- `veteran_owned_small_business` - Boolean
- `service_disabled_veteran_owned` - Boolean
- `hubzone_small_business` - Boolean
- `8a_program_participant` - Boolean
- `historically_underutilized_business_zone`
- `subcontinent_asian_american_owned`

**Classification:**
- `naics_code` - 6-digit industry code
- `naics_description` - Industry description
- `psc_code` - Product/Service Code
- `psc_description` - Product/Service description
- `contract_type` - FFP, CPFF, T&M, etc.
- `type_of_contract_pricing`

**Agency:**
- `contracting_agency_name`
- `contracting_agency_id`
- `funding_agency_name`
- `funding_agency_id`
- `contracting_office_name`

**Competition:**
- `extent_competed` - Full and open, sole source, etc.
- `number_of_offers_received`
- `solicitation_id` - Related solicitation
- `type_of_set_aside` - SB, WOSB, 8(a), HUBZone, etc.

**Work Details:**
- `description_of_requirement` - What the contract is for
- `place_of_performance_city`
- `place_of_performance_state`
- `place_of_performance_country`
- `place_of_performance_zip`

**SBIR-Specific (if applicable):**
- `research` - R&D indicator
- `research_type` - Basic, Applied, Development
- `sbir_phase` - Phase I, II, or III
- `sbir_program` - SBIR or STTR

---

## 🗄️ Database Schema for FPDS

### **Main Table: `fpds_contracts`**

```sql
CREATE TABLE IF NOT EXISTS fpds_contracts (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contract Identification
  piid TEXT NOT NULL,
  mod_number TEXT,
  transaction_number TEXT UNIQUE NOT NULL,
  referenced_idv_piid TEXT, -- Parent contract for task orders
  
  -- Dates
  date_signed DATE,
  effective_date DATE,
  current_completion_date DATE,
  ultimate_completion_date DATE,
  period_of_performance_start DATE,
  period_of_performance_end DATE,
  
  -- Financial
  base_and_exercised_options_value DECIMAL(15,2),
  base_and_all_options_value DECIMAL(15,2),
  dollars_obligated DECIMAL(15,2),
  current_total_value_of_award DECIMAL(15,2),
  
  -- Vendor
  vendor_name TEXT NOT NULL,
  vendor_duns TEXT,
  vendor_uei TEXT,
  vendor_cage_code TEXT,
  vendor_address TEXT,
  vendor_city TEXT,
  vendor_state TEXT,
  vendor_zip TEXT,
  vendor_country TEXT DEFAULT 'USA',
  parent_company_name TEXT,
  parent_duns TEXT,
  parent_uei TEXT,
  
  -- Socioeconomic
  small_business BOOLEAN DEFAULT false,
  woman_owned_small_business BOOLEAN DEFAULT false,
  veteran_owned_small_business BOOLEAN DEFAULT false,
  service_disabled_veteran_owned BOOLEAN DEFAULT false,
  hubzone_small_business BOOLEAN DEFAULT false,
  eight_a_program_participant BOOLEAN DEFAULT false,
  
  -- Classification
  naics_code TEXT,
  naics_description TEXT,
  psc_code TEXT,
  psc_description TEXT,
  contract_type TEXT,
  type_of_contract_pricing TEXT,
  
  -- Agency
  contracting_agency_name TEXT,
  contracting_agency_id TEXT,
  funding_agency_name TEXT,
  funding_agency_id TEXT,
  contracting_office_name TEXT,
  
  -- Competition
  extent_competed TEXT,
  number_of_offers_received INTEGER,
  solicitation_id TEXT,
  type_of_set_aside TEXT,
  
  -- Work Details
  description_of_requirement TEXT,
  place_of_performance_city TEXT,
  place_of_performance_state TEXT,
  place_of_performance_country TEXT,
  place_of_performance_zip TEXT,
  
  -- SBIR/R&D Specific
  is_research BOOLEAN DEFAULT false,
  research_type TEXT,
  sbir_phase TEXT,
  sbir_program TEXT,
  
  -- Metadata
  data_source TEXT DEFAULT 'fpds-sam.gov',
  fiscal_year INTEGER,
  last_modified_date TIMESTAMP,
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_fpds_piid ON fpds_contracts(piid);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_name ON fpds_contracts(vendor_name);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_uei ON fpds_contracts(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_fpds_vendor_duns ON fpds_contracts(vendor_duns);
CREATE INDEX IF NOT EXISTS idx_fpds_naics ON fpds_contracts(naics_code);
CREATE INDEX IF NOT EXISTS idx_fpds_psc ON fpds_contracts(psc_code);
CREATE INDEX IF NOT EXISTS idx_fpds_agency ON fpds_contracts(contracting_agency_id);
CREATE INDEX IF NOT EXISTS idx_fpds_date_signed ON fpds_contracts(date_signed);
CREATE INDEX IF NOT EXISTS idx_fpds_fiscal_year ON fpds_contracts(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_fpds_small_business ON fpds_contracts(small_business);
CREATE INDEX IF NOT EXISTS idx_fpds_woman_owned ON fpds_contracts(woman_owned_small_business);
CREATE INDEX IF NOT EXISTS idx_fpds_sbir_phase ON fpds_contracts(sbir_phase) WHERE sbir_phase IS NOT NULL;

-- Full-text search on description
CREATE INDEX IF NOT EXISTS idx_fpds_description_fts ON fpds_contracts USING GIN (to_tsvector('english', description_of_requirement));
```

### **Supporting Tables:**

**1. Company Performance Aggregations:**

```sql
CREATE TABLE IF NOT EXISTS fpds_company_stats (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT UNIQUE NOT NULL,
  vendor_uei TEXT UNIQUE,
  vendor_duns TEXT,
  
  total_contracts INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  total_obligated DECIMAL(15,2) DEFAULT 0,
  
  sbir_contracts INTEGER DEFAULT 0,
  sbir_value DECIMAL(15,2) DEFAULT 0,
  
  dod_contracts INTEGER DEFAULT 0,
  dod_value DECIMAL(15,2) DEFAULT 0,
  
  first_contract_date DATE,
  most_recent_contract_date DATE,
  
  top_naics_codes TEXT[],
  top_agencies TEXT[],
  
  small_business BOOLEAN,
  woman_owned BOOLEAN,
  veteran_owned BOOLEAN,
  hubzone BOOLEAN,
  eight_a BOOLEAN,
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**2. NAICS Industry Aggregations:**

```sql
CREATE TABLE IF NOT EXISTS fpds_naics_stats (
  id BIGSERIAL PRIMARY KEY,
  naics_code TEXT UNIQUE NOT NULL,
  naics_description TEXT,
  
  total_contracts INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  
  top_agencies TEXT[],
  top_companies TEXT[],
  
  avg_contract_value DECIMAL(15,2),
  median_contract_value DECIMAL(15,2),
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**3. Scraper Log:**

```sql
CREATE TABLE IF NOT EXISTS fpds_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL,
  fiscal_year INTEGER,
  agency TEXT,
  date_range TEXT,
  
  records_found INTEGER,
  records_inserted INTEGER,
  records_updated INTEGER,
  records_skipped INTEGER,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);
```

---

## 🚀 Implementation Strategy

### **Phase 1: Initial Bulk Load (One-Time)**

**Goal:** Get last 5 years of contracts (~5-10 million records)

**Approach:**
1. **By Fiscal Year** (FY2020 - FY2024)
2. **By Agency** (to parallelize and avoid timeouts)
3. **Filter: Small Business = TRUE** (reduce dataset by ~70%)

**Estimated Dataset Size:**
- All contracts (5 years): ~10 million records (~50 GB)
- Small business only: ~3 million records (~15 GB)
- SBIR/STTR only: ~200,000 records (~1 GB)

**Strategy:**
```
For each fiscal year (2020-2024):
  For each agency (DOD, NASA, DHS, etc.):
    Query FPDS API:
      - Fiscal year = [year]
      - Agency = [agency]
      - Small business = TRUE
      - Page size = 1000
      - Paginate through all results
    Normalize data
    Batch insert to Supabase (1000 at a time)
    Log progress
```

**Runtime Estimate:**
- 5 years × 20 agencies × ~150 requests = ~15,000 API calls
- Rate limit: 10 req/sec = ~25 minutes (theoretical)
- With delays + processing: **2-4 hours total**

---

### **Phase 2: Daily Incremental Updates**

**Goal:** Keep data current

**Approach:**
1. **Run daily at 4:00 AM ET** (after DSIP at 2 AM, Awards at 3 AM)
2. **Query: last_modified_date >= yesterday**
3. **Update existing records** (modifications)
4. **Insert new records** (new contracts)

**Daily Volume:**
- New contracts per day: ~5,000-10,000
- Modifications per day: ~20,000-30,000
- Total daily updates: ~30,000-40,000 records

**Runtime:** 10-20 minutes/day

---

## 📈 Data Volume & Cost Analysis

### **Storage:**

| Dataset | Records | Size | Supabase Cost |
|---------|---------|------|---------------|
| Full (5 years) | 10M | 50 GB | $150/month |
| Small Business | 3M | 15 GB | $50/month |
| SBIR Only | 200K | 1 GB | $5/month |

**Recommendation:** Start with **Small Business only** (~3M records, $50/month)

### **Compute:**

- **Bulk load:** One-time, 2-4 hours (Vercel Pro allows this)
- **Daily updates:** 10-20 min/day (included in Pro)
- **API queries:** Read-heavy, Supabase handles well

### **API Costs:**

- **SAM.gov API:** FREE (public data)
- **Rate limit:** 10 req/sec (very generous)
- **No costs for API access**

---

## 🔧 Technical Implementation

### **Scraper Service:**

**File:** `src/lib/fpds-scraper.ts`

**Key Functions:**
- `fetchFromFPDS(params)` - Query SAM.gov API
- `normalizeFPDSContract(raw)` - Transform to DB format
- `batchUpsertContracts(contracts)` - Insert/update in DB
- `scrapeFiscalYear(year, agency)` - Bulk scrape by year
- `dailyUpdateScraper()` - Incremental daily updates

### **API Endpoints:**

1. **GET /api/fpds/contracts** - Browse all contracts (admin)
2. **GET /api/fpds/company/:uei** - Company contract history
3. **GET /api/fpds/industry/:naics** - Industry analytics
4. **GET /api/fpds/agency/:agencyId** - Agency spending
5. **POST /api/cron/fpds-scraper** - Daily scraper (cron)

### **UI Components:**

1. **Company Performance Dashboard**
   - Total contracts, total value
   - Win rate, competition stats
   - NAICS breakdown
   - Agency relationships

2. **Industry Intelligence**
   - Top performers by NAICS
   - Market size, trends
   - Competition analysis

3. **Agency Spending**
   - Top vendors per agency
   - Spending trends
   - Set-aside utilization

---

## 🎯 Integration with Existing System

### **Link FPDS to SBIR Opportunities:**

**Strategy:** Match by solicitation ID and company

```sql
-- Link FPDS contracts to SBIR opportunities
ALTER TABLE fpds_contracts ADD COLUMN sbir_topic_number TEXT;

-- Create view linking FPDS awards to SBIR topics
CREATE VIEW fpds_sbir_awards AS
SELECT 
  fc.*,
  sf.title as opportunity_title,
  sf.status as opportunity_status
FROM fpds_contracts fc
LEFT JOIN sbir_final sf ON fc.solicitation_id = sf.topic_number
WHERE fc.sbir_phase IS NOT NULL;
```

### **Enhance Company Profiles:**

Combine SBIR.gov awards + FPDS contracts for **complete company history**:

```sql
-- Unified company view
CREATE VIEW company_complete_history AS
SELECT 
  'SBIR' as source,
  contract_award_number as contract_id,
  company,
  award_amount,
  award_year,
  phase,
  agency
FROM sbir_awards
UNION ALL
SELECT 
  'FPDS' as source,
  piid as contract_id,
  vendor_name as company,
  base_and_exercised_options_value as award_amount,
  EXTRACT(YEAR FROM date_signed) as award_year,
  sbir_phase as phase,
  contracting_agency_name as agency
FROM fpds_contracts;
```

---

## 🚦 Implementation Timeline

### **Week 1: Setup & Pilot**
- [ ] Register for SAM.gov API key
- [ ] Create database tables
- [ ] Build scraper service
- [ ] Test with 1,000 records (single agency, single year)
- [ ] Verify data quality

### **Week 2: Bulk Load**
- [ ] Run bulk scraper for FY2024 (most recent)
- [ ] ~600K-1M records (small business)
- [ ] Verify & validate
- [ ] Build company aggregation queries

### **Week 3: Historical Load**
- [ ] Run bulk scraper for FY2020-FY2023
- [ ] ~2-3M additional records
- [ ] Run aggregation jobs
- [ ] Optimize database indexes

### **Week 4: Daily Scraper & UI**
- [ ] Build daily incremental scraper
- [ ] Set up cron job (4:00 AM)
- [ ] Build API endpoints
- [ ] Create UI components
- [ ] Test and deploy

---

## 🎁 What This Gives You

### **Competitive Intelligence:**

1. **Complete Company History**
   - Not just SBIR, ALL federal contracts
   - Parent company relationships
   - Full financial picture

2. **Market Intelligence**
   - Who wins in each NAICS code?
   - Average contract values by industry
   - Competition levels (# of offers)

3. **Agency Insights**
   - Which agencies prefer which vendors?
   - Set-aside utilization rates
   - Contract vehicle preferences

4. **Predictive Analytics** (Future)
   - Which companies win most?
   - What NAICS codes are hot?
   - Which agencies have money to spend?

---

## 🔐 Security & Compliance

### **Data Privacy:**

- ✅ All FPDS data is **public domain**
- ✅ No PII (Personal Identifiable Information)
- ✅ All company data is public record
- ✅ No authentication required for public data

### **Terms of Use:**

- ✅ SAM.gov API is free for **research and analysis**
- ✅ No redistribution of raw data (we're not doing this)
- ✅ Attribution required (we'll add "Data from SAM.gov/FPDS")
- ✅ Rate limits must be respected (10 req/sec)

---

## 📊 Sample API Query

### **Query: Get all DOD small business contracts in FY2024**

```bash
curl "https://api.sam.gov/prod/opportunities/v2/search" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 1000,
    "offset": 0,
    "filters": {
      "fiscalYear": "2024",
      "contractingAgency": "DEPT OF DEFENSE",
      "smallBusiness": true
    },
    "sort": {
      "field": "dateSigned",
      "order": "desc"
    }
  }'
```

---

## 🎯 Next Steps

### **Immediate Actions:**

1. **Register for SAM.gov API**
   - Visit: https://open.gsa.gov/api/get-opportunities-public-api/
   - Sign up for account
   - Request API key (instant)

2. **Run SQL migration**
   - Create `fpds_contracts` table
   - Create supporting tables
   - Create indexes

3. **Test API access**
   - Run sample query
   - Verify data structure
   - Test pagination

4. **Build pilot scraper**
   - Single agency (NASA)
   - Single year (FY2024)
   - Small business only
   - Import ~10K records

5. **Validate & iterate**
   - Check data quality
   - Verify normalization
   - Test queries
   - Optimize as needed

---

## 💡 Summary

**FPDS = GAME CHANGER**

- **Scale:** 3M+ small business contracts (vs 200K SBIR awards)
- **Depth:** Full contract lifecycle, modifications, financials
- **Breadth:** ALL agencies, ALL contract types
- **FREE:** SAM.gov API is public domain, no costs
- **Current:** Daily updates available
- **Powerful:** Enables true competitive intelligence

**Timeline:** 4 weeks to full production

**Cost:** ~$50/month (Supabase storage only)

**ROI:** Massive - this is data competitors would pay $10K+/year for

**Status:** Ready to start immediately (API is live)

---

**Ready to build this?** 🚀

