// ============================================
// FPDS Transactions Scraper
// ============================================
// Scrapes ALL contract transactions (including modifications)
// Uses USASpending API's transaction endpoint to get 6000+ daily contracts

import { createClient } from '@supabase/supabase-js';
import { normalizeFullContract, batchInsertFullContracts } from './fpds-scraper-full';
import { validateContractBatch } from './fpds-data-cleaner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USA_SPENDING_API = 'https://api.usaspending.gov/api/v2';

// ============================================
// Search Contract Transactions
// ============================================
// This endpoint returns ALL transactions (new awards + modifications)
// This is why you'll see 6000+ per day instead of just 12

export async function searchContractTransactions(options: {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}) {
  const { startDate, endDate, page = 1, limit = 100 } = options;

  // Use the transaction_search endpoint which includes ALL actions
  const body = {
    filters: {
      time_period: [{
        start_date: startDate,
        end_date: endDate
      }],
      award_type_codes: ['A', 'B', 'C', 'D'], // All contract types
      prime_award_types: ['contract']
    },
    fields: [
      'Award ID',
      'generated_internal_id',
      'Recipient Name', 
      'Award Amount',
      'modification_number',
      'action_date',
      'action_type',
      'action_type_description'
    ],
    limit,
    page,
    order: 'desc',
    sort: 'action_date'
  };

  const response = await fetch(`${USA_SPENDING_API}/search/spending_by_transaction/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Transaction search API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    results: data.results || [],
    hasMore: data.page_metadata?.hasNext || false,
    total: data.page_metadata?.total || 0,
    count: data.results?.length || 0
  };
}

// ============================================
// Get Full Transaction Details
// ============================================

export async function getTransactionDetails(transactionId: string): Promise<any | null> {
  try {
    const response = await fetch(`${USA_SPENDING_API}/awards/${transactionId}/`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[FPDS Transactions] Transaction ${transactionId} not found (404)`);
        return null;
      }
      throw new Error(`Transaction details API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[FPDS Transactions] Error fetching details for ${transactionId}:`, error);
    return null;
  }
}

// ============================================
// Daily Transaction Scraper (Page-by-Page)
// ============================================

async function scrapePageTransactions(
  date: string,
  page: number
): Promise<{
  success: boolean;
  found: number;
  inserted: number;
  updated: number;
  failed: number;
  hasMore: boolean;
}> {
  try {
    // Step 1: Search for transactions on this page
    const searchResult = await searchContractTransactions({
      startDate: date,
      endDate: date,
      page,
      limit: 100
    });

    const results = searchResult.results || [];
    
    if (results.length === 0) {
      return { success: true, found: 0, inserted: 0, updated: 0, failed: 0, hasMore: false };
    }

    // Extract contract IDs
    const contractIds = results.map((r: any) => r.generated_internal_id || r['Award ID']);
    console.log(`[FPDS Tx:P${page}] Found ${contractIds.length} transactions`);

    // Step 2: Fetch full details for each contract
    const fullContracts: any[] = [];
    const successfulIds: string[] = [];
    let fetchErrors = 0;

    for (let i = 0; i < contractIds.length; i++) {
      try {
        const fullData = await getTransactionDetails(contractIds[i]);
        
        if (fullData) {
          fullContracts.push(fullData);
          successfulIds.push(contractIds[i]);
        } else {
          fetchErrors++;
          // Log failed fetch
          await supabase.from('fpds_failed_contracts').insert({
            contract_id: contractIds[i],
            error_message: 'Transaction details fetch returned null',
            error_type: 'details_fetch_failed',
            date_range: date,
            page_number: page
          });
        }
      } catch (err) {
        fetchErrors++;
        await supabase.from('fpds_failed_contracts').insert({
          contract_id: contractIds[i],
          error_message: err instanceof Error ? err.message : 'Unknown error',
          error_type: 'details_fetch_failed',
          date_range: date,
          page_number: page
        });
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`[FPDS Tx:P${page}] Fetched ${i + 1}/${contractIds.length} details...`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[FPDS Tx:P${page}] Fetched ${fullContracts.length}/${contractIds.length} details`);
    
    if (fetchErrors > 0) {
      console.log(`[FPDS Tx:P${page}] Failed: ${fetchErrors} transactions`);
    }

    // Step 3: Normalize, validate, and insert
    if (fullContracts.length > 0) {
      const normalized = fullContracts.map(normalizeFullContract);
      const validated = validateContractBatch(normalized);
      
      console.log(`[FPDS Tx:P${page}] Quality: ${validated.stats.averageScore.toFixed(1)}/100`);
      
      const result = await batchInsertFullContracts(validated.cleaned);
      console.log(`[FPDS Tx:P${page}] New: ${result.inserted} | Updated: ${result.updated} | Errors: ${result.errors}`);

      return {
        success: true,
        found: contractIds.length,
        inserted: result.inserted,
        updated: result.updated,
        failed: fetchErrors,
        hasMore: searchResult.hasMore
      };
    }

    return { 
      success: true, 
      found: contractIds.length, 
      inserted: 0, 
      updated: 0, 
      failed: fetchErrors, 
      hasMore: searchResult.hasMore 
    };

  } catch (error) {
    console.error(`[FPDS Tx:P${page}] Page error:`, error);
    throw error;
  }
}

export async function scrapeDailyTransactions(date: string): Promise<{
  date: string;
  totalFound: number;
  totalInserted: number;
  totalUpdated: number;
  totalFailed: number;
  pagesProcessed: number;
}> {
  console.log(`[FPDS Transactions] Starting scrape for ${date}`);
  
  let currentPage = 1;
  let totalFound = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let pagesProcessed = 0;

  // Get total count on first request
  const firstSearch = await searchContractTransactions({
    startDate: date,
    endDate: date,
    page: 1,
    limit: 1
  });
  
  totalFound = firstSearch.total;
  console.log(`[FPDS Transactions] Total available: ${totalFound} transactions`);
  
  if (totalFound === 0) {
    return {
      date,
      totalFound: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalFailed: 0,
      pagesProcessed: 0
    };
  }

  // Process pages
  while (currentPage <= 100) { // Safety limit
    try {
      const result = await scrapePageTransactions(date, currentPage);
      
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalFailed += result.failed;
      pagesProcessed++;

      if (!result.hasMore) {
        console.log(`[FPDS Transactions] Reached end at page ${currentPage}`);
        break;
      }

      currentPage++;
    } catch (error) {
      console.error(`[FPDS Transactions] Error on page ${currentPage}:`, error);
      break; // Stop on error
    }
  }

  console.log(`[FPDS Transactions] Completed scrape for ${date}:`);
  console.log(`  Total Found: ${totalFound}`);
  console.log(`  Inserted: ${totalInserted}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Pages: ${pagesProcessed}`);

  return {
    date,
    totalFound,
    totalInserted,
    totalUpdated,
    totalFailed,
    pagesProcessed
  };
}

