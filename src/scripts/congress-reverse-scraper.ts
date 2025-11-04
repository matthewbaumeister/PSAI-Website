#!/usr/bin/env node
/**
 * ============================================
 * Congress.gov REVERSE Scraper (Old → New)
 * ============================================
 * 
 * Scrapes OLDEST to NEWEST (Congress 1 → 119)
 * Uses SECOND API KEY for parallel scraping
 * 
 * Run alongside congress-complete-scraper.ts for 2x speed!
 * 
 * Usage:
 *   npx tsx src/scripts/congress-reverse-scraper.ts
 *   npx tsx src/scripts/congress-reverse-scraper.ts --resume
 * 
 * ============================================
 */

import 'dotenv/config';

// IMPORTANT: Use second API key for this scraper
process.env.CONGRESS_GOV_API_KEY = process.env.CONGRESS_SECOND_API_KEY;

import {
  fetchBillWithDetails,
  normalizeBill,
  saveBill,
  getCurrentCongress
} from '../lib/congress-gov-scraper';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ============================================
// Configuration
// ============================================

const STATE_FILE = path.join(process.cwd(), '.congress-reverse-scraper-state.json');
const REQUESTS_PER_HOUR = 5000; // Full 5000 limit (we have dedicated API key)
const DELAY_BETWEEN_REQUESTS = Math.ceil((3600 * 1000) / REQUESTS_PER_HOUR); // ~720ms
const BILLS_PER_PAGE = 250;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// ============================================
// State Management
// ============================================

interface ScraperState {
  direction: 'ascending'; // oldest to newest
  currentCongress: number;
  currentOffset: number;
  totalBillsProcessed: number;
  successCount: number;
  failureCount: number;
  congresses: {
    [congress: number]: {
      totalBills: number;
      processedBills: number;
      lastOffset: number;
    };
  };
  errors: Array<{ congress: number; bill: string; error: string }>;
  lastUpdated: string;
}

function loadState(): ScraperState | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return null;
}

function saveState(state: ScraperState): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

function initializeState(startCongress: number): ScraperState {
  return {
    direction: 'ascending',
    currentCongress: startCongress,
    currentOffset: 0,
    totalBillsProcessed: 0,
    successCount: 0,
    failureCount: 0,
    congresses: {},
    errors: [],
    lastUpdated: new Date().toISOString()
  };
}

// ============================================
// Logging
// ============================================

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [REVERSE] ${message}`);
}

// ============================================
// Delay Helper
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Scrape Single Congress
// ============================================

async function scrapeCongress(congress: number, state: ScraperState): Promise<void> {
  log(`\n==========================================`);
  log(`SCRAPING CONGRESS ${congress} (REVERSE MODE)`);
  log(`==========================================\n`);

  if (!state.congresses[congress]) {
    state.congresses[congress] = {
      totalBills: 0,
      processedBills: 0,
      lastOffset: 0
    };
  }

  const congressState = state.congresses[congress];
  let offset = congressState.lastOffset;

  // Determine total bills if not known
  if (congressState.totalBills === 0) {
    log(`📊 Determining total bills in Congress ${congress}...`);
    try {
      const response = await axios.get(
        `https://api.congress.gov/v3/bill/${congress}`,
        {
          params: {
            api_key: process.env.CONGRESS_GOV_API_KEY,
            format: 'json',
            limit: 1
          }
        }
      );
      congressState.totalBills = response.data.pagination?.count || 0;
      saveState(state);
      log(`📋 Found ${congressState.totalBills} total bills in Congress ${congress}`);
    } catch (error: any) {
      log(`❌ Error getting bill count: ${error.message}`);
      return;
    }
  }

  const totalBills = congressState.totalBills;
  if (totalBills === 0) {
    log(`No bills found for Congress ${congress}. Skipping.`);
    return;
  }

  // Scrape all bills in this Congress
  while (offset < totalBills) {
    log(`\n📄 Fetching bills ${offset + 1}-${Math.min(offset + BILLS_PER_PAGE, totalBills)} of ${totalBills}...`);
    
    let billsOnPage: any[] = [];
    try {
      const response = await axios.get(
        `https://api.congress.gov/v3/bill/${congress}`,
        {
          params: {
            api_key: process.env.CONGRESS_GOV_API_KEY,
            format: 'json',
            offset: offset,
            limit: BILLS_PER_PAGE,
            sort: 'updateDate+asc' // Ascending for oldest first
          }
        }
      );
      billsOnPage = response.data.bills || [];
      log(`   Found ${billsOnPage.length} bills in this page`);
    } catch (error: any) {
      log(`❌ Error fetching page (offset ${offset}): ${error.message}. Retrying...`);
      await delay(RETRY_DELAY_MS);
      continue;
    }

    if (billsOnPage.length === 0) {
      log(`No more bills found. Ending scrape for Congress ${congress}.`);
      break;
    }

    // Process each bill
    for (const rawBill of billsOnPage) {
      const billIdentifier = `${rawBill.type.toUpperCase()} ${rawBill.number}`;
      const progress = `[${congressState.processedBills + 1}/${totalBills} - ${((congressState.processedBills + 1) / totalBills * 100).toFixed(1)}%]`;
      log(`  ${progress} Processing ${billIdentifier}...`);

      let retries = 0;
      let billDetails: any = null;
      
      while (retries < MAX_RETRIES) {
        try {
          billDetails = await fetchBillWithDetails(congress, rawBill.type, rawBill.number);
          await delay(DELAY_BETWEEN_REQUESTS); // Rate limiting
          break;
        } catch (err: any) {
          retries++;
          log(`❌ Error fetching ${billIdentifier} (Attempt ${retries}/${MAX_RETRIES}): ${err.message}`);
          if (retries < MAX_RETRIES) {
            await delay(RETRY_DELAY_MS * Math.pow(2, retries));
          } else {
            log(`❌ Max retries reached for ${billIdentifier}. Skipping.`);
            state.errors.push({ congress, bill: billIdentifier, error: err.message });
            state.failureCount++;
            billDetails = null;
          }
        }
      }

      if (billDetails) {
        try {
          const normalized = normalizeBill(billDetails, rawBill.type);
          await saveBill(normalized);
          log(`    ✅ Saved successfully`);
          state.successCount++;
        } catch (err: any) {
          log(`❌ Error saving ${billIdentifier}: ${err.message}`);
          state.errors.push({ congress, bill: billIdentifier, error: err.message });
          state.failureCount++;
        }
      }

      congressState.processedBills++;
      congressState.lastOffset = offset;
      state.totalBillsProcessed++;
      state.lastUpdated = new Date().toISOString();
      saveState(state);
    }

    offset += BILLS_PER_PAGE;
  }

  log(`\n✅ Finished scraping Congress ${congress}.`);
  log(`   Processed: ${congressState.processedBills}/${totalBills} bills`);
}

// ============================================
// Main Execution
// ============================================

async function main() {
  log('==========================================');
  log('REVERSE SCRAPER STARTING (OLD → NEW)');
  log('Using SECOND API KEY');
  log('==========================================\n');

  // Verify second API key exists
  if (!process.env.CONGRESS_GOV_API_KEY) {
    console.error('❌ CONGRESS_SECOND_API_KEY not found in environment!');
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  const resumeMode = args.includes('--resume');

  const currentCongress = await getCurrentCongress();
  let state: ScraperState;

  if (resumeMode) {
    const savedState = loadState();
    if (!savedState) {
      console.error('❌ No saved state found. Cannot resume.');
      process.exit(1);
    }
    state = savedState;
    log(`🔄 Resuming from Congress ${state.currentCongress}`);
  } else {
    // Start from Congress 1 (oldest)
    state = initializeState(1);
    log(`🆕 Starting fresh from Congress 1 (oldest)`);
  }

  // Scrape from oldest to current
  for (let congress = state.currentCongress; congress <= currentCongress; congress++) {
    state.currentCongress = congress;
    state.currentOffset = 0;
    
    try {
      await scrapeCongress(congress, state);
    } catch (error: any) {
      log(`❌ Fatal error in Congress ${congress}: ${error.message}`);
      log(`State saved. You can resume with --resume flag.`);
      process.exit(1);
    }
  }

  log('\n==========================================');
  log('REVERSE SCRAPER COMPLETED!');
  log('==========================================');
  log(`Total bills processed: ${state.totalBillsProcessed}`);
  log(`Success: ${state.successCount}`);
  log(`Failed: ${state.failureCount}`);
  log(`Errors: ${state.errors.length}`);
  log('==========================================\n');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

