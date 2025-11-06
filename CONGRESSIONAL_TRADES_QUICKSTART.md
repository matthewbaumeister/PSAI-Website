# Congressional Trades Quick Start

## 3-Step Setup (5 minutes)

### Step 1: Install Dependencies

```bash
chmod +x setup-congressional-trades.sh
./setup-congressional-trades.sh
```

### Step 2: Apply Database Migration

```bash
# Option A: Direct psql
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql

# Option B: Supabase CLI
supabase db push
```

### Step 3: Run Historical Backfill

```bash
# Full history (2012-present) - takes 1-2 hours
npm run scrape:congress-trades:historical

# OR start from 2020 (faster, ~30 minutes)
npm run scrape:congress-trades:historical 2020
```

## Check It's Working

```sql
-- View summary stats
SELECT * FROM get_congressional_trades_stats();

-- View recent defense trades
SELECT * FROM recent_defense_trades LIMIT 10;

-- Check scraper status
SELECT * FROM scraper_logs 
WHERE scraper_name = 'congressional_trades' 
ORDER BY timestamp DESC 
LIMIT 5;
```

## Daily Automation

```bash
# Set up daily cron (runs at 3 AM)
crontab -e

# Add this line (update path):
0 3 * * * cd /path/to/PropShop_AI_Website && npm run scrape:congress-trades:daily >> /var/log/congress-trades.log 2>&1
```

## Powerful Queries (Copy & Paste)

### 1. Find Trades Before Major Contracts

```sql
SELECT * FROM find_trades_before_contracts(90, 30)
ORDER BY contract_value DESC
LIMIT 20;
```

Shows congressional trades that happened 90 days before to 30 days after major contract awards.

### 2. Defense Committee Trading Activity

```sql
SELECT 
    member_name,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE transaction_type = 'purchase') as buys,
    COUNT(*) FILTER (WHERE transaction_type = 'sale') as sells,
    STRING_AGG(DISTINCT ticker, ', ') as tickers
FROM congressional_stock_trades
WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)
  AND transaction_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY member_name
ORDER BY total_trades DESC
LIMIT 20;
```

### 3. Late Disclosures (STOCK Act Violations)

```sql
SELECT 
    member_name,
    transaction_date,
    disclosure_date,
    (disclosure_date - transaction_date) as days_late,
    ticker,
    amount_range
FROM congressional_stock_trades
WHERE (disclosure_date - transaction_date) > 45
ORDER BY days_late DESC
LIMIT 50;
```

### 4. Coordinated Trading (Suspicious Patterns)

```sql
SELECT 
    transaction_date,
    ticker,
    COUNT(*) as num_members,
    STRING_AGG(member_name, ', ' ORDER BY member_name) as members
FROM congressional_stock_trades
WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)
  AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY transaction_date, ticker
HAVING COUNT(*) >= 3
ORDER BY num_members DESC, transaction_date DESC;
```

## Correlation with Your Existing Data

### Link to DoD Contracts

```sql
SELECT 
    t.member_name,
    t.transaction_date,
    t.ticker,
    t.transaction_type,
    c.vendor_name,
    c.dollarsobligated,
    c.signed_date,
    (c.signed_date - t.transaction_date) as days_between
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
JOIN fpds_contracts c ON LOWER(c.vendor_name) LIKE '%' || LOWER(d.company_name) || '%'
WHERE t.transaction_date BETWEEN c.signed_date - INTERVAL '90 days' 
                            AND c.signed_date + INTERVAL '30 days'
  AND c.dollarsobligated > 50000000
ORDER BY c.dollarsobligated DESC, t.transaction_date
LIMIT 50;
```

### Link to SAM.gov Opportunities

```sql
SELECT 
    t.member_name,
    t.transaction_date,
    t.ticker,
    t.transaction_type,
    s.title,
    s.posted_date,
    s.naics_code
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
JOIN sam_gov_opportunities s ON LOWER(s.title) LIKE '%' || LOWER(d.company_name) || '%'
WHERE t.transaction_date BETWEEN s.posted_date - INTERVAL '30 days'
                            AND s.posted_date + INTERVAL '90 days'
ORDER BY t.transaction_date DESC
LIMIT 50;
```

## What Gets Tracked

**Defense Contractors (20+)**
- Prime: Lockheed Martin, Raytheon, Boeing, Northrop Grumman, General Dynamics
- IT: Leidos, SAIC, CACI, Palantir
- Space: Rocket Lab, AST SpaceMobile
- Cloud: Microsoft, Amazon, Google, Oracle

**Congressional Members (~100)**
- House Armed Services Committee
- Senate Armed Services Committee  
- House Defense Appropriations
- Senate Defense Appropriations

**Coverage**
- 2012-present (electronic filing era)
- ~10,000-50,000 total trades expected
- Updates daily for new disclosures

## Troubleshooting

### "Command not found: python3"
Install Python 3.8+: `brew install python3` (Mac) or `apt install python3` (Linux)

### "playwright install fails"
```bash
python3 -m playwright install --with-deps
```

### "No data returned"
Check scraper logs:
```sql
SELECT * FROM scraper_logs 
WHERE scraper_name = 'congressional_trades' 
ORDER BY timestamp DESC;
```

### "Scraper is slow"
Normal! Government sites are rate-limited. Historical backfill takes 1-2 hours.

## Data Quality Checks

```sql
-- Overall stats
SELECT * FROM get_congressional_trades_stats();

-- Check for gaps
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    COUNT(*) as trades
FROM congressional_stock_trades
GROUP BY month
ORDER BY month DESC;

-- Verify tickers
SELECT 
    ticker,
    COUNT(*) as trades
FROM congressional_stock_trades
WHERE ticker IS NOT NULL
GROUP BY ticker
ORDER BY trades DESC
LIMIT 20;
```

## Next Steps

1. **Automate Analysis**: Create views linking trades to your contracts data
2. **Add Alerts**: Email notifications when defense committee members trade
3. **Expand Coverage**: Add more committee members to Python script
4. **Visualize**: Build dashboards showing trading patterns

## Full Documentation

See `CONGRESSIONAL_TRADES_SETUP.md` for complete documentation.

## Support

Check logs:
```bash
tail -f /var/log/congress-trades.log
```

Test scraper directly:
```bash
python3 scripts/scrape_congress_trades.py --mode daily
```

Database issues:
```sql
\d congressional_stock_trades
```

