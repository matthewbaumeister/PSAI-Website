#!/usr/bin/env ts-node
// ============================================
// FPDS Full Details - CUSTOM DATE RANGE Load
// ============================================
// Scrapes ALL contracts for a specific date range
// Perfect for recent months or custom periods!
//
// Run: npx tsx src/scripts/fpds-full-load-date-range.ts --start=2025-06-01 --end=2025-10-31
//
// Examples:
//   npx tsx src/scripts/fpds-full-load-date-range.ts --start=2025-06-01 --end=2025-10-31
//   npx tsx src/scripts/fpds-full-load-date-range.ts --start=2025-01-01 --end=2025-03-31
//   npx tsx src/scripts/fpds-full-load-date-range.ts --start=2024-10-01 --end=2025-10-31

import 'dotenv/config';
import { scrapeDateRangeWithFullDetails, getScraperStats } from '../lib/fpds-scraper-full';

// Parse command line arguments
const args = process.argv.slice(2);
const startArg = args.find(arg => arg.startsWith('--start='));
const endArg = args.find(arg => arg.startsWith('--end='));
const maxArg = args.find(arg => arg.startsWith('--max='));

if (!startArg || !endArg) {
  console.error('Error: --start and --end are required');
  console.log('Usage: npx tsx src/scripts/fpds-full-load-date-range.ts --start=2025-06-01 --end=2025-10-31 [--max=unlimited]');
  console.log('');
  console.log('Examples:');
  console.log('  Last 5 months:  --start=2025-06-01 --end=2025-10-31');
  console.log('  Q4 2024:        --start=2024-10-01 --end=2024-12-31');
  console.log('  Custom period:  --start=2024-06-01 --end=2025-10-31');
  process.exit(1);
}

const startDate = startArg.split('=')[1];
const endDate = endArg.split('=')[1];
const maxContracts = maxArg ? parseInt(maxArg.split('=')[1]) : 999999; // Effectively unlimited

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   FPDS Full Details - Date Range Load     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Start Date: ${startDate}`);
  console.log(`  End Date: ${endDate}`);
  console.log(`  Max Contracts: ${maxContracts === 999999 ? 'UNLIMITED' : maxContracts.toLocaleString()}`);
  console.log(`  Details per Contract: ~100 fields`);
  console.log('');

  // Calculate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.round(days / 30);

  console.log(`📅 Date Range Info:`);
  console.log(`   Duration: ${days} days (~${months} months)`);
  console.log('');

  // Estimate time
  const estimatedContracts = maxContracts === 999999 ? months * 15000 : maxContracts;
  const estimatedMinutes = Math.ceil((estimatedContracts * 0.5) / 60);
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const remainingMinutes = estimatedMinutes % 60;
  const estimatedDays = Math.floor(estimatedHours / 24);
  const remainingHours = estimatedHours % 24;

  console.log(`⏱️  Estimated Time:`);
  console.log(`   Expected Contracts: ~${estimatedContracts.toLocaleString()}`);
  if (estimatedDays > 0) {
    console.log(`   Duration: ${estimatedDays} days ${remainingHours} hours ${remainingMinutes} minutes`);
  } else if (estimatedHours > 0) {
    console.log(`   Duration: ${estimatedHours} hours ${remainingMinutes} minutes`);
  } else {
    console.log(`   Duration: ${estimatedMinutes} minutes`);
  }
  console.log('');

  // Warnings
  if (maxContracts === 999999) {
    console.warn('⚠️  WARNING: No max limit set - will scrape ALL contracts!');
    console.warn('⚠️  This could take multiple days depending on volume');
    console.warn('⚠️  Recommendation: Use tmux to keep it running');
    console.log('');
  }

  if (estimatedHours > 24) {
    console.warn(`⚠️  This will take ${estimatedDays > 0 ? estimatedDays + '+ days' : estimatedHours + '+ hours'}`);
    console.warn('⚠️  Make sure you have time and stable connection!');
    console.warn('⚠️  Consider using tmux: tmux new -s fpds-scraper');
    console.log('');
  }

  console.log('Starting in 10 seconds... (Press Ctrl+C to cancel)');
  await sleep(10000);
  console.log('');

  const startTime = new Date();

  try {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║  Scraping ${startDate} to ${endDate}   ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);

    const result = await scrapeDateRangeWithFullDetails(
      startDate,
      endDate,
      {
        smallBusiness: false,
        maxContracts: maxContracts
      }
    );

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const daysActual = Math.floor(hours / 24);
    const hoursRemaining = hours % 24;

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║       DATE RANGE SCRAPE COMPLETE!          ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`Total Inserted: ${result.inserted.toLocaleString()} contracts`);
    console.log(`Total Errors: ${result.errors}`);
    
    if (daysActual > 0) {
      console.log(`Duration: ${daysActual}d ${hoursRemaining}h ${minutes}m`);
    } else if (hours > 0) {
      console.log(`Duration: ${hours}h ${minutes}m`);
    } else {
      console.log(`Duration: ${minutes} minutes`);
    }
    console.log('');

    // Get final stats
    const stats = await getScraperStats();
    console.log(`📊 Total contracts in database: ${stats.totalContracts.toLocaleString()}\n`);

    console.log('✨ Success! Date range complete!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Check data quality: SELECT * FROM fpds_data_quality_summary;');
    console.log('2. Review contracts: SELECT COUNT(*), fiscal_year FROM fpds_contracts GROUP BY fiscal_year;');
    console.log('3. Start analyzing your data!');
    console.log('');

  } catch (error) {
    console.error(`\n❌ Date range scrape failed:`, error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();

