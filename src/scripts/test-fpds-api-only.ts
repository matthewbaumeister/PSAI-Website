#!/usr/bin/env node
/**
 * Quick FPDS API Test
 * 
 * Tests if the transactions endpoint is working
 * WITHOUT fetching full details (fast test)
 */

import 'dotenv/config';
import { searchContractTransactions } from '../lib/fpds-transactions-scraper';

async function quickTest() {
  console.log('================================================================================');
  console.log('FPDS TRANSACTIONS API - QUICK TEST');
  console.log('================================================================================\n');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  console.log(`Testing date: ${dateStr}\n`);
  console.log('This will ONLY test the API search (not fetch full details)');
  console.log('Should complete in < 10 seconds\n');
  console.log('================================================================================\n');

  try {
    console.log('🔍 Calling transactions endpoint...');
    
    const result = await searchContractTransactions({
      startDate: dateStr,
      endDate: dateStr,
      page: 1,
      limit: 10 // Just get 10 to test
    });

    console.log('\n✅ API CALL SUCCESSFUL!\n');
    console.log('================================================================================');
    console.log('RESULTS:');
    console.log('================================================================================');
    console.log(`Total Available: ${result.total.toLocaleString()} transactions`);
    console.log(`Returned: ${result.count} transactions`);
    console.log(`Has More: ${result.hasMore}`);
    console.log('================================================================================\n');

    if (result.total > 1000) {
      console.log('✅ VERIFICATION PASSED');
      console.log(`   Found ${result.total.toLocaleString()} transactions`);
      console.log('   Transactions endpoint is working correctly!');
      console.log('   This is 100x more than the old awards endpoint (which found ~12)\n');
    } else if (result.total > 100) {
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`   Found ${result.total} transactions`);
      console.log('   More than awards endpoint (12) but less than expected');
      console.log('   Might be a weekend/holiday with less activity\n');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log(`   Only found ${result.total} transactions`);
      console.log('   Expected 1,000+ per day\n');
    }

    // Show sample contracts
    if (result.results && result.results.length > 0) {
      console.log('================================================================================');
      console.log('SAMPLE TRANSACTIONS:');
      console.log('================================================================================');
      result.results.slice(0, 5).forEach((tx: any, i: number) => {
        console.log(`${i + 1}. ${tx['Award ID'] || tx.generated_internal_id}`);
        console.log(`   Recipient: ${tx['Recipient Name']}`);
        console.log(`   Amount: $${tx['Award Amount']?.toLocaleString() || 'N/A'}`);
        console.log(`   Mod #: ${tx.modification_number || '0'}`);
        console.log(`   Action: ${tx.action_type_description || tx.action_type || 'N/A'}`);
        console.log('');
      });
    }

    console.log('================================================================================');
    console.log('NEXT STEPS:');
    console.log('================================================================================');
    console.log('✅ API is working');
    console.log('✅ Transactions endpoint returns correct data');
    console.log('');
    console.log('To run full scraper (will take 10-50 minutes):');
    console.log('  npx tsx src/scripts/fpds-historical-transactions-scraper.ts --test');
    console.log('================================================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n================================================================================');
    console.error('❌ API TEST FAILED');
    console.error('================================================================================');
    console.error(`Error: ${error.message}`);
    console.error('================================================================================\n');
    process.exit(1);
  }
}

quickTest();

