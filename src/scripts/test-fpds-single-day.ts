#!/usr/bin/env node
/**
 * Test FPDS Transactions Scraper
 * 
 * This script tests the new transactions-based scraper
 * to verify it gets 6000+ contracts instead of 12
 */

import 'dotenv/config';
import { scrapeDailyTransactions } from '../lib/fpds-transactions-scraper';

async function testSingleDay() {
  console.log('====================================');
  console.log('FPDS Transactions Scraper Test');
  console.log('====================================\n');

  // Test yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  console.log(`Testing date: ${dateStr}\n`);
  console.log('This will:');
  console.log('1. Query transactions endpoint (gets ALL contract actions)');
  console.log('2. Fetch full details for each transaction');
  console.log('3. Normalize and validate data');
  console.log('4. Insert/update in database\n');
  console.log('Expected: 1,000+ transactions (vs 12 with old method)\n');
  console.log('====================================\n');

  const startTime = Date.now();

  try {
    const result = await scrapeDailyTransactions(dateStr);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n====================================');
    console.log('SUCCESS!');
    console.log('====================================');
    console.log(`Date: ${result.date}`);
    console.log(`Total Found: ${result.totalFound.toLocaleString()}`);
    console.log(`New Contracts: ${result.totalInserted.toLocaleString()}`);
    console.log(`Updated Contracts: ${result.totalUpdated.toLocaleString()}`);
    console.log(`Failed: ${result.totalFailed}`);
    console.log(`Pages Processed: ${result.pagesProcessed}`);
    console.log(`Duration: ${duration} minutes`);
    console.log('====================================\n');

    if (result.totalFound > 1000) {
      console.log('✅ VERIFICATION PASSED');
      console.log(`   Found ${result.totalFound} transactions (expected 1,000+)`);
      console.log('   Transactions endpoint is working correctly!');
    } else if (result.totalFound > 100) {
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`   Found ${result.totalFound} transactions`);
      console.log('   This is more than the old method (12) but less than expected');
      console.log('   Weekend or holiday? FPDS has less activity on these days');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log(`   Only found ${result.totalFound} transactions`);
      console.log('   Expected 1,000+ transactions per day');
      console.log('   Check if API is working or if date has no data');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.log('\n====================================');
    console.log('FAILED');
    console.log('====================================');
    console.log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

testSingleDay();

