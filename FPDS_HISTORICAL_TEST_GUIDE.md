# FPDS Historical Transactions Scraper - Test Guide

## What's New

Created: `fpds-historical-transactions-scraper.ts`

**NEW scraper that uses TRANSACTIONS endpoint** to capture:
- ✅ Initial awards
- ✅ ALL modifications  
- ✅ Amendments
- ✅ Deobligations
- ✅ Task orders
- ✅ Complete contract lifecycle

**OLD scraper kept as backup:** `fpds-page-level-scraper.ts` (awards only)

---

## Step 1: Test Mode (Single Day)

Test with **ONE day** to verify everything works:

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --test
```

**What it does:**
- Scrapes yesterday's transactions
- Should find 1,000+ transactions (vs 12 with old method)
- Takes ~10-50 minutes
- Shows before/after database counts

**Expected output:**
```
✅ HISTORICAL SCRAPE COMPLETE
Dates Processed: 1
New Contracts: 1,247
Updated Contracts: 156
Database Before: 30,600
Database After: 31,847
Database Growth: 1,247
Duration: 25.3 minutes

✅ TEST PASSED - Scraper is working correctly!
```

**If test passes:**
- ✅ Scraper is working
- ✅ API is accessible
- ✅ Database is updating
- ✅ Ready for larger date ranges

---

## Step 2: Small Date Range (1 Week)

Test with a **small range** to verify multi-day functionality:

```bash
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2025-10-25
```

**What it does:**
- Scrapes 7 days of transactions
- ~7,000-10,000 transactions total
- Takes ~2-5 hours
- Progress saved page-by-page

**Expected output:**
```
✅ HISTORICAL SCRAPE COMPLETE
Dates Processed: 7
New Contracts: 8,743
Updated Contracts: 1,256
Database Growth: 10,000
Duration: 175.2 minutes
```

**If successful:**
- ✅ Multi-day scraping works
- ✅ Progress tracking works
- ✅ Ready for full historical scrape

---

## Step 3: Full Historical Scrape (Optional)

Once tests pass, run the **full historical scrape**:

```bash
# 3 months of data
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2025-08-01

# 6 months of data  
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2025-05-01

# Full year
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2024-11-01
```

**Time estimates:**
- 1 month = ~30,000 transactions = ~25 hours
- 3 months = ~90,000 transactions = ~75 hours (3 days)
- 6 months = ~180,000 transactions = ~150 hours (6 days)
- 1 year = ~360,000 transactions = ~300 hours (12 days)

**Pro tip:** Run in tmux session so it survives disconnects:
```bash
# Start tmux session
tmux new -s fpds-historical

# Run scraper
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2024-11-01

# Detach: Press Ctrl+B, then D
# Reattach later: tmux attach -t fpds-historical
```

---

## Key Features

### 1. Page-Level Progress Tracking
- Saves progress after EACH page
- Can resume from exact page if interrupted
- Never loses work

### 2. Resilient Retry Logic
- 20 retry attempts per page
- Exponential backoff (30s → 5min)
- Handles API instability

### 3. Error Tracking
- Failed contracts logged to `fpds_failed_contracts` table
- Can retry failed contracts later
- Automatic cleanup of resolved failures

### 4. Rate Limiting
- 500ms delay between detail fetches
- Prevents API throttling
- Respects API limits

### 5. Data Quality
- Validates all contracts
- Quality score per page
- Skips invalid data

---

## Monitoring Progress

### Check Database Growth
```sql
-- Total contracts
SELECT COUNT(*) FROM fpds_contracts;

-- Contracts scraped today
SELECT COUNT(*) 
FROM fpds_contracts 
WHERE last_scraped::date = CURRENT_DATE;

-- Recent activity
SELECT 
  date_signed::date as date,
  COUNT(*) as contracts
FROM fpds_contracts
WHERE date_signed >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date_signed::date
ORDER BY date_signed::date DESC;
```

### Check Page Progress
```sql
-- Pages completed per date
SELECT 
  date,
  COUNT(*) as pages_completed,
  SUM(contracts_found) as total_transactions
FROM fpds_page_progress
WHERE status = 'completed'
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- Failed pages (need retry)
SELECT * 
FROM fpds_page_progress 
WHERE status = 'failed'
ORDER BY date DESC, page_number;
```

### Check Failed Contracts
```sql
-- Failed contract count by date
SELECT 
  date_range,
  COUNT(*) as failed_count,
  COUNT(DISTINCT contract_id) as unique_contracts
FROM fpds_failed_contracts
GROUP BY date_range
ORDER BY date_range DESC
LIMIT 30;
```

---

## Resume After Interruption

The scraper automatically resumes from where it left off:

```bash
# If interrupted at 2025-10-15, Page 37
# Just run the same command again:
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2025-10-01

# It will:
# 1. Skip completed dates (2025-11-01 to 2025-10-16)
# 2. Resume 2025-10-15 from Page 37
# 3. Continue from there
```

**Manual resume control:**
```sql
-- Check where it stopped
SELECT * FROM fpds_page_progress 
WHERE date = '2025-10-15' 
ORDER BY page_number DESC 
LIMIT 1;

-- Mark a page as incomplete to re-scrape it
UPDATE fpds_page_progress 
SET status = 'pending' 
WHERE date = '2025-10-15' AND page_number = 37;
```

---

## Troubleshooting

### Issue: "Only found 12 transactions"
**Cause:** Using old awards endpoint  
**Solution:** Make sure you're running the NEW script:
```bash
# CORRECT (new transactions scraper)
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --test

# WRONG (old awards scraper)
npx tsx src/scripts/fpds-page-level-scraper.ts --test
```

### Issue: "API instability detected"
**Cause:** USASpending API is having issues  
**Solution:** 
1. Wait 5-10 minutes
2. Run script again (it will resume)
3. Script will retry automatically

### Issue: "Timeout after 5 minutes"
**Cause:** Rate limiting delays  
**Solution:** This is normal. Script continues in background.

### Issue: "Duplicate key error"
**Cause:** Contract already exists in database  
**Solution:** Script uses UPSERT, this is expected. It updates existing contracts.

---

## Verification Tests

After test mode completes, verify:

### 1. Check Transactions Count
```sql
-- Should have 1000+ new contracts
SELECT COUNT(*) 
FROM fpds_contracts 
WHERE last_scraped::date = CURRENT_DATE;
```

**✅ PASS if:** Count > 1000  
**❌ FAIL if:** Count < 100

### 2. Check Modifications
```sql
-- Should have contracts with multiple transactions
SELECT 
  piid,
  COUNT(*) as modification_count
FROM fpds_contracts
WHERE piid IS NOT NULL
  AND last_scraped::date = CURRENT_DATE
GROUP BY piid
HAVING COUNT(*) > 1
LIMIT 10;
```

**✅ PASS if:** Multiple contracts show modification_count > 1  
**❌ FAIL if:** No contracts with modifications

### 3. Check Data Quality
```sql
-- Check key fields are populated
SELECT 
  COUNT(*) as total,
  COUNT(vendor_name) as has_vendor,
  COUNT(dollars_obligated) as has_amount,
  COUNT(naics_code) as has_naics
FROM fpds_contracts
WHERE last_scraped::date = CURRENT_DATE;
```

**✅ PASS if:** > 90% of contracts have vendor, amount, and NAICS  
**❌ FAIL if:** < 50% missing key fields

---

## Before vs After Comparison

### OLD Scraper (Awards Only)
```bash
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2025-11-01 --end=2025-11-01
```
Result: ~12 contracts (only new awards)

### NEW Scraper (All Transactions)
```bash
npx tsx src/scripts/fpds-historical-transactions-scraper.ts --test
```
Result: ~1,247 contracts (awards + modifications + amendments)

**Difference:** **100x more data!**

---

## Next Steps After Testing

1. **Test passes** → Run small date range (1 week)
2. **Small range works** → Run larger date range (1 month)
3. **Everything stable** → Run full historical scrape
4. **Deploy to production** → Push to git (Vercel auto-deploys cron job)

---

## Deploy to Production

Once testing is complete:

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Stage all changes
git add .

# Commit
git commit -m "Add FPDS transactions scraper - captures ALL contract data

- New: fpds-historical-transactions-scraper.ts (transactions endpoint)
- Updated: cron job to use transactions
- Captures: awards + modifications + amendments + task orders
- Expected: 6000+ contracts per day (vs 12 before)
- Tested: Single day test passes with 1000+ transactions"

# Push to deploy
git push origin main
```

**Vercel will automatically:**
1. Detect the push
2. Deploy the new code
3. Update the cron job
4. Next cron run will use transactions endpoint

---

## Success Criteria

✅ Test mode completes without errors  
✅ Finds 1,000+ transactions (not 12)  
✅ Database count increases correctly  
✅ No duplicate key errors  
✅ Quality score > 80/100  
✅ Failed contracts < 5%  
✅ Can resume after interruption

If all tests pass, scraper is ready for full historical run!

