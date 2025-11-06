-- Check Senate Trades in Supabase
-- Run these queries in Supabase SQL Editor to verify scraper results

-- 1. Count Senate trades
SELECT COUNT(*) as senate_trades
FROM congressional_stock_trades
WHERE chamber = 'Senate';

-- 2. Senate vs House comparison
SELECT 
  chamber,
  COUNT(*) as total_trades,
  COUNT(ticker) as trades_with_ticker,
  ROUND(100.0 * COUNT(ticker) / COUNT(*), 1) as ticker_extraction_rate,
  COUNT(DISTINCT member_name) as unique_members,
  MIN(transaction_date) as earliest_trade,
  MAX(transaction_date) as latest_trade
FROM congressional_stock_trades
GROUP BY chamber;

-- 3. Recent Senate trades (last 20)
SELECT 
  member_name,
  transaction_date,
  disclosure_date,
  ticker,
  LEFT(asset_description, 60) as asset,
  transaction_type,
  amount_range
FROM congressional_stock_trades
WHERE chamber = 'Senate'
ORDER BY transaction_date DESC
LIMIT 20;

-- 4. Top Senate traders by volume
SELECT 
  member_name,
  COUNT(*) as trade_count,
  COUNT(ticker) as trades_with_ticker,
  ROUND(100.0 * COUNT(ticker) / COUNT(*), 1) as ticker_rate
FROM congressional_stock_trades
WHERE chamber = 'Senate'
GROUP BY member_name
ORDER BY trade_count DESC;

-- 5. Senate trades by year
SELECT 
  EXTRACT(YEAR FROM transaction_date) as year,
  COUNT(*) as trades,
  COUNT(ticker) as with_ticker
FROM congressional_stock_trades
WHERE chamber = 'Senate'
GROUP BY EXTRACT(YEAR FROM transaction_date)
ORDER BY year DESC;

-- 6. Defense contractor trades (Senate)
SELECT 
  t.member_name,
  t.transaction_date,
  t.ticker,
  d.company_name,
  t.transaction_type,
  t.amount_range
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
WHERE t.chamber = 'Senate'
ORDER BY t.transaction_date DESC;

-- 7. Check scraper logs
SELECT 
  scrape_type,
  date_range,
  records_found,
  records_inserted,
  records_updated,
  records_errors,
  duration_seconds,
  status,
  started_at
FROM congressional_trades_scraper_log
WHERE scrape_type IN ('historical', 'daily')
ORDER BY started_at DESC
LIMIT 10;

-- 8. Overall stats
SELECT * FROM get_congressional_trades_stats();

