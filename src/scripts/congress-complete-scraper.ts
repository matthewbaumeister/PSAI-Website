#!/usr/bin/env node
/**
 * ============================================
 * COMPLETE CONGRESS.GOV SCRAPER
 * ============================================
 * 
 * Scrapes ALL bills from Congress.gov for specified Congresses.
 * Handles pagination, API failures, rate limiting, and resume capability.
 * 
 * Features:
 * - Fetches ALL bills (not just 250)
 * - API resilience with exponential backoff
 * - Progress tracking & state persistence
 * - Resume from interruption
 * - Rate limiting (4000 req/hour safe limit)
 * - Detailed logging
 * 
 * Usage:
 *   # Scrape current Congress (119)
 *   npx tsx src/scripts/congress-complete-scraper.ts
 * 
 *   # Scrape specific Congress
 *   npx tsx src/scripts/congress-complete-scraper.ts --congress=118
 * 
 *   # Scrape multiple Congresses
 *   npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119
 * 
 *   # Scrape ALL Congresses (1-current)
 *   npx tsx src/scripts/congress-complete-scraper.ts --all
 * 
 *   # Resume interrupted scrape
 *   npx tsx src/scripts/congress-complete-scraper.ts --resume
 * 
 * ============================================
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  fetchBillWithDetails,
  normalizeBill,
  saveBill,
  delay,
  getCurrentCongress
} from '../lib/congress-gov-scraper';
import axios from 'axios';

// ============================================
// Configuration
// ============================================

const CONGRESS_GOV_API_KEY = process.env.CONGRESS_GOV_API_KEY;
const CONGRESS_GOV_BASE_URL = 'https://api.congress.gov/v3';

// Rate limiting (stay well under 5000/hour limit)
// Official limit: 5000/hour | Our setting: 4500/hour (90% safety buffer)
const REQUESTS_PER_HOUR = 4500;
const DELAY_BETWEEN_REQUESTS = Math.ceil((3600 * 1000) / REQUESTS_PER_HOUR); // ~800ms

// Pagination settings
const BILLS_PER_PAGE = 250; // Max allowed by API

// Retry settings
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const RETRY_BACKOFF_MULTIPLIER = 2;

// State file for resume capability
const STATE_FILE = path.join(process.cwd(), '.congress-scraper-state.json');

// ============================================
// Types
// ============================================

interface ScraperState {
  currentCongress: number;
  currentOffset: number;
  totalBillsProcessed: number;
  successCount: number;
  failureCount: number;
  startTime: string;
  lastSaveTime: string;
  completedCongresses: number[];
  errors: Array<{
    congress: number;
    bill: string;
    error: string;
    timestamp: string;
  }>;
}

interface CongressStats {
  congress: number;
  totalBills: number;
  processedBills: number;
  successCount: number;
  failureCount: number;
  startTime: Date;
  endTime?: Date;
  duration?: string;
}

// ============================================
// State Management
// ============================================

function loadState(): ScraperState | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return null;
}

function saveState(state: ScraperState): void {
  try {
    state.lastSaveTime = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

function initializeState(congress: number): ScraperState {
  return {
    currentCongress: congress,
    currentOffset: 0,
    totalBillsProcessed: 0,
    successCount: 0,
    failureCount: 0,
    startTime: new Date().toISOString(),
    lastSaveTime: new Date().toISOString(),
    completedCongresses: [],
    errors: []
  };
}

function clearState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

// ============================================
// API Helpers with Retry Logic
// ============================================

async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  context: string,
  retryCount = 0
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(`${context} failed after ${MAX_RETRIES} retries: ${error.message}`);
    }

    const retryDelay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF_MULTIPLIER, retryCount);
    console.log(`  ⚠️  ${context} failed (attempt ${retryCount + 1}/${MAX_RETRIES}), retrying in ${retryDelay}ms...`);
    console.log(`      Error: ${error.message}`);
    
    await delay(retryDelay);
    return apiCallWithRetry(apiCall, context, retryCount + 1);
  }
}

async function fetchBillsList(congress: number, offset: number = 0): Promise<any> {
  return apiCallWithRetry(async () => {
    const response = await axios.get(`${CONGRESS_GOV_BASE_URL}/bill/${congress}`, {
      params: {
        api_key: CONGRESS_GOV_API_KEY,
        format: 'json',
        limit: BILLS_PER_PAGE,
        offset: offset
      },
      timeout: 30000
    });
    return response.data;
  }, `Fetching bills list (Congress ${congress}, offset ${offset})`);
}

async function fetchAndSaveBill(
  congress: number,
  billType: string,
  billNumber: number,
  state: ScraperState
): Promise<boolean> {
  const billId = `${billType.toUpperCase()} ${billNumber}`;
  
  try {
    // Fetch complete bill data
    const bill = await apiCallWithRetry(
      () => fetchBillWithDetails(congress, billType, billNumber),
      `Fetching ${billId}`
    );

    if (!bill) {
      console.log(`  ⚠️  No data returned for ${billId}`);
      state.failureCount++;
      return false;
    }

    // Normalize the bill data before saving
    const normalized = normalizeBill(bill, billType);

    // Save to database
    const saved = await apiCallWithRetry(
      () => saveBill(normalized),
      `Saving ${billId} to database`
    );

    if (saved) {
      state.successCount++;
      return true;
    } else {
      state.failureCount++;
      state.errors.push({
        congress,
        bill: billId,
        error: 'Failed to save to database',
        timestamp: new Date().toISOString()
      });
      return false;
    }
  } catch (error: any) {
    console.error(`  ❌ Error processing ${billId}:`, error.message);
    state.failureCount++;
    state.errors.push({
      congress,
      bill: billId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// ============================================
// Congress Scraper
// ============================================

async function scrapeCompleteCongress(
  congress: number,
  state: ScraperState
): Promise<CongressStats> {
  const stats: CongressStats = {
    congress,
    totalBills: 0,
    processedBills: 0,
    successCount: 0,
    failureCount: 0,
    startTime: new Date()
  };

  console.log('');
  console.log('==========================================');
  console.log(`SCRAPING CONGRESS ${congress}`);
  console.log('==========================================');
  console.log('');

  let offset = state.currentOffset;
  let hasMore = true;
  let totalBills = 0;

  // First, determine total number of bills
  console.log(`📊 Determining total bills in Congress ${congress}...`);
  const firstPage = await fetchBillsList(congress, 0);
  totalBills = firstPage?.pagination?.count || 0;
  stats.totalBills = totalBills;

  console.log(`📋 Found ${totalBills} total bills in Congress ${congress}`);
  console.log(`⏱️  Estimated time: ${Math.ceil((totalBills * 3) / 3600)} hours`);
  console.log('');

  // Pagination loop
  while (hasMore) {
    console.log(`\n📄 Fetching bills ${offset + 1}-${Math.min(offset + BILLS_PER_PAGE, totalBills)} of ${totalBills}...`);
    
    const result = await fetchBillsList(congress, offset);
    const bills = result?.bills || [];

    if (bills.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`   Found ${bills.length} bills in this page`);
    console.log('');

    // Process each bill in the page
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      const billType = bill.type?.toLowerCase();
      const billNumber = bill.number;

      if (!billType || !billNumber) {
        console.log(`  ⚠️  Skipping bill with missing type/number`);
        continue;
      }

      const progress = offset + i + 1;
      const percent = ((progress / totalBills) * 100).toFixed(1);
      
      console.log(`  [${progress}/${totalBills} - ${percent}%] Processing ${billType.toUpperCase()} ${billNumber}...`);

      const success = await fetchAndSaveBill(congress, billType, billNumber, state);
      
      if (success) {
        console.log(`    ✅ Saved successfully`);
      }

      stats.processedBills++;
      state.totalBillsProcessed++;

      // Save state every 10 bills
      if (stats.processedBills % 10 === 0) {
        state.currentOffset = offset + i + 1;
        saveState(state);
        console.log(`    💾 Progress saved (${state.successCount} saved, ${state.failureCount} failed)`);
      }

      // Rate limiting delay
      await delay(DELAY_BETWEEN_REQUESTS);
    }

    offset += bills.length;
    state.currentOffset = offset;
    saveState(state);

    // Check if there are more pages
    const pagination = result?.pagination;
    hasMore = pagination?.next !== undefined;

    if (hasMore) {
      console.log(`\n⏭️  Moving to next page (${offset}/${totalBills} processed)...`);
    }
  }

  stats.endTime = new Date();
  stats.duration = formatDuration(stats.startTime, stats.endTime);
  stats.successCount = state.successCount;
  stats.failureCount = state.failureCount;

  // Mark congress as completed
  state.completedCongresses.push(congress);
  state.currentOffset = 0; // Reset for next congress
  saveState(state);

  console.log('');
  console.log('==========================================');
  console.log(`CONGRESS ${congress} COMPLETE`);
  console.log('==========================================');
  console.log(`Total Bills: ${stats.totalBills}`);
  console.log(`Processed: ${stats.processedBills}`);
  console.log(`Saved: ${stats.successCount}`);
  console.log(`Failed: ${stats.failureCount}`);
  console.log(`Duration: ${stats.duration}`);
  console.log('==========================================');
  console.log('');

  return stats;
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log('');
  console.log('====================================');
  console.log('COMPLETE CONGRESS.GOV SCRAPER');
  console.log('====================================');
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const resumeMode = args.includes('--resume');
  const allMode = args.includes('--all');
  
  const congressArg = args.find(arg => arg.startsWith('--congress='));
  const startArg = args.find(arg => arg.startsWith('--start='));
  const endArg = args.find(arg => arg.startsWith('--end='));

  const currentCongress = await getCurrentCongress();
  
  let congressesToScrape: number[] = [];

  // Determine which Congresses to scrape
  if (resumeMode) {
    const savedState = loadState();
    if (!savedState) {
      console.error('❌ No saved state found. Cannot resume.');
      process.exit(1);
    }
    console.log(`🔄 Resuming from Congress ${savedState.currentCongress}, offset ${savedState.currentOffset}`);
    console.log(`   Already processed: ${savedState.totalBillsProcessed} bills`);
    console.log(`   Success: ${savedState.successCount}, Failed: ${savedState.failureCount}`);
    console.log('');
  } else if (allMode) {
    // Scrape ALL Congresses from 1 to current
    console.log(`🌎 ALL MODE: Scraping Congresses 1-${currentCongress}`);
    console.log(`⚠️  WARNING: This will take DAYS to complete!`);
    console.log('');
    congressesToScrape = Array.from({ length: currentCongress }, (_, i) => currentCongress - i);
  } else if (congressArg) {
    const congress = parseInt(congressArg.split('=')[1]);
    congressesToScrape = [congress];
  } else if (startArg && endArg) {
    const start = parseInt(startArg.split('=')[1]);
    const end = parseInt(endArg.split('=')[1]);
    congressesToScrape = Array.from(
      { length: end - start + 1 },
      (_, i) => end - i // Start from newest
    );
  } else {
    // Default: scrape current Congress
    congressesToScrape = [currentCongress];
  }

  console.log(`📋 Congresses to scrape: ${congressesToScrape.join(', ')}`);
  console.log(`⏱️  Rate limit: ${REQUESTS_PER_HOUR} requests/hour`);
  console.log(`🔄 Retry policy: ${MAX_RETRIES} attempts with exponential backoff`);
  console.log(`💾 State file: ${STATE_FILE}`);
  console.log('');

  // Load or initialize state
  let state: ScraperState;
  if (resumeMode) {
    state = loadState()!;
  } else {
    state = initializeState(congressesToScrape[0]);
    clearState(); // Clear any old state
    saveState(state);
  }

  const allStats: CongressStats[] = [];
  const overallStartTime = new Date();

  try {
    // Process each Congress
    for (const congress of congressesToScrape) {
      // Skip if already completed
      if (state.completedCongresses.includes(congress)) {
        console.log(`✅ Congress ${congress} already completed, skipping...`);
        console.log('');
        continue;
      }

      // Update state for new Congress if needed
      if (congress !== state.currentCongress) {
        state.currentCongress = congress;
        state.currentOffset = 0;
        saveState(state);
      }

      const congressStats = await scrapeCompleteCongress(congress, state);
      allStats.push(congressStats);
    }

    // Final summary
    const overallEndTime = new Date();
    const overallDuration = formatDuration(overallStartTime, overallEndTime);

    console.log('');
    console.log('==========================================');
    console.log('SCRAPING COMPLETE - FINAL SUMMARY');
    console.log('==========================================');
    console.log('');
    console.log(`Congresses Scraped: ${allStats.length}`);
    console.log(`Total Bills Processed: ${state.totalBillsProcessed}`);
    console.log(`Total Saved: ${state.successCount}`);
    console.log(`Total Failed: ${state.failureCount}`);
    console.log(`Overall Duration: ${overallDuration}`);
    console.log('');
    
    if (state.errors.length > 0) {
      console.log(`❌ Errors encountered: ${state.errors.length}`);
      console.log('   See state file for details');
      console.log('');
    }

    console.log('Per-Congress Summary:');
    console.log('--------------------');
    allStats.forEach(stats => {
      console.log(`Congress ${stats.congress}:`);
      console.log(`  Total Bills: ${stats.totalBills}`);
      console.log(`  Success: ${stats.successCount}`);
      console.log(`  Failed: ${stats.failureCount}`);
      console.log(`  Duration: ${stats.duration}`);
      console.log('');
    });

    console.log('==========================================');
    console.log('');

    // Clean up state file on successful completion
    clearState();
    console.log('✅ State file cleaned up');

  } catch (error: any) {
    console.error('');
    console.error('==========================================');
    console.error('❌ SCRAPING INTERRUPTED');
    console.error('==========================================');
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('State has been saved. Resume with:');
    console.error('  npx tsx src/scripts/congress-complete-scraper.ts --resume');
    console.error('==========================================');
    console.error('');
    process.exit(1);
  }
}

// ============================================
// Utility Functions
// ============================================

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Run the scraper
main().catch(console.error);

