#!/usr/bin/env ts-node
// ============================================
// FPDS Full Details Bulk Load
// ============================================
// Imports federal contracts with FULL details
// SLOW but comprehensive!
//
// Run: npx tsx src/scripts/fpds-full-load.ts [--year=2024] [--max=10000]
//
// Examples:
//   npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=1000
//   npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=10000
//   npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100000

import 'dotenv/config';
import { scrapeDateRangeWithFullDetails, getScraperStats } from '../lib/fpds-scraper-full';

// Parse command line arguments
const args = process.argv.slice(2);
const yearArg = args.find(arg => arg.startsWith('--year='));
const maxArg = args.find(arg => arg.startsWith('--max='));

const year = yearArg ? parseInt(yearArg.split('=')[1]) : 2024;
const maxContracts = maxArg ? parseInt(maxArg.split('=')[1]) : 10000;

async function main() {
  console.log('============================================');
  console.log('FPDS FULL DETAILS Bulk Load');
  console.log('============================================\n');

  console.log(`Configuration:`);
  console.log(`  Year: ${year}`);
  console.log(`  Max Contracts: ${maxContracts.toLocaleString()}`);
  console.log(`  Small Business Filter: No (all contracts)`);
  console.log(`  Details per contract: ~100 fields`);
  console.log('');

  // Calculate estimated time
  const estimatedMinutes = Math.ceil((maxContracts * 0.5) / 60); // ~0.5 sec per contract
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const remainingMinutes = estimatedMinutes % 60;

  console.log(`⏱️  Estimated Time:`);
  if (estimatedHours > 0) {
    console.log(`   ${estimatedHours} hours ${remainingMinutes} minutes`);
  } else {
    console.log(`   ${estimatedMinutes} minutes`);
  }
  console.log('');

  console.warn('⚠️  This will import contracts with FULL details.');
  console.warn('⚠️  Much slower than basic scraper but WAY more data!');
  console.log('');

  console.log('Starting in 5 seconds... (Press Ctrl+C to cancel)');
  await sleep(5000);
  console.log('');

  const startTime = new Date();

  try {
    // Scrape by quarters to allow for resume capability
    const quarters = [
      { start: `${year}-01-01`, end: `${year}-03-31`, name: 'Q1' },
      { start: `${year}-04-01`, end: `${year}-06-30`, name: 'Q2' },
      { start: `${year}-07-01`, end: `${year}-09-30`, name: 'Q3' },
      { start: `${year}-10-01`, end: `${year}-12-31`, name: 'Q4' }
    ];

    let totalInserted = 0;
    let totalErrors = 0;
    const contractsPerQuarter = Math.ceil(maxContracts / 4);

    for (const quarter of quarters) {
      console.log(`\n╔════════════════════════════════════════════╗`);
      console.log(`║  Scraping ${year} ${quarter.name}                      ║`);
      console.log(`║  ${quarter.start} to ${quarter.end}   ║`);
      console.log(`╚════════════════════════════════════════════╝\n`);

      const result = await scrapeDateRangeWithFullDetails(
        quarter.start,
        quarter.end,
        {
          smallBusiness: false,
          maxContracts: contractsPerQuarter
        }
      );

      totalInserted += result.inserted;
      totalErrors += result.errors;

      console.log(`\n✅ ${quarter.name} complete:`);
      console.log(`   - Inserted: ${result.inserted.toLocaleString()}`);
      console.log(`   - Errors: ${result.errors}`);
      console.log(`   - Running Total: ${totalInserted.toLocaleString()} contracts`);

      // Small delay between quarters
      await sleep(2000);
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║       FULL DETAILS LOAD COMPLETE!         ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`Total Inserted: ${totalInserted.toLocaleString()} contracts`);
    console.log(`Total Errors: ${totalErrors}`);
    if (hours > 0) {
      console.log(`Duration: ${hours}h ${minutes}m`);
    } else {
      console.log(`Duration: ${minutes} minutes`);
    }
    console.log('');

    // Get final stats
    const stats = await getScraperStats();
    console.log(`📊 Total contracts in database: ${stats.totalContracts.toLocaleString()}\n`);

    console.log('✨ Success! Your database now has rich, detailed contract data!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify data in Supabase (check fpds_contracts table)');
    console.log('2. Run aggregations: npx tsx src/scripts/fpds-aggregate.ts');
    console.log('3. Build UI components');
    console.log('4. Query the data! You have ~100 fields per contract now!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Full details load failed:', error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();

