# Congressional Stock Trades Integration

## Overview

This system tracks stock trades by members of Congress using **100% free, official government sources**:
- House of Representatives financial disclosures
- Senate Periodic Transaction Reports (PTRs)

Historical data available: **2012-present** (when electronic filing began)

## Quick Start

### 1. Install Python Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Install Playwright browsers (required for scraping)
playwright install
```

### 2. Run Database Migration

```bash
# Apply the schema
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql

# Or if using Supabase CLI
supabase db push
```

### 3. Initial Historical Backfill (2012-Present)

This will take 1-2 hours but only needs to be run ONCE:

```bash
npm run scrape:congress:historical
```

Or specify a custom start year:

```bash
npm run scrape:congress:historical 2020
```

### 4. Daily Updates (Cron Job)

Add to your crontab for daily 3 AM updates:

```bash
crontab -e
```

Add this line:

```cron
0 3 * * * cd /path/to/PropShop_AI_Website && npm run scrape:congress:daily >> /var/log/congress-trades.log 2>&1
```

## Data Captured

For each trade, we capture:

- **Member Information**: Name, chamber (House/Senate)
- **Transaction Details**: Date, type (purchase/sale), amount range
- **Stock Information**: Ticker symbol, full asset description
- **Filing Information**: Disclosure date, filing URL for verification
- **Compliance**: Days to disclose (STOCK Act requires <45 days)

## Key Features

### Defense Contractor Focus

Pre-populated list of 20+ major defense contractors including:
- Lockheed Martin (LMT)
- Raytheon (RTX)
- Boeing (BA)
- Northrop Grumman (NOC)
- And many more...

### Correlation Analysis

Built-in SQL functions to correlate trades with:
- DoD contract awards
- Committee assignments
- Major defense appropriations
- Contract modifications

### Analysis Views

#### View: Defense Stock Trades
```sql
SELECT * FROM defense_stock_trades
ORDER BY transaction_date DESC
LIMIT 100;
```

Shows all trades in defense-related stocks.

#### View: Recent Defense Trades
```sql
SELECT * FROM recent_defense_trades;
```

Shows defense trades from last 90 days.

#### View: Suspicious Patterns
```sql
SELECT * FROM suspicious_trade_patterns;
```

Identifies unusual trading patterns (multiple members, same stock, same day).

## Powerful Queries

### 1. Find Trades Before Contract Awards

```sql
SELECT * FROM find_trades_before_contracts(90, 30);
```

Finds congressional trades that occurred 90 days before to 30 days after major contract awards (>$10M).

### 2. Defense Committee Members' Stock Activity

```sql
SELECT 
    t.member_name,
    t.chamber,
    t.transaction_date,
    t.ticker,
    t.transaction_type,
    t.amount_range,
    d.company_name
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
WHERE t.member_name IN (
    SELECT name FROM congressional_members 
    WHERE committees && ARRAY['Armed Services', 'Appropriations']
)
ORDER BY t.transaction_date DESC;
```

### 3. Late Disclosures (STOCK Act Violations)

```sql
SELECT 
    member_name,
    chamber,
    transaction_date,
    disclosure_date,
    (disclosure_date - transaction_date) as days_late,
    ticker,
    transaction_type,
    amount_range
FROM congressional_stock_trades
WHERE (disclosure_date - transaction_date) > 45
ORDER BY days_late DESC;
```

### 4. Most Active Traders (Defense Stocks)

```sql
SELECT 
    member_name,
    chamber,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE transaction_type = 'purchase') as purchases,
    COUNT(*) FILTER (WHERE transaction_type = 'sale') as sales
FROM congressional_stock_trades
WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)
GROUP BY member_name, chamber
ORDER BY total_trades DESC
LIMIT 20;
```

### 5. Cluster Analysis (Coordinated Trading?)

```sql
SELECT 
    transaction_date,
    ticker,
    COUNT(DISTINCT member_name) as num_members,
    STRING_AGG(member_name, ', ' ORDER BY member_name) as members,
    transaction_type
FROM congressional_stock_trades
WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)
  AND transaction_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY transaction_date, ticker, transaction_type
HAVING COUNT(DISTINCT member_name) >= 3
ORDER BY num_members DESC, transaction_date DESC;
```

## System Statistics

Check overall system health:

```sql
SELECT * FROM get_congressional_trades_stats();
```

Returns:
- Total trades
- Total members tracked
- Defense-related trades
- House vs Senate breakdown
- Purchase vs sale breakdown
- Date range
- Average disclosure time

## Troubleshooting

### Python Script Fails

```bash
# Test Python dependencies
python3 scripts/scrape_congress_trades.py --mode daily

# If playwright errors, reinstall browsers
playwright install --with-deps
```

### No Data Returned

Some members may not have electronic filings. The scraper focuses on defense committee members but you can expand the list in:

`scripts/scrape_congress_trades.py` - Functions `get_defense_house_members()` and `get_defense_senators()`

### Slow Performance

Historical backfill is slow by design to avoid overwhelming government servers. Expected times:

- **Historical (2012-present)**: 1-2 hours
- **Daily (current year only)**: 2-5 minutes

## Data Sources

All data comes from official government sources:

1. **House of Representatives**
   - https://disclosures-clerk.house.gov/
   - Periodic Transaction Reports (PTRs)
   - Financial Disclosure Reports

2. **Senate**
   - https://efdsearch.senate.gov/
   - Electronic Financial Disclosures
   - Periodic Transaction Reports

## STOCK Act Compliance

The STOCK Act requires:
- Members must report trades within **45 days**
- Disclosure of trades over **$1,000**
- Public access to all reports

Our system tracks compliance automatically:
```sql
SELECT 
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE disclosure_date - transaction_date <= 45) as compliant,
    COUNT(*) FILTER (WHERE disclosure_date - transaction_date > 45) as late
FROM congressional_stock_trades;
```

## Future Enhancements

1. **Member Committee Tracking**: Auto-populate `congressional_members` table from congress.gov API
2. **Contract Correlation**: Automatic flagging of suspicious timing
3. **Email Alerts**: Notify when defense committee members trade defense stocks
4. **Visualization**: Charts showing trading patterns over time
5. **Expand Coverage**: Add all 535 members (currently focuses on defense committees)

## API Usage

The scraper uses the CapitolGains Python package which:
- Scrapes official government websites
- Handles PDF and XML parsing
- Manages session state and caching
- Respects rate limits

No API keys required. 100% free.

## Maintenance

### Monthly Tasks
- Review scraper logs for errors
- Update committee member lists (when Congress changes)
- Add new defense contractors to reference table

### Annual Tasks (January)
- Update committee assignments after new Congress
- Verify all defense contractors still active
- Review correlation query effectiveness

## Support

For issues or questions:
1. Check scraper logs: `SELECT * FROM scraper_logs WHERE scraper_name = 'congressional_trades'`
2. Test Python script directly: `python3 scripts/scrape_congress_trades.py --mode daily`
3. Verify database schema: `\d congressional_stock_trades` in psql

## License

Uses open-source CapitolGains package (MIT License)
Data sources are public domain (official government records)

