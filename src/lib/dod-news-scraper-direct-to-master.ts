/**
 * ============================================
 * DoD Contract News Scraper - DIRECT TO OPPORTUNITY_MASTER
 * ============================================
 * Modified version that saves directly to opportunity_master table
 * instead of dod_contract_news intermediate table
 * ============================================
 */

import { createClient } from '@supabase/supabase-js';
import { ExtractedContract } from './dod-news-scraper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Generate Canonical Opportunity Key
// ============================================

async function generateCanonicalKey(params: {
  contractNumber?: string;
  noticeId?: string;
  awardId?: string;
  agency?: string;
  fiscalYear?: number;
}): Promise<string> {
  const { contractNumber, noticeId, awardId, agency, fiscalYear } = params;
  
  // Call the Postgres function to generate the key
  const { data, error } = await supabase.rpc('make_canonical_opportunity_key', {
    p_contract_number: contractNumber || null,
    p_notice_id: noticeId || null,
    p_award_id: awardId || null,
    p_agency: agency || null,
    p_fiscal_year: fiscalYear || null
  });
  
  if (error) {
    console.error('[Master] Error generating canonical key:', error);
    // Fallback: generate hash from available data
    const combined = `${contractNumber || ''}_${agency || ''}_${fiscalYear || ''}`;
    return `HASH:${Buffer.from(combined).toString('base64').substring(0, 32)}`;
  }
  
  return data || `FALLBACK:${Date.now()}`;
}

// ============================================
// Determine Vehicle Type
// ============================================

function determineVehicleType(contract: ExtractedContract): string | null {
  // Priority order for vehicle type determination
  if (contract.isIDIQ) return 'IDIQ';
  if (contract.isMultipleAward) return 'Multiple Award';
  if (contract.competitionType?.toLowerCase().includes('sole source')) return 'Sole Source';
  
  // Check contract types array
  if (contract.contractTypes && contract.contractTypes.length > 0) {
    // Prefer IDIQ if in the list
    if (contract.contractTypes.includes('IDIQ')) return 'IDIQ';
    // Otherwise return first type
    return contract.contractTypes[0];
  }
  
  return null;
}

// ============================================
// Determine Opportunity Type & Status
// ============================================

function determineOpportunityType(contract: ExtractedContract): string {
  if (contract.isModification) return 'modification';
  if (contract.isFMS) return 'award_fms'; // Foreign Military Sale award
  // Most DOD news articles are awards
  return 'award';
}

function determineStatus(contract: ExtractedContract): string {
  if (contract.isModification) return 'modified';
  return 'awarded';
}

// ============================================
// Calculate Data Quality Score
// ============================================

function calculateQualityScore(contract: ExtractedContract): number {
  let score = 50; // Base score
  
  // Critical fields
  if (contract.vendorName && contract.vendorName !== 'Unknown Vendor') score += 10;
  if (contract.contractNumber) score += 10;
  if (contract.awardAmount) score += 10;
  if (contract.contractingActivity) score += 5;
  if (contract.serviceBranch) score += 5;
  
  // Enhanced fields
  if (contract.contractTypes && contract.contractTypes.length > 0) score += 5;
  if (contract.performanceLocationBreakdown && contract.performanceLocationBreakdown.length > 0) score += 3;
  if (contract.fundingSources && contract.fundingSources.length > 0) score += 3;
  if (contract.naicsCode) score += 2;
  if (contract.completionDate) score += 2;
  
  // Vendor location
  if (contract.vendorCity && contract.vendorState) score += 5;
  
  return Math.min(score, 100);
}

// ============================================
// Save to opportunity_master (DIRECT)
// ============================================

export async function saveContractToOpportunityMaster(
  contract: ExtractedContract,
  articleId: number,
  articleUrl: string,
  articleTitle: string,
  publishedDate: Date
): Promise<boolean> {
  try {
    // Extract fiscal year from published date
    const fiscalYear = publishedDate.getMonth() >= 9 
      ? publishedDate.getFullYear() + 1 
      : publishedDate.getFullYear();
    
    // Generate canonical key
    const canonicalKey = await generateCanonicalKey({
      contractNumber: contract.contractNumber,
      noticeId: contract.solicitationNumber,
      awardId: `DOD-${articleId}`,
      agency: contract.contractingActivity || contract.serviceBranch,
      fiscalYear: fiscalYear
    });
    
    // Determine vehicle type
    const vehicleType = determineVehicleType(contract);
    
    // Determine opportunity type and status
    const opportunityType = determineOpportunityType(contract);
    const status = determineStatus(contract);
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(contract);
    
    // Prepare source attributes
    const sourceAttributes = {
      dod_contract_news: {
        source_primary_key: `${articleId}-${contract.contractNumber || 'UNKNOWN'}`,
        source_table: 'dod_contract_news',
        ingested_at: new Date().toISOString(),
        source_url: articleUrl,
        confidence_score: contract.parsingConfidence * 100,
        article_id: articleId,
        article_title: articleTitle,
        parsing_confidence: contract.parsingConfidence,
        extraction_method: 'regex_parser'
      }
    };
    
    // Prepare external IDs
    const externalIds = {
      article_id: articleId,
      contract_number: contract.contractNumber,
      solicitation_number: contract.solicitationNumber,
      modification_number: contract.modificationNumber,
      base_contract_number: contract.baseContractNumber,
      fpds_contract_id: null // Will be linked later if available
    };
    
    // Combine all keywords/tags
    const keywords = [
      ...(contract.industryTags || []),
      ...(contract.technologyTags || []),
      ...(contract.serviceTags || [])
    ];
    
    // Insert/Update opportunity_master
    const { data: masterData, error: masterError } = await supabase
      .from('opportunity_master')
      .upsert({
        canonical_opportunity_key: canonicalKey,
        
        // Identifiers
        primary_contract_number: contract.contractNumber,
        primary_notice_id: contract.solicitationNumber,
        primary_award_id: `DOD-${articleId}`,
        parent_contract_number: contract.baseContractNumber || null,
        external_ids: externalIds,
        
        // Descriptive
        title: articleTitle,
        short_description: contract.contractDescription?.substring(0, 500),
        full_description: contract.contractDescription,
        opportunity_type: opportunityType,
        domain_category: contract.industryTags && contract.industryTags.length > 0 
          ? contract.industryTags[0] 
          : null,
        keywords: keywords.length > 0 ? keywords : null,
        
        // Customer/Organization
        customer_department: contract.serviceBranch || 'DoD',
        customer_agency: contract.contractingActivity,
        customer_sub_agency: null,
        customer_office: contract.contractingActivity,
        customer_location: contract.contractingActivity,
        customer_country: 'USA',
        
        // Classification
        naics_codes: contract.naicsCode ? [contract.naicsCode] : null,
        psc_codes: null, // Not extracted yet
        
        // Financial
        vehicle_type: vehicleType,
        ceiling_value: contract.cumulativeValueWithOptions,
        estimated_value: contract.awardAmount,
        obligated_value: contract.totalObligatedAmount,
        funding_agency: null,
        contract_type: contract.contractTypes && contract.contractTypes.length > 0 
          ? contract.contractTypes.join(', ') 
          : null,
        set_aside_type: contract.setAsideType,
        competition_type: contract.competitionType,
        is_small_business_set_aside: contract.isSmallBusinessSetAside || false,
        is_sole_source: contract.competitionType?.toLowerCase().includes('sole source') || false,
        
        // Timeline
        status: status,
        publication_date: publishedDate.toISOString(),
        due_date: null, // Awards don't have due dates
        award_date: publishedDate.toISOString(),
        period_of_performance_start: null, // Not in DOD news
        period_of_performance_end: contract.completionDate?.toISOString(),
        last_seen_at: new Date().toISOString(),
        
        // Suppliers
        prime_recipients: contract.vendorName && contract.vendorName !== 'Unknown Vendor' 
          ? [contract.vendorName] 
          : null,
        sub_recipients: contract.subcontractors && contract.subcontractors.length > 0 
          ? contract.subcontractors 
          : null,
        cage_codes: null, // Not in DOD news
        uei_numbers: null, // Not in DOD news
        
        // Source attributes
        source_attributes: sourceAttributes,
        source_count: 1,
        data_quality_score: qualityScore,
        
        // LLM fields (will be populated later)
        llm_summary: null,
        llm_notes: null
      }, {
        onConflict: 'canonical_opportunity_key',
        ignoreDuplicates: false
      })
      .select();
    
    if (masterError) {
      console.error('[Master] Error saving to opportunity_master:', masterError);
      return false;
    }
    
    if (!masterData || masterData.length === 0) {
      console.error('[Master] No data returned after upsert');
      return false;
    }
    
    const opportunityId = masterData[0].id;
    console.log(`[Master] ✅ Saved to opportunity_master: ${opportunityId}`);
    
    // Insert into opportunity_sources for provenance
    const rawRecord = {
      article_id: articleId,
      article_url: articleUrl,
      article_title: articleTitle,
      published_date: publishedDate.toISOString(),
      vendor_name: contract.vendorName,
      vendor_location: contract.vendorLocation,
      vendor_city: contract.vendorCity,
      vendor_state: contract.vendorState,
      contract_number: contract.contractNumber,
      award_amount: contract.awardAmount,
      contract_description: contract.contractDescription,
      service_branch: contract.serviceBranch,
      contracting_activity: contract.contractingActivity,
      completion_date: contract.completionDate?.toISOString(),
      is_small_business: contract.isSmallBusiness,
      
      // Enhanced fields
      contract_types: contract.contractTypes,
      is_idiq: contract.isIDIQ,
      is_multiple_award: contract.isMultipleAward,
      is_hybrid_contract: contract.isHybridContract,
      has_options: contract.hasOptions,
      cumulative_value_with_options: contract.cumulativeValueWithOptions,
      is_modification: contract.isModification,
      modification_number: contract.modificationNumber,
      base_contract_number: contract.baseContractNumber,
      is_fms: contract.isFMS,
      fms_countries: contract.fmsCountries,
      competition_type: contract.competitionType,
      is_competed: contract.isCompeted,
      is_sbir: contract.isSBIR,
      sbir_phase: contract.sbirPhase,
      set_aside_type: contract.setAsideType,
      naics_code: contract.naicsCode,
      solicitation_number: contract.solicitationNumber,
      industry_tags: contract.industryTags,
      technology_tags: contract.technologyTags,
      service_tags: contract.serviceTags,
      
      parsing_confidence: contract.parsingConfidence,
      raw_paragraph: contract.rawParagraph
    };
    
    const { error: sourcesError } = await supabase
      .from('opportunity_sources')
      .upsert({
        opportunity_id: opportunityId,
        source_name: 'dod_contract_news',
        source_table: 'dod_contract_news',
        source_primary_key: `${articleId}-${contract.contractNumber || Date.now()}`,
        source_url: articleUrl,
        raw_record: rawRecord,
        ingested_at: new Date().toISOString(),
        match_confidence: contract.parsingConfidence * 100,
        match_method: 'direct_scrape'
      }, {
        onConflict: 'opportunity_id,source_name,source_primary_key',
        ignoreDuplicates: false
      });
    
    if (sourcesError) {
      console.error('[Master] Error saving to opportunity_sources:', sourcesError);
      // Don't fail the whole operation if sources fails
    } else {
      console.log(`[Master]   📋 Saved to opportunity_sources`);
    }
    
    // Log what we saved
    console.log(`[Master]   💼 ${contract.vendorName}`);
    console.log(`[Master]   💰 ${contract.awardAmountText || 'Unknown amount'}`);
    console.log(`[Master]   🚗 Vehicle: ${vehicleType || 'Unknown'}`);
    console.log(`[Master]   📊 Quality: ${qualityScore}/100`);
    
    return true;
    
  } catch (error) {
    console.error('[Master] Exception saving to opportunity_master:', error);
    return false;
  }
}

