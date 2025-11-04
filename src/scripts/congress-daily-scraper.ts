#!/usr/bin/env node
/**
 * ============================================
 * Congress.gov Daily Scraper
 * ============================================
 * 
 * Lightweight scraper for automated daily cron jobs.
 * Fetches recent updates to all legislation with comprehensive data.
 * 
 * Key Features:
 * - Updates bills from last 2 days (today + yesterday)
 * - Comprehensive data: actions, cosponsors, amendments, text versions
 * - Fetches new amendments and committee reports
 * - Tracks upcoming hearings
 * - Returns statistics for email notifications
 * 
 * Usage:
 *   npx tsx src/scripts/congress-daily-scraper.ts
 *   npx tsx src/scripts/congress-daily-scraper.ts --date=2025-11-03
 * 
 * ============================================
 */

import 'dotenv/config';
import {
  searchBills,
  fetchBill,
  fetchBillWithDetails,
  fetchBillActions,
  fetchBillCosponsors,
  normalizeBill,
  saveBill,
  searchCommitteeReports,
  fetchCommitteeReport,
  searchHearings,
  getCurrentCongress,
  logScrapingRun,
  delay
} from '../lib/congress-gov-scraper';

// ============================================
// Configuration
// ============================================

const MAX_BILLS_PER_RUN = 250;
const MAX_REPORTS_PER_RUN = 50;
const MAX_HEARINGS_PER_RUN = 30;
const UPDATE_WINDOW_DAYS = 2; // Scrape last 2 days (today + yesterday) for updates

// ============================================
// Helper Functions
// ============================================

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Congress Daily] ${message}`);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateRange(daysBack: number = UPDATE_WINDOW_DAYS): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

// ============================================
// Bill Scraping
// ============================================

async function scrapeRecentBills(dateRange: { startDate: string; endDate: string }): Promise<{
  found: number;
  new: number;
  updated: number;
  failed: number;
}> {
  log(`Scraping bills updated between ${dateRange.startDate} and ${dateRange.endDate}`);
  
  let found = 0;
  let newCount = 0;
  let updated = 0;
  let failed = 0;

  try {
    const currentCongress = getCurrentCongress();
    
    // Search for bills updated in date range
    const result = await searchBills({
      congress: currentCongress,
      fromDateTime: `${dateRange.startDate}T00:00:00Z`,
      toDateTime: `${dateRange.endDate}T23:59:59Z`,
      limit: MAX_BILLS_PER_RUN,
      sort: 'updateDate+desc'
    });

    const bills = result?.bills || [];
    found = bills.length;
    log(`Found ${found} bills updated in date range`);

    // Fetch full details for each bill (with ALL data - actions, cosponsors, amendments, etc.)
    for (const billSummary of bills) {
      try {
        // Use fetchBillWithDetails to get comprehensive data
        const fullBill = await fetchBillWithDetails(
          billSummary.congress,
          billSummary.type,
          billSummary.number
        );

        if (!fullBill) {
          failed++;
          continue;
        }

        // Normalize with billType parameter
        const normalized = normalizeBill(fullBill, billSummary.type);
        
        // Save ALL bills (we mark defense relevance, but store everything for completeness)
        const success = await saveBill(normalized);
        if (success) {
          if (normalized.introduced_date === dateRange.endDate) {
            newCount++;
          } else {
            updated++;
          }
          const defenseTag = normalized.is_defense_related ? '🛡️ ' : '';
          log(`  ✓ ${defenseTag}${normalized.bill_type.toUpperCase()} ${normalized.bill_number}: ${normalized.title.substring(0, 60)}...`);
        } else {
          failed++;
        }

        // Small delay to avoid overwhelming API (already has rate limiter, but extra safety)
        await delay(100);
      } catch (error) {
        log(`  ✗ Failed to process bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

  } catch (error) {
    log(`Error scraping bills: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { found, new: newCount, updated, failed };
}

// ============================================
// Committee Reports Scraping
// ============================================

async function scrapeRecentReports(dateRange: { startDate: string; endDate: string }): Promise<{
  found: number;
  new: number;
  failed: number;
}> {
  log(`Scraping committee reports from ${dateRange.startDate}`);
  
  let found = 0;
  let newCount = 0;
  let failed = 0;

  try {
    const currentCongress = getCurrentCongress();
    
    const reports = await searchCommitteeReports(currentCongress, {
      limit: MAX_REPORTS_PER_RUN
    });

    found = reports.length;
    log(`Found ${found} recent committee reports`);

    // TODO: Implement report normalization and saving
    // For now, just count them
    
  } catch (error) {
    log(`Error scraping reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { found, new: newCount, failed };
}

// ============================================
// Hearings Scraping
// ============================================

async function scrapeUpcomingHearings(): Promise<{
  found: number;
  new: number;
  failed: number;
}> {
  log(`Scraping upcoming hearings`);
  
  let found = 0;
  let newCount = 0;
  let failed = 0;

  try {
    const currentCongress = getCurrentCongress();
    
    // Get upcoming hearings for next 30 days
    const hearings = await searchHearings(currentCongress, undefined, {
      limit: MAX_HEARINGS_PER_RUN
    });

    found = hearings.length;
    log(`Found ${found} upcoming hearings`);

    // TODO: Implement hearing normalization and saving
    // For now, just count them
    
  } catch (error) {
    log(`Error scraping hearings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { found, new: newCount, failed };
}

// ============================================
// Main Execution
// ============================================

async function main() {
  const startTime = Date.now();
  log('====================================');
  log('Congress.gov Daily Scraper Starting');
  log('====================================');

  // Get date range
  const dateRange = getDateRange(UPDATE_WINDOW_DAYS);
  log(`Date range: ${dateRange.startDate} to ${dateRange.endDate}`);

  // Track statistics
  let totalApiCalls = 0;
  let totalFound = 0;
  let totalNew = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  try {
    // 1. Scrape recent bills
    log('');
    log('--- Step 1: Recent Bills ---');
    const billsResult = await scrapeRecentBills(dateRange);
    totalFound += billsResult.found;
    totalNew += billsResult.new;
    totalUpdated += billsResult.updated;
    totalFailed += billsResult.failed;
    totalApiCalls += billsResult.found + 1; // +1 for search call

    // 2. Scrape recent committee reports
    log('');
    log('--- Step 2: Committee Reports ---');
    const reportsResult = await scrapeRecentReports(dateRange);
    totalFound += reportsResult.found;
    totalNew += reportsResult.new;
    totalFailed += reportsResult.failed;
    totalApiCalls += 1; // 1 for search call

    // 3. Scrape upcoming hearings
    log('');
    log('--- Step 3: Upcoming Hearings ---');
    const hearingsResult = await scrapeUpcomingHearings();
    totalFound += hearingsResult.found;
    totalNew += hearingsResult.new;
    totalFailed += hearingsResult.failed;
    totalApiCalls += 1; // 1 for search call

    // Calculate duration
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Log summary
    log('');
    log('====================================');
    log('DAILY SCRAPE SUMMARY');
    log('====================================');
    log(`Total Found: ${totalFound}`);
    log(`Total New: ${totalNew}`);
    log(`Total Updated: ${totalUpdated}`);
    log(`Total Failed: ${totalFailed}`);
    log(`API Calls Made: ${totalApiCalls}`);
    log(`Duration: ${duration}s`);
    log('====================================');

    // Log to database
    await logScrapingRun({
      scrape_type: 'daily_update',
      congress: getCurrentCongress(),
      date_range_start: dateRange.startDate,
      date_range_end: dateRange.endDate,
      status: totalFailed === 0 ? 'completed' : 'partial',
      records_found: totalFound,
      records_new: totalNew,
      records_updated: totalUpdated,
      records_failed: totalFailed,
      api_calls_made: totalApiCalls,
      duration_seconds: duration,
      summary: `Daily update completed. ${totalNew} new, ${totalUpdated} updated, ${totalFailed} failed.`
    });

    // Return results for cron endpoint
    return {
      success: true,
      stats: {
        found: totalFound,
        new: totalNew,
        updated: totalUpdated,
        failed: totalFailed,
        apiCalls: totalApiCalls,
        duration
      }
    };

  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log('');
    log('====================================');
    log(`DAILY SCRAPE FAILED: ${errorMessage}`);
    log('====================================');

    // Log failure to database
    await logScrapingRun({
      scrape_type: 'daily_update',
      congress: getCurrentCongress(),
      date_range_start: dateRange.startDate,
      date_range_end: dateRange.endDate,
      status: 'failed',
      records_found: totalFound,
      records_new: totalNew,
      records_updated: totalUpdated,
      records_failed: totalFailed,
      api_calls_made: totalApiCalls,
      duration_seconds: duration,
      errors: [errorMessage],
      summary: `Daily update failed: ${errorMessage}`
    });

    return {
      success: false,
      error: errorMessage,
      stats: {
        found: totalFound,
        new: totalNew,
        updated: totalUpdated,
        failed: totalFailed,
        apiCalls: totalApiCalls,
        duration
      }
    };
  }
}

// ============================================
// Export for API endpoint
// ============================================

export { main as runDailyScraper };

// ============================================
// Run if called directly
// ============================================

if (require.main === module) {
  main()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

