// ============================================
// FPDS Full Details Scraper
// ============================================
// Scrapes federal contract data with FULL details
// Much slower but WAY more comprehensive!

import { createClient } from '@supabase/supabase-js';
import { validateContractBatch } from './fpds-data-cleaner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USA_SPENDING_API = 'https://api.usaspending.gov/api/v2';
const CONTRACT_TYPES = ['A', 'B', 'C', 'D'];

// Slower rate limiting for details fetching
const SEARCH_DELAY_MS = 200; // 5 searches/second
const DETAILS_DELAY_MS = 500; // 2 details/second (more conservative)

// ============================================
// Resume Logic - Track Progress
// ============================================

async function getLastCompletedPage(startDate: string, endDate: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('fpds_scraper_log')
      .select('records_found')
      .eq('scrape_type', 'full_details_2025')
      .eq('date_range', `${startDate}_to_${endDate}`)
      .eq('status', 'running')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('[FPDS Full] No previous progress found, starting from page 1');
      return 1;
    }

    // Calculate last completed page (100 contracts per page)
    const lastPage = Math.floor(data.records_found / 100);
    
    // Resume from 1 page before for safety (in case last page was partial)
    const resumePage = Math.max(1, lastPage - 1);
    
    console.log(`[FPDS Full] 📍 RESUMING from page ${resumePage} (last completed: ${lastPage})`);
    return resumePage;
  } catch (err) {
    console.log('[FPDS Full] Error checking progress, starting from page 1:', err);
    return 1;
  }
}

async function saveProgress(
  startDate: string,
  endDate: string,
  currentPage: number,
  totalProcessed: number,
  totalInserted: number,
  totalErrors: number
): Promise<void> {
  try {
    const dateRangeKey = `${startDate}_to_${endDate}`;
    
    // Check if record exists
    const { data: existing } = await supabase
      .from('fpds_scraper_log')
      .select('id, started_at')
      .eq('scrape_type', 'full_details_2025')
      .eq('date_range', dateRangeKey)
      .single();
    
    if (existing) {
      // Update existing record (preserve started_at, updated_at auto-updated by trigger)
      const { error } = await supabase
        .from('fpds_scraper_log')
        .update({
          records_found: totalProcessed,
          records_inserted: totalInserted,
          records_errors: totalErrors,
          status: 'running'
        })
        .eq('id', existing.id);
      
      if (error) {
        console.log('[FPDS Full] ⚠️  Failed to save progress:', error.message);
      } else {
        console.log(`[FPDS Full] 💾 Progress saved: Page ${currentPage}, ${totalInserted} contracts`);
      }
    } else {
      // Insert new record (timestamps auto-set by defaults)
      const { error } = await supabase
        .from('fpds_scraper_log')
        .insert({
          scrape_type: 'full_details_2025',
          date_range: dateRangeKey,
          records_found: totalProcessed,
          records_inserted: totalInserted,
          records_errors: totalErrors,
          status: 'running'
        });
      
      if (error) {
        console.log('[FPDS Full] ⚠️  Failed to create progress log:', error.message);
      } else {
        console.log(`[FPDS Full] 💾 Progress log created: Page ${currentPage}, ${totalInserted} contracts`);
      }
    }
  } catch (err) {
    console.log('[FPDS Full] ⚠️  Error saving progress:', err);
  }
}

// ============================================
// Search Functions (Get List of Contracts)
// ============================================

export async function searchContracts(options: {
  startDate: string;
  endDate: string;
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
      'generated_internal_id'
    ],
    limit,
    page
  };

  console.log(`[FPDS Full] Searching contracts: ${startDate} to ${endDate}, page ${page}`);

  const response = await fetch(`${USA_SPENDING_API}/search/spending_by_award/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    results: data.results || [],
    hasMore: data.page_metadata?.hasNext || false,
    total: data.results?.length || 0
  };
}

// ============================================
// Details Fetching (Get Full Contract Data)
// ============================================

export async function getContractFullDetails(generatedId: string): Promise<any | null> {
  try {
    const response = await fetch(`${USA_SPENDING_API}/awards/${generatedId}/`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[FPDS Full] Contract ${generatedId} not found (404)`);
        return null;
      }
      throw new Error(`Details API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[FPDS Full] Error fetching details for ${generatedId}:`, error);
    return null;
  }
}

// ============================================
// Full Data Normalization
// ============================================

export function normalizeFullContract(fullData: any): any {
  // Helper to safely extract nested data
  const get = (obj: any, path: string, defaultVal: any = null) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultVal;
  };

  // Parse business types
  const businessTypes = get(fullData, 'recipient.business_types_description', '') || '';
  
  return {
    // Contract Identification
    piid: fullData.piid || null,
    transaction_number: fullData.generated_unique_award_id || `${fullData.piid}-${Date.now()}`,
    referenced_idv_piid: get(fullData, 'latest_transaction_contract_data.referenced_idv_agency_iden'),
    
    // Dates (CORRECTED PATHS)
    date_signed: fullData.date_signed || null, // At root level, not nested
    effective_date: get(fullData, 'period_of_performance.start_date'), // Simplified path
    current_completion_date: get(fullData, 'period_of_performance.end_date'), // Simplified path
    ultimate_completion_date: get(fullData, 'period_of_performance.potential_end_date'),
    period_of_performance_start: get(fullData, 'period_of_performance.start_date'), // Simplified path
    period_of_performance_end: get(fullData, 'period_of_performance.end_date'), // Simplified path
    
    // Financial
    base_and_exercised_options_value: fullData.base_and_exercised_options_value || null,
    base_and_all_options_value: fullData.base_and_all_options_value || null,
    dollars_obligated: fullData.total_obligation || null,
    current_total_value_of_award: fullData.total_obligation || fullData.base_and_exercised_options_value || null,
    
    // Vendor (Recipient)
    vendor_name: get(fullData, 'recipient.recipient_name') || 'Unknown',
    vendor_duns: get(fullData, 'recipient.recipient_duns'),
    vendor_uei: get(fullData, 'recipient.recipient_uei'),
    vendor_cage_code: get(fullData, 'latest_transaction_contract_data.cage_code'),
    vendor_address: get(fullData, 'recipient.location.address_line1'),
    vendor_city: get(fullData, 'recipient.location.city_name'),
    vendor_state: get(fullData, 'recipient.location.state_code'),
    vendor_zip: get(fullData, 'recipient.location.zip5'),
    vendor_country: get(fullData, 'recipient.location.country_name', 'USA'),
    parent_company_name: get(fullData, 'recipient.parent_recipient_name'),
    parent_duns: get(fullData, 'recipient.parent_duns'),
    parent_uei: get(fullData, 'recipient.parent_uei'),
    
    // Socioeconomic Flags
    small_business: businessTypes.toLowerCase().includes('small business'),
    woman_owned_small_business: businessTypes.toLowerCase().includes('woman'),
    veteran_owned_small_business: businessTypes.toLowerCase().includes('veteran'),
    service_disabled_veteran_owned: businessTypes.toLowerCase().includes('service-disabled veteran'),
    hubzone_small_business: businessTypes.toLowerCase().includes('hubzone'),
    eight_a_program_participant: businessTypes.toLowerCase().includes('8(a)'),
    historically_black_college: businessTypes.toLowerCase().includes('historically black'),
    
    // Classification (CORRECTED PATHS)
    naics_code: get(fullData, 'latest_transaction_contract_data.naics'), // Just 'naics', not 'naics_code'
    naics_description: get(fullData, 'latest_transaction_contract_data.naics_description'),
    psc_code: get(fullData, 'latest_transaction_contract_data.product_or_service_code'),
    psc_description: get(fullData, 'latest_transaction_contract_data.product_or_service_code_description'),
    contract_type: get(fullData, 'latest_transaction_contract_data.contract_award_type'),
    type_of_contract_pricing: get(fullData, 'latest_transaction_contract_data.type_of_contract_pricing'),
    
    // Agency
    contracting_agency_name: get(fullData, 'awarding_agency.toptier_agency.name'),
    contracting_agency_id: get(fullData, 'awarding_agency.toptier_agency.abbreviation'),
    funding_agency_name: get(fullData, 'funding_agency.toptier_agency.name'),
    funding_agency_id: get(fullData, 'funding_agency.toptier_agency.abbreviation'),
    contracting_office_name: get(fullData, 'awarding_agency.subtier_agency.name'),
    contracting_office_id: get(fullData, 'awarding_agency.subtier_agency.abbreviation'),
    
    // Competition
    extent_competed: get(fullData, 'latest_transaction_contract_data.extent_competed'),
    number_of_offers_received: get(fullData, 'latest_transaction_contract_data.number_of_offers_received'),
    solicitation_id: get(fullData, 'latest_transaction_contract_data.solicitation_identifier'),
    type_of_set_aside: get(fullData, 'latest_transaction_contract_data.type_of_set_aside'),
    fair_opportunity_limited_sources: get(fullData, 'latest_transaction_contract_data.fair_opportunity_limited_sources'),
    
    // Work Details
    description_of_requirement: fullData.description || get(fullData, 'latest_transaction_contract_data.award_description'),
    place_of_performance_city: get(fullData, 'place_of_performance.city_name'),
    place_of_performance_state: get(fullData, 'place_of_performance.state_code'),
    place_of_performance_country: get(fullData, 'place_of_performance.country_name'),
    place_of_performance_zip: get(fullData, 'place_of_performance.zip5'),
    place_of_performance_congressional_district: get(fullData, 'place_of_performance.congressional_code'),
    
    // SBIR/R&D Specific
    is_research: get(fullData, 'latest_transaction_contract_data.research') === 'RES' || 
                 get(fullData, 'latest_transaction_contract_data.research') === 'R&D',
    research_type: get(fullData, 'latest_transaction_contract_data.research'),
    sbir_phase: null, // Not in standard contracts
    sbir_program: null,
    sbir_topic_number: null,
    
    // Additional Details
    contract_award_unique_key: get(fullData, 'latest_transaction_contract_data.contract_award_unique_key'),
    award_id_piid: fullData.piid,
    parent_award_id_piid: get(fullData, 'latest_transaction_contract_data.parent_award_piid'),
    
    // Metadata
    data_source: 'usaspending.gov-full',
    // Calculate fiscal_year from date_signed (US fiscal year starts Oct 1)
    fiscal_year: (() => {
      const dateSigned = fullData.date_signed || get(fullData, 'period_of_performance.start_date');
      if (!dateSigned) return null;
      const date = new Date(dateSigned);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      // If month >= 10 (Oct, Nov, Dec), fiscal year is next year
      return month >= 9 ? year + 1 : year;
    })(),
    calendar_year: (() => {
      const startDate = fullData.date_signed || get(fullData, 'period_of_performance.start_date');
      return startDate ? new Date(startDate).getFullYear() : null;
    })(),
    last_modified_date: get(fullData, 'period_of_performance.last_modified_date'),
    
    // SAM.gov search link (Phase 1 - search by solicitation_id)
    // Note: Using search URL because SAM.gov uses internal Notice IDs, not solicitation numbers
    sam_gov_opportunity_url: (() => {
      const solicitationId = get(fullData, 'latest_transaction_contract_data.solicitation_identifier');
      return solicitationId ? `https://sam.gov/search/?index=opp&q=${solicitationId}` : null;
    })(),
    
    last_scraped: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// ============================================
// Database Operations
// ============================================

export async function batchInsertFullContracts(contracts: any[], batchSize: number = 250) {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < contracts.length; i += batchSize) {
    const batch = contracts.slice(i, i + batchSize);
    
    try {
      // Check which contracts already exist
      const transactionNumbers = batch.map((c: any) => c.transaction_number);
      const { data: existing, error: checkError } = await supabase
        .from('fpds_contracts')
        .select('transaction_number')
        .in('transaction_number', transactionNumbers);
      
      const existingIds = new Set(existing?.map((e: any) => e.transaction_number) || []);
      const newCount = batch.filter((c: any) => !existingIds.has(c.transaction_number)).length;
      const updateCount = batch.length - newCount;

      // Now do the upsert
      const { data, error } = await supabase
        .from('fpds_contracts')
        .upsert(batch, {
          onConflict: 'transaction_number',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error(`[FPDS Full] Batch error:`, error.message);
        errors += batch.length;
      } else {
        inserted += newCount;
        updated += updateCount;
      }
    } catch (error) {
      console.error(`[FPDS Full] Batch exception:`, error);
      errors += batch.length;
    }
  }

  return { inserted, updated, errors };
}

// ============================================
// Failed Contract Logging
// ============================================

async function logFailedContract(
  contractId: string,
  errorMessage: string,
  errorType: string,
  dateRange: string,
  pageNumber: number,
  scrapeRunId?: number
) {
  try {
    const { error } = await supabase
      .from('fpds_failed_contracts')
      .insert({
        contract_id: contractId,
        error_message: errorMessage.substring(0, 500), // Limit message length
        error_type: errorType,
        date_range: dateRange,
        page_number: pageNumber,
        scrape_run_id: scrapeRunId,
        attempt_count: 1
      });
    
    if (error) {
      console.error('[FPDS Full] Failed to log contract failure:', error.message);
    }
  } catch (err) {
    // Silent fail - don't let logging errors stop the scraper
  }
}

// ============================================
// Full Scraping with Details
// ============================================

export async function scrapeDateRangeWithFullDetails(
  startDate: string,
  endDate: string,
  options: {
    smallBusiness?: boolean;
    maxContracts?: number;
    resumeFrom?: number;
  } = {}
) {
  const { smallBusiness = false, maxContracts = 10000 } = options;
  const startTime = new Date();

  console.log(`[FPDS Full] Starting FULL scrape: ${startDate} to ${endDate}`);
  console.log(`[FPDS Full] Max contracts: ${maxContracts}`);
  if (smallBusiness) console.log(`[FPDS Full] Filter: Small Business only`);

  // Get last completed page from database (resume logic)
  let page = await getLastCompletedPage(startDate, endDate);

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  
  try {
    while (totalProcessed < maxContracts) {
      // Step 1: Search for contracts (fast)
      const searchResult = await searchContracts({
        startDate,
        endDate,
        smallBusiness,
        page,
        limit: 100
      });

      if (searchResult.results.length === 0) {
        console.log(`[FPDS Full] No more contracts found`);
        break;
      }

      console.log(`\n[FPDS Full] Page ${page}: Found ${searchResult.results.length} contracts`);
      console.log(`[FPDS Full] Fetching full details... (this takes ~1 minute per 100 contracts)`);

      // Step 2: Fetch full details for each contract (slow)
      const enrichedContracts: any[] = [];
      
      for (let i = 0; i < searchResult.results.length; i++) {
        const basicContract = searchResult.results[i];
        
        // Show progress every 10 contracts
        if ((i + 1) % 10 === 0) {
          console.log(`[FPDS Full]   Fetched ${i + 1}/${searchResult.results.length} details...`);
        }

        try {
          const fullDetails = await getContractFullDetails(basicContract.generated_internal_id);
          
          if (fullDetails) {
            const normalized = normalizeFullContract(fullDetails);
            enrichedContracts.push(normalized);
          } else {
            // If details fetch fails, log and skip this contract
            totalErrors++;
            await logFailedContract(
              basicContract.generated_internal_id,
              'Failed to fetch contract details',
              'details_fetch_failed',
              `${startDate} to ${endDate}`,
              page
            );
          }

          // Rate limiting
          await sleep(DETAILS_DELAY_MS);
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[FPDS Full] Error enriching contract ${basicContract['Award ID']}:`, error);
          totalErrors++;
          
          // Log failed contract
          await logFailedContract(
            basicContract.generated_internal_id,
            errorMsg,
            'enrichment_error',
            `${startDate} to ${endDate}`,
            page
          );
        }
      }

      // Step 3: Clean and validate contracts
      if (enrichedContracts.length > 0) {
        console.log(`[FPDS Full] Cleaning and validating ${enrichedContracts.length} contracts...`);
        const { cleaned, stats } = validateContractBatch(enrichedContracts);
        
        console.log(`[FPDS Full] Data Quality: ${stats.averageScore.toFixed(1)}/100 avg score`);
        console.log(`[FPDS Full]   High Quality: ${stats.highQuality}, Medium: ${stats.mediumQuality}, Low: ${stats.lowQuality}`);
        if (stats.suspicious > 0) {
          console.log(`[FPDS Full]   ⚠️  Suspicious: ${stats.suspicious}`);
        }
        
        // Step 4: Batch insert cleaned contracts
        console.log(`[FPDS Full] Inserting ${cleaned.length} cleaned contracts...`);
        const result = await batchInsertFullContracts(cleaned);
        totalInserted += result.inserted;
        totalErrors += result.errors;
      }

      totalProcessed += searchResult.results.length;
      
      console.log(`[FPDS Full] Progress: ${totalProcessed}/${maxContracts} contracts processed`);
      console.log(`[FPDS Full] Inserted: ${totalInserted}, Errors: ${totalErrors}`);

      // Save progress after each successful page
      await saveProgress(startDate, endDate, page, totalProcessed, totalInserted, totalErrors);

      // Check if we should continue
      if (!searchResult.hasMore || totalProcessed >= maxContracts) {
        break;
      }

      page++;
      await sleep(SEARCH_DELAY_MS);
    }

    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Mark scrape as completed
    await supabase
      .from('fpds_scraper_log')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('scrape_type', 'full_details_2025')
      .eq('date_range', `${startDate}_to_${endDate}`);

    console.log(`\n[FPDS Full] ========================================`);
    console.log(`[FPDS Full] ✅ Scrape Complete!`);
    console.log(`[FPDS Full] ========================================`);
    console.log(`[FPDS Full] Processed: ${totalProcessed} contracts`);
    console.log(`[FPDS Full] Inserted: ${totalInserted}`);
    console.log(`[FPDS Full] Errors: ${totalErrors}`);
    console.log(`[FPDS Full] Duration: ${Math.floor(durationSeconds / 60)} minutes`);

    return { 
      totalProcessed, 
      totalInserted, 
      totalErrors, 
      avgQualityScore: 0 
    };
    
  } catch (error) {
    console.error('[FPDS Full] Fatal error:', error);
    throw error;
  }
}

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getScraperStats() {
  const { count: totalContracts } = await supabase
    .from('fpds_contracts')
    .select('*', { count: 'exact', head: true });

  const { data: recentRuns } = await supabase
    .from('fpds_scraper_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  return {
    totalContracts: totalContracts || 0,
    recentRuns: recentRuns || []
  };
}

