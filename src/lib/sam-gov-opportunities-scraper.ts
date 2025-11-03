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
let SAM_GOV_API_KEY: string | null = null;

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

function getApiKey() {
  if (!SAM_GOV_API_KEY) {
    SAM_GOV_API_KEY = process.env.SAM_GOV_API_KEY || '';
    if (!SAM_GOV_API_KEY) {
      throw new Error('Missing SAM_GOV_API_KEY in environment');
    }
  }
  return SAM_GOV_API_KEY;
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
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search opportunities with pagination
   */
  async searchOpportunities(options: ScraperOptions = {}, offset: number = 0): Promise<{ opportunities: SAMOpportunity[]; hasMore: boolean }> {
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
      console.log(`[SAM.gov] Fetching opportunities: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(`${SAM_GOV_API_BASE}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
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
   */
  async getOpportunityDetails(noticeId: string): Promise<any> {
    const url = `https://api.sam.gov/opportunities/v2/opportunities/${noticeId}?api_key=${getApiKey()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunity ${noticeId}: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`[SAM.gov] Error fetching details for ${noticeId}:`, error);
      return null;
    }
  }

  /**
   * Normalize SAM.gov opportunity to database format
   */
  normalizeOpportunity(raw: SAMOpportunity): any {
    // Extract department and sub-tier from fullParentPathName
    const pathParts = raw.fullParentPathName?.split('.') || [];
    const department = pathParts[0] || null;
    const subTier = pathParts[1] || null;
    const office = pathParts[2] || null;

    // Extract primary contact
    const primaryContact = raw.pointOfContact?.[0] ? {
      fullName: raw.pointOfContact[0].fullName,
      email: raw.pointOfContact[0].email,
      phone: raw.pointOfContact[0].phone,
      type: raw.pointOfContact[0].type
    } : null;

    // Extract award information if available
    const award = raw.award || {};

    return {
      notice_id: raw.noticeId,
      solicitation_number: raw.solicitationNumber || null,
      
      title: raw.title,
      notice_type: raw.type,
      base_type: raw.baseType,
      
      description: raw.description || null,
      type_of_set_aside: raw.typeOfSetAside || null,
      type_of_set_aside_description: raw.typeOfSetAsideDescription || null,
      
      posted_date: raw.postedDate || null,
      response_deadline: raw.responseDeadLine || null,
      archive_date: raw.archiveDate || null,
      original_posted_date: raw.postedDate || null,
      last_modified_date: raw.postedDate || null, // SAM doesn't provide modified date in search
      
      naics_code: raw.naicsCode || null,
      classification_code: raw.classificationCode || null,
      
      department,
      sub_tier: subTier,
      office,
      full_parent_path: raw.fullParentPathName,
      
      primary_contact: primaryContact,
      
      place_of_performance_city: raw.organizationLocationCityName || null,
      place_of_performance_state: raw.organizationLocationStateCode || null,
      place_of_performance_country: raw.organizationLocationCountryCode || 'USA',
      place_of_performance_zip: raw.organizationLocationZIPCode || null,
      
      award_number: award.number || null,
      award_date: award.date || null,
      award_dollars: award.amount || null,
      awardee_name: award.awardee?.name || null,
      awardee_duns: award.awardee?.duns || null,
      awardee_uei: award.awardee?.uei || null,
      
      ui_link: raw.uiLink || `https://sam.gov/opp/${raw.noticeId}/view`,
      attachments: raw.links || null,
      resource_links: raw.resourceLinks || null,
      
      additional_info_text: raw.additionalInfoText || null,
      
      active: raw.active === 'Yes',
      is_archived: raw.archiveType ? true : false,
      
      data_source: 'sam.gov-api',
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

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

// ============================================
// Convenience Export
// ============================================

export async function scrapeSAMGovOpportunities(options: ScraperOptions = {}): Promise<void> {
  const scraper = new SAMGovOpportunitiesScraper();
  
  console.log(`
╔════════════════════════════════════════════╗
║   SAM.gov Opportunities Scraper           ║
╚════════════════════════════════════════════╝

📅 Date Range: ${options.postedFrom || 'Last 30 days'} → ${options.postedTo || 'Today'}
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

      // Normalize
      const normalized = opportunities.map(o => scraper.normalizeOpportunity(o));
      
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

