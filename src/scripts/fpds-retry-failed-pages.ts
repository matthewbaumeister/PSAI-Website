import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import the scrapePage function from page-level scraper
// We'll need to refactor to make this reusable
import { searchContracts, getContractFullDetails, normalizeFullContract, batchInsertFullContracts } from '../lib/fpds-scraper-full';
import { validateContractBatch } from '../lib/fpds-data-cleaner';

async function retryFailedPages() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  FPDS Failed Pages Retry Script           ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Get all failed pages
  const { data: failedPages, error } = await supabase
    .from('fpds_page_progress')
    .select('*')
    .eq('status', 'failed')
    .order('date', { ascending: false })
    .order('page_number', { ascending: true });

  if (error) {
    console.error('❌ Error fetching failed pages:', error.message);
    return;
  }

  if (!failedPages || failedPages.length === 0) {
    console.log('✅ No failed pages to retry!');
    return;
  }

  console.log(`📊 Found ${failedPages.length} failed pages to retry\n`);

  let successful = 0;
  let stillFailing = 0;

  for (const page of failedPages) {
    console.log(`\n[${page.date}:P${page.page_number}] 🔄 Retrying...`);
    
    try {
      // Step 1: Search for contracts on this page
      const searchResult = await searchContracts({
        startDate: page.date,
        endDate: page.date,
        page: page.page_number,
        limit: 100
      });

      const results = searchResult.results || [];
      
      if (results.length === 0) {
        console.log(`[${page.date}:P${page.page_number}] ℹ️  No contracts found (page might be beyond end)`);
        
        // Mark as completed with 0 contracts
        await supabase
          .from('fpds_page_progress')
          .update({
            status: 'completed',
            contracts_found: 0,
            contracts_inserted: 0,
            contracts_failed: 0,
            completed_at: new Date().toISOString()
          })
          .eq('date', page.date)
          .eq('page_number', page.page_number);
        
        successful++;
        continue;
      }

      // Extract contract IDs
      const contractIds = results.map((r: any) => r.generated_internal_id || r['Award ID']);
      console.log(`[${page.date}:P${page.page_number}] Found ${contractIds.length} contracts`);

      // Step 2: Fetch full details
      const fullContracts: any[] = [];
      const successfulIds: string[] = [];
      let fetchErrors = 0;

      for (let i = 0; i < contractIds.length; i++) {
        try {
          const fullData = await getContractFullDetails(contractIds[i]);
          if (fullData) {
            fullContracts.push(fullData);
            successfulIds.push(contractIds[i]);
          } else {
            fetchErrors++;
            // Log to failed_contracts
            await supabase.from('fpds_failed_contracts').insert({
              contract_id: contractIds[i],
              error_message: 'Contract details fetch returned null',
              error_type: 'details_fetch_failed',
              date_range: page.date,
              page_number: page.page_number,
              attempt_count: 1
            });
          }
        } catch (err) {
          fetchErrors++;
          await supabase.from('fpds_failed_contracts').insert({
            contract_id: contractIds[i],
            error_message: err instanceof Error ? err.message : 'Unknown error',
            error_type: 'details_fetch_failed',
            date_range: page.date,
            page_number: page.page_number,
            attempt_count: 1
          });
        }

        if ((i + 1) % 10 === 0) {
          console.log(`[${page.date}:P${page.page_number}]   Fetched ${i + 1}/${contractIds.length}...`);
        }
      }

      console.log(`[${page.date}:P${page.page_number}] ✅ Fetched ${fullContracts.length}/${contractIds.length} details`);

      // Clean up resolved failures
      if (successfulIds.length > 0) {
        const { count } = await supabase
          .from('fpds_failed_contracts')
          .delete({ count: 'exact' })
          .in('contract_id', successfulIds)
          .eq('date_range', page.date)
          .eq('page_number', page.page_number);
        
        if (count && count > 0) {
          console.log(`[${page.date}:P${page.page_number}] 🧹 Cleaned ${count} resolved failures`);
        }
      }

      // Step 3: Validate and insert
      if (fullContracts.length > 0) {
        const normalized = fullContracts.map(normalizeFullContract);
        const validated = validateContractBatch(normalized);
        
        console.log(`[${page.date}:P${page.page_number}] 🔬 Quality: ${validated.stats.averageScore.toFixed(1)}/100`);
        
        const result = await batchInsertFullContracts(validated.cleaned);
        
        console.log(`[${page.date}:P${page.page_number}] 💾 New: ${result.inserted} | Updated: ${result.updated} | DB Errors: ${result.errors}`);
      }

      // Mark page as completed
      await supabase
        .from('fpds_page_progress')
        .update({
          status: 'completed',
          contracts_found: contractIds.length,
          contracts_inserted: fullContracts.length,
          contracts_failed: fetchErrors,
          completed_at: new Date().toISOString(),
          error_message: null
        })
        .eq('date', page.date)
        .eq('page_number', page.page_number);

      console.log(`[${page.date}:P${page.page_number}] ✅ Page retry successful!`);
      successful++;

    } catch (error) {
      console.error(`[${page.date}:P${page.page_number}] ❌ Retry failed:`, error instanceof Error ? error.message : error);
      stillFailing++;
    }

    // Small delay between pages to avoid API throttling
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Retry Summary                             ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Still failing: ${stillFailing}`);
  console.log(`📊 Total attempted: ${failedPages.length}\n`);
}

// Run the retry script
retryFailedPages()
  .then(() => {
    console.log('✅ Retry script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

