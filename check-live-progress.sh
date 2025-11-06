#!/bin/bash

# Quick check of congressional trades scraper progress

echo "============================================"
echo "CONGRESSIONAL TRADES - LIVE PROGRESS"
echo "============================================"
echo ""

# Load environment
export $(cat .env.local | grep -v '^#' | xargs)

echo "📊 CURRENT STATUS:"
echo ""

# Count total trades
psql $DATABASE_URL -c "
SELECT 
    COUNT(*) as total_trades,
    COUNT(DISTINCT member_name) as members,
    COUNT(*) FILTER (WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers)) as defense_trades,
    MAX(scraped_at) as last_updated
FROM congressional_stock_trades;
" 2>/dev/null

echo ""
echo "🔥 RECENT TRADES (Last 5):"
echo ""

psql $DATABASE_URL -c "
SELECT 
    member_name,
    transaction_date,
    ticker,
    transaction_type,
    scraped_at
FROM congressional_stock_trades
ORDER BY scraped_at DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo "📋 SCRAPER STATUS:"
echo ""

psql $DATABASE_URL -c "
SELECT 
    scrape_type,
    date_range,
    status,
    records_inserted,
    records_updated,
    started_at
FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 1;
" 2>/dev/null

echo ""
echo "============================================"
echo "Run this script again to see updates!"
echo "============================================"

