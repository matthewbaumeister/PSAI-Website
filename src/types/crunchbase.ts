/**
 * Crunchbase API Integration Types
 * Type definitions for Crunchbase company enrichment
 */

// ============================================
// DATABASE TYPES (Match SQL Schema)
// ============================================

export interface CrunchbaseCompany {
  id: number;
  crunchbase_uuid: string;
  crunchbase_permalink: string;
  
  // Matching
  company_name: string;
  legal_name?: string;
  matched_vendor_names?: string[];
  matched_vendor_uei?: string[];
  matched_vendor_duns?: string[];
  
  // Basic Info
  website?: string;
  short_description?: string;
  long_description?: string;
  
  // Contact & Social
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  email?: string;
  phone?: string;
  
  // Classification
  category_groups?: string[];
  industries?: string[];
  operating_status?: 'active' | 'closed' | 'acquired';
  company_type?: 'for_profit' | 'non_profit' | 'government';
  ipo_status?: 'public' | 'private' | 'acquired' | 'closed';
  
  // Financial
  total_funding_amount?: number;
  total_funding_currency?: string;
  last_funding_date?: string;
  last_funding_type?: string;
  number_of_funding_rounds?: number;
  
  // Valuation
  valuation?: number;
  valuation_date?: string;
  valuation_currency?: string;
  
  // IPO
  ipo_date?: string;
  stock_symbol?: string;
  stock_exchange?: string;
  
  // Acquisition
  was_acquired?: boolean;
  acquired_by_name?: string;
  acquired_by_uuid?: string;
  acquisition_date?: string;
  acquisition_price?: number;
  
  // People
  founder_names?: string[];
  ceo_name?: string;
  cto_name?: string;
  employee_count?: number;
  employee_count_range?: string;
  
  // Location
  headquarters_city?: string;
  headquarters_region?: string;
  headquarters_country?: string;
  headquarters_postal_code?: string;
  
  // Market Intelligence
  number_of_acquisitions?: number;
  number_of_investments?: number;
  number_of_exits?: number;
  
  // Dates
  founded_date?: string;
  closed_date?: string;
  
  // Metadata
  last_enriched?: string;
  enrichment_source?: string;
  api_call_count?: number;
  data_quality_score?: number;
  
  created_at?: string;
  updated_at?: string;
  data_attribution?: string;
}

export interface CrunchbaseFundingRound {
  id: number;
  crunchbase_company_id: number;
  company_uuid: string;
  
  // Identifiers
  funding_round_uuid: string;
  funding_round_permalink?: string;
  
  // Round Details
  round_name?: string;
  round_type?: string;
  announced_date?: string;
  closed_date?: string;
  
  // Amounts
  money_raised?: number;
  currency?: string;
  pre_money_valuation?: number;
  post_money_valuation?: number;
  
  // Investors
  investor_count?: number;
  lead_investor_name?: string;
  lead_investor_uuid?: string;
  investor_names?: string[];
  investor_types?: string[];
  
  // Strategic
  has_strategic_investor?: boolean;
  strategic_investor_names?: string[];
  
  is_equity?: boolean;
  target_funding?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface CrunchbasePerson {
  id: number;
  crunchbase_person_uuid: string;
  person_permalink?: string;
  
  // Name
  full_name: string;
  first_name?: string;
  last_name?: string;
  
  // Position
  current_company_uuid?: string;
  current_company_name?: string;
  current_title?: string;
  started_on?: string;
  ended_on?: string;
  is_current?: boolean;
  
  // Contact
  linkedin_url?: string;
  twitter_url?: string;
  email?: string;
  
  // Background
  bio?: string;
  gender?: string;
  education?: EducationRecord[];
  
  // Location
  location_city?: string;
  location_region?: string;
  location_country?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface CrunchbaseAcquisition {
  id: number;
  acquisition_uuid: string;
  
  // Acquirer
  acquirer_uuid?: string;
  acquirer_name: string;
  acquirer_crunchbase_id?: number;
  
  // Acquired
  acquired_uuid?: string;
  acquired_name: string;
  acquired_crunchbase_id?: number;
  
  // Deal
  announced_date?: string;
  completed_date?: string;
  acquisition_type?: string;
  acquisition_status?: string;
  
  // Financial
  price?: number;
  price_currency?: string;
  deal_terms?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface CrunchbaseEnrichmentQueueItem {
  id: number;
  
  // Company to Enrich
  company_name: string;
  vendor_uei?: string;
  vendor_duns?: string;
  source_table: 'fpds_contracts' | 'sam_gov_opportunities' | 'army_innovation_submissions';
  source_id?: number;
  
  // Priority
  priority: number; // 1-10
  priority_reason?: string;
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_found';
  attempt_count: number;
  max_attempts: number;
  
  // Results
  crunchbase_company_id?: number;
  match_confidence?: number;
  match_method?: 'exact_name' | 'website' | 'manual' | 'fuzzy_match';
  
  // Errors
  last_error?: string;
  last_attempted_at?: string;
  
  // Timestamps
  created_at?: string;
  completed_at?: string;
  updated_at?: string;
}

export interface CrunchbaseAPIUsage {
  id: number;
  endpoint: string;
  request_method: string;
  company_name?: string;
  company_uuid?: string;
  
  status_code?: number;
  success: boolean;
  response_time_ms?: number;
  
  rate_limit_remaining?: number;
  rate_limit_total?: number;
  api_credits_used: number;
  
  error_message?: string;
  error_type?: string;
  
  called_at?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CrunchbaseAPIResponse<T> {
  count: number;
  entities: T[];
  error?: string;
}

export interface CrunchbaseOrganizationSearchResult {
  uuid: string;
  permalink: string;
  properties: {
    identifier: {
      uuid: string;
      value: string;
      entity_def_id: string;
      permalink: string;
    };
    name: string;
    legal_name?: string;
    website?: {
      value: string;
    };
    short_description?: string;
    categories?: Array<{
      value: string;
    }>;
    location_identifiers?: Array<{
      value: string;
      location_type: string;
      permalink: string;
    }>;
  };
}

export interface CrunchbaseOrganizationDetail {
  uuid: string;
  permalink: string;
  properties: {
    identifier: {
      uuid: string;
      value: string;
      entity_def_id: string;
      permalink: string;
    };
    
    // Basic Info
    name: string;
    legal_name?: string;
    description?: string;
    short_description?: string;
    website?: {
      value: string;
    };
    
    // Contact
    email?: string;
    phone_number?: string;
    linkedin?: {
      value: string;
    };
    twitter?: {
      value: string;
    };
    facebook?: {
      value: string;
    };
    
    // Classification
    categories?: Array<{
      value: string;
    }>;
    category_groups?: Array<{
      value: string;
    }>;
    operating_status?: string;
    company_type?: string;
    ipo_status?: string;
    
    // Location
    location_identifiers?: Array<{
      value: string;
      location_type: string;
    }>;
    headquarters_location?: {
      value: string;
    };
    
    // Financial
    funding_total?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    last_funding_at?: string;
    last_funding_type?: string;
    num_funding_rounds?: number;
    
    // Valuation
    valuation?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    valuation_date?: string;
    
    // IPO
    went_public_on?: string;
    stock_symbol?: string;
    stock_exchange_symbol?: string;
    
    // Acquisition
    acquired_by?: {
      uuid: string;
      value: string;
    };
    acquired_on?: string;
    acquisition_price?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    
    // People
    num_employees_enum?: string;
    founded_on?: {
      value: string;
    };
    closed_on?: {
      value: string;
    };
    
    // Counts
    num_acquisitions?: number;
    num_investments?: number;
    num_exits?: number;
  };
  
  // Cards (additional data)
  cards?: {
    funding_rounds?: CrunchbaseFundingRoundCard[];
    investors?: CrunchbaseInvestorCard[];
    people?: CrunchbasePersonCard[];
    acquisitions?: CrunchbaseAcquisitionCard[];
  };
}

export interface CrunchbaseFundingRoundCard {
  uuid: string;
  identifier: {
    uuid: string;
    value: string;
  };
  properties: {
    name?: string;
    funding_type?: string;
    announced_on?: {
      value: string;
    };
    money_raised?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    pre_money_valuation?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    post_money_valuation?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    investor_count?: number;
    lead_investor_identifiers?: Array<{
      uuid: string;
      value: string;
    }>;
  };
}

export interface CrunchbaseInvestorCard {
  uuid: string;
  identifier: {
    uuid: string;
    value: string;
  };
  properties: {
    name: string;
    investor_type?: string;
    is_lead_investor?: boolean;
  };
}

export interface CrunchbasePersonCard {
  uuid: string;
  identifier: {
    uuid: string;
    value: string;
  };
  properties: {
    name: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    started_on?: {
      value: string;
    };
    ended_on?: {
      value: string;
    };
    linkedin?: {
      value: string;
    };
    twitter?: {
      value: string;
    };
  };
}

export interface CrunchbaseAcquisitionCard {
  uuid: string;
  identifier: {
    uuid: string;
    value: string;
  };
  properties: {
    acquirer_identifier?: {
      uuid: string;
      value: string;
    };
    acquiree_identifier?: {
      uuid: string;
      value: string;
    };
    announced_on?: {
      value: string;
    };
    completed_on?: {
      value: string;
    };
    price?: {
      value_usd: number;
      currency: string;
      value: number;
    };
    acquisition_type?: string;
    acquisition_status?: string;
  };
}

// ============================================
// HELPER TYPES
// ============================================

export interface EducationRecord {
  school: string;
  degree?: string;
  field?: string;
  graduated_year?: number;
}

export interface CompanyMatchResult {
  company: CrunchbaseOrganizationSearchResult | null;
  confidence: number; // 0.0 - 1.0
  method: 'exact' | 'domain' | 'fuzzy' | 'location' | 'not_found' | 'needs_manual_review';
  candidates?: CrunchbaseOrganizationSearchResult[];
}

export interface EnrichmentPriority {
  priority: number; // 1-10
  reason: string;
  factors: {
    contractValue: number;
    contractFrequency: number;
    recentActivity: number;
    innovationParticipation: number;
  };
}

export interface EnrichmentResult {
  success: boolean;
  crunchbaseCompanyId?: number;
  matchConfidence?: number;
  matchMethod?: string;
  error?: string;
  apiCallsUsed: number;
}

export interface CrunchbaseAPIConfig {
  apiKey: string;
  baseURL?: string;
  rateLimitPerMinute?: number;
  timeout?: number;
}

// ============================================
// API CLIENT TYPES
// ============================================

export interface SearchOrganizationsParams {
  query: string;
  fieldIds?: string[];
  limit?: number;
  order?: 'asc' | 'desc';
}

export interface GetOrganizationParams {
  uuid: string;
  cardIds?: string[];
}

export interface CrunchbaseAPIError extends Error {
  statusCode?: number;
  endpoint?: string;
  rateLimitRemaining?: number;
}

// ============================================
// USAGE STATS TYPES
// ============================================

export interface DailyAPIUsageStats {
  date: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCreditsUsed: number;
  avgResponseTimeMs: number;
  endpoints: Record<string, number>;
}

export interface EnrichmentQueueStats {
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  notFound: number;
  totalProcessed: number;
  avgProcessingTimeMs: number;
}

export interface CompanyEnrichmentStats {
  totalCompanies: number;
  enrichedCompanies: number;
  enrichmentRate: number; // percentage
  avgDataQualityScore: number;
  companiesWithFunding: number;
  companiesWithAcquisitions: number;
  totalFundingTracked: number;
}

