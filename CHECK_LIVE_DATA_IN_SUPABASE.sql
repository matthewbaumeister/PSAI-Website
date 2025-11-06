-- ============================================
-- CHECK CONGRESSIONAL TRADES - LIVE PROGRESS
-- ============================================
-- Copy/paste these into Supabase SQL Editor to see live data
-- Dashboard: https://supabase.com/dashboard/project/reprsoqodhmpdoiajhst/editor

-- ============================================
-- 1. QUICK STATS - How many trades collected?
-- ============================================

SELECT 
    COUNT(*) as total_trades,
    COUNT(DISTINCT member_name) as unique_members,
    COUNT(*) FILTER (WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)) as defense_trades,
    COUNT(*) FILTER (WHERE chamber = 'House') as house_trades,
    COUNT(*) FILTER (WHERE chamber = 'Senate') as senate_trades,
    MAX(scraped_at) as last_updated
FROM congressional_stock_trades;

-- ============================================
-- 2. RECENT TRADES - See the latest ones
-- ============================================

SELECT 
    member_name,
    chamber,
    transaction_date,
    ticker,
    transaction_type,
    amount_range,
    scraped_at
FROM congressional_stock_trades
ORDER BY scraped_at DESC
LIMIT 20;

-- ============================================
-- 3. PROGRESS BY MEMBER - Who's been scraped?
-- ============================================

SELECT 
    member_name,
    chamber,
    COUNT(*) as total_trades,
    MIN(transaction_date) as earliest_trade,
    MAX(transaction_date) as latest_trade,
    MAX(scraped_at) as last_scraped
FROM congressional_stock_trades
GROUP BY member_name, chamber
ORDER BY last_scraped DESC
LIMIT 20;

-- ============================================
-- 4. DEFENSE TRADES - See defense contractor trades
-- ============================================

SELECT 
    t.member_name,
    t.ticker,
    d.company_name,
    t.transaction_type,
    t.transaction_date,
    t.amount_range
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
ORDER BY t.scraped_at DESC
LIMIT 20;

-- ============================================
-- 5. SCRAPER STATUS - Is it running?
-- ============================================

SELECT 
    scrape_type,
    date_range,
    status,
    records_found,
    records_inserted,
    records_updated,
    records_errors,
    started_at,
    duration_seconds
FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 5;

-- ============================================
-- 6. TRADES BY YEAR - See distribution
-- ============================================

SELECT 
    EXTRACT(YEAR FROM transaction_date) as year,
    COUNT(*) as trades,
    COUNT(DISTINCT member_name) as members
FROM congressional_stock_trades
GROUP BY year
ORDER BY year DESC;

-- ============================================
-- 7. TOP TRADERS - Who has most trades?
-- ============================================

SELECT 
    member_name,
    chamber,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE transaction_type = 'purchase') as purchases,
    COUNT(*) FILTER (WHERE transaction_type = 'sale') as sales
FROM congressional_stock_trades
GROUP BY member_name, chamber
ORDER BY total_trades DESC
LIMIT 10;

-- ============================================
-- 8. MOST RECENT 10 TRADES
-- ============================================

SELECT 
    member_name,
    ticker,
    transaction_type,
    amount_range,
    transaction_date,
    TO_CHAR(scraped_at, 'HH24:MI:SS') as time_scraped
FROM congressional_stock_trades
ORDER BY scraped_at DESC
LIMIT 10;

-- ============================================
-- REFRESH THIS PAGE TO SEE LIVE UPDATES!
-- ============================================
-- The numbers will grow as the scraper runs
-- Should see hundreds/thousands of trades after 30-60 minutes

