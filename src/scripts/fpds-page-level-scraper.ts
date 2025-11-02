#!/usr/bin/env node
/**
 * FPDS Page-Level Backwards Scraper
 * 
 * The ULTIMATE resilient scraper for unstable APIs!
 * 
 * Key Features:
 * - Processes ONE PAGE at a time (not whole days)
 * - Saves progress after EACH page
 * - Retries failed pages 3x with 30s cooldown
 * - Never loses progress (can resume from exact page)
 * - Works backwards: Today → Yesterday → ... → 2000
 * 
 * Usage:
 *   npx tsx src/scripts/fpds-page-level-scraper.ts
 *   npx tsx src/scripts/fpds-page-level-scraper.ts --start=2025-10-30 --end=2024-01-01
 */

import 'dotenv/config';
import { 
  searchContracts,
  getContractFullDetails,
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
// Page-Level Progress Tracking
// ============================================

interface PageProgress {
  date: string;
  page: number;
  status: 'completed' | 'failed';
  contracts_found: number;
  contracts_inserted: number;
  contracts_failed: number;
}

async function getLastCompletedPage(date: string): Promise<number> {
  // Check database for last completed page for this date
  const { data, error } = await supabase
    .from('fpds_page_progress')
    .select('page_number, status')
    .eq('date', date)
    .eq('status', 'completed')
    .order('page_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 0; // Start from page 1
  }

  return data.page_number;
}

async function markPageComplete(
  date: string,
  page: number,
  found: number,
  inserted: number,
  failed: number
): Promise<void> {
  const { error } = await supabase
    .from('fpds_page_progress')
    .upsert({
      date,
      page_number: page,
      status: 'completed',
      contracts_found: found,
      contracts_inserted: inserted,
      contracts_failed: failed,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'date,page_number'
    });

  if (error) {
    console.error(`[${date}:P${page}] ⚠️  Failed to save progress:`, error.message);
  }
}

async function markPageFailed(date: string, page: number, errorMsg: string): Promise<void> {
  const { error } = await supabase
    .from('fpds_page_progress')
    .upsert({
      date,
      page_number: page,
      status: 'failed',
      error_message: errorMsg.substring(0, 500),
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'date,page_number'
    });

  if (error) {
    console.error(`[${date}:P${page}] ⚠️  Failed to log failure:`, error.message);
  }
}

async function isDayComplete(date: string): Promise<boolean> {
  // Check if we've hit a page with < 100 results (indicates end of day)
  const { data } = await supabase
    .from('fpds_page_progress')
    .select('contracts_found')
    .eq('date', date)
    .eq('status', 'completed')
    .order('page_number', { ascending: false })
    .limit(1)
    .single();

  return data ? data.contracts_found < 100 : false;
}

// ============================================
// Page Scraping with Retry
// ============================================

async function scrapePage(
  date: string,
  pageNum: number
): Promise<{ success: boolean; found: number; inserted: number; failed: number }> {
  
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      if (attempt > 1) {
        console.log(`[${date}:P${pageNum}] 🔄 Retry attempt ${attempt}/${maxAttempts}`);
        console.log(`[${date}:P${pageNum}] ⏸️  Cooling down API for 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }

      // Step 1: Search for contracts on this page
      console.log(`[${date}:P${pageNum}] 🔍 Searching page ${pageNum}...`);
      
      const searchResult = await searchContracts({
        startDate: date,
        endDate: date,
        page: pageNum,
        limit: 100
      });

      const results = searchResult.results || [];
      
      if (results.length === 0) {
        console.log(`[${date}:P${pageNum}] ✅ No more contracts (end of day)`);
        return { success: true, found: 0, inserted: 0, failed: 0 };
      }

      // Extract contract IDs from result objects
      const contractIds = results.map((r: any) => r.generated_internal_id || r['Award ID']);
      
      console.log(`[${date}:P${pageNum}] Found ${contractIds.length} contracts`);

      // Step 2: Fetch full details for each contract
      const fullContracts: any[] = [];
      const successfulIds: string[] = [];
      let fetchErrors = 0;

      for (let i = 0; i < contractIds.length; i++) {
        try {
          const fullData = await getContractFullDetails(contractIds[i]);
          if (fullData) {
            fullContracts.push(fullData);
            successfulIds.push(contractIds[i]); // Track successful fetches
          } else {
            // Contract fetch returned null (failed)
            fetchErrors++;
            // Log the failure to database
            await supabase.from('fpds_failed_contracts').insert({
              contract_id: contractIds[i],
              error_message: 'Contract details fetch returned null',
              error_type: 'details_fetch_failed',
              date_range: date,
              page_number: pageNum,
              attempt_count: attempt
            });
          }
        } catch (err) {
          // Exception was thrown
          fetchErrors++;
          // Log individual contract failure
          await supabase.from('fpds_failed_contracts').insert({
            contract_id: contractIds[i],
            error_message: err instanceof Error ? err.message : 'Unknown error',
            error_type: 'details_fetch_failed',
            date_range: date,
            page_number: pageNum,
            attempt_count: attempt
          });
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`[${date}:P${pageNum}]   Fetched ${i + 1}/${contractIds.length} details...`);
        }
      }

      console.log(`[${date}:P${pageNum}] ✅ Fetched ${fullContracts.length}/${contractIds.length} details`);
      
      if (fetchErrors > 0) {
        console.log(`[${date}:P${pageNum}] ⚠️  Failed to fetch: ${fetchErrors} contracts (saved to retry log)`);
      }

      // Clean up failed_contracts table for successful fetches
      // This handles both retries within this run AND previous failed attempts from crashed runs
      if (successfulIds.length > 0) {
        const { error: deleteError, count: deletedCount } = await supabase
          .from('fpds_failed_contracts')
          .delete({ count: 'exact' })
          .in('contract_id', successfulIds)
          .eq('date_range', date)
          .eq('page_number', pageNum);
        
        if (!deleteError && deletedCount && deletedCount > 0) {
          console.log(`[${date}:P${pageNum}] 🧹 Cleaned ${deletedCount} resolved failures from retry log`);
        }
      }

      // Step 3: Normalize, validate, and insert
      if (fullContracts.length > 0) {
        const normalized = fullContracts.map(normalizeFullContract);
        const validated = validateContractBatch(normalized);
        
        console.log(`[${date}:P${pageNum}] 🔬 Quality: ${validated.stats.averageScore.toFixed(1)}/100`);
        
        const result = await batchInsertFullContracts(validated.cleaned);
        
        console.log(`[${date}:P${pageNum}] 💾 New: ${result.inserted} | Updated: ${result.updated} | DB Errors: ${result.errors}`);

        // Mark page as complete
        await markPageComplete(date, pageNum, contractIds.length, result.inserted, fetchErrors);

        return {
          success: true,
          found: contractIds.length,
          inserted: result.inserted,
          failed: fetchErrors
        };
      }

      // No contracts to insert
      await markPageComplete(date, pageNum, contractIds.length, 0, fetchErrors);
      return { success: true, found: contractIds.length, inserted: 0, failed: fetchErrors };

    } catch (error) {
      console.error(`[${date}:P${pageNum}] ❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt >= maxAttempts) {
        // Failed all attempts
        await markPageFailed(date, pageNum, error instanceof Error ? error.message : 'Unknown error');
        return { success: false, found: 0, inserted: 0, failed: 0 };
      }
      // Loop will retry
    }
  }

  // Should never reach here
  return { success: false, found: 0, inserted: 0, failed: 0 };
}

// ============================================
// Main Function
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const startArg = args.find(arg => arg.startsWith('--start='))?.split('=')[1];
  const endArg = args.find(arg => arg.startsWith('--end='))?.split('=')[1];

  const startDate = startArg || formatDate(new Date());
  const endDate = endArg || '2000-01-01';

  console.log(`
╔════════════════════════════════════════════╗
║   FPDS Page-Level Backwards Scraper       ║
╚════════════════════════════════════════════╝

📅 Date Range: ${startDate} → ${endDate} (backwards)
📄 Granularity: PAGE-LEVEL (most resilient!)

⏱️  Process per page:
   1️⃣  Search for 100 contracts
   2️⃣  Fetch full details for each
   3️⃣  Validate & clean data
   4️⃣  Insert into database
   5️⃣  SAVE progress immediately
   6️⃣  Move to next page

✨ Benefits:
   - Never loses progress
   - Retries failed pages only
   - Resumes from exact page on restart
   - Maximum data capture

Starting in 5 seconds...
`);

  await new Promise(resolve => setTimeout(resolve, 5000));

  let currentDate = startDate;
  let totalPages = 0;
  let totalContracts = 0;
  let totalFailed = 0;

  while (currentDate >= endDate) {
    console.log(`
╔════════════════════════════════════════════╗
║  📅 Processing: ${currentDate}              ║
╚════════════════════════════════════════════╝
`);

    // Check if day is already complete
    if (await isDayComplete(currentDate)) {
      console.log(`[${currentDate}] ✅ Already complete - skipping to previous day\n`);
      currentDate = getPreviousDay(currentDate);
      continue;
    }

    // Get last completed page for this date
    const lastPage = await getLastCompletedPage(currentDate);
    const startPage = lastPage + 1;

    if (lastPage > 0) {
      console.log(`[${currentDate}] 📍 Resuming from page ${startPage} (last completed: ${lastPage})`);
    }

    // Scrape pages until no more contracts
    let currentPage = startPage;
    let dayContracts = 0;
    let dayFailed = 0;
    let consecutiveEmptyPages = 0;

    while (true) {
      const result = await scrapePage(currentDate, currentPage);

      if (!result.success) {
        console.log(`[${currentDate}:P${currentPage}] ⚠️  Page failed after 3 attempts - moving to next page`);
        currentPage++;
        consecutiveEmptyPages++;
        
        // Stop if 3 consecutive failures
        if (consecutiveEmptyPages >= 3) {
          console.log(`[${currentDate}] ⚠️  3 consecutive failures - moving to previous day`);
          break;
        }
        continue;
      }

      if (result.found === 0) {
        // No more contracts for this day
        console.log(`[${currentDate}] ✅ Day complete - ${dayContracts} contracts total\n`);
        break;
      }

      totalPages++;
      dayContracts += result.inserted;
      dayFailed += result.failed;
      consecutiveEmptyPages = 0;

      // Brief pause between pages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      currentPage++;
    }

    totalContracts += dayContracts;
    totalFailed += dayFailed;

    console.log(`
📊 Running Totals:
   Pages Processed: ${totalPages}
   Total Contracts: ${totalContracts}
   Failed Details: ${totalFailed}
`);

    // Move to previous day
    currentDate = getPreviousDay(currentDate);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`
╔════════════════════════════════════════════╗
║  🎉 SCRAPING COMPLETE!                    ║
╚════════════════════════════════════════════╝

📊 Final Statistics:
   Date Range: ${startDate} → ${endDate}
   Pages Processed: ${totalPages}
   Contracts Inserted: ${totalContracts}
   Failed Details: ${totalFailed}

Done! ✅
`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

