-- Fix ticker field length issue
-- Need to drop views first, alter column, then recreate views

-- Step 1: Drop views that depend on ticker column
DROP VIEW IF EXISTS defense_stock_trades CASCADE;
DROP VIEW IF EXISTS recent_defense_trades CASCADE;
DROP VIEW IF EXISTS suspicious_trade_patterns CASCADE;

-- Step 2: Alter the ticker column
ALTER TABLE congressional_stock_trades 
ALTER COLUMN ticker TYPE VARCHAR(50);

-- Step 3: Recreate the views

-- View: Defense stock trades by committee members
CREATE OR REPLACE VIEW defense_stock_trades AS
SELECT 
    t.id,
    t.member_name,
    t.chamber,
    t.transaction_date,
    t.disclosure_date,
    t.ticker,
    t.asset_description,
    t.transaction_type,
    t.amount_range,
    d.company_name,
    d.sector,
    d.is_prime_contractor,
    t.filing_url,
    -- Days between transaction and disclosure (should be <45 days per STOCK Act)
    (t.disclosure_date - t.transaction_date) as days_to_disclose
FROM congressional_stock_trades t
LEFT JOIN defense_contractors_tickers d ON d.ticker = t.ticker
WHERE t.ticker IN (SELECT ticker FROM defense_contractors_tickers)
ORDER BY t.transaction_date DESC;

-- View: Recent defense trades (last 90 days)
CREATE OR REPLACE VIEW recent_defense_trades AS
SELECT *
FROM defense_stock_trades
WHERE transaction_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY transaction_date DESC;

-- View: Suspicious timing (trades before major contract awards)
CREATE OR REPLACE VIEW suspicious_trade_patterns AS
SELECT 
    t.member_name,
    t.chamber,
    t.transaction_date,
    t.ticker,
    t.transaction_type,
    t.amount_range,
    d.company_name,
    COUNT(*) OVER (PARTITION BY t.ticker, t.transaction_date) as concurrent_trades,
    t.filing_url
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
WHERE t.transaction_type = 'purchase'
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY t.transaction_date DESC, concurrent_trades DESC;

-- Verify the change
SELECT 
  'Ticker field updated successfully' as status,
  data_type,
  character_maximum_length as max_length
FROM information_schema.columns
WHERE table_name = 'congressional_stock_trades'
  AND column_name = 'ticker';

