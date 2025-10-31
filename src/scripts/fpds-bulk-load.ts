#!/usr/bin/env ts-node
// ============================================
// FPDS Bulk Load
// ============================================
// Imports large datasets of federal contracts
// Run: npx ts-node src/scripts/fpds-bulk-load.ts [--year 2024] [--months 3]
//
// Examples:
//   npx ts-node src/scripts/fpds-bulk-load.ts
//   npx ts-node src/scripts/fpds-bulk-load.ts --year 2024
//   npx ts-node src/scripts/fpds-bulk-load.ts --year 2024 --months 6

import { scrapeDateRange, getScraperStats } from '../lib/fpds-scraper.js';

// Parse command line arguments
const args = process.argv.slice(2);
const yearArg = args.find(arg => arg.startsWith('--year='));
const monthsArg = args.find(arg => arg.startsWith('--months='));

const year = yearArg ? parseInt(yearArg.split('=')[1]) : 2024;
const months = monthsArg ? parseInt(monthsArg.split('=')[1]) : 12;

async function main() {
  console.log('============================================');
  console.log('FPDS Bulk Load');
  console.log('============================================\n');

  console.log(`Configuration:`);
  console.log(`  Year: ${year}`);
  console.log(`  Months: ${months} (${months === 12 ? 'full year' : 'partial year'})`);
  console.log(`  Small Business Filter: No (all contracts)`);
  console.log(`  Max Pages per month: 100 (10,000 contracts/month)`);
  console.log('');

  console.warn('⚠️  WARNING: This will import potentially 100,000+ contracts.');
  console.warn('⚠️  Estimated time: 2-4 hours depending on data volume.');
  console.warn('⚠️  Run this overnight or during off-peak hours.');
  console.log('');

  // Wait 5 seconds to allow user to cancel
  console.log('Starting in 5 seconds... (Press Ctrl+C to cancel)');
  await sleep(5000);
  console.log('');

  const startTime = new Date();
  let totalInserted = 0;
  let totalErrors = 0;

  try {
    // Scrape month by month to avoid timeouts
    for (let month = 1; month <= months; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const lastDay = new Date(year, month, 0).getDate();
      
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-${lastDay}`;

      console.log(`\n============================================`);
      console.log(`Scraping Month ${month}/${months}: ${monthStr}/${year}`);
      console.log(`Date range: ${startDate} to ${endDate}`);
      console.log(`============================================\n`);

      const result = await scrapeDateRange(startDate, endDate, {
        smallBusiness: false,
        maxPages: 100 // 10,000 contracts per month
      });

      totalInserted += result.inserted;
      totalErrors += result.errors;

      console.log(`\n✅ Month ${month} complete:`);
      console.log(`   - Inserted: ${result.inserted}`);
      console.log(`   - Errors: ${result.errors}`);
      console.log(`   - Total so far: ${totalInserted} contracts`);

      // Small delay between months
      await sleep(2000);
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    console.log('\n============================================');
    console.log('Bulk Load Complete!');
    console.log('============================================\n');
    console.log(`Total Inserted: ${totalInserted} contracts`);
    console.log(`Total Errors: ${totalErrors} contracts`);
    console.log(`Duration: ${durationMinutes} minutes\n`);

    // Get final stats
    const stats = await getScraperStats();
    console.log(`Total contracts in database: ${stats.totalContracts}\n`);

    console.log('Next steps:');
    console.log('1. Verify data in Supabase (check fpds_contracts table)');
    console.log('2. Run aggregations: npx ts-node src/scripts/fpds-aggregate.ts');
    console.log('3. Build UI components');
    console.log('');

  } catch (error) {
    console.error('\n❌ Bulk load failed:', error);
    console.error('Progress so far:');
    console.error(`  - Inserted: ${totalInserted} contracts`);
    console.error(`  - Errors: ${totalErrors} contracts`);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();

