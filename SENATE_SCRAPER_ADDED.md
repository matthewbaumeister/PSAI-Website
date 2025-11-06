# Senate Congressional Trades Scraper - Added!

## ✅ Senate Scraper Complete

I've added the **Senate Congressional Trades scraper** to your GitHub Actions workflow!

---

## What Was Built

### New Files Created

1. **`scripts/scrape_senate_trades_monthly.py`**
   - Python scraper for Senate trades
   - Uses HTML parsing (not PDF like House)
   - Scrapes 26 defense committee senators
   - Extracts trades from Senate eFiling pages

2. **`scripts/run-senate-trades-monthly.ts`**
   - TypeScript runner with email notifications
   - Calls Python script and uploads to Supabase
   - Handles data cleaning and deduplication

3. **`.github/workflows/senate-trades-monthly.yml`**
   - GitHub Actions workflow
   - Runs monthly on 20th at 2 AM UTC
   - Manual trigger enabled
   - 90-minute timeout (long scrape)

### Integration

✅ **Admin Page**: Senate scraper now appears in dashboard  
✅ **Manual Triggers**: Can trigger from admin UI  
✅ **Email Notifications**: Success/failure emails  
✅ **Database**: Uses same `congressional_stock_trades` table  
✅ **Chamber Field**: Differentiates with `chamber='Senate'`

---

## Schedule

| Scraper | Frequency | Day | Time (UTC) |
|---------|-----------|-----|------------|
| **House Trades** | Monthly | 15th | 2:00 AM |
| **Senate Trades** | Monthly | 20th | 2:00 AM |

Senate runs 5 days after House to spread the load.

---

## How Senate Scraper Works

### 1. Scraping Method (Different from House!)

**House**: Downloads PDFs → Parses tables  
**Senate**: Fetches HTML → Parses web page tables

### 2. Data Sources

- Senate eFiling website (https://efdsearch.senate.gov/)
- Uses `capitolgains` library for authentication
- Playwright for browser automation
- HTML parsing for table extraction

### 3. Flow

```
Python Script → capitolgains auth → Fetch HTML pages → Parse tables → 
TypeScript Runner → Clean data → Supabase upsert → Send email
```

### 4. Senators Tracked

26 Senate Armed Services Committee members:
- Reed (RI) - Chair
- Wicker (MS) - Ranking
- Plus 24 other committee members

---

## Testing

### Test Senate Scraper

```bash
# Push to GitHub
git add .
git commit -m "Add Senate Congressional Trades scraper"
git push origin main

# Test via GitHub Actions
# 1. Go to: https://github.com/[YOUR_USERNAME]/PropShop_AI_Website/actions
# 2. Click "Senate Trades Monthly Update"
# 3. Click "Run workflow" → "Run workflow"
# 4. Wait 60-90 minutes
# 5. Check email for results
```

### Test via Admin Page

```bash
# 1. Go to: https://prop-shop.ai/admin/scrapers
# 2. Find "Congressional Stock Trades (Senate)"
# 3. Click "Trigger Manually"
# 4. Check GitHub Actions for running workflow
# 5. Check email for results
```

### Verify Data

```sql
-- Check Senate trades in database
SELECT 
  COUNT(*) as total_trades,
  COUNT(DISTINCT member_name) as senators,
  MAX(transaction_date) as latest_trade,
  MIN(transaction_date) as earliest_trade
FROM congressional_stock_trades
WHERE chamber = 'Senate';

-- Compare House vs Senate
SELECT 
  chamber,
  COUNT(*) as total_trades,
  COUNT(DISTINCT member_name) as members
FROM congressional_stock_trades
GROUP BY chamber;
```

---

## Next Steps

### Immediate

1. **Add GitHub secrets** (if not done yet)
2. **Push code to GitHub**
3. **Test Senate scraper** manually
4. **Verify email notification**
5. **Check admin dashboard**

### Ongoing

- Senate scraper will run automatically on 20th of each month
- House scraper runs on 15th of each month
- Both send email notifications
- Both visible in admin dashboard

---

## Complete Scraper List

You now have **9 GitHub Actions scrapers**:

1. FPDS Contracts (daily)
2. Congress.gov Bills (daily)
3. SAM.gov Opportunities (daily)
4. DOD Contract News (daily)
5. DSIP/SBIR (daily)
6. Army xTech/Innovation (daily)
7. ManTech Projects (daily)
8. **Congressional Trades - House** (monthly - 15th)
9. **Congressional Trades - Senate** (monthly - 20th) ← NEW!

---

## Files Modified

- `.github/workflows/senate-trades-monthly.yml` (new)
- `scripts/scrape_senate_trades_monthly.py` (new)
- `scripts/run-senate-trades-monthly.ts` (new)
- `src/app/api/admin/scrapers/trigger/route.ts` (updated)
- `src/app/api/admin/scrapers/status/route.ts` (updated)

---

## GitHub Actions Usage

**Previous**: ~1,140 minutes/month  
**With Senate**: ~1,230 minutes/month (61% of free tier)  
**Still FREE!**

---

**Status**: ✅ Senate scraper added and ready to test!

