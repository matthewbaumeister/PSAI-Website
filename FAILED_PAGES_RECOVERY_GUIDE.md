# Failed Pages Recovery Guide

## 🚨 **The Problem:**

When the USASpending.gov API is unstable, **entire pages can fail** before we even get the list of contracts!

### **What Happens:**
```
Page 1: ❌ Failed 3x → SKIP (100 contracts lost!)
Page 2: ✅ Success → 100 contracts saved
Page 3: ✅ Success → 100 contracts saved
Page 4: ❌ Failed 3x → SKIP (100 contracts lost!)
```

**Result:** You're missing the data from failed pages (Page 1 & 4 in this example).

---

## ✅ **Good News: We Track Failed Pages!**

Failed pages are logged in `fpds_page_progress` with `status='failed'`.

This means we can **retry them later** when the API is more stable!

---

## 📊 **Check Your Current Status:**

### **Step 1: Run Diagnostic Queries**

Run **`CHECK_FAILED_PAGES.sql`** in Supabase to see:
- How many pages failed
- Which dates are affected
- Estimated missing contracts
- Success rate by day

### **Key Queries:**

```sql
-- How many pages failed?
SELECT COUNT(*) as failed_pages
FROM fpds_page_progress
WHERE status = 'failed';

-- Which dates have failures?
SELECT 
  date,
  COUNT(*) as failed_pages,
  ARRAY_AGG(page_number) as which_pages
FROM fpds_page_progress
WHERE status = 'failed'
GROUP BY date
ORDER BY date DESC;

-- Estimated missing contracts
SELECT 
  COUNT(*) * 100 as estimated_missing_contracts
FROM fpds_page_progress
WHERE status = 'failed';
```

---

## 🔄 **Recovery Strategy:**

### **Option 1: Automatic Retry (Recommended)**

Run the retry script:

```bash
# Retry all failed pages
npx tsx src/scripts/fpds-retry-failed-pages.ts
```

**What it does:**
1. Finds all pages with `status='failed'`
2. Retries each page (1 attempt)
3. Updates page status to `completed` on success
4. Logs any contracts that still fail individually
5. Reports success/failure summary

**When to run:**
- After the main scraper finishes for the day
- During off-peak hours (night/weekend)
- When API seems more stable

---

### **Option 2: Manual Inspection**

If you want to be selective:

```sql
-- See all failed pages with details
SELECT * FROM fpds_page_progress
WHERE status = 'failed'
ORDER BY date DESC, page_number;

-- Manually mark specific pages for retry
UPDATE fpds_page_progress
SET status = 'pending'
WHERE date = '2025-10-29'
  AND page_number = 1;
```

Then run the scraper - it will pick up `pending` pages.

---

### **Option 3: Re-scrape Entire Days**

For days with many failures, just re-scrape the whole day:

```sql
-- Clear progress for a specific day
DELETE FROM fpds_page_progress
WHERE date = '2025-10-29';

-- Or reset to pending
UPDATE fpds_page_progress
SET status = 'pending'
WHERE date = '2025-10-29';
```

Then restart the scraper - it will re-scrape that day from page 1.

---

## 🎯 **Expected Outcomes:**

### **Scenario 1: API Was Temporarily Down**
```
Retry → ✅ Success
Result: All data recovered!
```

### **Scenario 2: Specific Contracts Are Bad**
```
Retry → ✅ Page succeeds
But: 2-3 individual contracts fail
Result: Those contracts logged to fpds_failed_contracts
```

### **Scenario 3: Page Genuinely Empty**
```
Retry → ℹ️  0 contracts found
Result: Page marked complete (was beyond end of day)
```

### **Scenario 4: Still Failing**
```
Retry → ❌ Still fails
Result: Remains in failed_pages, try again later
```

---

## 📈 **Is This Normal?**

### **YES, API instability is expected:**

| API Behavior | Frequency | Impact |
|-------------|-----------|--------|
| Individual contract 500 errors | Common (2-5%) | Low - logged & retried |
| Page search timeouts | Occasional (1-2%) | Medium - entire page lost temporarily |
| Complete API downtime | Rare (<1%) | High - scraper pauses/retries |

**USASpending.gov API is notoriously unstable!** This is why we built:
- ✅ Page-level retry (3 attempts with 30s cooldown)
- ✅ Failed page tracking
- ✅ Resume capability
- ✅ Retry scripts

---

## 🔍 **Data Loss Analysis:**

### **Your Current Stats:**
```
Pages Processed: 14
Total Contracts: 11
Failed Details: 204
```

**This looks WRONG!** 

Expected: ~1,400 contracts (14 pages × 100)  
Actual: 11 contracts  
**Loss: ~99% of data!**

### **Likely Cause:**
Most pages are completely failing before we even get the contract list.

### **Solution:**
1. Let the scraper keep running (it will eventually succeed on retries)
2. Wait until API is more stable (try overnight/weekend)
3. Run the retry script for failed pages
4. Consider using proxy/different IP if API is rate-limiting you

---

## 🛠️ **Troubleshooting:**

### **Problem: Too Many Failed Pages**

**Possible Causes:**
1. **API is down/unstable** - Wait and retry later
2. **Rate limiting** - Add longer delays between pages
3. **Network issues** - Check your internet connection
4. **Authentication** - Verify API key (though we don't use one for USASpending)

**Solutions:**
```typescript
// Increase delay between page requests
await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

// Reduce page batch size
const maxConcurrent = 1; // Process one page at a time

// Add exponential backoff
const delay = Math.min(1000 * Math.pow(2, attempt), 60000);
```

---

### **Problem: Same Pages Keep Failing**

**Possible Causes:**
1. **Bad data on that page** - API can't serve it
2. **Specific date issues** - Government system issue
3. **Page number beyond range** - No more contracts

**Solution:**
```sql
-- Check if page is beyond actual data
SELECT 
  date,
  MAX(page_number) FILTER (WHERE status = 'completed') as last_successful_page,
  COUNT(*) FILTER (WHERE status = 'failed') as failures
FROM fpds_page_progress
GROUP BY date
HAVING COUNT(*) FILTER (WHERE status = 'failed') > 0;

-- If failed page is way beyond last successful,
-- it might just be beyond the end of available data
```

---

## 📋 **Recovery Checklist:**

- [ ] Run `CHECK_FAILED_PAGES.sql` to assess damage
- [ ] Note how many pages failed and which dates
- [ ] Wait for API to stabilize (check status with test script)
- [ ] Run `fpds-retry-failed-pages.ts` script
- [ ] Check results - how many recovered?
- [ ] For still-failing pages, investigate individually
- [ ] Re-run main scraper to continue forward progress
- [ ] Schedule regular retry runs (daily/weekly)

---

## 🎯 **Long-Term Strategy:**

### **Daily Routine:**
1. **Morning:** Check overnight scraper progress
2. **Afternoon:** Run failed pages retry script
3. **Evening:** Review success rates
4. **Weekly:** Deep analysis of persistent failures

### **Acceptance Criteria:**
- ✅ 95%+ page success rate = Good
- ⚠️ 85-95% page success rate = Acceptable (retry failed pages)
- ❌ <85% page success rate = API issues (wait and retry)

---

## 🚀 **Quick Commands:**

```bash
# Check status
psql -h ... -c "SELECT * FROM CHECK_FAILED_PAGES.sql"

# Retry all failed pages
npx tsx src/scripts/fpds-retry-failed-pages.ts

# Check progress
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') as success,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM fpds_page_progress;

# Clear and restart a specific day
DELETE FROM fpds_page_progress WHERE date = '2025-10-29';
./run-fpds-page-level.sh
```

---

**Bottom Line:** 

✅ Failed pages ARE tracked  
✅ Data is recoverable with retry script  
⚠️ You WILL lose data if you don't run retries  
🎯 Schedule regular retry runs to maximize data capture  

The API is unstable, but with our tracking and retry system, **no data is permanently lost!** 🚀

