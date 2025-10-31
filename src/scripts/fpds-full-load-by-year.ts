#!/usr/bin/env ts-node
// ============================================
// FPDS Full Details - SINGLE YEAR Load
// ============================================
// Scrapes ONE year at a time for manageable chunks
// Perfect for 1-24 hour time windows!
//
// Run: npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 [--max=50000]
//
// Examples:
//   npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024
//   npx tsx src/scripts/fpds-full-load-by-year.ts --year=2023 --max=50000
//   npx tsx src/scripts/fpds-full-load-by-year.ts --year=2020 --max=25000

import 'dotenv/config';
import { scrapeDateRangeWithFullDetails, getScraperStats } from '../lib/fpds-scraper-full';

// Parse command line arguments
const args = process.argv.slice(2);
const yearArg = args.find(arg => arg.startsWith('--year='));
const maxArg = args.find(arg => arg.startsWith('--max='));

if (!yearArg) {
  console.error('Error: --year is required');
  console.log('Usage: npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 [--max=50000]');
  process.exit(1);
}

const year = parseInt(yearArg.split('=')[1]);
const maxContracts = maxArg ? parseInt(maxArg.split('=')[1]) : 50000;

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log(`║     FPDS Full Details - Year ${year}        ║`);
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Year: ${year}`);
  console.log(`  Max Contracts: ${maxContracts.toLocaleString()}`);
  console.log(`  Details per Contract: ~100 fields`);
  console.log('');

  // Calculate estimates
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

  // Time limit warning
  if (estimatedHours > 24) {
    console.warn(`⚠️  WARNING: This will take > 24 hours!`);
    console.warn(`⚠️  Reduce --max to stay under 24 hours`);
    console.warn(`⚠️  Recommended: --max=100000 for 24 hour window`);
    console.log('');
  } else if (estimatedHours > 12) {
    console.warn(`⚠️  This will take ${estimatedHours}+ hours`);
    console.warn(`⚠️  Make sure you have time for this!`);
    console.log('');
  }

  console.log('Starting in 5 seconds... (Press Ctrl+C to cancel)');
  await sleep(5000);
  console.log('');

  const startTime = new Date();

  try {
    // Scrape by quarters for better resume capability
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
      console.log(`║  ${year} ${quarter.name} - ${quarter.start} to ${quarter.end}   ║`);
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

      console.log(`\n✅ ${year} ${quarter.name} complete:`);
      console.log(`   - Inserted: ${result.inserted.toLocaleString()}`);
      console.log(`   - Errors: ${result.errors}`);
      console.log(`   - Year Total: ${totalInserted.toLocaleString()} contracts`);

      // Small delay between quarters
      await sleep(2000);
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    console.log('\n╔════════════════════════════════════════════╗');
    console.log(`║        YEAR ${year} COMPLETE!                  ║`);
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

    console.log('✨ Success! Year complete!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log(`1. Run next year: npx tsx src/scripts/fpds-full-load-by-year.ts --year=${year - 1}`);
    console.log('2. Check data quality: SELECT * FROM fpds_data_quality_summary;');
    console.log('3. Continue with more years as time allows!');
    console.log('');

  } catch (error) {
    console.error(`\n❌ Year ${year} load failed:`, error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();

