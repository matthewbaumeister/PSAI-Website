#!/usr/bin/env node
/**
 * FPDS Backwards Daily Scraper with Auto-Retry
 * 
 * Scrapes one day at a time, working BACKWARDS from today to 2000
 * For each day: scrape → pause 30s → auto-retry failures → next day
 * 
 * This is the MOST RESILIENT approach for unstable APIs:
 * - Small daily batches complete before API crashes
 * - Immediate retry maximizes success rate
 * - 30-second pause prevents API overload
 * - Gradually fills entire database
 * 
 * Usage:
 *   npx tsx src/scripts/fpds-backwards-auto-retry.ts
 *   npx tsx src/scripts/fpds-backwards-auto-retry.ts --start=2025-11-01 --end=2000-01-01
 */

import 'dotenv/config';
import { 
  scrapeDateRangeWithFullDetails, 
  normalizeFullContract,
  batchInsertFullContracts 
} from '../lib/fpds-scraper-full';
import { validateContractBatch } from '../lib/fpds-data-cleaner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

// ============================================
// Main Function
// ============================================

async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  const startArg = args.find(arg => arg.startsWith('--start='))?.split('=')[1];
  const endArg = args.find(arg => arg.startsWith('--end='))?.split('=')[1];

  // Default: start from today, end at 2000-01-01
  const startDate = startArg || formatDate(new Date());
  const endDate = endArg || '2000-01-01';

  console.log(`
╔════════════════════════════════════════════╗
║   FPDS Backwards Scraper + Auto-Retry     ║
╚════════════════════════════════════════════╝

📅 Date Range: ${startDate} → ${endDate} (backwards)
⏱️  Process per day:
   1️⃣  Scrape all contracts for that day
   2️⃣  Pause 30 seconds (let API rest)
   3️⃣  Auto-retry any failures
   4️⃣  Move to previous day

🎯 Goal: Fill database with maximum success rate!

⚠️  This will run continuously until:
   - You press Ctrl+C
   - It reaches ${endDate}
   - A fatal error occurs

Starting in 5 seconds...
`);

  await new Promise(resolve => setTimeout(resolve, 5000));

  // ============================================
  // Main Loop - Process Each Day
  // ============================================

  let currentDate = startDate;
  let totalDaysProcessed = 0;
  let totalContractsFound = 0;
  let totalContractsInserted = 0;
  let totalContractsFailed = 0;

  while (currentDate >= endDate) {
    console.log(`
╔════════════════════════════════════════════╗
║  📅 Processing: ${currentDate}              ║
╚════════════════════════════════════════════╝
`);

    try {
      // ============================================
      // STEP 1: Scrape the Day
      // ============================================

      console.log(`[${currentDate}] Step 1/4: Scraping contracts...`);

      const scrapeResult = await scrapeDateRangeWithFullDetails(
        currentDate,
        currentDate,
        { maxContracts: 999999 }
      );

      console.log(`[${currentDate}] ✅ Initial scrape: ${scrapeResult.totalInserted}/${scrapeResult.totalProcessed} succeeded`);

      // ============================================
      // STEP 2: Pause 30 Seconds
      // ============================================

      if (scrapeResult.totalErrors > 0) {
        console.log(`[${currentDate}] Step 2/4: Pausing 30 seconds for API rest...`);
        
        for (let i = 30; i > 0; i -= 10) {
          console.log(`[${currentDate}]    ${i}s remaining...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        console.log(`[${currentDate}] ✅ Pause complete`);

        // ============================================
        // STEP 3: Auto-Retry Failures
        // ============================================

        console.log(`[${currentDate}] Step 3/4: Retrying ${scrapeResult.totalErrors} failures...`);

        const { data: failures } = await supabase
          .from('fpds_failed_contracts')
          .select('contract_id')
          .ilike('date_range', `%${currentDate}%`);

        if (failures && failures.length > 0) {
          const uniqueFailures = Array.from(new Set(failures.map(f => f.contract_id)));
          let retrySuccess = 0;
          let retryFailed = 0;

          for (let i = 0; i < uniqueFailures.length; i++) {
            const contractId = uniqueFailures[i];
            
            try {
              const detailsUrl = `https://api.usaspending.gov/api/v2/awards/${contractId}/`;
              const response = await fetch(detailsUrl);
              
              if (!response.ok) {
                retryFailed++;
                continue;
              }
              
              const fullData = await response.json();
              const normalized = normalizeFullContract(fullData);
              const validated = validateContractBatch([normalized]);
              const result = await batchInsertFullContracts(validated.cleaned);
              
              if (result.inserted > 0) {
                retrySuccess++;
                await supabase
                  .from('fpds_failed_contracts')
                  .delete()
                  .eq('contract_id', contractId);
              } else {
                retryFailed++;
              }
              
              await new Promise(resolve => setTimeout(resolve, 100));
              
            } catch (err) {
              retryFailed++;
            }
          }

          console.log(`[${currentDate}] ✅ Retry: +${retrySuccess} recovered, ${retryFailed} still failed`);

          // Update totals with retry results
          scrapeResult.totalInserted += retrySuccess;
          scrapeResult.totalErrors = retryFailed;
        }
      } else {
        console.log(`[${currentDate}] Step 2/4: No failures - skipping pause & retry`);
      }

      // ============================================
      // STEP 4: Update Running Totals
      // ============================================

      totalDaysProcessed++;
      totalContractsFound += scrapeResult.totalProcessed;
      totalContractsInserted += scrapeResult.totalInserted;
      totalContractsFailed += scrapeResult.totalErrors;

      const daySuccessRate = scrapeResult.totalProcessed > 0 
        ? ((scrapeResult.totalInserted / scrapeResult.totalProcessed) * 100).toFixed(1)
        : '0.0';

      console.log(`[${currentDate}] Step 4/4: Complete! Success rate: ${daySuccessRate}%`);

      // Show running totals every day
      const overallSuccessRate = totalContractsFound > 0
        ? ((totalContractsInserted / totalContractsFound) * 100).toFixed(1)
        : '0.0';

      console.log(`
📊 Running Totals:
   Days Processed: ${totalDaysProcessed}
   Total Contracts: ${totalContractsInserted}/${totalContractsFound} (${overallSuccessRate}% success)
   Remaining Failed: ${totalContractsFailed}
`);

      // ============================================
      // Move to Previous Day
      // ============================================

      currentDate = getPreviousDay(currentDate);
      console.log(`➡️  Moving to next day: ${currentDate}\n`);

      // Brief pause between days to be gentle on API
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`[${currentDate}] ❌ Error processing day:`, error);
      console.log(`[${currentDate}] Skipping to previous day...\n`);
      currentDate = getPreviousDay(currentDate);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // ============================================
  // Final Summary
  // ============================================

  console.log(`
╔════════════════════════════════════════════╗
║  🎉 SCRAPING COMPLETE!                    ║
╚════════════════════════════════════════════╝

📊 Final Statistics:
   Date Range: ${startDate} → ${endDate}
   Days Processed: ${totalDaysProcessed}
   
   Contracts:
   ✅ Successfully Inserted: ${totalContractsInserted}
   📋 Total Found: ${totalContractsFound}
   ❌ Still Failed: ${totalContractsFailed}
   
   Overall Success Rate: ${((totalContractsInserted / totalContractsFound) * 100).toFixed(1)}%

💡 Tip: Run this script again anytime to retry remaining failures!

Done! ✅
`);

  process.exit(0);
}

// ============================================
// Run Main with Error Handling
// ============================================

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

