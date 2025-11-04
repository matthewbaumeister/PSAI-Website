# Complete Implementation Steps: GSA MAS + GWACs

## You Are Here
✅ Tried to run the SQL schema (got constraint error)  
➡️ **Next: Run the fixed schema and follow these steps**

---

## Step-by-Step Implementation

### Step 1: Run Fixed Database Schema (5 minutes)

**Run this file in Supabase SQL Editor:**
```
GWAC_AND_MAS_FIXED.sql
```

This will:
- Drop any conflicting tables
- Create all necessary tables for GWACs and GSA MAS
- Create indexes and views
- Set up helper functions

**Verify it worked:**
```sql
-- Should return 7 tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'contract_vehicles',
  'contract_holders', 
  'labor_rates',
  'product_pricing',
  'vehicle_task_orders',
  'vehicle_company_stats',
  'vehicle_scraper_log'
);
```

---

## Part A: GSA MAS Implementation (30 minutes)

### Step 2: Test CALC+ API Connection (2 minutes)

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
ts-node src/lib/calc-plus-scraper.ts search "Software Engineer"
```

**Expected Output:**
```
[CALC+] Fetching: https://calc.gsa.gov/api/rates/?q=Software+Engineer...
[CALC+] Found 10 rates (total: 1247)

=== SEARCH RESULTS ===
Found 1247 total results

First 10 results:
  Software Engineer (3yr) - $95.50/hr - Company A (GS35F0119Y)
  Senior Software Engineer (5yr) - $125.30/hr - Company B (GS35F0234Z)
  ...
```

**If this works, continue. If not, let me know the error.**

### Step 3: Scrape Popular Labor Categories (15 minutes)

This will get you ~2,000-5,000 labor rate records across 18 popular categories.

```bash
ts-node src/lib/calc-plus-scraper.ts popular
```

**This will scrape:**
- Software Engineer (all levels)
- Project Manager
- Business Analyst
- Systems Analyst
- Database Administrator
- Network Engineer
- Security Specialist
- Cybersecurity Analyst
- DevOps Engineer
- Cloud Architect
- Data Scientist
- UX Designer
- Technical Writer
- Help Desk Technician
- IT Support Specialist

**Expected Output:**
```
[CALC+] Starting bulk scrape of 18 popular labor categories
[CALC+] Scraping rates for labor category: Software Engineer
[CALC+] Found 1247 rates
[CALC+] Created vehicle record for GS35F0119Y
[CALC+] Processed page 1, total: 100
...
[CALC+] Bulk scrape complete!
  Categories Processed: 18
  Total Rates: 3,452
```

### Step 4: Verify GSA MAS Data (5 minutes)

```sql
-- Check total rates imported
SELECT COUNT(*) as total_rates FROM labor_rates;

-- See rate breakdown by category
SELECT 
  labor_category,
  COUNT(*) as rate_count,
  AVG(current_year_rate) as avg_rate,
  MIN(current_year_rate) as min_rate,
  MAX(current_year_rate) as max_rate
FROM labor_rates
GROUP BY labor_category
ORDER BY rate_count DESC;

-- Find cheapest vs most expensive for Senior Software Engineer
SELECT 
  company_name,
  contract_number,
  min_years_experience,
  current_year_rate
FROM labor_rates
WHERE labor_category LIKE '%Senior Software Engineer%'
ORDER BY current_year_rate
LIMIT 10;
```

### Step 5: Build Rate Comparison Dashboard (Optional - 2 hours)

Create a simple page to compare rates:

**Example queries for dashboard:**
```sql
-- Rate comparison view (already created)
SELECT * FROM labor_rate_comparison 
WHERE labor_category = 'Senior Software Engineer'
LIMIT 50;

-- Find best value (low rate + high experience)
SELECT 
  company_name,
  labor_category,
  min_years_experience,
  current_year_rate,
  ROUND(current_year_rate / NULLIF(min_years_experience, 0), 2) as cost_per_year_experience
FROM labor_rates
WHERE labor_category LIKE '%Software Engineer%'
  AND min_years_experience > 0
ORDER BY cost_per_year_experience
LIMIT 20;
```

**✅ GSA MAS IS NOW LIVE! You have pricing intelligence.**

---

## Part B: GWAC Implementation (6-10 hours)

### Step 6: Add GWAC Programs (15 minutes)

Run this SQL to add the major GWAC programs:

```sql
-- Insert Major GWAC Programs

INSERT INTO contract_vehicles (
  vehicle_type, program_name, program_code, contract_number, 
  contract_type, managing_agency, status, contract_ceiling, 
  award_date, base_period_start, base_period_end, 
  ultimate_expiration_date, small_business_only, veteran_owned_only, 
  eight_a_only, contract_website
) VALUES

-- 8(a) STARS III
(
  'GWAC', '8(a) STARS III', 'STARS3', 'GS00Q17GWD4003', 
  'IT Services', 'GSA', 'Active', 50000000000, 
  '2019-06-04', '2019-06-04', '2024-06-03', 
  '2034-06-03', false, false, true,
  'https://www.gsa.gov/buy-through-us/purchasing-programs/gsa-schedules/gsa-schedule-offerings/8a-stars-iii'
),

-- Alliant 2
(
  'GWAC', 'Alliant 2', 'ALLIANT2', 'GS00Q14OADU107', 
  'IT Services', 'GSA', 'Active', 80000000000, 
  '2018-08-16', '2018-08-16', '2023-08-15', 
  '2033-08-15', false, false, false,
  'https://www.gsa.gov/buy-through-us/products-and-services/information-technology/alliant-2-governmentwide-acquisition-contract'
),

-- Alliant 2 Small Business
(
  'GWAC', 'Alliant 2 Small Business', 'ALLIANT2_SB', 'GS00Q14OADU206', 
  'IT Services', 'GSA', 'Active', 15000000000, 
  '2018-08-16', '2018-08-16', '2023-08-15', 
  '2033-08-15', true, false, false,
  'https://www.gsa.gov/buy-through-us/products-and-services/information-technology/alliant-2-governmentwide-acquisition-contract'
),

-- VETS 2
(
  'GWAC', 'VETS 2', 'VETS2', 'VA11817F1001', 
  'IT Services', 'VA', 'Active', 85000000000, 
  '2018-03-29', '2018-03-29', '2023-03-28', 
  '2038-03-28', false, true, false,
  'https://www.gsa.gov/buy-through-us/products-and-services/information-technology/vets-2-gwac'
),

-- Polaris
(
  'GWAC', 'Polaris', 'POLARIS', '47QRAD20D', 
  'IT Services', 'GSA', 'Active', 15000000000, 
  '2020-12-15', '2020-12-15', '2025-12-14', 
  '2040-12-14', true, false, false,
  'https://www.gsa.gov/buy-through-us/products-and-services/information-technology/polaris'
),

-- OASIS+
(
  'GWAC', 'OASIS+', 'OASIS_PLUS', '47QRAA', 
  'Professional Services', 'GSA', 'Active', 130000000000, 
  '2023-01-01', '2023-01-01', '2028-01-01', 
  '2048-01-01', false, false, false,
  'https://www.gsa.gov/buy-through-us/products-and-services/professional-services/oasisplus'
),

-- CIO-SP4
(
  'GWAC', 'CIO-SP4', 'CIOSP4', 'HHSN316201900001W', 
  'IT Services', 'NIH', 'Active', 50000000000, 
  '2020-05-05', '2020-05-05', '2030-05-04', 
  '2040-05-04', false, false, false,
  'https://cio-sp4.com/'
);

-- Verify
SELECT program_name, program_code, contract_ceiling, status 
FROM contract_vehicles 
WHERE vehicle_type = 'GWAC'
ORDER BY contract_ceiling DESC;
```

### Step 7: Link FPDS Data to GWACs (15 minutes)

First, identify what GWAC task orders you already have in FPDS:

```bash
ts-node src/lib/gwac-fpds-linker.ts identify
```

**Expected Output:**
```
[GWAC Identifier] Scanning FPDS for potential GWAC contracts...
[GWAC Identifier] Scan complete!
  Total Task Orders: 15,234
  Unique Parent PIIDs: 8,723
  Potential GWAC Matches:
    8(a) STARS III: 342 task orders
    Alliant 2: 156 task orders
    VETS 2: 89 task orders
    Polaris: 67 task orders
```

Then link them (dry run first):

```bash
ts-node src/lib/gwac-fpds-linker.ts link
```

If it looks good, run for real:

```bash
ts-node src/lib/gwac-fpds-linker.ts link --for-real
```

**Verify:**
```sql
-- Check linked task orders
SELECT COUNT(*) as total_gwac_orders FROM vehicle_task_orders;

-- Breakdown by GWAC program
SELECT 
  cv.program_name,
  COUNT(vto.id) as task_orders,
  SUM(vto.order_value) as total_value
FROM contract_vehicles cv
LEFT JOIN vehicle_task_orders vto ON cv.id = vto.vehicle_id
WHERE cv.vehicle_type = 'GWAC'
GROUP BY cv.program_name
ORDER BY total_value DESC;
```

### Step 8: Scrape GWAC Contract Holders (4-6 hours)

**Option A: Manual Entry (Faster for Testing)**

Start with 8(a) STARS III (86 companies). Download the list from:
https://www.gsa.gov/buy-through-us/purchasing-programs/gsa-schedules/gsa-schedule-offerings/8a-stars-iii

Then manually insert a few to test:

```sql
-- Get STARS III vehicle ID
SELECT id FROM contract_vehicles WHERE program_code = 'STARS3';
-- Say it returns id = 1

-- Insert sample contract holders
INSERT INTO contract_holders (
  vehicle_id, company_name, vendor_uei, contract_number, status
) VALUES
(1, 'Example Tech Company', 'ABC123DEF456', '47QTCA19D0001', 'Active'),
(1, 'Another Company Inc', 'XYZ789GHI012', '47QTCA19D0002', 'Active');
```

**Option B: Build Web Scraper (For Full Automation)**

I can help you build a scraper for each GWAC's contract holder list, but this requires:
1. Analyzing each GWAC website's structure
2. Building parsing logic for PDF/Excel/HTML
3. 4-6 hours development time

Let me know if you want this.

### Step 9: Build GWAC Analytics Dashboard (2-3 hours)

**Key Queries for Dashboard:**

```sql
-- Top GWAC performers by task order value
SELECT 
  ch.company_name,
  cv.program_name,
  COUNT(vto.id) as task_orders,
  SUM(vto.order_value) as total_value
FROM contract_holders ch
JOIN contract_vehicles cv ON ch.vehicle_id = cv.id
JOIN vehicle_task_orders vto ON ch.id = vto.contract_holder_id
WHERE cv.vehicle_type = 'GWAC'
GROUP BY ch.company_name, cv.program_name
ORDER BY total_value DESC
LIMIT 50;

-- Companies with multiple GWAC positions
SELECT 
  company_name,
  COUNT(DISTINCT vehicle_id) as gwac_count,
  ARRAY_AGG(DISTINCT cv.program_name) as gwacs
FROM contract_holders ch
JOIN contract_vehicles cv ON ch.vehicle_id = cv.id
WHERE cv.vehicle_type = 'GWAC'
GROUP BY company_name
HAVING COUNT(DISTINCT vehicle_id) > 1
ORDER BY gwac_count DESC;

-- Agency spending by GWAC
SELECT 
  vto.ordering_agency_name,
  cv.program_name,
  COUNT(vto.id) as orders,
  SUM(vto.order_value) as total_spent
FROM vehicle_task_orders vto
JOIN contract_vehicles cv ON vto.vehicle_id = cv.id
WHERE cv.vehicle_type = 'GWAC'
GROUP BY vto.ordering_agency_name, cv.program_name
ORDER BY total_spent DESC
LIMIT 50;
```

---

## Part C: Automation & Maintenance

### Step 10: Set Up Automated Updates

**Create cron job scripts:**

#### Daily: Link New FPDS Orders to Vehicles
```typescript
// src/app/api/cron/link-vehicle-orders/route.ts

import { linkFPDSToGWAC } from '@/lib/gwac-fpds-linker';

export async function GET(request: Request) {
  // Link orders from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const result = await linkFPDSToGWAC({
    dateFrom: sevenDaysAgo.toISOString().split('T')[0]
  });
  
  return Response.json(result);
}
```

#### Monthly: Update CALC+ Rates
```typescript
// src/app/api/cron/update-calc-rates/route.ts

import { scrapePopularLaborCategories } from '@/lib/calc-plus-scraper';

export async function GET(request: Request) {
  const result = await scrapePopularLaborCategories();
  return Response.json(result);
}
```

#### Weekly: Update Statistics
```sql
-- Run this weekly
SELECT update_vehicle_company_stats();
```

---

## Quick Reference: What's Working Now

### After Step 3 (GSA MAS Basic):
✅ Labor rates from 25,000+ GSA MAS contracts  
✅ Rate comparison queries  
✅ Pricing intelligence  
❌ GWAC programs  
❌ GWAC contract holders  
❌ FPDS linking  

### After Step 7 (GWAC Linking):
✅ Labor rates from MAS  
✅ GWAC programs defined  
✅ FPDS task orders linked to GWACs  
❌ GWAC contract holder details  

### After Step 8 (Full Implementation):
✅ Everything!  
✅ Complete contract vehicle tracking  
✅ Pricing intelligence  
✅ Company portfolios  
✅ Market analytics  

---

## Troubleshooting

### Error: "relation already exists"
**Solution:** Run `GWAC_AND_MAS_FIXED.sql` which drops tables first

### Error: "column does not exist" 
**Solution:** Make sure you ran the full schema, not just part of it

### CALC+ scraper fails
**Solution:** Check internet connection, try manual curl:
```bash
curl "https://calc.gsa.gov/api/rates/?page_size=5"
```

### No results from FPDS linking
**Solution:** Check that you have FPDS data with `referenced_idv_piid`:
```sql
SELECT COUNT(*) FROM fpds_contracts WHERE referenced_idv_piid IS NOT NULL;
```

---

## Priority Order (If Time Limited)

### Must Do (1 hour):
1. ✅ Run GWAC_AND_MAS_FIXED.sql
2. ✅ Run CALC+ popular scraper
3. ✅ Verify rate data

**Result:** Pricing intelligence live

### Should Do (3 hours):
4. Add GWAC programs
5. Link FPDS to GWACs
6. Build basic rate comparison view

**Result:** Complete data foundation

### Nice to Have (8 hours):
7. Scrape GWAC contract holders
8. Build full dashboards
9. Set up automation

**Result:** Production-ready system

---

## Your Next Command

Run this NOW to fix the schema error:

```bash
# In Supabase SQL Editor, paste contents of:
GWAC_AND_MAS_FIXED.sql
```

Then come back here and continue with Step 2!
