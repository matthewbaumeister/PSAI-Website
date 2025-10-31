#!/usr/bin/env ts-node
// ============================================
// FPDS Pilot Scrape
// ============================================
// Imports a small dataset (100 contracts) for testing
// Run: npx tsx src/scripts/fpds-pilot-scrape.ts

import 'dotenv/config';
import { scrapeDateRange, getScraperStats } from '../lib/fpds-scraper';

async function main() {
  console.log('============================================');
  console.log('FPDS Pilot Scrape');
  console.log('============================================\n');

  console.log('Importing first 100 contracts from 2024...');
  console.log('Date range: Jan 1, 2024 - Dec 31, 2024');
  console.log('Max pages: 1 (100 contracts)\n');

  try {
    const result = await scrapeDateRange(
      '2024-01-01',
      '2024-12-31',
      {
        smallBusiness: false,
        maxPages: 1 // Only fetch first page (100 contracts)
      }
    );

    console.log('\n============================================');
    console.log('Pilot Scrape Complete!');
    console.log('============================================\n');
    console.log(`✅ Inserted: ${result.inserted} contracts`);
    console.log(`⚠️  Errors: ${result.errors} contracts\n`);

    // Get current stats
    const stats = await getScraperStats();
    console.log(`Total contracts in database: ${stats.totalContracts}\n`);

    console.log('Next steps:');
    console.log('1. Verify data in Supabase (check fpds_contracts table)');
    console.log('2. Run bulk load: npx ts-node src/scripts/fpds-bulk-load.ts');
    console.log('');

  } catch (error) {
    console.error('\n❌ Pilot scrape failed:', error);
    process.exit(1);
  }
}

main();

