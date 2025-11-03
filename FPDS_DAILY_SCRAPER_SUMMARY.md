# FPDS Daily Scraper - Complete Setup

## Status: READY FOR PRODUCTION

All scrapers are configured, tested, and ready for automated daily runs.

---

## Automated Cron Schedule

All scrapers run **daily at noon UTC** with 15-minute offsets:

| Scraper | Time (UTC) | Time (EST) | Endpoint |
|---------|------------|------------|----------|
| **FPDS** | 12:00 PM | 8:00 AM | `/api/cron/scrape-fpds` |
| **DoD News** | 12:15 PM | 8:15 AM | `/api/cron/scrape-dod-news` |
| **SAM.gov** | 12:30 PM | 8:45 AM | `/api/cron/scrape-sam-gov` |
| **SBIR/DSIP** | 12:45 PM | 8:45 AM | `/api/cron/sbir-scraper` |

**Email notifications:** `matt@make-ready-consulting.com`

---

## FPDS Daily Scraper Features

### Multi-Day Mode (Default)
- Scrapes **last 3 days** automatically (today, yesterday, 2 days ago)
- Handles USASpending.gov API delays (1-2 day publishing lag)
- Re-processes recent contracts for updates
- Smart upsert prevents duplicates

### Resilience
- **20 retry attempts** with exponential backoff
- **Consecutive error detection** (10+ = API issue, retry page)
- **Failed contract logging** to database
- **Quality validation** (data completeness scoring)
- **Page-by-page progress tracking** with resume capability

### Smart Upsert
- Uses `transaction_number` as unique key
- Detects existing contracts before insert
- Updates existing records with new data
- Tracks new vs updated for reporting
- Zero duplicates guaranteed

---

## Testing

### 1. Manual Test (Multi-Day Mode)
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/fpds-daily-scraper.ts
```

**Expected output:**
```
[FPDS Daily] FPDS Daily Scraper (Multi-Day Mode)
[FPDS Daily] Scraping 3 recent days to handle API delays
[FPDS Daily] Dates: 2025-11-03, 2025-11-02, 2025-11-01

Processing 2025-11-03...
Processing 2025-11-02...
Processing 2025-11-01...

MULTI-DAY SUMMARY
Total Found: 40
Total Inserted: 13
Total Updated: 22
```

### 2. Test Cron Endpoint (With Email)
```bash
curl https://www.prop-shop.ai/api/cron/scrape-fpds \
  -H "Authorization: Bearer 700b504582bfea8640a5901dfc2550610e23f981cc5fe2ea0ecdb9606f44a8ec"
```

**Expected:**
- JSON response with stats
- Email to matt@make-ready-consulting.com

### 3. Data Quality Verification

Run the queries in `TEST_FPDS_DATA_QUALITY.sql` in Supabase SQL Editor:

#### Quick Health Check:
```sql
-- Check contracts from last 3 days
SELECT 
  DATE(last_modified_date) as date,
  COUNT(*) as contracts,
  COUNT(DISTINCT piid) as unique_contracts
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY DATE(last_modified_date)
ORDER BY date DESC;
```

#### Check for Duplicates:
```sql
-- Should return 0 rows
SELECT 
  transaction_number,
  COUNT(*) as duplicate_count
FROM fpds_contracts
GROUP BY transaction_number
HAVING COUNT(*) > 1;
```

#### Data Completeness:
```sql
SELECT 
  COUNT(*) as total,
  ROUND(100.0 * COUNT(piid) / COUNT(*), 2) as piid_pct,
  ROUND(100.0 * COUNT(vendor_name) / COUNT(*), 2) as vendor_pct,
  ROUND(100.0 * COUNT(description) / COUNT(*), 2) as description_pct
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '3 days';
```

**Expected results:**
- 0 duplicates
- 95%+ completeness on critical fields
- Steady flow of contracts each day

---

## What Gets Scraped

### Data Fields
- Contract ID (PIID, transaction number)
- Agency information (name, ID, office)
- Vendor details (name, DUNS, address, state)
- Contract description
- Award date, start date, end date
- Total contract value
- Contract type, pricing, competition
- SAM.gov opportunity link (if available)
- 50+ other fields

### Date Range
- **Today:** May have 0 contracts (API delay)
- **Yesterday:** May have some contracts
- **2 Days Ago:** Should have most contracts

The multi-day approach ensures we catch everything despite API delays!

---

## Monitoring

### Daily Email
You'll receive an email like this each morning:

**Subject:** FPDS Contract Awards Scraper Completed Successfully - 2025-11-03

**Stats:**
- Days Scraped: 3
- Total Found: 45
- New Contracts: 20
- Updated Contracts: 25
- Failed: 0
- Total in DB: 16,500

### Supabase Tables

#### `fpds_contracts`
Main contract data (all scraped contracts)

#### `fpds_page_progress`
Page-by-page progress tracking
- Date, page number, status
- Contracts found/inserted/failed per page
- Timestamp of completion

#### `fpds_failed_contracts`
Failed contract details for retry
- Contract ID, error message, attempt count
- Auto-cleaned when contract succeeds

---

## Troubleshooting

### No Contracts Found
**Symptom:** All 3 days return 0 contracts

**Causes:**
- USASpending.gov API is down
- Network issue
- Date format problem

**Solution:** Check Vercel logs, API will retry automatically

### High Failure Rate
**Symptom:** Many contracts in `fpds_failed_contracts`

**Causes:**
- API instability
- Rate limiting
- Network issues

**Solution:** Scraper auto-retries. Failed contracts are logged and retried on next run.

### Duplicates Detected
**Symptom:** Query #3 shows duplicate transaction_numbers

**Causes:**
- Database migration issue
- Upsert conflict field mismatch

**Solution:** 
```sql
-- Clean duplicates (keeps latest)
DELETE FROM fpds_contracts a USING fpds_contracts b
WHERE a.id < b.id 
  AND a.transaction_number = b.transaction_number;
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Vercel Cron (Daily at 12:00 PM UTC)       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  /api/cron/scrape-fpds                      │
│  - Verifies CRON_SECRET                     │
│  - Executes fpds-daily-scraper.ts           │
│  - Tracks stats                             │
│  - Sends email notification                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  fpds-daily-scraper.ts (Multi-Day Mode)     │
│  - Scrapes last 3 days                      │
│  - 20 retries with exponential backoff      │
│  - Consecutive error detection              │
│  - Page-by-page processing                  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  fpds-scraper-full.ts (Library)             │
│  - searchContracts() - USASpending API      │
│  - getContractFullDetails() - Full data     │
│  - normalizeFullContract() - Clean data     │
│  - batchInsertFullContracts() - Upsert DB   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Supabase                                   │
│  - fpds_contracts (main data)               │
│  - fpds_page_progress (tracking)            │
│  - fpds_failed_contracts (retry log)        │
└─────────────────────────────────────────────┘
```

---

## Summary

✅ **FPDS daily scraper is production-ready**
✅ **Automated cron job configured (12:00 PM UTC daily)**
✅ **Email notifications enabled**
✅ **Multi-day mode handles API delays**
✅ **Battle-tested resilience (20 retries, error detection)**
✅ **Smart upsert prevents duplicates**
✅ **Data quality testing queries provided**

**Next Steps:**
1. Monitor first few automated runs
2. Run data quality tests weekly
3. Check email notifications daily
4. Historical backfill continues in separate tmux session

**No manual intervention needed - the scraper runs itself!** 🚀

