// ============================================
// FPDS Contract Data Scraper
// ============================================
// Scrapes federal contract data from USASpending.gov API
// (Contains all FPDS data, no API key required!)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// USASpending.gov API base URL
const USA_SPENDING_API = 'https://api.usaspending.gov/api/v2';

// Contract type codes (A=BPA, B=Contract, C=Delivery Order, D=Purchase Order)
const CONTRACT_TYPES = ['A', 'B', 'C', 'D'];

// Delay between requests (be respectful)
const DELAY_MS = 200; // 5 requests/second

// ============================================
// API Functions
// ============================================

/**
 * Search for contracts by time period and filters
 */
export async function searchContracts(options: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  smallBusiness?: boolean;
  page?: number;
  limit?: number;
}) {
  const { startDate, endDate, smallBusiness, page = 1, limit = 100 } = options;

  const body = {
    filters: {
      time_period: [{
        start_date: startDate,
        end_date: endDate
      }],
      award_type_codes: CONTRACT_TYPES,
      ...(smallBusiness && {
        recipient_type_names: ['small_business']
      })
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Start Date',
      'End Date',
      'Award Amount',
      'Total Outlays',
      'Description',
      'def_codes',
      'Award Type',
      'Awarding Agency',
      'Awarding Sub Agency',
      'Contract Award Type',
      'recipient_id',
      'prime_award_recipient_id'
    ],
    limit,
    page
  };

  console.log(`[FPDS Scraper] Fetching contracts: ${startDate} to ${endDate}, page ${page}`);

  const response = await fetch(`${USA_SPENDING_API}/search/spending_by_award/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  console.log(`[FPDS Scraper] Found ${data.results?.length || 0} contracts`);
  
  return {
    results: data.results || [],
    hasMore: data.page_metadata?.hasNext || false,
    total: data.results?.length || 0
  };
}

/**
 * Get detailed contract information
 */
export async function getContractDetails(awardId: string, generatedId: string) {
  const response = await fetch(
    `${USA_SPENDING_API}/awards/${generatedId}/`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    console.error(`[FPDS Scraper] Error fetching details for ${awardId}: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data;
}

// ============================================
// Data Normalization
// ============================================

/**
 * Normalize USA Spending data to our database format
 */
export function normalizeContract(raw: any): any {
  // Extract basic info
  const awardId = raw['Award ID'] || raw.internal_id?.toString();
  const generatedId = raw.generated_internal_id;
  
  return {
    // Contract Identification
    piid: awardId,
    transaction_number: generatedId || `${awardId}-${Date.now()}`,
    
    // Dates
    date_signed: raw['Start Date'] ? new Date(raw['Start Date']) : null,
    current_completion_date: raw['End Date'] ? new Date(raw['End Date']) : null,
    
    // Financial
    base_and_exercised_options_value: parseFloat(raw['Award Amount']) || null,
    dollars_obligated: parseFloat(raw['Total Outlays']) || null,
    current_total_value_of_award: parseFloat(raw['Award Amount']) || null,
    
    // Vendor
    vendor_name: raw['Recipient Name'] || 'Unknown',
    vendor_uei: raw.recipient_id || null,
    
    // Agency
    contracting_agency_name: raw['Awarding Agency'] || null,
    contracting_office_name: raw['Awarding Sub Agency'] || null,
    
    // Classification
    contract_type: raw['Contract Award Type'] || raw['Award Type'] || null,
    description_of_requirement: raw['Description'] || null,
    
    // Determine if small business (simplified)
    small_business: raw['Recipient Name']?.includes('LLC') || raw['Recipient Name']?.includes('Inc') ? true : null,
    
    // Metadata
    data_source: 'usaspending.gov',
    fiscal_year: raw['Start Date'] ? new Date(raw['Start Date']).getFullYear() : null,
    calendar_year: raw['Start Date'] ? new Date(raw['Start Date']).getFullYear() : null,
    last_scraped: new Date().toISOString(),
    
    // Store original ID for fetching details later
    award_id_piid: awardId,
    parent_award_id_piid: generatedId
  };
}

// ============================================
// Database Operations
// ============================================

/**
 * Batch insert contracts
 */
export async function batchInsertContracts(contracts: any[], batchSize: number = 500) {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < contracts.length; i += batchSize) {
    const batch = contracts.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('fpds_contracts')
        .upsert(batch, {
          onConflict: 'transaction_number',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error(`[FPDS Scraper] Batch error:`, error.message);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`[FPDS Scraper] Batch ${Math.floor(i / batchSize) + 1}: Inserted ${data?.length || 0} contracts`);
      }
    } catch (error) {
      console.error(`[FPDS Scraper] Batch exception:`, error);
      errors += batch.length;
    }
  }

  return { inserted, updated, errors };
}

/**
 * Log scraper run
 */
export async function logScraperRun(log: {
  scrape_type: string;
  fiscal_year?: number;
  date_range?: string;
  records_found: number;
  records_inserted: number;
  records_updated: number;
  records_skipped: number;
  records_errors: number;
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('fpds_scraper_log')
      .insert(log)
      .select();

    if (error) {
      console.error('[FPDS Scraper] Error logging run:', error);
    }

    return data;
  } catch (error) {
    console.error('[FPDS Scraper] Log error:', error);
  }
}

// ============================================
// Bulk Scraping
// ============================================

/**
 * Scrape contracts for a specific date range
 */
export async function scrapeDateRange(
  startDate: string,
  endDate: string,
  options: {
    smallBusiness?: boolean;
    maxPages?: number;
  } = {}
) {
  const { smallBusiness = false, maxPages = 100 } = options;
  const startTime = new Date();

  console.log(`[FPDS Scraper] Starting scrape: ${startDate} to ${endDate}`);
  if (smallBusiness) console.log(`[FPDS Scraper] Filter: Small Business only`);

  const allContracts: any[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore && page <= maxPages) {
      const result = await searchContracts({
        startDate,
        endDate,
        smallBusiness,
        page,
        limit: 100
      });

      if (result.results.length > 0) {
        const normalized = result.results.map(normalizeContract);
        allContracts.push(...normalized);
      }

      hasMore = result.hasMore;
      page++;

      // Delay between requests
      if (hasMore) {
        await sleep(DELAY_MS);
      }
    }

    console.log(`[FPDS Scraper] Total contracts fetched: ${allContracts.length}`);

    // Batch insert
    const result = await batchInsertContracts(allContracts);

    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Log the run
    await logScraperRun({
      scrape_type: 'date_range',
      date_range: `${startDate} to ${endDate}`,
      records_found: allContracts.length,
      records_inserted: result.inserted,
      records_updated: result.updated,
      records_skipped: 0,
      records_errors: result.errors,
      status: 'completed',
      started_at: startTime,
      completed_at: endTime,
      duration_seconds: durationSeconds
    });

    console.log(`[FPDS Scraper] Complete in ${durationSeconds}s`);
    console.log(`[FPDS Scraper] Inserted: ${result.inserted}, Errors: ${result.errors}`);

    return result;
  } catch (error) {
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await logScraperRun({
      scrape_type: 'date_range',
      date_range: `${startDate} to ${endDate}`,
      records_found: allContracts.length,
      records_inserted: 0,
      records_updated: 0,
      records_skipped: 0,
      records_errors: allContracts.length,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      started_at: startTime,
      completed_at: endTime,
      duration_seconds: durationSeconds
    });

    throw error;
  }
}

/**
 * Scrape full fiscal year
 */
export async function scrapeFiscalYear(year: number, smallBusiness: boolean = false) {
  // Federal fiscal year: Oct 1 (year-1) to Sep 30 (year)
  const startDate = `${year - 1}-10-01`;
  const endDate = `${year}-09-30`;

  return scrapeDateRange(startDate, endDate, { smallBusiness, maxPages: 1000 });
}

// ============================================
// Utility Functions
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get scraper statistics
 */
export async function getScraperStats() {
  try {
    // Total contracts
    const { count: totalContracts } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });

    // Recent runs
    const { data: recentRuns } = await supabase
      .from('fpds_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    return {
      totalContracts: totalContracts || 0,
      recentRuns: recentRuns || []
    };
  } catch (error) {
    console.error('[FPDS Scraper] Error getting stats:', error);
    throw error;
  }
}

