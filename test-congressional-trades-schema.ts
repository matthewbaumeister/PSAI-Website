/**
 * Test Congressional Trades Schema
 * Applies the migration SQL and tests the tables
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING CONGRESSIONAL TRADES SCHEMA');
  console.log('='.repeat(60) + '\n');

  // Load env
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  } catch (e) {
    // Already loaded
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('✅ Connected to Supabase');
  console.log('   URL:', supabaseUrl);
  console.log('');

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'supabase/migrations/create_congressional_trades.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Loaded SQL migration file');
  console.log('   Size:', (sql.length / 1024).toFixed(2), 'KB');
  console.log('');

  // Split into statements and execute
  console.log('⚠️  Cannot apply SQL directly via client');
  console.log('   Will check if tables already exist...\n');

  // Test 1: Check if main table exists
  console.log('TEST 1: Main table exists');
  const { data: tradesTable, error: tradesError } = await supabase
    .from('congressional_stock_trades')
    .select('*')
    .limit(1);

  if (tradesError && tradesError.code === '42P01') {
    console.log('❌ Table congressional_stock_trades does not exist');
    console.log('   Creating manually...\n');
    
    // Create the table manually
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS congressional_stock_trades (
        id BIGSERIAL PRIMARY KEY,
        member_name VARCHAR(255) NOT NULL,
        chamber VARCHAR(10) NOT NULL CHECK (chamber IN ('House', 'Senate')),
        transaction_date DATE NOT NULL,
        disclosure_date DATE NOT NULL,
        ticker VARCHAR(20),
        asset_description TEXT NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'exchange', 'unknown')),
        amount_range VARCHAR(100),
        filing_url TEXT,
        scraped_at TIMESTAMP DEFAULT NOW(),
        related_defense_contractors TEXT[],
        potential_conflicts BOOLEAN DEFAULT FALSE,
        UNIQUE(member_name, transaction_date, ticker, transaction_type)
      );
    `;
    
    // We'll need to create tables through a migration or manually
    console.log('❌ Cannot create table directly via Supabase client');
    console.log('   Please run the SQL migration manually in Supabase dashboard');
    console.log('\nSteps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/reprsoqodhmpdoiajhst/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/create_congressional_trades.sql');
    console.log('3. Paste and run in the SQL editor');
    process.exit(1);
  } else if (tradesError) {
    console.log('❌ Error checking table:', tradesError.message);
    process.exit(1);
  } else {
    console.log('✅ Table congressional_stock_trades exists');
    console.log('   Current records:', tradesTable?.length || 0);
  }

  // Test 2: Check scraper log table
  console.log('\nTEST 2: Scraper log table exists');
  const { data: logTable, error: logError } = await supabase
    .from('congressional_trades_scraper_log')
    .select('*')
    .limit(1);

  if (logError && logError.code === '42P01') {
    console.log('❌ Table congressional_trades_scraper_log does not exist');
  } else if (logError) {
    console.log('❌ Error checking log table:', logError.message);
  } else {
    console.log('✅ Table congressional_trades_scraper_log exists');
    console.log('   Log entries:', logTable?.length || 0);
  }

  // Test 3: Check defense contractors reference table
  console.log('\nTEST 3: Defense contractors table exists');
  const { data: contractorsTable, error: contractorsError } = await supabase
    .from('defense_contractors_tickers')
    .select('*')
    .limit(5);

  if (contractorsError && contractorsError.code === '42P01') {
    console.log('❌ Table defense_contractors_tickers does not exist');
  } else if (contractorsError) {
    console.log('❌ Error checking contractors table:', contractorsError.message);
  } else {
    console.log('✅ Table defense_contractors_tickers exists');
    console.log('   Pre-loaded tickers:', contractorsTable?.length || 0);
    if (contractorsTable && contractorsTable.length > 0) {
      console.log('   Sample:', contractorsTable.slice(0, 3).map(c => c.ticker).join(', '));
    }
  }

  // Test 4: Check views
  console.log('\nTEST 4: Views exist');
  const { data: viewData, error: viewError } = await supabase
    .from('defense_stock_trades')
    .select('*')
    .limit(1);

  if (viewError && viewError.code === '42P01') {
    console.log('❌ View defense_stock_trades does not exist');
  } else if (viewError) {
    console.log('⚠️  View may not exist yet or has no data');
  } else {
    console.log('✅ View defense_stock_trades exists');
  }

  // Test 5: Check function
  console.log('\nTEST 5: Stats function exists');
  const { data: statsData, error: statsError } = await supabase
    .rpc('get_congressional_trades_stats');

  if (statsError) {
    console.log('❌ Function get_congressional_trades_stats does not exist or failed');
    console.log('   Error:', statsError.message);
  } else {
    console.log('✅ Function get_congressional_trades_stats exists');
    if (statsData && statsData.length > 0) {
      const stats = statsData[0];
      console.log('   Stats:', JSON.stringify(stats, null, 2));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SCHEMA TEST COMPLETE');
  console.log('='.repeat(60) + '\n');

  console.log('Next step:');
  console.log('  npm run scrape:congress-trades:historical');
  console.log('');
}

main().catch(console.error);

