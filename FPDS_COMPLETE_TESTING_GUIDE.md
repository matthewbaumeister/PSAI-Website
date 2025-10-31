# FPDS Complete Testing & Monitoring Guide

## 🎯 Your Questions Answered

You asked:
> "How do we test fully integrating? All things downloaded? New updates tracked and scraped? How check Supabase? What commands? When is updated? How make sure stored properly?"

This guide answers everything!

---

## ✅ Step 1: Initial Test (2 minutes)

### **Run This Command:**
```bash
npx tsx test-fpds-scraper.ts
```

### **What It Does:**
- Fetches 10 contracts from USASpending.gov
- Normalizes data
- Inserts into Supabase
- Shows statistics

### **Expected Output:**
```
============================================
FPDS Scraper - Test Script
============================================

TEST 1: Fetching 10 contracts...
✅ Fetched 10 contracts

Sample Contract:
Award ID: W9128F25C0008
Recipient: EDMAN BRYAN LLC
Amount: $19,476,530
...

TEST 2: Normalizing...
✅ Normalized 10 contracts

TEST 3: Inserting to database...
✅ Database insert complete:
   - Inserted: 10
   - Errors: 0

TEST 4: Getting statistics...
✅ Current database stats:
   - Total Contracts: 10

✅ ALL TESTS PASSED!
```

### **If This Works:**
✅ API connection works
✅ Database connection works
✅ Data normalization works
✅ Ready for bulk load!

---

## ✅ Step 2: Verify in Supabase (2 minutes)

### **Check Your Data:**

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard

2. **Select Your Project**

3. **Click "Table Editor"** (left sidebar)

4. **Open `fpds_contracts` table**

5. **You Should See:**
   - 10 rows
   - Columns: piid, vendor_name, award amounts, dates
   - Real contract data

### **SQL Query to Check:**
In Supabase SQL Editor, run:

```sql
-- Check total contracts
SELECT COUNT(*) as total_contracts FROM fpds_contracts;

-- Check recent contracts
SELECT 
  piid,
  vendor_name,
  base_and_exercised_options_value,
  date_signed,
  contracting_agency_name
FROM fpds_contracts
ORDER BY created_at DESC
LIMIT 10;

-- Check by agency
SELECT 
  contracting_agency_name,
  COUNT(*) as contract_count,
  SUM(base_and_exercised_options_value) as total_value
FROM fpds_contracts
GROUP BY contracting_agency_name
ORDER BY contract_count DESC;
```

---

## ✅ Step 3: Pilot Scrape (5 minutes)

### **Run This Command:**
```bash
npx tsx src/scripts/fpds-pilot-scrape.ts
```

### **What It Does:**
- Fetches first 100 contracts from 2024
- Full end-to-end test
- Validates entire pipeline

### **Expected Output:**
```
============================================
FPDS Pilot Scrape
============================================

Importing first 100 contracts from 2024...
[FPDS Scraper] Fetching contracts: 2024-01-01 to 2024-12-31, page 1
[FPDS Scraper] Found 100 contracts
[FPDS Scraper] Batch 1: Inserted 100 contracts
[FPDS Scraper] Complete in 3s
[FPDS Scraper] Inserted: 100, Errors: 0

============================================
Pilot Scrape Complete!
============================================

✅ Inserted: 100 contracts
⚠️  Errors: 0 contracts

Total contracts in database: 110
```

### **Verify:**
```sql
SELECT COUNT(*) FROM fpds_contracts;
-- Should show 110 (10 from test + 100 from pilot)
```

---

## ✅ Step 4: Bulk Load (2-4 hours, overnight)

### **Run This Command:**
```bash
# Full year 2024
npx tsx src/scripts/fpds-bulk-load.ts --year=2024

# Or just Q1 2024 (faster, for testing)
npx tsx src/scripts/fpds-bulk-load.ts --year=2024 --months=3
```

### **What It Does:**
- Scrapes month-by-month
- Up to 10,000 contracts per month
- Full year = ~100,000-120,000 contracts
- Tracks progress
- Logs everything

### **Expected Output:**
```
============================================
FPDS Bulk Load
============================================

Configuration:
  Year: 2024
  Months: 12 (full year)
  Small Business Filter: No (all contracts)
  Max Pages per month: 100 (10,000 contracts/month)

⚠️  WARNING: This will import 100,000+ contracts.
⚠️  Estimated time: 2-4 hours.

Starting in 5 seconds... (Press Ctrl+C to cancel)

============================================
Scraping Month 1/12: 01/2024
============================================

[FPDS Scraper] Fetching contracts: 2024-01-01 to 2024-01-31, page 1
[FPDS Scraper] Found 100 contracts
... (continues) ...

✅ Month 1 complete:
   - Inserted: 8,432
   - Total so far: 8,432 contracts

... (months 2-12) ...

============================================
Bulk Load Complete!
============================================

Total Inserted: 105,248 contracts
Total Errors: 23 contracts
Duration: 147 minutes

Total contracts in database: 105,358
```

### **Monitor Progress:**

While it's running, you can check Supabase:

```sql
-- Check current count (run every 5 minutes)
SELECT COUNT(*) FROM fpds_contracts;

-- Check latest imports
SELECT 
  fiscal_year,
  COUNT(*) as count,
  MAX(created_at) as last_import
FROM fpds_contracts
GROUP BY fiscal_year;

-- Check scraper log
SELECT 
  scrape_type,
  fiscal_year,
  records_inserted,
  status,
  started_at,
  duration_seconds
FROM fpds_scraper_log
ORDER BY started_at DESC
LIMIT 10;
```

---

## ✅ Step 5: Verify All Data Loaded (5 minutes)

### **After Bulk Load Completes:**

#### **Check 1: Total Count**
```sql
SELECT COUNT(*) as total FROM fpds_contracts;
-- Should be 100K-120K for full year 2024
```

#### **Check 2: Date Range**
```sql
SELECT 
  MIN(date_signed) as earliest,
  MAX(date_signed) as latest,
  COUNT(*) as total
FROM fpds_contracts;
-- Should span 2024-01-01 to 2024-12-31
```

#### **Check 3: Top Vendors**
```sql
SELECT 
  vendor_name,
  COUNT(*) as contract_count,
  SUM(base_and_exercised_options_value) as total_value
FROM fpds_contracts
GROUP BY vendor_name
ORDER BY total_value DESC NULLS LAST
LIMIT 20;
-- Should show real companies with real contract values
```

#### **Check 4: Top Agencies**
```sql
SELECT 
  contracting_agency_name,
  COUNT(*) as contracts,
  SUM(base_and_exercised_options_value) as total_value
FROM fpds_contracts
GROUP BY contracting_agency_name
ORDER BY contracts DESC
LIMIT 10;
-- Should show DOD, DHS, VA, etc.
```

#### **Check 5: Data Quality**
```sql
-- Check for nulls in critical fields
SELECT 
  COUNT(*) FILTER (WHERE vendor_name IS NULL) as missing_vendor,
  COUNT(*) FILTER (WHERE piid IS NULL) as missing_piid,
  COUNT(*) FILTER (WHERE date_signed IS NULL) as missing_date,
  COUNT(*) FILTER (WHERE base_and_exercised_options_value IS NULL) as missing_amount,
  COUNT(*) as total
FROM fpds_contracts;
-- Should show minimal nulls (< 5%)
```

---

## 🔄 Step 6: Daily Updates (Automation)

### **How to Keep Data Current:**

#### **Option A: Manual Daily Update**

Run this every morning:

```bash
# Get yesterday's contracts
npx tsx src/scripts/fpds-daily-update.ts
```

#### **Option B: Automated Cron Job**

Create file: `src/app/api/cron/fpds-daily-update/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { scrapeDateRange } from '@/lib/fpds-scraper';

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get yesterday's contracts
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const result = await scrapeDateRange(dateStr, dateStr, {
    smallBusiness: false,
    maxPages: 50 // ~5,000 contracts max
  });

  return NextResponse.json({
    success: true,
    inserted: result.inserted,
    errors: result.errors,
    date: dateStr
  });
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/dsip-scraper",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/awards-scraper",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/fpds-daily-update",
      "schedule": "0 4 * * *"
    }
  ]
}
```

This runs at 4:00 AM daily, after DSIP and Awards scrapers.

---

## 📊 Step 7: Monitoring Dashboard

### **Create Monitoring Queries:**

Save these in Supabase → SQL Editor → "Saved Queries"

#### **Query 1: Daily Stats**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as contracts_added
FROM fpds_contracts
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### **Query 2: Scraper Health**
```sql
SELECT 
  DATE(started_at) as date,
  scrape_type,
  records_inserted,
  records_errors,
  status,
  duration_seconds
FROM fpds_scraper_log
ORDER BY started_at DESC
LIMIT 30;
```

#### **Query 3: Data Freshness**
```sql
SELECT 
  MAX(date_signed) as most_recent_contract,
  MAX(created_at) as last_import,
  AGE(NOW(), MAX(created_at)) as data_age
FROM fpds_contracts;
-- If data_age > 2 days, something's wrong
```

---

## 🚨 Step 8: Alerts & Troubleshooting

### **Set Up Alerts:**

#### **Daily Health Check Script:**

Create: `src/scripts/fpds-health-check.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function healthCheck() {
  // Check 1: Last import time
  const { data: lastImport } = await supabase
    .from('fpds_contracts')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const hoursSinceLastImport = lastImport 
    ? (Date.now() - new Date(lastImport.created_at).getTime()) / 1000 / 60 / 60
    : 999;

  if (hoursSinceLastImport > 48) {
    console.error('🚨 ALERT: No imports in 48+ hours!');
  } else {
    console.log('✅ Imports are current');
  }

  // Check 2: Recent scraper failures
  const { data: recentFails } = await supabase
    .from('fpds_scraper_log')
    .select('*')
    .eq('status', 'failed')
    .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (recentFails && recentFails.length > 0) {
    console.error(`🚨 ALERT: ${recentFails.length} failed scrapes in last 7 days`);
  } else {
    console.log('✅ No recent failures');
  }

  // Check 3: Total count growth
  const { count } = await supabase
    .from('fpds_contracts')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total contracts: ${count}`);
}

healthCheck();
```

Run daily:
```bash
npx tsx src/scripts/fpds-health-check.ts
```

---

## 📋 Complete Command Reference

### **Testing:**
```bash
# Test API & database
npx tsx test-fpds-scraper.ts

# Pilot scrape (100 contracts)
npx tsx src/scripts/fpds-pilot-scrape.ts
```

### **Bulk Loading:**
```bash
# Full year 2024
npx tsx src/scripts/fpds-bulk-load.ts --year=2024

# Just Q1 2024
npx tsx src/scripts/fpds-bulk-load.ts --year=2024 --months=3

# Multiple years
npx tsx src/scripts/fpds-bulk-load.ts --year=2024
npx tsx src/scripts/fpds-bulk-load.ts --year=2023
npx tsx src/scripts/fpds-bulk-load.ts --year=2022
```

### **Monitoring:**
```bash
# Health check
npx tsx src/scripts/fpds-health-check.ts

# View stats
npx tsx -e "import {getScraperStats} from './src/lib/fpds-scraper'; getScraperStats().then(s => console.log(s))"
```

---

## ✅ Success Checklist

After completing all steps, you should have:

- [ ] ✅ 10 test contracts in database
- [ ] ✅ 100 pilot contracts in database  
- [ ] ✅ 100,000+ contracts from bulk load
- [ ] ✅ All data verified in Supabase
- [ ] ✅ Scraper logs showing success
- [ ] ✅ Daily update script scheduled
- [ ] ✅ Monitoring queries saved
- [ ] ✅ Health check running

---

## 🎯 Summary

**To Test Everything:**
1. Run: `npx tsx test-fpds-scraper.ts`
2. Check Supabase for 10 records
3. Run: `npx tsx src/scripts/fpds-pilot-scrape.ts`
4. Check Supabase for 110 records
5. Run bulk load overnight
6. Verify 100K+ records next morning

**To Monitor:**
- Run health check daily
- Check Supabase scraper_log table
- Query fpds_contracts for latest data
- Set up daily cron job

**To Update:**
- Manual: Run daily update script
- Auto: Set up Vercel cron job (runs 4 AM daily)

**Data is Properly Stored When:**
- ✅ Counts match expected
- ✅ Date ranges are correct
- ✅ No excessive nulls
- ✅ Real company names appear
- ✅ Contract values look reasonable

---

Ready to start? Run this first command:

```bash
npx tsx test-fpds-scraper.ts
```

Then tell me the results! 🚀

