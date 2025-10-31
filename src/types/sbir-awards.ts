// ============================================
// SBIR Awards Type Definitions
// ============================================

export interface SBIRAward {
  // Award Identification
  contract_award_number: string;
  award_year: number;
  award_date?: Date;
  
  // Topic Linkage
  topic_number?: string;
  solicitation_id?: string;
  solicitation_number?: string;
  
  // Award Details
  award_title: string;
  abstract?: string;
  phase: 'Phase I' | 'Phase II' | 'Phase III';
  program: 'SBIR' | 'STTR';
  award_amount?: number;
  
  // Agency
  agency: string;
  agency_id: string;
  branch_of_service?: string;
  component?: string;
  
  // Company
  company: string;
  duns?: string;
  firm_address?: string;
  firm_city?: string;
  firm_state?: string;
  firm_zip?: string;
  firm_country?: string;
  firm_phone?: string;
  firm_website?: string;
  
  // Diversity
  hubzone_owned: boolean;
  woman_owned: boolean;
  socially_economically_disadvantaged: boolean;
  veteran_owned: boolean;
  
  // Research Institution (STTR)
  research_institution?: string;
  ri_location?: string;
  
  // Program Management
  program_manager?: string;
  program_manager_email?: string;
  program_manager_phone?: string;
  
  // Technical
  keywords?: string[];
  technology_areas?: string[];
  
  // Metadata
  data_source: string;
  last_scraped: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SBIRCompany {
  id: number;
  company_name: string;
  duns?: string;
  
  // Location
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
  website?: string;
  
  // Classification
  hubzone_owned: boolean;
  woman_owned: boolean;
  socially_economically_disadvantaged: boolean;
  veteran_owned: boolean;
  
  // Statistics
  total_awards: number;
  total_funding: number;
  phase_1_count: number;
  phase_2_count: number;
  phase_3_count: number;
  first_award_year?: number;
  most_recent_award_year?: number;
  
  // Success Metrics
  phase_1_to_2_conversion_rate?: number;
  average_award_amount?: number;
  
  // Focus Areas
  primary_technology_areas?: string[];
  primary_agencies?: string[];
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface TopicAwardsSummary {
  id: number;
  topic_number: string;
  
  // Statistics
  total_awards: number;
  total_funding: number;
  phase_1_awards: number;
  phase_2_awards: number;
  phase_3_awards: number;
  
  // Winners
  winners?: WinnerInfo[];
  
  // Patterns
  average_award_amount_phase_1?: number;
  average_award_amount_phase_2?: number;
  most_common_winner_state?: string;
  woman_owned_percentage?: number;
  
  // Metadata
  last_computed: Date;
}

export interface WinnerInfo {
  company: string;
  phase: string;
  award_amount: number;
  year: number;
  contract_number: string;
  woman_owned: boolean;
  website?: string;
}

export interface ScraperLog {
  id: number;
  scrape_type: 'bulk_historical' | 'daily_update' | 'agency_specific';
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
}

// ============================================
// SBIR.gov API Response Types
// ============================================

export interface SBIRgovAwardResponse {
  response: {
    numFound: number;
    start: number;
    docs: SBIRgovAward[];
  };
}

export interface SBIRgovAward {
  // Raw API response structure
  agency?: string;
  agency_id?: string;
  award_title?: string;
  award_year?: string;
  company?: string;
  duns?: string;
  phase?: string;
  program?: string;
  award_amount?: string; // Note: API returns as string with $ and commas
  contract_award_number?: string;
  topic_number?: string;
  solicitation_id?: string;
  branch_of_service?: string;
  component?: string;
  hubzone_owned?: string; // "Y" or "N"
  woman_owned?: string; // "Y" or "N"
  socially_and_economically_disadvantaged?: string; // "Y" or "N"
  firm_address?: string;
  firm_phone?: string;
  firm_website?: string;
  abstract?: string;
  ri?: string; // Research Institution
  program_manager?: string;
  program_manager_email?: string;
}

// ============================================
// Helper Types
// ============================================

export interface AwardFilters {
  agency?: string;
  year?: number;
  phase?: string;
  company?: string;
  topic_number?: string;
  woman_owned?: boolean;
  page?: number;
  limit?: number;
}

export interface CompanyStats {
  company_name: string;
  total_awards: number;
  total_funding: number;
  win_rate: number;
  phase_conversion_rate: number;
  recent_awards: SBIRAward[];
}

