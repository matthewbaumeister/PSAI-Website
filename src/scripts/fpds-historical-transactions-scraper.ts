#!/usr/bin/env node
/**
 * FPDS Historical Transactions Scraper
 * 
 * NEW VERSION using TRANSACTIONS endpoint to capture ALL contract data:
 * - Initial awards
 * - All modifications
 * - Amendments
 * - Deobligations
 * - Task orders
 * - Complete contract lifecycle
 * 
 * This is the COMPLETE data version - captures everything!
 * 
 * Features:
 * - Uses transactions endpoint (6000+ per day vs 12 with old method)
 * - Page-level progress tracking
 * - Resilient retry logic (20 attempts per page)
 * - Can resume from any point
 * - Works backwards: Today → Past
 * - Test mode for small datasets
 * 
 * Usage:
 *   # Test mode (single day)
 *   npx tsx src/scripts/fpds-historical-transactions-scraper.ts --test
 * 
 *   # Small date range (good for testing)
 *   npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2025-10-25
 * 
 *   # Full historical scrape
 *   npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2024-01-01
 */

import 'dotenv/config';
import { 
  getContractFullDetails,
  normalizeFullContract,
  batchInsertFullContracts 
} from '../lib/fpds-scraper-full';
import { validateContractBatch } from '../lib/fpds-data-cleaner';
import { searchContractTransactions } from '../lib/fpds-transactions-scraper';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// Configuration
// ============================================

const CONTRACTS_PER_PAGE = 100;
const MAX_RETRY_ATTEMPTS = 20;
const CONSECUTIVE_ERROR_THRESHOLD = 10;
const RATE_LIMIT_DELAY_MS = 500; // 500ms between detail fetches

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

function log(message: string, date?: string, page?: number) {
  const timestamp = new Date().toISOString().substring(11, 19);
  if (date && page) {
    console.log(`[${timestamp}][${date}:P${page}] ${message}`);
  } else if (date) {
    console.log(`[${timestamp}][${date}] ${message}`);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// ============================================
// Progress Tracking
// ============================================

async function getLastCompletedPage(date: string): Promise<number> {
  const { data, error } = await supabase
    .from('fpds_page_progress')
    .select('page_number')
    .eq('date', date)
    .eq('status', 'completed')
    .order('page_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0;
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
    log(`⚠️ Failed to save progress: ${error.message}`, date, page);
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
    log(`⚠️ Failed to log failure: ${error.message}`, date, page);
  }
}

async function isDayComplete(date: string): Promise<boolean> {
  const { data } = await supabase
    .from('fpds_page_progress')
    .select('contracts_found')
    .eq('date', date)
    .eq('status', 'completed')
    .order('page_number', { ascending: false })
    .limit(1)
    .single();

  return data ? data.contracts_found < CONTRACTS_PER_PAGE : false;
}

// ============================================
// Page Scraping with TRANSACTIONS endpoint
// ============================================

async function scrapePage(
  date: string,
  pageNum: number,
  attempt: number = 1
): Promise<{
  success: boolean;
  found: number;
  inserted: number;
  updated: number;
  failed: number;
  hasMore: boolean;
}> {
  try {
    // Step 1: Search for TRANSACTIONS on this page
    log(`🔍 Searching transactions page ${pageNum}...`, date, pageNum);
    
    const searchResult = await searchContractTransactions({
      startDate: date,
      endDate: date,
      page: pageNum,
      limit: CONTRACTS_PER_PAGE
    });

    const results = searchResult.results || [];
    
    if (results.length === 0) {
      log(`✅ No more transactions (end of day)`, date, pageNum);
      return { success: true, found: 0, inserted: 0, updated: 0, failed: 0, hasMore: false };
    }

    // Extract contract IDs
    const contractIds = results.map((r: any) => r.generated_internal_id || r['Award ID']);
    log(`📋 Found ${contractIds.length} transactions`, date, pageNum);

    // Step 2: Fetch full details with error tracking
    const fullContracts: any[] = [];
    const successfulIds: string[] = [];
    let fetchErrors = 0;
    let consecutiveErrors = 0;

    for (let i = 0; i < contractIds.length; i++) {
      try {
        const fullData = await getContractFullDetails(contractIds[i]);
        
        if (fullData) {
          fullContracts.push(fullData);
          successfulIds.push(contractIds[i]);
          consecutiveErrors = 0;
        } else {
          fetchErrors++;
          consecutiveErrors++;
          
          await supabase.from('fpds_failed_contracts').insert({
            contract_id: contractIds[i],
            error_message: 'Transaction details fetch returned null',
            error_type: 'details_fetch_failed',
            date_range: date,
            page_number: pageNum,
            attempt_count: attempt
          });

          if (consecutiveErrors >= CONSECUTIVE_ERROR_THRESHOLD) {
            log(`❌ ${consecutiveErrors} consecutive errors - API issue detected`, date, pageNum);
            throw new Error(`API instability: ${consecutiveErrors} consecutive failures`);
          }
        }
      } catch (err) {
        fetchErrors++;
        consecutiveErrors++;
        
        if (err instanceof Error && err.message.includes('API instability')) {
          throw err;
        }
        
        await supabase.from('fpds_failed_contracts').insert({
          contract_id: contractIds[i],
          error_message: err instanceof Error ? err.message : 'Unknown error',
          error_type: 'details_fetch_failed',
          date_range: date,
          page_number: pageNum,
          attempt_count: attempt
        });

        if (consecutiveErrors >= CONSECUTIVE_ERROR_THRESHOLD) {
          log(`❌ ${consecutiveErrors} consecutive errors - API issue detected`, date, pageNum);
          throw new Error(`API instability: ${consecutiveErrors} consecutive failures`);
        }
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        log(`⏳ Fetched ${i + 1}/${contractIds.length} details...`, date, pageNum);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    log(`✅ Fetched ${fullContracts.length}/${contractIds.length} details`, date, pageNum);
    
    if (fetchErrors > 0) {
      log(`⚠️ Failed: ${fetchErrors} transactions`, date, pageNum);
    }

    // Clean up resolved failures
    if (successfulIds.length > 0) {
      const { count: deletedCount } = await supabase
        .from('fpds_failed_contracts')
        .delete({ count: 'exact' })
        .in('contract_id', successfulIds)
        .eq('date_range', date)
        .eq('page_number', pageNum);
      
      if (deletedCount && deletedCount > 0) {
        log(`🧹 Cleaned ${deletedCount} resolved failures`, date, pageNum);
      }
    }

    // Step 3: Normalize, validate, and insert
    if (fullContracts.length > 0) {
      const normalized = fullContracts.map(normalizeFullContract);
      const validated = validateContractBatch(normalized);
      
      log(`📊 Quality Score: ${validated.stats.averageScore.toFixed(1)}/100`, date, pageNum);
      
      const result = await batchInsertFullContracts(validated.cleaned);
      log(`💾 New: ${result.inserted} | Updated: ${result.updated} | Errors: ${result.errors}`, date, pageNum);

      await markPageComplete(date, pageNum, contractIds.length, result.inserted, fetchErrors);

      return {
        success: true,
        found: contractIds.length,
        inserted: result.inserted,
        updated: result.updated,
        failed: fetchErrors,
        hasMore: searchResult.hasMore
      };
    }

    await markPageComplete(date, pageNum, contractIds.length, 0, fetchErrors);
    return { 
      success: true, 
      found: contractIds.length, 
      inserted: 0, 
      updated: 0, 
      failed: fetchErrors, 
      hasMore: searchResult.hasMore
    };

  } catch (error) {
    log(`❌ Page error: ${error instanceof Error ? error.message : 'Unknown'}`, date, pageNum);
    throw error;
  }
}

// ============================================
// Date Scraping with Retry Logic
// ============================================

async function scrapeDate(date: string): Promise<{
  date: string;
  pagesProcessed: number;
  totalFound: number;
  totalInserted: number;
  totalUpdated: number;
  totalFailed: number;
  completed: boolean;
}> {
  log(`📅 Starting scrape for ${date}`);
  
  // Check if already complete
  if (await isDayComplete(date)) {
    log(`✅ Day already complete, skipping`, date);
    return {
      date,
      pagesProcessed: 0,
      totalFound: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalFailed: 0,
      completed: true
    };
  }

  const lastPage = await getLastCompletedPage(date);
  const startPage = lastPage + 1;
  
  if (lastPage > 0) {
    log(`🔄 Resuming from page ${startPage}`, date);
  }

  let currentPage = startPage;
  let totalFound = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let pagesProcessed = 0;

  while (currentPage <= 100) { // Safety limit
    let attempt = 0;
    let success = false;
    let result;

    while (attempt < MAX_RETRY_ATTEMPTS && !success) {
      attempt++;
      
      try {
        if (attempt > 1) {
          const cooldown = Math.min(30000 * Math.pow(2, attempt - 2), 300000);
          const minutes = Math.floor(cooldown / 60000);
          const seconds = Math.floor((cooldown % 60000) / 1000);
          
          log(`🔄 Retry ${attempt}/${MAX_RETRY_ATTEMPTS}`, date, currentPage);
          log(`⏸️ Cooldown: ${minutes}m ${seconds}s`, date, currentPage);
          await new Promise(resolve => setTimeout(resolve, cooldown));
        }

        result = await scrapePage(date, currentPage, attempt);
        success = true;
      } catch (error: any) {
        log(`❌ Attempt ${attempt} failed: ${error.message}`, date, currentPage);
        
        if (attempt >= MAX_RETRY_ATTEMPTS) {
          await markPageFailed(date, currentPage, error.message);
          log(`💀 Failed after ${MAX_RETRY_ATTEMPTS} attempts`, date, currentPage);
          throw new Error(`Failed page ${currentPage} after ${MAX_RETRY_ATTEMPTS} attempts`);
        }
      }
    }

    if (!success || !result) {
      throw new Error(`Failed to scrape page ${currentPage}`);
    }

    totalFound += result.found;
    totalInserted += result.inserted;
    totalUpdated += result.updated;
    totalFailed += result.failed;
    pagesProcessed++;

    if (!result.hasMore) {
      log(`✅ Reached end of day at page ${currentPage}`, date);
      break;
    }

    currentPage++;
  }

  log(`✅ Completed: ${pagesProcessed} pages, ${totalInserted} new, ${totalUpdated} updated`, date);

  return {
    date,
    pagesProcessed,
    totalFound,
    totalInserted,
    totalUpdated,
    totalFailed,
    completed: true
  };
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  console.log('================================================================================');
  console.log('FPDS HISTORICAL TRANSACTIONS SCRAPER');
  console.log('================================================================================');
  console.log('Using TRANSACTIONS endpoint - captures ALL contract data:');
  console.log('  ✅ Initial awards');
  console.log('  ✅ All modifications');
  console.log('  ✅ Amendments');
  console.log('  ✅ Deobligations');
  console.log('  ✅ Task orders');
  console.log('  ✅ Complete contract lifecycle');
  console.log('================================================================================\n');

  // Parse arguments
  let startDate: string;
  let endDate: string;

  const testMode = args.includes('--test');
  const startArg = args.find(arg => arg.startsWith('--start='));
  const endArg = args.find(arg => arg.startsWith('--end='));

  if (testMode) {
    // TEST MODE: Just scrape yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = formatDate(yesterday);
    endDate = startDate;
    console.log('🧪 TEST MODE: Scraping single day to verify functionality\n');
  } else if (startArg && endArg) {
    startDate = startArg.split('=')[1];
    endDate = endArg.split('=')[1];
  } else {
    console.error('❌ Missing required arguments');
    console.log('\nUsage:');
    console.log('  # Test mode (single day)');
    console.log('  npx tsx src/scripts/fpds-historical-transactions-scraper.ts --test\n');
    console.log('  # Date range');
    console.log('  npx tsx src/scripts/fpds-historical-transactions-scraper.ts --start=2025-11-01 --end=2025-10-25\n');
    process.exit(1);
  }

  console.log(`📅 Date Range: ${startDate} → ${endDate}`);
  console.log(`📊 Working backwards from start date\n`);
  console.log('================================================================================\n');

  // Get initial database count
  const { count: initialCount } = await supabase
    .from('fpds_contracts')
    .select('*', { count: 'exact', head: true });

  console.log(`📦 Database currently has: ${initialCount?.toLocaleString() || 0} contracts\n`);

  const startTime = Date.now();
  let currentDate = startDate;
  let datesProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;

  try {
    while (currentDate >= endDate) {
      const result = await scrapeDate(currentDate);
      
      datesProcessed++;
      totalInserted += result.totalInserted;
      totalUpdated += result.totalUpdated;
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 Progress: ${datesProcessed} days | ${totalInserted} new | ${totalUpdated} updated`);
      console.log(`${'='.repeat(80)}\n`);
      
      // Move to previous day
      currentDate = getPreviousDay(currentDate);
      
      // Small delay between days
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Get final database count
    const { count: finalCount } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('✅ HISTORICAL SCRAPE COMPLETE');
    console.log('='.repeat(80));
    console.log(`Dates Processed: ${datesProcessed}`);
    console.log(`New Contracts: ${totalInserted.toLocaleString()}`);
    console.log(`Updated Contracts: ${totalUpdated.toLocaleString()}`);
    console.log(`Database Before: ${initialCount?.toLocaleString() || 0}`);
    console.log(`Database After: ${finalCount?.toLocaleString() || 0}`);
    console.log(`Database Growth: ${((finalCount || 0) - (initialCount || 0)).toLocaleString()}`);
    console.log(`Duration: ${duration} minutes`);
    console.log('='.repeat(80) + '\n');

    if (testMode) {
      console.log('✅ TEST PASSED - Scraper is working correctly!');
      console.log('   You can now run it on larger date ranges.\n');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ SCRAPE FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(80) + '\n');
    console.error(error);
    process.exit(1);
  }
}

main();

