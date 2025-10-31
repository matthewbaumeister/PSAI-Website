#!/usr/bin/env ts-node
// ============================================
// FPDS Scraper - Test Script
// ============================================
// Tests the FPDS scraper with a small dataset
// Run: npx tsx test-fpds-scraper.ts

import 'dotenv/config';
import {
  searchContracts,
  normalizeContract,
  batchInsertContracts,
  getScraperStats
} from './src/lib/fpds-scraper';

async function main() {
  console.log('============================================');
  console.log('FPDS Scraper - Test Script');
  console.log('============================================\n');

  try {
    // ============================================
    // TEST 1: Fetch 10 contracts from API
    // ============================================
    console.log('TEST 1: Fetching 10 contracts from USASpending.gov API...\n');

    const result = await searchContracts({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      limit: 10,
      page: 1
    });

    console.log(`✅ Fetched ${result.results.length} contracts\n`);

    if (result.results.length > 0) {
      console.log('Sample Contract:');
      console.log('----------------');
      const sample = result.results[0];
      console.log(`Award ID: ${sample['Award ID'] || 'N/A'}`);
      console.log(`Recipient: ${sample['Recipient Name'] || 'N/A'}`);
      console.log(`Amount: $${sample['Award Amount']?.toLocaleString() || '0'}`);
      console.log(`Start Date: ${sample['Start Date'] || 'N/A'}`);
      console.log(`Agency: ${sample['Awarding Agency'] || 'N/A'}`);
      console.log(`Type: ${sample['Award Type'] || 'N/A'}\n`);
    }

    // ============================================
    // TEST 2: Normalize data
    // ============================================
    console.log('TEST 2: Normalizing contract data...\n');

    const normalized = result.results.map(normalizeContract);

    console.log(`✅ Normalized ${normalized.length} contracts\n`);

    if (normalized.length > 0) {
      console.log('Sample Normalized Contract:');
      console.log('---------------------------');
      console.log(JSON.stringify(normalized[0], null, 2));
      console.log('');
    }

    // ============================================
    // TEST 3: Insert to database
    // ============================================
    console.log('TEST 3: Inserting to database...\n');

    const insertResult = await batchInsertContracts(normalized);

    console.log(`✅ Database insert complete:`);
    console.log(`   - Inserted: ${insertResult.inserted}`);
    console.log(`   - Errors: ${insertResult.errors}\n`);

    // ============================================
    // TEST 4: Get statistics
    // ============================================
    console.log('TEST 4: Getting scraper statistics...\n');

    const stats = await getScraperStats();

    console.log(`✅ Current database stats:`);
    console.log(`   - Total Contracts: ${stats.totalContracts}`);
    console.log(`   - Recent Runs: ${stats.recentRuns?.length || 0}\n`);

    // ============================================
    // SUCCESS
    // ============================================
    console.log('============================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('============================================\n');

    console.log('Next steps:');
    console.log('1. Run pilot scrape: npx ts-node src/scripts/fpds-pilot-scrape.ts');
    console.log('2. Run bulk load: npx ts-node src/scripts/fpds-bulk-load.ts');
    console.log('3. Build aggregations');
    console.log('4. Create UI components\n');

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

// Run the test
main();

