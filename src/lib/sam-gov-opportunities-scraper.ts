/**
 * ============================================
 * SAM.gov Contract Opportunities Scraper
 * ============================================
 * 
 * Scrapes contract solicitations and opportunities from SAM.gov API
 * Links them to FPDS contracts via solicitation_number
 * 
 * API Documentation: https://open.gsa.gov/api/opportunities-api/
 * 
 * ============================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SAM_GOV_API_BASE = 'https://api.sam.gov/opportunities/v2/search';

// Lazy initialization - don't create client until needed
let supabase: SupabaseClient | null = null;
let SAM_GOV_API_KEYS: string[] = [];
let currentKeyIndex = 0;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

function initializeApiKeys() {
  if (SAM_GOV_API_KEYS.length === 0) {
    // Support multiple API keys for rotation
    const key1 = process.env.SAM_GOV_API_KEY || process.env.SAM_GOV_API_KEY_1;
    const key2 = process.env.SAM_GOV_API_KEY_2;
    
    if (key1) SAM_GOV_API_KEYS.push(key1);
    if (key2) SAM_GOV_API_KEYS.push(key2);
    
    if (SAM_GOV_API_KEYS.length === 0) {
      throw new Error('Missing SAM_GOV_API_KEY in environment. Please set SAM_GOV_API_KEY or SAM_GOV_API_KEY_1');
    }
    
    console.log(`[SAM.gov] Initialized with ${SAM_GOV_API_KEYS.length} API key(s)`);
  }
}

function getApiKey(): string {
  initializeApiKeys();
  return SAM_GOV_API_KEYS[currentKeyIndex];
}

function rotateApiKey(): boolean {
  initializeApiKeys();
  
  if (SAM_GOV_API_KEYS.length <= 1) {
    console.log('[SAM.gov] No additional API keys available for rotation');
    return false;
  }
  
  currentKeyIndex = (currentKeyIndex + 1) % SAM_GOV_API_KEYS.length;
  console.log(`[SAM.gov] Rotated to API key ${currentKeyIndex + 1}/${SAM_GOV_API_KEYS.length}`);
  return true;
}

function resetApiKeyRotation() {
  currentKeyIndex = 0;
}

// ============================================
// Types
// ============================================

interface SAMOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  fullParentPathCode?: string;
  postedDate?: string;
  type?: string;
  baseType?: string;
  archiveType?: string;
  archiveDate?: string;
  typeOfSetAsideDescription?: string;
  typeOfSetAside?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  classificationCode?: string;
  active?: string;
  award?: any;
  pointOfContact?: any[];
  description?: string;
  organizationLocationCityName?: string;
  organizationLocationStateCode?: string;
  organizationLocationCountryCode?: string;
  organizationLocationZIPCode?: string;
  additionalInfoText?: string;
  uiLink?: string;
  links?: any[];
  resourceLinks?: any[];
}

interface ScraperOptions {
  postedFrom?: string;      // YYYY-MM-DD
  postedTo?: string;        // YYYY-MM-DD
  limit?: number;           // Opportunities per page (max 1000)
  includeAwards?: boolean;  // Include awarded opportunities
}

// ============================================
// API Client
// ============================================

export class SAMGovOpportunitiesScraper {
  
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search opportunities with pagination
   * Supports automatic API key rotation on rate limit errors
   */
  async searchOpportunities(options: ScraperOptions = {}, offset: number = 0, retryCount: number = 0): Promise<{ opportunities: SAMOpportunity[]; hasMore: boolean }> {
    const {
      postedFrom = this.getDateDaysAgo(30), // Default: Last 30 days
      postedTo = this.getToday(),
      limit = 100,
      includeAwards = true
    } = options;

    const params = new URLSearchParams({
      api_key: getApiKey(),
      postedFrom,
      postedTo,
      limit: limit.toString(),
      offset: offset.toString(),
      ptype: 'o,s,k,r', // Opportunity types: o=Solicitation, s=Sources Sought, k=Special Notice, r=Request for Information
    });

    try {
      const url = `${SAM_GOV_API_BASE}?${params}`;
      console.log(`[SAM.gov] Fetching opportunities: offset=${offset}, limit=${limit}`);
      console.log(`[SAM.gov] URL: ${url.substring(0, 150)}...`);
      console.log(`[SAM.gov] Date range: ${postedFrom} to ${postedTo}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Handle rate limiting with automatic key rotation
      if (response.status === 429) {
        const errorText = await response.text();
        console.warn(`[SAM.gov] Rate limit hit (429). Attempting API key rotation...`);
        
        if (retryCount < SAM_GOV_API_KEYS.length - 1) {
          const rotated = rotateApiKey();
          if (rotated) {
            console.log(`[SAM.gov] Retrying with different API key...`);
            await this.delay(2000); // Brief delay before retry
            return this.searchOpportunities(options, offset, retryCount + 1);
          }
        }
        
        console.error(`[SAM.gov] All API keys exhausted. Rate limit error: ${errorText.substring(0, 500)}`);
        throw new Error(`SAM.gov API rate limit exceeded: ${errorText}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SAM.gov] API Response: ${errorText.substring(0, 500)}`);
        throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const opportunities = data.opportunitiesData || [];
      const totalRecords = data.totalRecords || 0;
      const hasMore = (offset + opportunities.length) < totalRecords;

      console.log(`[SAM.gov] Found ${opportunities.length} opportunities (${offset + opportunities.length}/${totalRecords})`);

      return { opportunities, hasMore };

    } catch (error) {
      console.error('[SAM.gov] Error fetching opportunities:', error);
      throw error;
    }
  }

  /**
   * Get full details for a single opportunity
   * Supports automatic API key rotation on rate limit errors
   */
  async getOpportunityDetails(noticeId: string, retryCount: number = 0): Promise<any> {
    const url = `https://api.sam.gov/opportunities/v2/opportunities/${noticeId}?api_key=${getApiKey()}`;
    
    try {
      const response = await fetch(url);
      
      // Handle rate limiting with automatic key rotation
      if (response.status === 429) {
        console.warn(`[SAM.gov] Rate limit hit for ${noticeId}. Attempting API key rotation...`);
        
        if (retryCount < SAM_GOV_API_KEYS.length - 1) {
          const rotated = rotateApiKey();
          if (rotated) {
            console.log(`[SAM.gov] Retrying ${noticeId} with different API key...`);
            await this.delay(2000); // Brief delay before retry
            return this.getOpportunityDetails(noticeId, retryCount + 1);
          }
        }
        
        console.error(`[SAM.gov] All API keys exhausted for ${noticeId}`);
        return null;
      }
      
      // 404 is common - record doesn't exist or was archived
      // This is NOT an error - just return null and use search data
      if (response.status === 404) {
        // Silently return null - we'll use search data instead
        return null;
      }
      
      if (!response.ok) {
        console.warn(`[SAM.gov] HTTP ${response.status} for ${noticeId} - using search data`);
        return null;
      }

      return await response.json();

    } catch (error) {
      // Log only if it's not a 404 error
      if (!(error instanceof Error) || !error.message.includes('404')) {
        console.warn(`[SAM.gov] Could not fetch details for ${noticeId} - using search data`);
      }
      return null;
    }
  }

/**
 * Normalize SAM.gov opportunity to database format
 * @param raw - Raw opportunity data (from search or details API)
 * @param fullDetails - Optional full details data (if fetched separately)
 */
  normalizeOpportunity(raw: SAMOpportunity, fullDetails?: any): any {
    // If we have full details, merge them in
    const data = fullDetails || raw;
    
    // Extract department and sub-tier from fullParentPathName
    const pathParts = data.fullParentPathName?.split('.') || [];
    const department = pathParts[0] || null;
    const subTier = pathParts[1] || null;
    const office = pathParts[2] || null;

    // Extract primary contact (from details or search)
    const primaryContact = data.pointOfContact?.[0] ? {
      fullName: data.pointOfContact[0].fullName,
      email: data.pointOfContact[0].email,
      phone: data.pointOfContact[0].phone,
      type: data.pointOfContact[0].type
    } : null;
    
    // Extract secondary contact (usually only in full details)
    const secondaryContact = data.pointOfContact?.[1] ? {
      fullName: data.pointOfContact[1].fullName,
      email: data.pointOfContact[1].email,
      phone: data.pointOfContact[1].phone,
      type: data.pointOfContact[1].type
    } : null;

    // Extract award information if available
    const award = data.award || {};
    
    // Get FULL description from details API if available
    // The search API often returns just a link, but details API has the full text
    let description = null;
    if (fullDetails?.description) {
      description = fullDetails.description;
    } else if (data.description && !data.description.startsWith('https://')) {
      // Only use search description if it's actual text, not a link
      description = data.description;
    }
    
    // Get all attachments from details API (more complete than search)
    const attachments = fullDetails?.attachments || data.links || null;
    
    // Get additional info text (usually only in full details)
    const additionalInfo = fullDetails?.additionalInfoText || data.additionalInfoText || null;

    return {
      notice_id: data.noticeId,
      solicitation_number: data.solicitationNumber || null,
      
      title: data.title,
      notice_type: data.type,
      base_type: data.baseType,
      
      description: description,
      type_of_set_aside: data.typeOfSetAside || null,
      type_of_set_aside_description: data.typeOfSetAsideDescription || null,
      
      posted_date: data.postedDate || null,
      response_deadline: data.responseDeadLine || null,
      archive_date: data.archiveDate || null,
      original_posted_date: data.postedDate || null,
      last_modified_date: data.lastModifiedDate || data.postedDate || null,
      
      naics_code: data.naicsCode || null,
      classification_code: data.classificationCode || null,
      
      department,
      sub_tier: subTier,
      office,
      full_parent_path: data.fullParentPathName,
      
      primary_contact: primaryContact,
      secondary_contact: secondaryContact,
      
      place_of_performance_city: data.organizationLocationCityName || data.placeOfPerformance?.city?.name || null,
      place_of_performance_state: data.organizationLocationStateCode || data.placeOfPerformance?.state?.code || null,
      place_of_performance_country: data.organizationLocationCountryCode || data.placeOfPerformance?.country?.code || 'USA',
      place_of_performance_zip: data.organizationLocationZIPCode || data.placeOfPerformance?.zip || null,
      
      award_number: award.number || null,
      award_date: award.date || null,
      award_dollars: award.amount || null,
      awardee_name: award.awardee?.name || null,
      awardee_duns: award.awardee?.duns || null,
      awardee_uei: award.awardee?.uei || null,
      
      ui_link: data.uiLink || `https://sam.gov/opp/${data.noticeId}/view`,
      attachments: attachments,
      resource_links: data.resourceLinks || null,
      
      additional_info_text: additionalInfo,
      
      active: data.active === 'Yes',
      is_archived: data.archiveType ? true : false,
      
      data_source: fullDetails ? 'sam.gov-api-full' : 'sam.gov-api-search',
      last_scraped: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Save opportunities to database (upsert)
   */
  async saveOpportunities(opportunities: any[]): Promise<{ inserted: number; updated: number; errors: number }> {
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    const batchSize = 100;

    for (let i = 0; i < opportunities.length; i += batchSize) {
      const batch = opportunities.slice(i, i + batchSize);

      try {
        // Check which already exist
        const noticeIds = batch.map(o => o.notice_id);
        const { data: existing } = await getSupabase()
          .from('sam_gov_opportunities')
          .select('notice_id')
          .in('notice_id', noticeIds);

        const existingIds = new Set(existing?.map((e: any) => e.notice_id) || []);
        const newCount = batch.filter(o => !existingIds.has(o.notice_id)).length;
        const updateCount = batch.length - newCount;

        // Upsert
        const { error } = await getSupabase()
          .from('sam_gov_opportunities')
          .upsert(batch, {
            onConflict: 'notice_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`[SAM.gov] Batch error:`, error.message);
          errors += batch.length;
        } else {
          inserted += newCount;
          updated += updateCount;
          console.log(`[SAM.gov] Saved batch: +${newCount} new, ~${updateCount} updated`);
        }

      } catch (err) {
        console.error('[SAM.gov] Error saving batch:', err);
        errors += batch.length;
      }

      // Rate limiting
      await this.delay(1000);
    }

    return { inserted, updated, errors };
  }

  /**
   * Link opportunities to FPDS contracts
   */
  async linkToFPDSContracts(): Promise<number> {
    console.log('[SAM.gov] Linking opportunities to FPDS contracts...');

    const { data, error } = await getSupabase().rpc('link_sam_to_fpds');

    if (error) {
      console.error('[SAM.gov] Error linking:', error);
      return 0;
    }

    const linkedCount = data || 0;
    console.log(`[SAM.gov] ✅ Linked ${linkedCount} opportunities to FPDS contracts`);
    return linkedCount;
  }

  // ============================================
  // Helper Functions
  // ============================================

  private formatDateForSAM(date: Date): string {
    // SAM.gov API requires MM/dd/yyyy format
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private getToday(): string {
    return this.formatDateForSAM(new Date());
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.formatDateForSAM(date);
  }
}

// ============================================
// Convenience Export
// ============================================

export async function scrapeSAMGovOpportunities(options: ScraperOptions & { fullDetails?: boolean } = {}): Promise<void> {
  const scraper = new SAMGovOpportunitiesScraper();
  const fetchFullDetails = options.fullDetails || false;
  
  // Reset API key rotation at start of scraping session
  resetApiKeyRotation();
  initializeApiKeys();
  
  console.log(`
╔════════════════════════════════════════════╗
║   SAM.gov Opportunities Scraper           ║
╚════════════════════════════════════════════╝

📅 Date Range: ${options.postedFrom || 'Last 30 days'} → ${options.postedTo || 'Today'}
${fetchFullDetails ? '🔍 Mode: FULL DETAILS (descriptions, attachments, contacts)' : '⚡ Mode: FAST (search results only)'}
🔑 API Keys: ${SAM_GOV_API_KEYS.length} available
🔄 Fetching all pages...
  `);

  let offset = 0;
  let hasMore = true;
  let totalOpportunities = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  // Fetch all pages
  while (hasMore) {
    try {
      const { opportunities, hasMore: more } = await scraper.searchOpportunities(options, offset);
      
      if (opportunities.length === 0) {
        break;
      }

      // Fetch full details if requested
      let normalized: any[];
      
      if (fetchFullDetails) {
        console.log(`[SAM.gov] Fetching full details for ${opportunities.length} opportunities...`);
        normalized = [];
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < opportunities.length; i++) {
          const opp = opportunities[i];
          
          // Fetch full details (may return null if 404)
          const details = await scraper.getOpportunityDetails(opp.noticeId);
          
          // Track success/failure
          if (details) {
            successCount++;
          } else {
            failCount++;
          }
          
          // Normalize with full details (or just search data if details failed)
          normalized.push(scraper.normalizeOpportunity(opp, details));
          
          // Progress indicator
          if ((i + 1) % 10 === 0 || i === opportunities.length - 1) {
            console.log(`[SAM.gov] Progress: ${i + 1}/${opportunities.length} (${successCount} full details, ${failCount} search-only)`);
          }
          
          // Rate limiting between detail requests (important!)
          await scraper.delay(1000);
        }
        
        console.log(`[SAM.gov] Completed: ${successCount} with full details, ${failCount} using search data only`);
      } else {
        // Fast mode: just use search results
        normalized = opportunities.map(o => scraper.normalizeOpportunity(o));
      }
      
      // Save
      const { inserted, updated, errors } = await scraper.saveOpportunities(normalized);
      
      totalOpportunities += opportunities.length;
      totalInserted += inserted;
      totalUpdated += updated;
      totalErrors += errors;
      
      hasMore = more;
      offset += opportunities.length;

      // Rate limiting between pages
      await scraper.delay(2000);

    } catch (error) {
      console.error('[SAM.gov] Error in scraping loop:', error);
      break;
    }
  }

  // Link to FPDS contracts
  const linkedCount = await scraper.linkToFPDSContracts();

  console.log(`
╔════════════════════════════════════════════╗
║  🎉 SCRAPING COMPLETE!                    ║
╚════════════════════════════════════════════╝

📊 Final Statistics:
   Total Opportunities: ${totalOpportunities}
   ✅ Inserted: ${totalInserted}
   🔄 Updated: ${totalUpdated}
   ❌ Errors: ${totalErrors}
   🔗 Linked to FPDS: ${linkedCount}

Done! ✅
  `);
}

