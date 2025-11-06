-- ============================================
-- Congressional Trades Data Quality Check
-- ============================================
-- Run these queries to verify your data and find insights
-- ============================================

-- 1. Overall Statistics
-- ============================================
SELECT 
    'Overall Stats' as check_type,
    *
FROM get_congressional_trades_stats();

-- 2. Data Coverage by Year
-- ============================================
SELECT 
    'Coverage by Year' as check_type,
    DATE_PART('year', transaction_date) as year,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE chamber = 'House') as house_trades,
    COUNT(*) FILTER (WHERE chamber = 'Senate') as senate_trades,
    COUNT(*) FILTER (WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)) as defense_trades
FROM congressional_stock_trades
GROUP BY year
ORDER BY year DESC;

-- 3. Most Active Traders
-- ============================================
SELECT 
    'Most Active Traders' as check_type,
    member_name,
    chamber,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE transaction_type = 'purchase') as purchases,
    COUNT(*) FILTER (WHERE transaction_type = 'sale') as sales,
    MIN(transaction_date) as first_trade,
    MAX(transaction_date) as latest_trade
FROM congressional_stock_trades
GROUP BY member_name, chamber
ORDER BY total_trades DESC
LIMIT 20;

-- 4. Most Traded Defense Stocks
-- ============================================
SELECT 
    'Most Traded Defense Stocks' as check_type,
    t.ticker,
    d.company_name,
    COUNT(*) as num_trades,
    COUNT(DISTINCT member_name) as num_members,
    COUNT(*) FILTER (WHERE transaction_type = 'purchase') as purchases,
    COUNT(*) FILTER (WHERE transaction_type = 'sale') as sales
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
GROUP BY t.ticker, d.company_name
ORDER BY num_trades DESC;

-- 5. Recent Activity (Last 30 Days)
-- ============================================
SELECT 
    'Recent Activity (30 days)' as check_type,
    transaction_date,
    member_name,
    chamber,
    ticker,
    transaction_type,
    amount_range
FROM congressional_stock_trades
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY transaction_date DESC
LIMIT 50;

-- 6. STOCK Act Compliance Check
-- ============================================
SELECT 
    'STOCK Act Compliance' as check_type,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE disclosure_date - transaction_date <= 45) as compliant,
    COUNT(*) FILTER (WHERE disclosure_date - transaction_date > 45) as late_disclosure,
    ROUND(100.0 * COUNT(*) FILTER (WHERE disclosure_date - transaction_date <= 45) / COUNT(*), 2) as compliance_rate
FROM congressional_stock_trades;

-- 7. Late Disclosures (Top Violators)
-- ============================================
SELECT 
    'Late Disclosures' as check_type,
    member_name,
    COUNT(*) as late_disclosures,
    AVG(disclosure_date - transaction_date) as avg_days_late,
    MAX(disclosure_date - transaction_date) as worst_delay
FROM congressional_stock_trades
WHERE disclosure_date - transaction_date > 45
GROUP BY member_name
ORDER BY late_disclosures DESC
LIMIT 20;

-- 8. Suspicious Patterns (Coordinated Trading)
-- ============================================
SELECT 
    'Suspicious Patterns' as check_type,
    transaction_date,
    ticker,
    COUNT(*) as num_members,
    STRING_AGG(member_name, ', ' ORDER BY member_name) as members
FROM congressional_stock_trades
WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)
  AND transaction_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY transaction_date, ticker
HAVING COUNT(*) >= 3
ORDER BY num_members DESC, transaction_date DESC
LIMIT 20;

-- 9. Defense Trades Near Contract Awards (Last 6 Months)
-- ============================================
SELECT 
    'Trades Near Contracts' as check_type,
    t.member_name,
    t.transaction_date,
    t.ticker,
    t.transaction_type,
    c.signed_date as contract_date,
    c.vendor_name,
    c.dollarsobligated,
    (c.signed_date - t.transaction_date) as days_difference
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
JOIN fpds_contracts c ON LOWER(c.vendor_name) LIKE '%' || LOWER(d.company_name) || '%'
WHERE t.transaction_date >= c.signed_date - INTERVAL '90 days'
  AND t.transaction_date <= c.signed_date + INTERVAL '30 days'
  AND c.dollarsobligated > 10000000
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY c.dollarsobligated DESC
LIMIT 20;

-- 10. Data Quality Issues
-- ============================================
SELECT 
    'Data Quality Issues' as check_type,
    'Missing Tickers' as issue,
    COUNT(*) as count
FROM congressional_stock_trades
WHERE ticker IS NULL OR ticker = ''
UNION ALL
SELECT 
    'Data Quality Issues' as check_type,
    'Future Transaction Dates' as issue,
    COUNT(*) as count
FROM congressional_stock_trades
WHERE transaction_date > CURRENT_DATE
UNION ALL
SELECT 
    'Data Quality Issues' as check_type,
    'Disclosure Before Transaction' as issue,
    COUNT(*) as count
FROM congressional_stock_trades
WHERE disclosure_date < transaction_date;

-- 11. Monthly Trade Volume Trend
-- ============================================
SELECT 
    'Monthly Trend' as check_type,
    DATE_TRUNC('month', transaction_date) as month,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)) as defense_trades,
    COUNT(DISTINCT member_name) as active_members
FROM congressional_stock_trades
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;

-- 12. Scraper Status
-- ============================================
SELECT 
    'Scraper Status' as check_type,
    timestamp,
    status,
    notes
FROM scraper_logs
WHERE scraper_name = 'congressional_trades'
ORDER BY timestamp DESC
LIMIT 10;

-- ============================================
-- Summary Message
-- ============================================
DO $$ 
BEGIN 
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Congressional Trades Data Quality Check Complete';
    RAISE NOTICE '============================================';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Review the results above for:';
    RAISE NOTICE '- Overall statistics and coverage';
    RAISE NOTICE '- Most active traders';
    RAISE NOTICE '- STOCK Act compliance';
    RAISE NOTICE '- Suspicious patterns';
    RAISE NOTICE '- Contract correlations';
    RAISE NOTICE '- Data quality issues';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. If data looks good, set up daily cron';
    RAISE NOTICE '2. Integrate queries into your UI';
    RAISE NOTICE '3. Set up email alerts for new trades';
    RAISE NOTICE ' ';
    RAISE NOTICE '============================================';
END $$;
