/**
 * Re-scrape the 838 existing 2025 contracts to fix missing dates/NAICS
 * This will UPDATE the existing records with corrected data
 */

import 'dotenv/config';
import { scrapeDateRangeWithFullDetails } from './src/lib/fpds-scraper-full';

async function fixExisting2025Data() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  FIX EXISTING 838 CONTRACTS (2025)        ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log('This will re-scrape the 838 contracts from Jan-Oct 2025');
  console.log('and UPDATE them with the corrected field mappings.\n');
  console.log('⏱️  Estimated time: ~8-10 minutes\n');
  console.log('Starting in 5 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const startDate = '2025-01-01';
  const endDate = '2025-10-31';
  const maxContracts = 1000; // Should capture all 838
  
  console.log(`\n📅 Re-scraping: ${startDate} to ${endDate}`);
  console.log(`📊 Max contracts: ${maxContracts}\n`);
  
  const result = await scrapeDateRangeWithFullDetails(startDate, endDate, { maxContracts });
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           FIX COMPLETE!                    ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log(`✅ Total contracts processed: ${result.totalProcessed}`);
  console.log(`✅ Inserted/Updated: ${result.totalInserted} contracts`);
  console.log(`⚠️  Errors: ${result.totalErrors} contracts\n`);
  
  console.log('🎯 Next Steps:');
  console.log('1. Run the Supabase queries above to verify dates/NAICS');
  console.log('2. Tomorrow: Run full year scrape in tmux\n');
}

fixExisting2025Data().catch(console.error);

