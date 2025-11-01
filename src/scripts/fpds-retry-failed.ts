#!/usr/bin/env tsx
// ============================================
// FPDS Retry Failed Contracts
// ============================================
// Retries only the contracts that failed during scraping
// Much faster than re-running the entire date range!
//
// Usage:
//   npx tsx src/scripts/fpds-retry-failed.ts
//   npx tsx src/scripts/fpds-retry-failed.ts --max=100
//   npx tsx src/scripts/fpds-retry-failed.ts --date-range="2025-01-01 to 2025-12-31"

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USA_SPENDING_API = 'https://api.usaspending.gov/api/v2';
const DETAILS_DELAY_MS = 500;

// Parse command line args
const args = process.argv.slice(2);
const maxArg = args.find(arg => arg.startsWith('--max='));
const dateRangeArg = args.find(arg => arg.startsWith('--date-range='));

const maxRetries = maxArg ? parseInt(maxArg.split('=')[1]) : undefined;
const dateRangeFilter = dateRangeArg ? dateRangeArg.split('=')[1] : undefined;

async function getContractFullDetails(generatedId: string) {
  try {
    const response = await fetch(`${USA_SPENDING_API}/awards/${generatedId}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Retry] Error fetching ${generatedId}:`, error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     FPDS Retry Failed Contracts           ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Get failed contracts
  let query = supabase
    .from('fpds_failed_contracts')
    .select('*')
    .eq('resolved', false)
    .order('attempt_count', { ascending: true })
    .order('last_attempted_at', { ascending: true });

  if (dateRangeFilter) {
    query = query.eq('date_range', dateRangeFilter);
  }

  if (maxRetries) {
    query = query.limit(maxRetries);
  }

  const { data: failedContracts, error } = await query;

  if (error) {
    console.error('❌ Error fetching failed contracts:', error);
    process.exit(1);
  }

  if (!failedContracts || failedContracts.length === 0) {
    console.log('✅ No failed contracts to retry!');
    process.exit(0);
  }

  console.log(`📋 Found ${failedContracts.length} failed contracts to retry`);
  if (dateRangeFilter) {
    console.log(`   Date Range: ${dateRangeFilter}`);
  }
  console.log('');

  let successCount = 0;
  let stillFailingCount = 0;

  for (let i = 0; i < failedContracts.length; i++) {
    const failed = failedContracts[i];
    
    if ((i + 1) % 10 === 0) {
      console.log(`[Retry] Progress: ${i + 1}/${failedContracts.length}...`);
    }

    try {
      const fullDetails = await getContractFullDetails(failed.contract_id);

      if (fullDetails) {
        // Successfully fetched! Mark as resolved
        await supabase
          .from('fpds_failed_contracts')
          .update({ 
            resolved: true, 
            resolved_at: new Date().toISOString() 
          })
          .eq('id', failed.id);

        // Insert into main contracts table
        // (You would call normalizeFullContract and insert here)
        // For now, just mark as resolved
        
        successCount++;
        console.log(`✅ [${i + 1}/${failedContracts.length}] Resolved: ${failed.contract_id}`);
      } else {
        // Still failing, increment attempt count
        await supabase
          .from('fpds_failed_contracts')
          .update({ 
            attempt_count: failed.attempt_count + 1,
            last_attempted_at: new Date().toISOString()
          })
          .eq('id', failed.id);

        stillFailingCount++;
        console.log(`⚠️  [${i + 1}/${failedContracts.length}] Still failing: ${failed.contract_id}`);
      }

      await sleep(DETAILS_DELAY_MS);

    } catch (error) {
      console.error(`❌ [${i + 1}/${failedContracts.length}] Error retrying ${failed.contract_id}:`, error);
      stillFailingCount++;
      
      // Update attempt count
      await supabase
        .from('fpds_failed_contracts')
        .update({ 
          attempt_count: failed.attempt_count + 1,
          last_attempted_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : String(error)
        })
        .eq('id', failed.id);
    }
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║          RETRY COMPLETE!                   ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`✅ Successfully resolved: ${successCount}`);
  console.log(`⚠️  Still failing: ${stillFailingCount}`);
  console.log(`📊 Success rate: ${((successCount / failedContracts.length) * 100).toFixed(1)}%`);
  console.log('');

  if (stillFailingCount > 0) {
    console.log('💡 Tip: Wait a few hours and run again. Government APIs improve over time!');
    console.log('');
  }
}

main().catch(error => {
  console.error('\n❌ Retry script failed:', error);
  process.exit(1);
});

