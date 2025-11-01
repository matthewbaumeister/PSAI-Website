#!/usr/bin/env node
/**
 * FPDS Daily Scraper with Auto-Retry
 * 
 * Scrapes a single day → pauses 30s → retries failures from that day
 * This maximizes success rate by immediately retrying while API is "warm"
 * 
 * Usage:
 *   npx tsx src/scripts/fpds-daily-with-auto-retry.ts --date=2025-11-01
 *   npx tsx src/scripts/fpds-daily-with-auto-retry.ts  # Defaults to today
 */

import 'dotenv/config';
import { 
  scrapeDateRangeWithFullDetails, 
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

// Parse command line args
const args = process.argv.slice(2);
const dateArg = args.find(arg => arg.startsWith('--date='))?.split('=')[1];

// Default to today if no date provided
const targetDate = dateArg || new Date().toISOString().split('T')[0];

console.log(`
╔════════════════════════════════════════════╗
║   FPDS Daily Scrape + Auto-Retry          ║
╚════════════════════════════════════════════╝

📅 Target Date: ${targetDate}
⏱️  Process:
   1️⃣  Scrape all contracts for this day
   2️⃣  Pause 30 seconds (let API rest)
   3️⃣  Retry any failures from this day
   4️⃣  Report final stats

Starting in 3 seconds...
`);

await new Promise(resolve => setTimeout(resolve, 3000));

// ============================================
// STEP 1: Scrape the Day
// ============================================

console.log(`
╔════════════════════════════════════════════╗
║  STEP 1: Scraping ${targetDate}           ║
╚════════════════════════════════════════════╝
`);

const scrapeResult = await scrapeDateRangeWithFullDetails(
  targetDate,
  targetDate,
  { maxContracts: 999999 }
);

console.log(`
✅ Initial Scrape Complete:
   Found: ${scrapeResult.totalProcessed} contracts
   Inserted: ${scrapeResult.totalInserted} contracts
   Errors: ${scrapeResult.totalErrors} contracts
`);

// ============================================
// STEP 2: Pause 30 Seconds
// ============================================

console.log(`
╔════════════════════════════════════════════╗
║  STEP 2: Pausing 30 Seconds (API Rest)    ║
╚════════════════════════════════════════════╝

⏳ Letting the API cool down...
`);

// Countdown
for (let i = 30; i > 0; i -= 5) {
  console.log(`   ${i} seconds remaining...`);
  await new Promise(resolve => setTimeout(resolve, 5000));
}

console.log(`✅ Pause complete!\n`);

// ============================================
// STEP 3: Get Failed Contracts from This Day
// ============================================

console.log(`
╔════════════════════════════════════════════╗
║  STEP 3: Fetching Failed Contracts        ║
╚════════════════════════════════════════════╝
`);

const { data: failures, error: fetchError } = await supabase
  .from('fpds_failed_contracts')
  .select('contract_id, error_type, attempt_count')
  .ilike('date_range', `%${targetDate}%`)
  .order('created_at', { ascending: false });

if (fetchError) {
  console.error('❌ Error fetching failures:', fetchError.message);
  process.exit(1);
}

if (!failures || failures.length === 0) {
  console.log(`
🎉 NO FAILURES! All contracts succeeded on first try!
   Total Success: ${scrapeResult.totalInserted} contracts
`);
  process.exit(0);
}

const uniqueFailures = Array.from(new Set(failures.map(f => f.contract_id)));

console.log(`
📋 Found ${failures.length} failure records
🔁 Retrying ${uniqueFailures.length} unique contract IDs
`);

// ============================================
// STEP 4: Retry Failed Contracts
// ============================================

console.log(`
╔════════════════════════════════════════════╗
║  STEP 4: Retrying Failed Contracts        ║
╚════════════════════════════════════════════╝
`);

let retrySuccess = 0;
let retryStillFailed = 0;

for (let i = 0; i < uniqueFailures.length; i++) {
  const contractId = uniqueFailures[i];
  
  if ((i + 1) % 10 === 0) {
    console.log(`   Retrying ${i + 1}/${uniqueFailures.length}...`);
  }
  
  try {
    // Fetch full details
    const detailsUrl = `https://api.usaspending.gov/api/v2/awards/${contractId}/`;
    const response = await fetch(detailsUrl);
    
    if (!response.ok) {
      retryStillFailed++;
      continue;
    }
    
    const fullData = await response.json();
    
    const normalized = normalizeFullContract(fullData);
    const validated = validateContractBatch([normalized]);
    const result = await batchInsertFullContracts(validated.contracts);
    
    if (result.inserted > 0) {
      retrySuccess++;
      
      // Remove from failed contracts log (it succeeded!)
      await supabase
        .from('fpds_failed_contracts')
        .delete()
        .eq('contract_id', contractId);
    } else {
      retryStillFailed++;
    }
    
    // Small delay between retries
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } catch (err) {
    retryStillFailed++;
    
    // Update attempt count
    await supabase
      .from('fpds_failed_contracts')
      .update({ 
        attempt_count: supabase.rpc('increment', { row_id: contractId }),
        updated_at: new Date().toISOString()
      })
      .eq('contract_id', contractId);
  }
}

// ============================================
// FINAL REPORT
// ============================================

const totalUnique = scrapeResult.totalProcessed;
const finalSuccess = scrapeResult.totalInserted + retrySuccess;
const finalFailed = retryStillFailed;
const successRate = ((finalSuccess / totalUnique) * 100).toFixed(1);

console.log(`
╔════════════════════════════════════════════╗
║  🎯 FINAL RESULTS for ${targetDate}     ║
╚════════════════════════════════════════════╝

📊 Contract Statistics:
   Total Found: ${totalUnique} contracts
   
   Initial Scrape:
   ✅ Success: ${scrapeResult.totalInserted}
   ❌ Failed:  ${scrapeResult.totalErrors}
   
   Retry Results:
   ✅ Recovered: ${retrySuccess}
   ❌ Still Failed: ${retryStillFailed}
   
   FINAL:
   ✅ Total Success: ${finalSuccess} contracts
   ❌ Total Failed: ${finalFailed} contracts
   📈 Success Rate: ${successRate}%

${finalFailed === 0 ? '🎉 PERFECT! 100% success rate!' : ''}
${finalFailed > 0 && finalFailed < 10 ? '✨ Excellent! Very few failures remaining.' : ''}
${finalFailed >= 10 ? '⚠️  Some contracts still failing - API might be having issues.' : ''}

💡 Tip: You can run this again later to retry remaining failures.
`);

// ============================================
// Summary in Supabase
// ============================================

console.log(`
📝 Check your data in Supabase:

SELECT COUNT(*) as contracts
FROM fpds_contracts
WHERE date_signed = '${targetDate}'
  AND data_source = 'usaspending.gov-full';

Done! ✅
`);

process.exit(0);

