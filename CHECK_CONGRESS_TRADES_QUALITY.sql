-- ============================================
-- Congressional Trades Data Quality Check
-- Single comprehensive output table
-- ============================================

WITH 

-- Overall Summary
summary AS (
  SELECT 
    'SUMMARY' as section,
    chamber as category,
    'Total Trades' as metric,
    COUNT(*)::TEXT as value,
    1 as sort_order
  FROM congressional_stock_trades
  GROUP BY chamber
  
  UNION ALL
  
  SELECT 
    'SUMMARY',
    chamber,
    'Unique Members',
    COUNT(DISTINCT member_name)::TEXT,
    2
  FROM congressional_stock_trades
  GROUP BY chamber
  
  UNION ALL
  
  SELECT 
    'SUMMARY',
    chamber,
    'Ticker Extraction Rate',
    ROUND(100.0 * COUNT(ticker) / COUNT(*), 1)::TEXT || '%',
    3
  FROM congressional_stock_trades
  GROUP BY chamber
  
  UNION ALL
  
  SELECT 
    'SUMMARY',
    chamber,
    'Date Range',
    MIN(transaction_date)::TEXT || ' to ' || MAX(transaction_date)::TEXT,
    4
  FROM congressional_stock_trades
  GROUP BY chamber
  
  UNION ALL
  
  SELECT 
    'SUMMARY',
    'TOTAL',
    'Combined Total',
    COUNT(*)::TEXT,
    5
  FROM congressional_stock_trades
),

-- Transaction Types
txn_types AS (
  SELECT 
    'TRANSACTION TYPES' as section,
    chamber || ': ' || transaction_type as category,
    'Count' as metric,
    COUNT(*)::TEXT,
    6 + ROW_NUMBER() OVER (ORDER BY chamber, COUNT(*) DESC)
  FROM congressional_stock_trades
  GROUP BY chamber, transaction_type
),

-- Top Traders by Chamber
top_senate AS (
  SELECT 
    'TOP SENATE TRADERS' as section,
    member_name as category,
    'Trades' as metric,
    COUNT(*)::TEXT || ' (' || COUNT(ticker)::TEXT || ' w/ticker)',
    20 + ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)
  FROM congressional_stock_trades
  WHERE chamber = 'Senate'
  GROUP BY member_name
  ORDER BY COUNT(*) DESC
  LIMIT 10
),

top_house AS (
  SELECT 
    'TOP HOUSE TRADERS' as section,
    member_name as category,
    'Trades' as metric,
    COUNT(*)::TEXT || ' (' || COUNT(ticker)::TEXT || ' w/ticker)',
    40 + ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)
  FROM congressional_stock_trades
  WHERE chamber = 'House'
  GROUP BY member_name
  ORDER BY COUNT(*) DESC
  LIMIT 10
),

-- Recent Activity
recent AS (
  SELECT 
    'RECENT TRADES (30 days)' as section,
    chamber as category,
    'Count' as metric,
    COUNT(*)::TEXT,
    60
  FROM congressional_stock_trades
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY chamber
),

-- Defense Contractor Trades
defense AS (
  SELECT 
    'DEFENSE TRADES (6 mo)' as section,
    t.chamber as category,
    'Count' as metric,
    COUNT(*)::TEXT,
    70
  FROM congressional_stock_trades t
  JOIN defense_contractors_tickers d ON d.ticker = t.ticker
  WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '180 days'
  GROUP BY t.chamber
),

-- Trades by Year
yearly AS (
  SELECT 
    'TRADES BY YEAR' as section,
    EXTRACT(YEAR FROM transaction_date)::TEXT || ' ' || chamber as category,
    'Trades (w/ticker)' as metric,
    COUNT(*)::TEXT || ' (' || COUNT(ticker)::TEXT || ')',
    80 + ROW_NUMBER() OVER (ORDER BY EXTRACT(YEAR FROM transaction_date) DESC, chamber)
  FROM congressional_stock_trades
  GROUP BY EXTRACT(YEAR FROM transaction_date), chamber
  ORDER BY EXTRACT(YEAR FROM transaction_date) DESC, chamber
  LIMIT 20
),

-- Most Traded Tickers
top_tickers AS (
  SELECT 
    'TOP TICKERS' as section,
    ticker as category,
    'Trades (P/S)' as metric,
    COUNT(*)::TEXT || ' (' || 
    COUNT(*) FILTER (WHERE transaction_type = 'purchase')::TEXT || '/' ||
    COUNT(*) FILTER (WHERE transaction_type = 'sale')::TEXT || ')',
    120 + ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)
  FROM congressional_stock_trades
  WHERE ticker IS NOT NULL
  GROUP BY ticker
  ORDER BY COUNT(*) DESC
  LIMIT 15
),

-- Data Quality Issues
quality AS (
  SELECT 
    'DATA QUALITY' as section,
    'Missing Tickers' as category,
    'Count' as metric,
    COUNT(*)::TEXT,
    150
  FROM congressional_stock_trades
  WHERE ticker IS NULL
  
  UNION ALL
  
  SELECT 
    'DATA QUALITY',
    'Unknown Transaction Type',
    'Count',
    COUNT(*)::TEXT,
    151
  FROM congressional_stock_trades
  WHERE transaction_type = 'unknown'
  
  UNION ALL
  
  SELECT 
    'DATA QUALITY',
    'Missing Dates',
    'Count',
    COUNT(*)::TEXT,
    152
  FROM congressional_stock_trades
  WHERE transaction_date IS NULL OR disclosure_date IS NULL
  
  UNION ALL
  
  SELECT 
    'DATA QUALITY',
    'Pre-2012 Dates',
    'Count',
    COUNT(*)::TEXT,
    153
  FROM congressional_stock_trades
  WHERE transaction_date < '2012-01-01'
),

-- Comparison Metrics
comparison AS (
  SELECT 
    'SENATE vs HOUSE' as section,
    'Ticker Extraction' as category,
    'Rate' as metric,
    'Senate: ' || ROUND(100.0 * COUNT(ticker) FILTER (WHERE chamber = 'Senate') / 
          NULLIF(COUNT(*) FILTER (WHERE chamber = 'Senate'), 0), 1)::TEXT || '% | House: ' ||
    ROUND(100.0 * COUNT(ticker) FILTER (WHERE chamber = 'House') / 
          NULLIF(COUNT(*) FILTER (WHERE chamber = 'House'), 0), 1)::TEXT || '%',
    160
  FROM congressional_stock_trades
  
  UNION ALL
  
  SELECT 
    'SENATE vs HOUSE',
    'Avg Trades per Member',
    'Average',
    'Senate: ' || ROUND(COUNT(*) FILTER (WHERE chamber = 'Senate')::NUMERIC / 
          NULLIF(COUNT(DISTINCT member_name) FILTER (WHERE chamber = 'Senate'), 0), 1)::TEXT ||
    ' | House: ' || ROUND(COUNT(*) FILTER (WHERE chamber = 'House')::NUMERIC / 
          NULLIF(COUNT(DISTINCT member_name) FILTER (WHERE chamber = 'House'), 0), 1)::TEXT,
    161
  FROM congressional_stock_trades
),

-- Latest Scraper Run
scraper_log AS (
  SELECT 
    'LATEST SCRAPE' as section,
    scrape_type as category,
    'Performance' as metric,
    records_inserted::TEXT || ' inserted, ' || 
    records_updated::TEXT || ' updated, ' ||
    records_errors::TEXT || ' errors in ' ||
    ROUND(duration_seconds / 60.0, 1)::TEXT || ' min',
    170
  FROM congressional_trades_scraper_log
  ORDER BY started_at DESC
  LIMIT 1
)

-- Combine all results
SELECT section, category, metric, value
FROM (
  SELECT * FROM summary
  UNION ALL SELECT * FROM txn_types
  UNION ALL SELECT * FROM top_senate
  UNION ALL SELECT * FROM top_house
  UNION ALL SELECT * FROM recent
  UNION ALL SELECT * FROM defense
  UNION ALL SELECT * FROM yearly
  UNION ALL SELECT * FROM top_tickers
  UNION ALL SELECT * FROM quality
  UNION ALL SELECT * FROM comparison
  UNION ALL SELECT * FROM scraper_log
) combined
ORDER BY sort_order;

