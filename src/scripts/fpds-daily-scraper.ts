#!/usr/bin/env node
/**
 * FPDS Daily Scraper
 * 
 * Lightweight scraper designed for automated cron jobs.
 * Scrapes ONLY yesterday's contracts (or specified date).
 * 
 * Key Features:
 * - Scrapes one day at a time (default: yesterday)
 * - Page-by-page processing with progress tracking
 * - Retry logic for failed pages
 * - Returns statistics for email notifications
 * - Smart upsert to prevent duplicates
 * 
 * Usage:
 *   npx tsx src/scripts/fpds-daily-scraper.ts
 *   npx tsx src/scripts/fpds-daily-scraper.ts --date=2025-11-02
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
// Configuration
// ============================================

const CONTRACTS_PER_PAGE = 100;
const MAX_PAGES_PER_DAY = 50; // Safety limit
const MAX_RETRY_ATTEMPTS = 20; // Much more persistent for unstable API
const CONSECUTIVE_ERROR_THRESHOLD = 10; // Abort if 10+ consecutive failures

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

function log(message: string) {
  console.log(`[FPDS Daily] ${message}`);
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
    console.error(`[${date}:P${page}] Failed to save progress:`, error.message);
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
    console.error(`[${date}:P${page}] Failed to log failure:`, error.message);
  }
}

// ============================================
// Main Scraping Logic
// ============================================

async function scrapePage(
  date: string,
  page: number,
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
    // Step 1: Search for contracts on this page
    log(`[${date}:P${page}] Searching page ${page}...`);
    
    const searchResult = await searchContracts({
      startDate: date,
      endDate: date,
      page,
      limit: CONTRACTS_PER_PAGE
    });

    const results = searchResult.results || [];
    
    if (results.length === 0) {
      log(`[${date}:P${page}] No more contracts (end of day)`);
      return { success: true, found: 0, inserted: 0, updated: 0, failed: 0, hasMore: false };
    }

    // Extract contract IDs
    const contractIds = results.map((r: any) => r.generated_internal_id || r['Award ID']);
    log(`[${date}:P${page}] Found ${contractIds.length} contracts`);

    // Step 2: Fetch full details for each contract with error tracking
    const fullContracts: any[] = [];
    const successfulIds: string[] = [];
    let fetchErrors = 0;
    let consecutiveErrors = 0; // Track consecutive failures

    for (let i = 0; i < contractIds.length; i++) {
      try {
        const fullData = await getContractFullDetails(contractIds[i]);
        
        if (fullData) {
          fullContracts.push(fullData);
          successfulIds.push(contractIds[i]);
          consecutiveErrors = 0; // Reset on success
        } else {
          // Null response = failed fetch
          fetchErrors++;
          consecutiveErrors++;
          
          // Log the failure to database
          await supabase.from('fpds_failed_contracts').insert({
            contract_id: contractIds[i],
            error_message: 'Contract details fetch returned null',
            error_type: 'details_fetch_failed',
            date_range: date,
            page_number: page,
            attempt_count: attempt
          });

          // If 10+ consecutive errors, API is having issues - abort page and retry
          if (consecutiveErrors >= CONSECUTIVE_ERROR_THRESHOLD) {
            log(`[${date}:P${page}] ${consecutiveErrors} consecutive errors - API issue detected`);
            throw new Error(`API instability: ${consecutiveErrors} consecutive contract failures`);
          }
        }
      } catch (err) {
        fetchErrors++;
        consecutiveErrors++;
        
        // Check if it's our API instability detection
        if (err instanceof Error && err.message.includes('API instability')) {
          throw err; // Propagate to trigger page retry
        }
        
        // Log individual contract failure
        await supabase.from('fpds_failed_contracts').insert({
          contract_id: contractIds[i],
          error_message: err instanceof Error ? err.message : 'Unknown error',
          error_type: 'details_fetch_failed',
          date_range: date,
          page_number: page,
          attempt_count: attempt
        });

        // If 10+ consecutive errors, API is having issues
        if (consecutiveErrors >= CONSECUTIVE_ERROR_THRESHOLD) {
          log(`[${date}:P${page}] ${consecutiveErrors} consecutive errors - API issue detected`);
          throw new Error(`API instability: ${consecutiveErrors} consecutive contract failures`);
        }
      }

      // Progress indicator every 10 contracts
      if ((i + 1) % 10 === 0) {
        log(`[${date}:P${page}] Fetched ${i + 1}/${contractIds.length} details...`);
      }
    }

    log(`[${date}:P${page}] Fetched ${fullContracts.length}/${contractIds.length} details`);
    
    if (fetchErrors > 0) {
      log(`[${date}:P${page}] Failed to fetch: ${fetchErrors} contracts (saved to retry log)`);
    }

    // Clean up failed_contracts table for successful fetches
    if (successfulIds.length > 0) {
      const { error: deleteError, count: deletedCount } = await supabase
        .from('fpds_failed_contracts')
        .delete({ count: 'exact' })
        .in('contract_id', successfulIds)
        .eq('date_range', date)
        .eq('page_number', page);
      
      if (!deleteError && deletedCount && deletedCount > 0) {
        log(`[${date}:P${page}] Cleaned ${deletedCount} resolved failures from retry log`);
      }
    }

    // Step 3: Normalize, validate, and insert
    if (fullContracts.length > 0) {
      const normalized = fullContracts.map(normalizeFullContract);
      const validated = validateContractBatch(normalized);
      
      log(`[${date}:P${page}] Quality: ${validated.stats.averageScore.toFixed(1)}/100`);
      
      const result = await batchInsertFullContracts(validated.cleaned);
      log(`[${date}:P${page}] New: ${result.inserted} | Updated: ${result.updated} | DB Errors: ${result.errors}`);

      // Mark page as complete
      await markPageComplete(date, page, contractIds.length, result.inserted, fetchErrors);

      return {
        success: true,
        found: contractIds.length,
        inserted: result.inserted,
        updated: result.updated,
        failed: fetchErrors,
        hasMore: contractIds.length === CONTRACTS_PER_PAGE
      };
    }

    // No contracts to insert
    await markPageComplete(date, page, contractIds.length, 0, fetchErrors);
    return { 
      success: true, 
      found: contractIds.length, 
      inserted: 0, 
      updated: 0, 
      failed: fetchErrors, 
      hasMore: contractIds.length === CONTRACTS_PER_PAGE 
    };

  } catch (error) {
    log(`[${date}:P${page}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error; // Propagate for retry logic
  }
}

async function scrapeDate(date: string): Promise<{
  date: string;
  totalFound: number;
  totalInserted: number;
  totalUpdated: number;
  totalFailed: number;
  pagesProcessed: number;
}> {
  log(`Starting scrape for date: ${date}`);
  
  // Resume from last completed page
  const lastPage = await getLastCompletedPage(date);
  const startPage = lastPage + 1;
  
  if (lastPage > 0) {
    log(`Resuming from page ${startPage} (last completed: ${lastPage})`);
  }

  let currentPage = startPage;
  let totalFound = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let pagesProcessed = 0;

  // Process pages until no more results or hit safety limit
  while (currentPage <= MAX_PAGES_PER_DAY) {
    let attempt = 0;
    let success = false;
    let result;

    // Retry logic with exponential backoff
    while (attempt < MAX_RETRY_ATTEMPTS && !success) {
      attempt++;
      
      try {
        // Exponential backoff on retries: 30s, 60s, 120s, 240s, then cap at 5min
        if (attempt > 1) {
          const cooldown = Math.min(30000 * Math.pow(2, attempt - 2), 300000);
          const minutes = Math.floor(cooldown / 60000);
          const seconds = Math.floor((cooldown % 60000) / 1000);
          
          log(`[${date}:P${currentPage}] Retry attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
          log(`[${date}:P${currentPage}] API cooldown: ${minutes}m ${seconds}s...`);
          await new Promise(resolve => setTimeout(resolve, cooldown));
        }

        result = await scrapePage(date, currentPage, attempt);
        success = true;
      } catch (error: any) {
        log(`[${date}:P${currentPage}] Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= MAX_RETRY_ATTEMPTS) {
          // Failed all attempts
          await markPageFailed(date, currentPage, error.message);
          log(`[${date}:P${currentPage}] Failed after ${MAX_RETRY_ATTEMPTS} attempts. Stopping.`);
          throw new Error(`Failed to scrape page ${currentPage} after ${MAX_RETRY_ATTEMPTS} attempts`);
        }
        // Loop will retry
      }
    }

    if (!success) {
      log(`[${date}:P${currentPage}] Failed after ${MAX_RETRY_ATTEMPTS} attempts. Stopping.`);
      throw new Error(`Failed to scrape page ${currentPage} after ${MAX_RETRY_ATTEMPTS} attempts`);
    }

    // Update totals
    totalFound += result!.found;
    totalInserted += result!.inserted;
    totalUpdated += result!.updated;
    totalFailed += result!.failed;
    pagesProcessed++;

    // Check if there are more pages
    if (!result!.hasMore) {
      log(`[${date}] Reached end of results at page ${currentPage}`);
      break;
    }

    currentPage++;
  }

  log(`Completed scrape for ${date}:`);
  log(`  Pages: ${pagesProcessed}`);
  log(`  Found: ${totalFound}`);
  log(`  Inserted: ${totalInserted}`);
  log(`  Updated: ${totalUpdated}`);
  log(`  Failed: ${totalFailed}`);

  return {
    date,
    totalFound,
    totalInserted,
    totalUpdated,
    totalFailed,
    pagesProcessed
  };
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  // Parse date argument (default: yesterday)
  let date = getYesterday();
  
  for (const arg of args) {
    if (arg.startsWith('--date=')) {
      date = arg.split('=')[1];
    }
  }

  log(`====================================`);
  log(`FPDS Daily Scraper`);
  log(`====================================`);
  log(`Date: ${date}`);
  log(`====================================`);

  try {
    const result = await scrapeDate(date);
    
    log(`====================================`);
    log(`SUCCESS!`);
    log(`====================================`);
    log(JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error: any) {
    log(`====================================`);
    log(`FAILED: ${error.message}`);
    log(`====================================`);
    console.error(error);
    process.exit(1);
  }
}

// Export for use in cron endpoint
export { scrapeDate };

// Run if called directly
if (require.main === module) {
  main();
}

