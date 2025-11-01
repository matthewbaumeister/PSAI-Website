#!/usr/bin/env ts-node
// ============================================
// FPDS Full Details - MULTI-YEAR Bulk Load
// ============================================
// Imports federal contracts with FULL details across multiple years
// This is the BIG ONE!
//
// Run: npx tsx src/scripts/fpds-full-load-multi-year.ts [--start=2020] [--end=2024] [--max=10000]
//
// Examples:
//   npx tsx src/scripts/fpds-full-load-multi-year.ts --start=2020 --end=2024
//   npx tsx src/scripts/fpds-full-load-multi-year.ts --start=2010 --end=2024 --max=50000
//   npx tsx src/scripts/fpds-full-load-multi-year.ts --start=2000 --end=2024

import 'dotenv/config';
import { scrapeDateRangeWithFullDetails, getScraperStats } from '../lib/fpds-scraper-full';

// Parse command line arguments
const args = process.argv.slice(2);
const startYearArg = args.find(arg => arg.startsWith('--start='));
const endYearArg = args.find(arg => arg.startsWith('--end='));
const maxArg = args.find(arg => arg.startsWith('--max='));

const currentYear = new Date().getFullYear();
const startYear = startYearArg ? parseInt(startYearArg.split('=')[1]) : 2020;
const endYear = endYearArg ? parseInt(endYearArg.split('=')[1]) : currentYear;
const maxPerYear = maxArg ? parseInt(maxArg.split('=')[1]) : 50000;

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   FPDS MULTI-YEAR Full Details Load       ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Year Range: ${startYear} - ${endYear}`);
  console.log(`  Total Years: ${endYear - startYear + 1}`);
  console.log(`  Max Contracts per Year: ${maxPerYear.toLocaleString()}`);
  console.log(`  Details per Contract: ~100 fields`);
  console.log('');

  // Calculate estimates
  const totalYears = endYear - startYear + 1;
  const estimatedTotalContracts = totalYears * maxPerYear;
  const estimatedMinutes = Math.ceil((estimatedTotalContracts * 0.5) / 60); // ~0.5 sec per contract
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const remainingMinutes = estimatedMinutes % 60;
  const estimatedDays = Math.floor(estimatedHours / 24);
  const remainingHours = estimatedHours % 24;

  console.log(`📊 Estimated Totals:`);
  console.log(`   Total Contracts: ~${estimatedTotalContracts.toLocaleString()}`);
  console.log('');
  console.log(`⏱️  Estimated Time:`);
  if (estimatedDays > 0) {
    console.log(`   ${estimatedDays} days ${remainingHours} hours ${remainingMinutes} minutes`);
  } else if (estimatedHours > 0) {
    console.log(`   ${estimatedHours} hours ${remainingMinutes} minutes`);
  } else {
    console.log(`   ${estimatedMinutes} minutes`);
  }
  console.log('');

  console.warn('⚠️  This is a MAJOR data collection operation!');
  console.warn('⚠️  Recommendation: Run in tmux/screen session');
  console.warn('⚠️  The scraper is resumable if interrupted');
  console.log('');

  console.log('Starting in 10 seconds... (Press Ctrl+C to cancel)');
  await sleep(10000);
  console.log('');

  const overallStartTime = new Date();
  let grandTotalInserted = 0;
  let grandTotalErrors = 0;
  const yearResults: Array<{ year: number; inserted: number; errors: number; duration: string }> = [];

  // Process each year
  for (let year = startYear; year <= endYear; year++) {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log(`║        SCRAPING YEAR ${year}                 ║`);
    console.log('╚════════════════════════════════════════════╝\n');

    const yearStartTime = new Date();

    try {
      // Scrape by quarters for better resume capability
      const quarters = [
        { start: `${year}-01-01`, end: `${year}-03-31`, name: 'Q1' },
        { start: `${year}-04-01`, end: `${year}-06-30`, name: 'Q2' },
        { start: `${year}-07-01`, end: `${year}-09-30`, name: 'Q3' },
        { start: `${year}-10-01`, end: `${year}-12-31`, name: 'Q4' }
      ];

      let yearInserted = 0;
      let yearErrors = 0;
      const contractsPerQuarter = Math.ceil(maxPerYear / 4);

      for (const quarter of quarters) {
        console.log(`\n═══════════════════════════════════════════`);
        console.log(`  ${year} ${quarter.name} - ${quarter.start} to ${quarter.end}`);
        console.log(`═══════════════════════════════════════════\n`);

        const result = await scrapeDateRangeWithFullDetails(
          quarter.start,
          quarter.end,
          {
            smallBusiness: false,
            maxContracts: contractsPerQuarter
          }
        );

        yearInserted += result.totalInserted;
        yearErrors += result.totalErrors;

        console.log(`\n✅ ${year} ${quarter.name} complete:`);
        console.log(`   - Inserted: ${result.totalInserted.toLocaleString()}`);
        console.log(`   - Errors: ${result.totalErrors}`);
        console.log(`   - Year Total: ${yearInserted.toLocaleString()} contracts`);

        // Small delay between quarters
        await sleep(2000);
      }

      const yearEndTime = new Date();
      const yearDurationMinutes = Math.floor((yearEndTime.getTime() - yearStartTime.getTime()) / 60000);
      const yearHours = Math.floor(yearDurationMinutes / 60);
      const yearMinutes = yearDurationMinutes % 60;
      const yearDuration = yearHours > 0 ? `${yearHours}h ${yearMinutes}m` : `${yearMinutes}m`;

      grandTotalInserted += yearInserted;
      grandTotalErrors += yearErrors;

      yearResults.push({
        year,
        inserted: yearInserted,
        errors: yearErrors,
        duration: yearDuration
      });

      console.log(`\n╔════════════════════════════════════════════╗`);
      console.log(`║       YEAR ${year} COMPLETE!                  ║`);
      console.log(`╚════════════════════════════════════════════╝`);
      console.log(`  Inserted: ${yearInserted.toLocaleString()}`);
      console.log(`  Errors: ${yearErrors}`);
      console.log(`  Duration: ${yearDuration}`);
      console.log(`  Running Total: ${grandTotalInserted.toLocaleString()} contracts\n`);

    } catch (error) {
      console.error(`\n❌ Error scraping year ${year}:`, error);
      console.log(`Continuing to next year...\n`);
    }

    // Delay between years
    await sleep(5000);
  }

  const overallEndTime = new Date();
  const totalDurationMinutes = Math.floor((overallEndTime.getTime() - overallStartTime.getTime()) / 60000);
  const totalHours = Math.floor(totalDurationMinutes / 60);
  const totalMinutes = totalDurationMinutes % 60;
  const totalDays = Math.floor(totalHours / 24);
  const remainingHrs = totalHours % 24;

  console.log('\n\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     🎉 MULTI-YEAR LOAD COMPLETE! 🎉       ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('📊 SUMMARY BY YEAR:');
  console.log('═══════════════════════════════════════════\n');
  yearResults.forEach(yr => {
    console.log(`  ${yr.year}: ${yr.inserted.toLocaleString().padStart(10)} contracts (${yr.duration.padStart(8)}) - ${yr.errors} errors`);
  });

  console.log('\n═══════════════════════════════════════════\n');
  console.log(`📈 GRAND TOTALS:`);
  console.log(`   Years Scraped: ${totalYears}`);
  console.log(`   Total Contracts: ${grandTotalInserted.toLocaleString()}`);
  console.log(`   Total Errors: ${grandTotalErrors}`);
  
  if (totalDays > 0) {
    console.log(`   Total Duration: ${totalDays}d ${remainingHrs}h ${totalMinutes}m`);
  } else if (totalHours > 0) {
    console.log(`   Total Duration: ${totalHours}h ${totalMinutes}m`);
  } else {
    console.log(`   Total Duration: ${totalMinutes} minutes`);
  }
  console.log('');

  // Get final database stats
  const stats = await getScraperStats();
  console.log(`💾 Total contracts in database: ${stats.totalContracts.toLocaleString()}`);
  console.log('');

  console.log('✨ Success! You now have a comprehensive multi-year dataset!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Check data quality: SELECT * FROM fpds_data_quality_summary;');
  console.log('2. Run aggregations: npx tsx src/scripts/fpds-aggregate.ts');
  console.log('3. Build UI components');
  console.log('4. Analyze trends across years!');
  console.log('');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error('\n❌ Multi-year load failed:', error);
  process.exit(1);
});

