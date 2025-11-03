#!/usr/bin/env node
/**
 * ============================================
 * Congress.gov Bulk Historical Import
 * ============================================
 * 
 * One-time bulk import of historical defense legislation.
 * Imports key bills from the last 5 Congresses.
 * 
 * Target Bills:
 * - National Defense Authorization Acts (NDAA)
 * - Defense Appropriations Acts
 * - SBIR/STTR Reauthorization
 * - Major defense reform bills
 * 
 * Usage:
 *   npx tsx src/scripts/congress-bulk-import.ts
 *   npx tsx src/scripts/congress-bulk-import.ts --congress=118
 *   npx tsx src/scripts/congress-bulk-import.ts --priority-only
 * 
 * ============================================
 */

import 'dotenv/config';
import {
  fetchBill,
  normalizeBill,
  saveBill,
  searchBills,
  getCurrentCongress,
  logScrapingRun,
  delay
} from '../lib/congress-gov-scraper';

// ============================================
// Priority Bills List
// ============================================

interface PriorityBill {
  congress: number;
  type: string;
  number: number;
  description: string;
}

const PRIORITY_BILLS: PriorityBill[] = [
  // ========== CONGRESS 119 (2025-2026) ==========
  {
    congress: 119,
    type: 'hr',
    number: 5009,
    description: 'FY2025 National Defense Authorization Act'
  },
  {
    congress: 119,
    type: 'hr',
    number: 4368,
    description: 'FY2025 Defense Appropriations Act'
  },

  // ========== CONGRESS 118 (2023-2024) ==========
  {
    congress: 118,
    type: 'hr',
    number: 2670,
    description: 'FY2024 National Defense Authorization Act (James M. Inhofe NDAA)'
  },
  {
    congress: 118,
    type: 'hr',
    number: 4365,
    description: 'FY2024 Defense Appropriations Act'
  },
  {
    congress: 118,
    type: 's',
    number: 870,
    description: 'SBIR/STTR Reauthorization Act of 2023'
  },
  {
    congress: 118,
    type: 'hr',
    number: 7776,
    description: 'FY2024 Continuing Resolution (Defense Funding)'
  },

  // ========== CONGRESS 117 (2021-2022) ==========
  {
    congress: 117,
    type: 's',
    number: 4543,
    description: 'FY2023 National Defense Authorization Act'
  },
  {
    congress: 117,
    type: 'hr',
    number: 8236,
    description: 'FY2023 Defense Appropriations Act'
  },
  {
    congress: 117,
    type: 'hr',
    number: 4350,
    description: 'FY2022 National Defense Authorization Act'
  },
  {
    congress: 117,
    type: 'hr',
    number: 4432,
    description: 'FY2022 Defense Appropriations Act'
  },
  {
    congress: 117,
    type: 'hr',
    number: 1917,
    description: 'CHIPS and Science Act (Defense Technology)'
  },

  // ========== CONGRESS 116 (2019-2020) ==========
  {
    congress: 116,
    type: 'hr',
    number: 6395,
    description: 'FY2021 National Defense Authorization Act (William M. Thornberry NDAA)'
  },
  {
    congress: 116,
    type: 'hr',
    number: 7617,
    description: 'FY2021 Defense Appropriations Act'
  },
  {
    congress: 116,
    type: 's',
    number: 1790,
    description: 'FY2020 National Defense Authorization Act'
  },
  {
    congress: 116,
    type: 'hr',
    number: 2500,
    description: 'FY2020 Defense Appropriations Act'
  },

  // ========== CONGRESS 115 (2017-2018) ==========
  {
    congress: 115,
    type: 'hr',
    number: 5515,
    description: 'FY2019 John S. McCain National Defense Authorization Act'
  },
  {
    congress: 115,
    type: 'hr',
    number: 6157,
    description: 'FY2019 Defense Appropriations Act'
  },
  {
    congress: 115,
    type: 'hr',
    number: 2810,
    description: 'FY2018 National Defense Authorization Act'
  },
  {
    congress: 115,
    type: 'hr',
    number: 1625,
    description: 'FY2018 Defense Appropriations Act'
  },

  // Additional Key Bills
  {
    congress: 118,
    type: 'hr',
    number: 5013,
    description: 'National Defense Industrial Strategy Act'
  },
  {
    congress: 118,
    type: 's',
    number: 2103,
    description: 'Department of Defense Appropriations Act, 2024'
  },
  {
    congress: 117,
    type: 'hr',
    number: 7776,
    description: 'Chips and Science Act - Defense Innovation'
  },
  {
    congress: 116,
    type: 'hr',
    number: 6395,
    description: 'Pacific Deterrence Initiative Authorization'
  }
];

// ============================================
// Helper Functions
// ============================================

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Bulk Import] ${message}`);
}

// ============================================
// Import Priority Bills
// ============================================

async function importPriorityBills(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  log('====================================');
  log(`Importing ${PRIORITY_BILLS.length} Priority Bills`);
  log('====================================');

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < PRIORITY_BILLS.length; i++) {
    const bill = PRIORITY_BILLS[i];
    
    try {
      log(`[${i + 1}/${PRIORITY_BILLS.length}] Fetching: ${bill.description}`);
      log(`  Congress ${bill.congress}, ${bill.type.toUpperCase()} ${bill.number}`);

      // Fetch bill details
      const rawBill = await fetchBill(bill.congress, bill.type, bill.number);

      if (!rawBill) {
        log(`  ✗ Bill not found`);
        failed++;
        errors.push(`${bill.congress}/${bill.type}/${bill.number}: Not found`);
        continue;
      }

      // Normalize
      const normalized = normalizeBill(rawBill);

      // Save to database
      const saved = await saveBill(normalized);

      if (saved) {
        log(`  ✓ Saved successfully`);
        log(`    Defense Relevance: ${normalized.defense_relevance_score}/100`);
        if (normalized.defense_programs_mentioned && normalized.defense_programs_mentioned.length > 0) {
          log(`    Programs: ${normalized.defense_programs_mentioned.slice(0, 3).join(', ')}`);
        }
        if (normalized.contractors_mentioned && normalized.contractors_mentioned.length > 0) {
          log(`    Contractors: ${normalized.contractors_mentioned.slice(0, 3).join(', ')}`);
        }
        success++;
      } else {
        log(`  ✗ Failed to save to database`);
        failed++;
        errors.push(`${bill.congress}/${bill.type}/${bill.number}: Database error`);
      }

      // Rate limiting delay
      await delay(750);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log(`  ✗ Error: ${errorMsg}`);
      failed++;
      errors.push(`${bill.congress}/${bill.type}/${bill.number}: ${errorMsg}`);
    }

    log('');
  }

  return { success, failed, errors };
}

// ============================================
// Import All Defense Bills from Congress
// ============================================

async function importAllDefenseBills(congress: number): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  log('====================================');
  log(`Importing All Defense Bills from Congress ${congress}`);
  log('====================================');

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Search for all bills with defense keywords
    const result = await searchBills({
      congress,
      limit: 250,
      sort: 'updateDate+desc'
    });

    const bills = result?.bills || [];
    log(`Found ${bills.length} bills in Congress ${congress}`);

    for (let i = 0; i < bills.length; i++) {
      const billSummary = bills[i];

      try {
        // Fetch full bill
        const rawBill = await fetchBill(
          billSummary.congress,
          billSummary.type,
          billSummary.number
        );

        if (!rawBill) {
          failed++;
          continue;
        }

        // Normalize
        const normalized = normalizeBill(rawBill);

        // Only save defense-related bills
        if (normalized.is_defense_related && normalized.defense_relevance_score >= 30) {
          const saved = await saveBill(normalized);

          if (saved) {
            success++;
            log(`  ✓ [${i + 1}/${bills.length}] ${normalized.bill_type.toUpperCase()} ${normalized.bill_number}: ${normalized.title.substring(0, 50)}... (score: ${normalized.defense_relevance_score})`);
          } else {
            failed++;
          }
        }

        // Rate limiting
        if ((i + 1) % 10 === 0) {
          log(`Progress: ${i + 1}/${bills.length} bills processed...`);
          await delay(1000); // Extra delay every 10 bills
        } else {
          await delay(750);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        failed++;
        errors.push(`${billSummary.congress}/${billSummary.type}/${billSummary.number}: ${errorMsg}`);
      }
    }

  } catch (error) {
    log(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { success, failed, errors };
}

// ============================================
// Main Execution
// ============================================

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);

  log('====================================');
  log('Congress.gov Bulk Import');
  log('====================================');
  log('');

  let totalSuccess = 0;
  let totalFailed = 0;
  let allErrors: string[] = [];

  try {
    // Check for priority-only flag
    const priorityOnly = args.includes('--priority-only');
    
    // Check for specific congress
    const congressArg = args.find(arg => arg.startsWith('--congress='));
    const specificCongress = congressArg ? parseInt(congressArg.split('=')[1]) : null;

    if (specificCongress) {
      // Import all defense bills from specific congress
      log(`Mode: All Defense Bills (Congress ${specificCongress})`);
      const result = await importAllDefenseBills(specificCongress);
      totalSuccess = result.success;
      totalFailed = result.failed;
      allErrors = result.errors;

    } else if (priorityOnly) {
      // Import only priority bills
      log(`Mode: Priority Bills Only (${PRIORITY_BILLS.length} bills)`);
      const result = await importPriorityBills();
      totalSuccess = result.success;
      totalFailed = result.failed;
      allErrors = result.errors;

    } else {
      // Default: Import priority bills first, then recent congress
      log(`Mode: Priority Bills + Recent Congress`);
      log('');

      // Step 1: Priority bills
      log('Step 1: Importing Priority Bills...');
      const priorityResult = await importPriorityBills();
      totalSuccess += priorityResult.success;
      totalFailed += priorityResult.failed;
      allErrors.push(...priorityResult.errors);

      // Step 2: Current congress
      const currentCongress = getCurrentCongress();
      log('');
      log(`Step 2: Importing All Defense Bills from Congress ${currentCongress}...`);
      const currentResult = await importAllDefenseBills(currentCongress);
      totalSuccess += currentResult.success;
      totalFailed += currentResult.failed;
      allErrors.push(...currentResult.errors);
    }

    // Calculate duration
    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    // Print summary
    log('');
    log('====================================');
    log('BULK IMPORT SUMMARY');
    log('====================================');
    log(`Success: ${totalSuccess} bills imported`);
    log(`Failed: ${totalFailed} bills`);
    log(`Duration: ${minutes}m ${seconds}s`);
    log('====================================');

    if (allErrors.length > 0 && allErrors.length <= 10) {
      log('');
      log('Errors:');
      allErrors.forEach(err => log(`  - ${err}`));
    }

    // Log to database
    await logScrapingRun({
      scrape_type: 'bulk_import',
      congress: specificCongress || getCurrentCongress(),
      status: totalFailed === 0 ? 'completed' : 'partial',
      records_found: totalSuccess + totalFailed,
      records_new: totalSuccess,
      records_updated: 0,
      records_failed: totalFailed,
      api_calls_made: totalSuccess + totalFailed,
      duration_seconds: duration,
      errors: allErrors.length > 0 ? allErrors : undefined,
      summary: `Bulk import completed. ${totalSuccess} bills imported, ${totalFailed} failed.`
    });

    process.exit(totalFailed > 0 ? 1 : 0);

  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    log('');
    log('====================================');
    log(`FATAL ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    log('====================================');

    await logScrapingRun({
      scrape_type: 'bulk_import',
      congress: getCurrentCongress(),
      status: 'failed',
      records_found: totalSuccess + totalFailed,
      records_new: totalSuccess,
      records_updated: 0,
      records_failed: totalFailed,
      api_calls_made: totalSuccess + totalFailed,
      duration_seconds: duration,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      summary: `Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });

    process.exit(1);
  }
}

// ============================================
// Run
// ============================================

if (require.main === module) {
  main();
}

