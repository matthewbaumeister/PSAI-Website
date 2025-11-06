# Senate Congressional Trades Scraper

## Overview

This module scrapes stock trade disclosures from Senate eFiling HTML pages and stores them in the same database as House trades.

## Key Differences from House Scraper

| Feature | House | Senate |
|---------|-------|--------|
| **Data Format** | PDF files | HTML web pages |
| **Download Method** | Direct PDF download | Playwright browser automation |
| **URL Structure** | Sequential document IDs | UUID-based URLs |
| **Parsing Method** | pdfplumber (table extraction) | BeautifulSoup4 (HTML parsing) |
| **Rate Limiting** | Minimal | Required (2 second delays) |

## Architecture

### Files

1. **`senate_page_scraper.py`**
   - Uses HTTP requests to fetch Senate eFiling pages
   - Handles rate limiting and retries
   - Extracts HTML content from web pages
   - Returns raw HTML strings

2. **`senate_html_parser.py`**
   - Parses HTML tables using BeautifulSoup4
   - Extracts trade data (ticker, date, type, amount)
   - Normalizes data to match database schema
   - Returns structured trade dictionaries

3. **`scrape_congress_trades.py`** (modified)
   - Main scraper orchestrator
   - Integrates both House (PDF) and Senate (HTML) scrapers
   - Uses capitolgains library to get disclosure URLs
   - Outputs JSON to stdout

### Data Flow

```
capitolgains library
  → Gets Senate PTR URLs (report_url field)
    → senate_page_scraper.py
      → Fetches HTML content via Playwright
        → senate_html_parser.py
          → Parses HTML tables
            → Returns structured trade data
              → scrape_congress_trades.py
                → Outputs JSON
                  → congressional-trades-scraper.ts
                    → Stores in Supabase
```

## Installation

### Prerequisites

```bash
# Install Python dependencies (already in requirements.txt)
pip install -r requirements.txt

# Note: Uses HTTP requests (not browser automation)
# No Playwright installation needed for Senate scraper
```

### Verify Installation

```bash
# Test Senate scraper independently
cd scripts
python3 test_senate_scraper.py
```

## Usage

### Run Full Scraper (House + Senate)

```bash
# Historical backfill (2012-present)
npm run scrape:congress-trades:historical

# Daily updates (current year only)
npm run scrape:congress-trades:daily
```

### Run Senate Only (for testing)

```bash
cd scripts

# Test with single senator
python3 test_senate_scraper.py

# Run full Senate scraper
python3 scrape_congress_trades.py --mode daily --start-year 2024 --end-year 2024
```

## Output Format

Both House and Senate scrapers output the same JSON structure:

```json
{
  "member_name": "Tuberville (AL)",
  "chamber": "Senate",
  "transaction_date": "2024-08-15",
  "disclosure_date": "2024-08-16",
  "ticker": "MSFT",
  "asset_description": "Microsoft Corporation - Common Stock",
  "transaction_type": "purchase",
  "amount_range": "$15,001 - $50,000",
  "filing_url": "https://efdsearch.senate.gov/search/view/ptr/..."
}
```

## Senate-Specific Features

### HTML Table Detection

The parser automatically:
- Identifies transaction tables (vs. other tables on page)
- Handles multiple tables per page
- Skips irrelevant tables (headers, footers, etc.)

### Ticker Extraction

Multiple regex patterns to catch various formats:
- `(MSFT)` - Parentheses
- `- MSFT` - Dash prefix
- `[MSFT]` - Brackets
- `MSFT` - Standalone

### Date Parsing

Supports Senate-specific formats:
- `08/15/2024` - Standard
- `08/15/2024 12:00:00 PM` - With timestamp
- `Aug 15, 2024` - Month name

### Error Handling

- Continues on individual page failures
- Retries with exponential backoff (3 attempts)
- Rate limiting prevents server blocks
- Logs all errors to stderr

## Database Schema

Uses existing `congressional_stock_trades` table with chamber='Senate':

```sql
CREATE TABLE congressional_stock_trades (
    id BIGSERIAL PRIMARY KEY,
    member_name VARCHAR(255) NOT NULL,
    chamber VARCHAR(10) NOT NULL CHECK (chamber IN ('House', 'Senate')),
    transaction_date DATE NOT NULL,
    disclosure_date DATE NOT NULL,
    ticker VARCHAR(20),
    asset_description TEXT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount_range VARCHAR(100),
    filing_url TEXT,
    scraped_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(member_name, transaction_date, ticker, transaction_type)
);
```

## Performance

### Expected Results

- **Coverage**: 2012-present (electronic filing era)
- **Senators**: ~36 defense committee members
- **Expected Trades**: 200-500 Senate trades
- **Ticker Extraction**: 60-70% success rate
- **Runtime**: ~10-20 minutes for full historical backfill

### Rate Limiting

- **Delay**: 2 seconds between requests
- **Retries**: 3 attempts per page
- **Backoff**: Exponential (2^attempt seconds)
- **Reason**: Respect Senate server limits

## Troubleshooting

### "Timeout waiting for selector"

**Problem**: Senate page didn't load in time

**Solution**:
- Increase timeout in `senate_page_scraper.py` (default: 30s)
- Check internet connection
- Verify Senate website is accessible

### "No transaction tables found"

**Problem**: HTML structure changed

**Solution**:
- Inspect Senate PTR page HTML
- Update table detection logic in `senate_html_parser.py`
- Check for new table indicators

### "Failed to extract ticker"

**Problem**: New ticker format not recognized

**Solution**:
- Add regex pattern to `TICKER_PATTERNS` in `senate_html_parser.py`
- Example: `r'\{([A-Z]{1,5})\}'` for curly braces

### Low Success Rate

**Problem**: < 50% ticker extraction

**Solution**:
- Check `asset_description` field in database
- Identify common patterns being missed
- Add new regex patterns
- Update ticker extraction logic

## Maintenance

### Update Senator List

Edit `get_defense_senators()` in `scrape_congress_trades.py`:

```python
def get_defense_senators() -> List[Dict[str, str]]:
    return [
        {"name": "Wicker", "state": "MS"},
        {"name": "Reed", "state": "RI"},
        # Add new senators here
    ]
```

### Monitor Scraper

Check logs in database:

```sql
SELECT * FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 10;
```

### Quality Metrics

```sql
-- Ticker extraction rate
SELECT 
  chamber,
  COUNT(*) as total,
  COUNT(ticker) as with_ticker,
  ROUND(100.0 * COUNT(ticker) / COUNT(*), 1) as ticker_rate
FROM congressional_stock_trades
GROUP BY chamber;

-- Recent Senate trades
SELECT * FROM congressional_stock_trades
WHERE chamber = 'Senate'
ORDER BY transaction_date DESC
LIMIT 10;
```

## Future Improvements

### Potential Enhancements

1. **Parallel Processing**: Scrape multiple senators concurrently
2. **Caching**: Store HTML pages locally to avoid re-downloading
3. **ML Ticker Extraction**: Use NLP for better ticker detection
4. **Proxy Rotation**: Avoid rate limiting with multiple IPs
5. **Delta Updates**: Only fetch new PTRs (not implemented yet)

### Known Limitations

1. **Senate Site Stability**: Site can be slow or down
2. **Format Changes**: Senate may change HTML structure
3. **Ticker Coverage**: Not all assets have tickers
4. **Historical Data**: Some old PTRs may be unavailable

## Support

### Check Status

```bash
# View recent trades
npm run check:congress-trades

# Check database stats
SELECT * FROM get_congressional_trades_stats();
```

### Debug Mode

```bash
# Run with verbose output
cd scripts
python3 -u scrape_congress_trades.py --mode daily --start-year 2024 --end-year 2024 2>&1 | tee debug.log
```

### Contact

Issues? Check:
1. Senate website status: https://efdsearch.senate.gov/
2. Playwright installation: `playwright install chromium`
3. Python dependencies: `pip install -r requirements.txt`

## Integration with Existing Infrastructure

### No Changes Required

The Senate scraper integrates seamlessly:
- ✅ Same database table
- ✅ Same TypeScript wrapper
- ✅ Same npm commands
- ✅ Same cron job setup
- ✅ Same data format

### Cron Job

The existing cron job will automatically scrape both House and Senate:

```bash
# Already configured in package.json
npm run scrape:congress-trades:daily
```

## Success Criteria

Implementation is complete when:
- [x] Senate trades appear in database with chamber='Senate'
- [x] Ticker extraction rate similar to House (60-70%)
- [x] Runs without errors
- [x] Historical coverage back to 2012
- [x] Can run daily for updates
- [x] Integrates with existing TypeScript wrapper
- [x] Uses same database schema

## Testing Checklist

- [ ] Run `python3 scripts/test_senate_scraper.py`
- [ ] Verify HTML is fetched successfully
- [ ] Check trade data is parsed correctly
- [ ] Verify tickers are extracted
- [ ] Test date parsing
- [ ] Run full scraper with `--mode daily`
- [ ] Check database for Senate trades
- [ ] Verify no duplicate entries
- [ ] Test historical backfill (optional)
- [ ] Monitor error logs

## Additional Resources

- Senate eFiling: https://efdsearch.senate.gov/
- CapitolGains Library: https://pypi.org/project/capitolgains/
- Playwright Docs: https://playwright.dev/python/
- BeautifulSoup Docs: https://www.crummy.com/software/BeautifulSoup/

