/**
 * Quick status checker for Congressional Trades scraper
 * 
 * Usage: tsx check-congress-status.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n' + '='.repeat(60));
  console.log('CONGRESSIONAL STOCK TRADES STATUS');
  console.log('='.repeat(60) + '\n');

  // Check if table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('congressional_stock_trades')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('❌ Database table NOT found');
    console.log('\nRun migration first:');
    console.log('  psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql\n');
    process.exit(1);
  }

  console.log('✅ Database table exists\n');

  // Get stats
  const { data: stats, error: statsError } = await supabase
    .rpc('get_congressional_trades_stats');

  if (statsError || !stats || stats.length === 0) {
    console.log('⚠️  No data yet\n');
    console.log('Run historical backfill:');
    console.log('  npm run scrape:congress:historical\n');
  } else {
    const s = stats[0];
    console.log('📊 STATISTICS:');
    console.log('─'.repeat(60));
    console.log(`Total Trades:          ${s.total_trades?.toLocaleString() || 0}`);
    console.log(`Total Members:         ${s.total_members?.toLocaleString() || 0}`);
    console.log(`Defense Trades:        ${s.defense_trades?.toLocaleString() || 0}`);
    console.log(`House Trades:          ${s.house_trades?.toLocaleString() || 0}`);
    console.log(`Senate Trades:         ${s.senate_trades?.toLocaleString() || 0}`);
    console.log(`Purchases:             ${s.purchases?.toLocaleString() || 0}`);
    console.log(`Sales:                 ${s.sales?.toLocaleString() || 0}`);
    console.log(`Date Range:            ${s.earliest_trade} to ${s.latest_trade}`);
    console.log(`Avg Days to Disclose:  ${s.avg_days_to_disclose ? parseFloat(s.avg_days_to_disclose).toFixed(1) : 'N/A'}`);
    console.log('');
  }

  // Recent scraper runs
  const { data: logs } = await supabase
    .from('congressional_trades_scraper_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5);

  if (logs && logs.length > 0) {
    console.log('📋 RECENT SCRAPER RUNS:');
    console.log('─'.repeat(60));
    logs.forEach(log => {
      const status = log.status === 'completed' ? '✅' : 
                     log.status === 'running' ? '⏳' :
                     log.status === 'failed' ? '❌' : '⚪️';
      const time = new Date(log.started_at).toLocaleString();
      const type = log.scrape_type === 'historical' ? 'HISTORICAL' : 'DAILY';
      console.log(`${status} ${time} - ${type} ${log.status}`);
      console.log(`   Range: ${log.date_range} | Found: ${log.records_found || 0} | Inserted: ${log.records_inserted || 0} | Updated: ${log.records_updated || 0}`);
      if (log.error_message) {
        console.log(`   Error: ${log.error_message}`);
      }
    });
    console.log('');
  }

  // Recent defense trades
  const { data: recentTrades } = await supabase
    .from('defense_stock_trades')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(5);

  if (recentTrades && recentTrades.length > 0) {
    console.log('🔥 RECENT DEFENSE TRADES:');
    console.log('─'.repeat(60));
    recentTrades.forEach(trade => {
      console.log(`${trade.transaction_date} | ${trade.member_name} (${trade.chamber})`);
      console.log(`  ${trade.transaction_type.toUpperCase()}: ${trade.ticker} - ${trade.company_name}`);
      console.log(`  Amount: ${trade.amount_range}`);
      console.log('');
    });
  }

  // Suspicious patterns
  const { data: suspicious } = await supabase
    .from('suspicious_trade_patterns')
    .select('*')
    .order('concurrent_trades', { ascending: false })
    .limit(3);

  if (suspicious && suspicious.length > 0) {
    console.log('⚠️  SUSPICIOUS PATTERNS (Multiple Members, Same Day):');
    console.log('─'.repeat(60));
    suspicious.forEach(pattern => {
      console.log(`${pattern.transaction_date} | ${pattern.ticker} - ${pattern.company_name}`);
      console.log(`  ${pattern.concurrent_trades} members traded`);
      console.log('');
    });
  }

  console.log('='.repeat(60));
  console.log('\nFor more details, run:');
  console.log('  SELECT * FROM get_congressional_trades_stats();');
  console.log('  SELECT * FROM recent_defense_trades;');
  console.log('  SELECT * FROM suspicious_trade_patterns;\n');
}

main().catch(console.error);

