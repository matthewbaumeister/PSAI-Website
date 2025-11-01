#!/usr/bin/env tsx
// ============================================
// FPDS Daily Scraper - Backwards from Today
// ============================================
// Scrapes one day at a time, starting from today going backwards
// Perfect for unstable APIs - completes before crashes!
//
// Usage:
//   npx tsx src/scripts/fpds-daily-scraper.ts
//   npx tsx src/scripts/fpds-daily-scraper.ts --start-date=2025-01-01
//   npx tsx src/scripts/fpds-daily-scraper.ts --days=30

import 'dotenv/config';
import { scrapeDateRangeWithFullDetails } from '../lib/fpds-scraper-full';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse command line arguments
const args = process.argv.slice(2);
const startDateArg = args.find(arg => arg.startsWith('--start-date='));
const daysArg = args.find(arg => arg.startsWith('--days='));

const stopDate = startDateArg ? new Date(startDateArg.split('=')[1]) : new Date('2025-01-01');
const maxDays = daysArg ? parseInt(daysArg.split('=')[1]) : 365;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function isDayComplete(date: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('fpds_scraper_log')
    .select('status')
    .eq('scrape_type', 'daily_scrape')
    .eq('date_range', date)
    .eq('status', 'completed')
    .single();

  return !error && data !== null;
}

async function markDayComplete(date: string, inserted: number, errors: number) {
  await supabase
    .from('fpds_scraper_log')
    .upsert({
      scrape_type: 'daily_scrape',
      date_range: date,
      records_inserted: inserted,
      records_errors: errors,
      status: 'completed',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'scrape_type,date_range'
    });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   FPDS Daily Scraper - Backwards Mode     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const today = new Date();
  let currentDate = new Date(today);
  let daysProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  let daysCompleted = 0;
  let daysSkipped = 0;

  console.log(`📅 Starting from: ${formatDate(today)}`);
  console.log(`📅 Going back to: ${formatDate(stopDate)}`);
  console.log(`📊 Max days: ${maxDays}`);
  console.log('');
  console.log('Strategy: Complete one day before API can crash!');
  console.log('');

  while (currentDate >= stopDate && daysProcessed < maxDays) {
    const dateStr = formatDate(currentDate);
    daysProcessed++;

    // Check if already complete
    const isComplete = await isDayComplete(dateStr);
    
    if (isComplete) {
      console.log(`⏭️  [Day ${daysProcessed}] ${dateStr} - Already completed, skipping`);
      daysSkipped++;
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║  Day ${daysProcessed}: ${dateStr}                    ║`);
    console.log(`╚════════════════════════════════════════════╝`);

    const startTime = Date.now();

    try {
      const result = await scrapeDateRangeWithFullDetails(
        dateStr,
        dateStr,
        { maxContracts: 10000 } // Limit per day (safety)
      );

      const duration = Math.floor((Date.now() - startTime) / 1000);

      totalInserted += result.totalInserted;
      totalErrors += result.totalErrors;
      daysCompleted++;

      // Mark day as complete
      await markDayComplete(dateStr, result.totalInserted, result.totalErrors);

      console.log(`\n✅ ${dateStr} Complete!`);
      console.log(`   - Contracts: ${result.totalInserted}`);
      console.log(`   - Errors: ${result.totalErrors}`);
      console.log(`   - Duration: ${duration}s`);
      console.log(`   - Quality: ${result.avgQualityScore?.toFixed(1) || 'N/A'}/100`);

    } catch (error) {
      console.error(`\n❌ ${dateStr} Failed:`, error);
      console.log(`   Skipping to previous day...`);
      // Don't mark as complete - will retry next run
    }

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);

    // Small delay between days
    await sleep(2000);
  }

  console.log('\n\n╔════════════════════════════════════════════╗');
  console.log('║          DAILY SCRAPE SUMMARY              ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`📊 Days Processed: ${daysProcessed}`);
  console.log(`✅ Days Completed: ${daysCompleted}`);
  console.log(`⏭️  Days Skipped: ${daysSkipped}`);
  console.log(`📈 Total Contracts: ${totalInserted.toLocaleString()}`);
  console.log(`⚠️  Total Errors: ${totalErrors}`);
  console.log('');

  if (daysProcessed < maxDays && currentDate >= stopDate) {
    console.log('🎯 Reached stop date! All days processed.');
  } else if (daysProcessed >= maxDays) {
    console.log(`🎯 Reached max days limit (${maxDays}).`);
    console.log(`💡 Run again to continue: npx tsx src/scripts/fpds-daily-scraper.ts`);
  }
  console.log('');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error('\n❌ Daily scraper failed:', error);
  process.exit(1);
});

