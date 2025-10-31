// ============================================
// SBIR Awards Scraper Service
// ============================================

import { createClient } from '@supabase/supabase-js';
import type { SBIRgovAwardResponse, SBIRgovAward, SBIRAward } from '@/types/sbir-awards';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SBIR.gov API Configuration
const SBIR_API_BASE_URL = 'https://api.www.sbir.gov/public/api/awards';
const DELAY_BETWEEN_REQUESTS_MS = 500; // Be respectful to the API

// Supported agencies
export const AGENCIES = [
  'DOD', 'DOE', 'NASA', 'NIH', 'NSF', 
  'DOT', 'DHS', 'ED', 'EPA', 'USDA', 'DOC'
];

// ============================================
// Main Scraper Functions
// ============================================

/**
 * Fetch awards from SBIR.gov API
 */
export async function fetchAwardsFromAPI(
  agency: string,
  year: number,
  options: {
    phase?: string;
    rows?: number;
    start?: number;
  } = {}
): Promise<SBIRgovAward[]> {
  const { phase, rows = 1000, start = 0 } = options;
  
  // Build query parameters
  const params = new URLSearchParams({
    agency,
    year: year.toString(),
    rows: rows.toString(),
    start: start.toString(),
    format: 'json'
  });
  
  if (phase) {
    params.append('phase', phase);
  }
  
  const url = `${SBIR_API_BASE_URL}?${params.toString()}`;
  
  console.log(`[SBIR Scraper] Fetching: ${agency} ${year} (rows: ${rows}, start: ${start})`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PropShopAI-SBIRScraper/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data: SBIRgovAwardResponse = await response.json();
    
    console.log(`[SBIR Scraper] Found ${data.response.numFound} total awards, fetched ${data.response.docs.length}`);
    
    return data.response.docs;
  } catch (error) {
    console.error(`[SBIR Scraper] Error fetching awards:`, error);
    throw error;
  }
}

/**
 * Fetch all awards for an agency/year (handles pagination)
 */
export async function fetchAllAwards(
  agency: string,
  year: number
): Promise<SBIRgovAward[]> {
  const allAwards: SBIRgovAward[] = [];
  let start = 0;
  const rows = 1000; // Max per request
  
  while (true) {
    const awards = await fetchAwardsFromAPI(agency, year, { rows, start });
    allAwards.push(...awards);
    
    if (awards.length < rows) {
      // No more results
      break;
    }
    
    start += rows;
    
    // Delay between requests
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }
  
  console.log(`[SBIR Scraper] Fetched total of ${allAwards.length} awards for ${agency} ${year}`);
  
  return allAwards;
}

// ============================================
// Data Normalization
// ============================================

/**
 * Normalize raw API data to database format
 */
export function normalizeAward(rawAward: SBIRgovAward): Partial<SBIRAward> {
  return {
    contract_award_number: rawAward.contract || `UNKNOWN-${Date.now()}`,
    award_year: parseInt(rawAward.award_year || '0'),
    award_date: rawAward.proposal_award_date ? new Date(rawAward.proposal_award_date) : undefined,
    
    topic_number: rawAward.topic_code || null,
    solicitation_id: rawAward.solicitation_number || null,
    solicitation_number: rawAward.solicitation_number || null,
    
    award_title: rawAward.award_title || 'Untitled',
    abstract: rawAward.abstract || null,
    phase: normalizePhase(rawAward.phase),
    program: normalizeProgram(rawAward.program),
    award_amount: parseAwardAmount(rawAward.award_amount),
    
    agency: rawAward.agency || 'Unknown',
    agency_id: rawAward.agency || 'UNKNOWN',
    branch_of_service: rawAward.branch || null,
    component: rawAward.branch || null,
    
    company: rawAward.firm || 'Unknown Company',
    duns: rawAward.duns || null,
    firm_address: rawAward.address1 ? `${rawAward.address1}${rawAward.address2 ? ' ' + rawAward.address2 : ''}` : null,
    firm_city: rawAward.city || null,
    firm_state: rawAward.state || null,
    firm_zip: rawAward.zip || null,
    firm_phone: rawAward.poc_phone || null,
    firm_website: rawAward.company_url || null,
    
    hubzone_owned: rawAward.hubzone_owned === 'Y',
    woman_owned: rawAward.women_owned === 'Y', // Note: API uses "women_owned"
    socially_economically_disadvantaged: rawAward.socially_economically_disadvantaged === 'Y',
    veteran_owned: false, // Not in API, default to false
    
    research_institution: rawAward.ri_name || null,
    ri_location: null, // Not directly in API
    
    program_manager: rawAward.poc_name || null,
    program_manager_email: rawAward.poc_email || null,
    program_manager_phone: rawAward.poc_phone || null,
    
    keywords: rawAward.research_area_keywords ? rawAward.research_area_keywords.split(',').map(k => k.trim()) : undefined,
    
    data_source: 'sbir.gov',
    last_scraped: new Date(),
  };
}

/**
 * Parse award amount from string like "$150,000" to number
 */
function parseAwardAmount(amountStr?: string): number | null {
  if (!amountStr) return null;
  
  // Remove $, commas, and spaces
  const cleaned = amountStr.replace(/[\$,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? null : amount;
}

/**
 * Normalize phase string
 */
function normalizePhase(phase?: string): 'Phase I' | 'Phase II' | 'Phase III' {
  if (!phase) return 'Phase I';
  
  const normalized = phase.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (normalized.includes('phase2') || normalized.includes('phaseii') || normalized.includes('ii')) {
    return 'Phase II';
  } else if (normalized.includes('phase3') || normalized.includes('phaseiii') || normalized.includes('iii')) {
    return 'Phase III';
  } else {
    return 'Phase I';
  }
}

/**
 * Normalize program string
 */
function normalizeProgram(program?: string): 'SBIR' | 'STTR' {
  if (!program) return 'SBIR';
  return program.toUpperCase().includes('STTR') ? 'STTR' : 'SBIR';
}

// ============================================
// Database Operations
// ============================================

/**
 * Insert or update award in database
 */
export async function upsertAward(award: Partial<SBIRAward>) {
  try {
    const { data, error } = await supabase
      .from('sbir_awards')
      .upsert(award, {
        onConflict: 'contract_award_number',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('[SBIR Scraper] Error upserting award:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[SBIR Scraper] Database error:', error);
    throw error;
  }
}

/**
 * Batch insert awards (more efficient)
 */
export async function batchInsertAwards(awards: Partial<SBIRAward>[]) {
  const BATCH_SIZE = 100;
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < awards.length; i += BATCH_SIZE) {
    const batch = awards.slice(i, i + BATCH_SIZE);
    
    try {
      const { data, error } = await supabase
        .from('sbir_awards')
        .upsert(batch, {
          onConflict: 'contract_award_number',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error(`[SBIR Scraper] Batch ${i / BATCH_SIZE + 1} error:`, error);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
      }
    } catch (error) {
      console.error(`[SBIR Scraper] Batch ${i / BATCH_SIZE + 1} exception:`, error);
      errors += batch.length;
    }
    
    console.log(`[SBIR Scraper] Batch ${i / BATCH_SIZE + 1}/${Math.ceil(awards.length / BATCH_SIZE)} processed`);
  }
  
  return { inserted, updated, errors };
}

/**
 * Log scraper run
 */
export async function logScraperRun(log: {
  scrape_type: string;
  agency?: string;
  year_range?: string;
  records_found: number;
  records_inserted: number;
  records_updated: number;
  records_skipped: number;
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('sbir_awards_scraper_log')
      .insert(log)
      .select();
    
    if (error) {
      console.error('[SBIR Scraper] Error logging scraper run:', error);
    }
    
    return data;
  } catch (error) {
    console.error('[SBIR Scraper] Log error:', error);
  }
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Scrape all awards for a specific agency and year
 */
export async function scrapeAgencyYear(agency: string, year: number) {
  const startTime = new Date();
  
  console.log(`[SBIR Scraper] Starting scrape: ${agency} ${year}`);
  
  try {
    // Fetch all awards
    const rawAwards = await fetchAllAwards(agency, year);
    
    // Normalize awards
    const normalizedAwards = rawAwards.map(normalizeAward);
    
    // Batch insert
    const result = await batchInsertAwards(normalizedAwards);
    
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Log the run
    await logScraperRun({
      scrape_type: 'agency_specific',
      agency,
      year_range: year.toString(),
      records_found: rawAwards.length,
      records_inserted: result.inserted,
      records_updated: result.updated,
      records_skipped: result.errors,
      status: 'completed',
      started_at: startTime,
      completed_at: endTime,
      duration_seconds: durationSeconds
    });
    
    console.log(`[SBIR Scraper] Completed: ${agency} ${year} in ${durationSeconds}s`);
    console.log(`[SBIR Scraper] Results: ${result.inserted} inserted, ${result.errors} errors`);
    
    return result;
  } catch (error) {
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    await logScraperRun({
      scrape_type: 'agency_specific',
      agency,
      year_range: year.toString(),
      records_found: 0,
      records_inserted: 0,
      records_updated: 0,
      records_skipped: 0,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      started_at: startTime,
      completed_at: endTime,
      duration_seconds: durationSeconds
    });
    
    throw error;
  }
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
    // Total awards
    const { count: totalAwards } = await supabase
      .from('sbir_awards')
      .select('*', { count: 'exact', head: true });
    
    // Total companies
    const { count: totalCompanies } = await supabase
      .from('sbir_companies')
      .select('*', { count: 'exact', head: true });
    
    // Recent scraper runs
    const { data: recentRuns } = await supabase
      .from('sbir_awards_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
    
    return {
      totalAwards,
      totalCompanies,
      recentRuns
    };
  } catch (error) {
    console.error('[SBIR Scraper] Error getting stats:', error);
    throw error;
  }
}

