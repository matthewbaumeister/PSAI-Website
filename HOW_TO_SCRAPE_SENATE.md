# How to Scrape All Senate Results and Save to Supabase

## Quick Start (3 Steps)

### Step 1: Test with Single Senator (2 minutes)

```bash
./scripts/run_senate_scraper.sh test
```

This tests the scraper with Senator Tuberville for 2024. You'll see sample trades printed to verify it works.

### Step 2: Scrape Current Year (10-15 minutes)

```bash
./scripts/run_senate_scraper.sh daily
```

Or use npm:

```bash
npm run scrape:congress-trades:daily
```

This scrapes **all defense committee senators** for 2024 and saves to Supabase.

### Step 3: Verify Results in Supabase

Go to your Supabase SQL Editor and run:

```sql
SELECT COUNT(*) FROM congressional_stock_trades WHERE chamber='Senate';
```

You should see 50-200+ Senate trades.

---

## Full Historical Scrape (Optional)

To get all Senate trades from 2012-2025:

```bash
./scripts/run_senate_scraper.sh historical
```

Or:

```bash
npm run scrape:congress-trades:historical
```

**Warning**: This takes 2-4 hours and scrapes both House and Senate for all years.

---

## What Gets Scraped

### Senators Included (36 total)

**Senate Armed Services Committee:**
- Wicker (MS), Reed (RI), Fischer (NE), Cotton (AR), Rounds (SD), Ernst (IA)
- Tillis (NC), Sullivan (AK), Cramer (ND), Scott (FL), Blackburn (TN)
- Hawley (MO), Tuberville (AL), Budd (NC), Schmitt (MO)
- Shaheen (NH), Gillibrand (NY), Blumenthal (CT), Hirono (HI)
- Kaine (VA), King (ME), Warren (MA), Peters (MI), Manchin (WV)
- Duckworth (IL), Rosen (NV), Kelly (AZ)

**Defense Appropriations Subcommittee:**
- Tester (MT), Durbin (IL), Murray (WA), Feinstein (CA)
- Collins (ME), Shelby (AL), McConnell (KY), Graham (SC), Moran (KS)

### Data Extracted

For each trade:
- Member name and state
- Transaction date and disclosure date
- Stock ticker (if available)
- Asset description
- Transaction type (purchase/sale/exchange)
- Amount range
- Filing URL for verification

---

## How the Scraper Works

1. **Gets URLs**: Uses `capitolgains` library to find all PTR disclosure URLs
2. **Downloads HTML**: Uses Playwright to fetch Senate eFiling pages
3. **Parses Tables**: Uses BeautifulSoup to extract trade data from HTML tables
4. **Extracts Tickers**: Uses 6 regex patterns to find stock symbols
5. **Saves to Supabase**: Automatically inserts into `congressional_stock_trades` table
6. **Deduplication**: Checks for existing trades to avoid duplicates

---

## Automatic Saving to Supabase

The scraper automatically saves to Supabase with this logic:

```python
# For each trade found:
1. Clean the data (remove HTML artifacts, normalize dates)
2. Check if trade already exists (by member, date, ticker, type)
3. If exists: UPDATE the existing record
4. If new: INSERT into congressional_stock_trades
5. Set chamber='Senate'
```

**No manual intervention needed** - everything is automatic.

---

## Verification Queries

Run these in Supabase SQL Editor:

### Basic Count
```sql
SELECT COUNT(*) FROM congressional_stock_trades WHERE chamber='Senate';
```

### Recent Trades
```sql
SELECT 
  member_name,
  transaction_date,
  ticker,
  asset_description,
  transaction_type,
  amount_range
FROM congressional_stock_trades
WHERE chamber='Senate'
ORDER BY transaction_date DESC
LIMIT 20;
```

### Ticker Extraction Rate
```sql
SELECT 
  chamber,
  COUNT(*) as total,
  COUNT(ticker) as with_ticker,
  ROUND(100.0 * COUNT(ticker) / COUNT(*), 1) as ticker_rate
FROM congressional_stock_trades
GROUP BY chamber;
```

### All Verification Queries
```bash
# Copy queries from:
cat scripts/check_senate_trades.sql
```

---

## Expected Results

After running the scraper:

| Metric | Expected Value |
|--------|---------------|
| **Total Senate Trades** | 200-500+ |
| **Ticker Extraction Rate** | 60-70% |
| **Senators with Trades** | 10-20 (not all senators trade) |
| **Years Covered** | 2012-2025 |
| **Runtime (daily)** | 10-15 minutes |
| **Runtime (historical)** | 2-4 hours |

---

## Monitoring Progress

The scraper outputs progress to your terminal:

```
[1/36] Senate: Wicker (MS)
  2024: 3 PTR(s) found
  Fetching: https://efdsearch.senate.gov/search/view/ptr/...
    Success: 45230 bytes
  Parsing HTML (45230 bytes)
  Found 2 table(s)
    Table 1: Transaction table detected
      Columns: asset=0, type=1, date=2, amount=3
      Extracted 5 trade(s) from table 1
  Extracted 5 trade(s)

[2/36] Senate: Reed (RI)
...
```

---

## Troubleshooting

### No trades found?

```bash
# Test with known active trader
cd scripts
python3 test_senate_scraper.py
```

### Connection timeout?

The Senate website can be slow. The scraper will:
- Retry 3 times
- Wait 2 seconds between requests
- Skip failed pages and continue

### Duplicate trades?

The scraper automatically handles duplicates using this unique constraint:
```sql
UNIQUE(member_name, transaction_date, ticker, transaction_type)
```

### Check logs

```sql
SELECT * FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 5;
```

---

## Running in Background (for long scrapes)

For historical scrapes that take hours:

```bash
# Run in tmux
tmux new -s senate-scraper
npm run scrape:congress-trades:historical

# Detach: Ctrl+B, then D
# Reattach later: tmux attach -t senate-scraper
```

Or run in background:

```bash
nohup npm run scrape:congress-trades:historical > senate_scraper.log 2>&1 &

# Check progress
tail -f senate_scraper.log
```

---

## Daily Automation

Set up a cron job to scrape daily:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 6am daily)
0 6 * * * cd /path/to/PropShop_AI_Website && npm run scrape:congress-trades:daily >> logs/senate_scraper.log 2>&1
```

---

## What's in the Database

After scraping, your `congressional_stock_trades` table will have:

```sql
SELECT 
  id,
  member_name,          -- "Tuberville (AL)"
  chamber,              -- "Senate"
  transaction_date,     -- "2024-08-15"
  disclosure_date,      -- "2024-08-16"
  ticker,               -- "MSFT" or NULL
  asset_description,    -- "Microsoft Corporation - Common Stock"
  transaction_type,     -- "purchase", "sale", or "exchange"
  amount_range,         -- "$15,001 - $50,000"
  filing_url,           -- Link to Senate eFiling page
  scraped_at           -- Timestamp of when scraped
FROM congressional_stock_trades
WHERE chamber='Senate'
LIMIT 1;
```

---

## Summary

To scrape all Senate results and save to Supabase:

```bash
# Quick test first
./scripts/run_senate_scraper.sh test

# Then scrape current year
./scripts/run_senate_scraper.sh daily

# Or scrape everything (2012-present)
./scripts/run_senate_scraper.sh historical

# Verify in Supabase
# SELECT COUNT(*) FROM congressional_stock_trades WHERE chamber='Senate';
```

**That's it!** The scraper handles everything automatically:
- Finding disclosure URLs
- Downloading HTML pages  
- Parsing trade data
- Extracting tickers
- Saving to Supabase
- Deduplication
- Error handling

No additional configuration needed.

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Test scraper | `./scripts/run_senate_scraper.sh test` |
| Scrape 2024 | `npm run scrape:congress-trades:daily` |
| Scrape all years | `npm run scrape:congress-trades:historical` |
| Check results | See `scripts/check_senate_trades.sql` |
| View logs | `SELECT * FROM congressional_trades_scraper_log` |

---

**Ready to start?** Run the test first:

```bash
./scripts/run_senate_scraper.sh test
```

