/**
 * SBIR Column Mapper - CLEAN SCHEMA VERSION
 * Maps scraper output to modern sbir_final table with proper data types
 * Uses BOOLEAN for yes/no, INTEGER for numbers, TIMESTAMPTZ for dates
 */

export interface ScraperTopic {
  [key: string]: any;
}

// Helper function to convert "Yes"/"No" strings to boolean
const toBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'yes' || val === '1' || val === 'true';
  return false;
};

// Format timestamp to MM/DD/YYYY
const formatDate = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return '';
  }
};

// Expand component abbreviations
const expandComponentName = (component: string): string => {
  const componentMap: Record<string, string> = {
    'ARMY': 'United States Army',
    'NAVY': 'United States Navy',
    'AIRFORCE': 'United States Air Force',
    'SPACEFORCE': 'United States Space Force',
    'DARPA': 'Defense Advanced Research Projects Agency',
    'DHA': 'Defense Health Agency',
    'DISA': 'Defense Information Systems Agency',
    'DLA': 'Defense Logistics Agency',
    'DTRA': 'Defense Threat Reduction Agency',
    'MDA': 'Missile Defense Agency',
    'NGA': 'National Geospatial-Intelligence Agency',
    'OSD': 'Office of the Secretary of Defense',
    'SOCOM': 'Special Operations Command',
    'CYBERCOM': 'Cyber Command',
    'TRANSCOM': 'Transportation Command',
    'CBD': 'Chemical and Biological Defense',
    'JPEO-CBRND': 'Joint Program Executive Office for CBRN Defense'
  };
  return componentMap[component?.toUpperCase()] || component || '';
};

/**
 * Map scraper output to clean sbir_final schema
 */
export function mapToSupabaseColumns(topic: ScraperTopic): Record<string, any> {
  const m: Record<string, any> = {};

  // ==== CORE IDENTIFICATION ====
  m.topic_number = topic.topicCode || null;
  m.topic_id = topic.topicId || null;
  m.title = topic.topicTitle || null;
  m.short_title = topic.topicTitle ? topic.topicTitle.substring(0, 50) : null;
  // Removed obsolete fields not in new schema: record_id, unique_id

  // ==== COMPONENT & PROGRAM ====
  m.component = topic.component || null;
  m.component_full_name = topic.component ? expandComponentName(topic.component) : null;
  m.command = topic.command || null;
  m.program = topic.program || null;
  if (topic.program) {
    if (topic.program.includes('SBIR')) m.program_type = 'SBIR';
    else if (topic.program.includes('STTR')) m.program_type = 'STTR';
  }

  // ==== SOLICITATION INFO ====
  m.solicitation_title = topic.solicitationTitle || null;
  m.solicitation_number = topic.solicitationNumber || null;
  m.cycle_name = topic.cycleName || null;
  m.release_number = topic.releaseNumber ? String(topic.releaseNumber) : null;
  m.solicitation_phase = topic.solicitation_phase || null;

  // ==== STATUS ====
  m.status = topic.topicStatus || null;
  m.proposal_window_status = topic.proposal_window_status || null;
  m.urgency_level = topic.urgency_level || null;

  // ==== DATES ====
  if (topic.topicStartDate) {
    m.open_date = formatDate(topic.topicStartDate);
    m.open_datetime = new Date(topic.topicStartDate).toISOString();
  }
  if (topic.topicEndDate) {
    m.close_date = formatDate(topic.topicEndDate);
    m.close_datetime = new Date(topic.topicEndDate).toISOString();
  }
  m.pre_release_date = topic.topicPreReleaseStartDate ? formatDate(topic.topicPreReleaseStartDate) : null;
  m.pre_release_date_close = topic.topicPreReleaseEndDate ? formatDate(topic.topicPreReleaseEndDate) : null;
  m.created_date = topic.createdDate ? formatDate(topic.createdDate) : null;
  m.updated_date = topic.updatedDate ? formatDate(topic.updatedDate) : null;
  m.modified_date = topic.modifiedDate ? formatDate(topic.modifiedDate) : null;
  m.last_activity_date = topic.last_activity_date || null;
  m.last_scraped = topic.last_scraped || new Date().toISOString();

  // Date calculations
  m.days_until_close = topic.days_until_close !== undefined ? parseInt(topic.days_until_close) : null;
  m.days_since_open = topic.days_since_open !== undefined ? parseInt(topic.days_since_open) : null;
  m.duration_days = topic.duration_days !== undefined ? parseInt(topic.duration_days) : null;
  m.pre_release_duration = topic.pre_release_duration !== undefined ? parseInt(topic.pre_release_duration) : null;

  // ==== Q&A INFORMATION ====
  m.qa_close_date = topic.topicQAEndDate ? formatDate(topic.topicQAEndDate) : null;
  m.qa_window_active = topic.qa_window_active !== undefined ? toBoolean(topic.qa_window_active) : false;
  m.topic_question_count = topic.topicQuestionCount !== undefined ? parseInt(topic.topicQuestionCount) || 0 : 0;
  m.no_of_published_questions = (topic.noOfPublishedQuestions !== undefined && topic.noOfPublishedQuestions !== null) ? parseInt(topic.noOfPublishedQuestions) || 0 : 0;
  m.qa_response_rate_percentage = topic.qa_response_rate_percentage !== undefined ? parseInt(topic.qa_response_rate_percentage) : null;
  m.days_until_qa_close = topic.days_until_qa_close !== undefined ? parseInt(topic.days_until_qa_close) : null;
  m.qa_content = topic.qaContent || null;
  m.qa_content_fetched = topic.qa_content_fetched !== undefined ? toBoolean(topic.qa_content_fetched) : false;
  m.qa_last_updated = topic.qa_last_updated || null;

  // ==== TECHNOLOGY & KEYWORDS ====
  if (topic.technologyAreas) {
    m.technology_areas = topic.technologyAreas;
    const areas = topic.technologyAreas.split(',').map((a: string) => a.trim()).filter(Boolean);
    m.technology_areas_count = areas.length;
    m.primary_technology_area = areas.length > 0 ? areas[0] : null;
  }
  if (topic.modernizationPriorities) {
    m.modernization_priorities = topic.modernizationPriorities;
    const priorities = topic.modernizationPriorities.split('|').map((p: string) => p.trim()).filter(Boolean);
    m.modernization_priority_count = priorities.length;
  }
  if (topic.keywords) {
    m.keywords = topic.keywords;
    const kws = topic.keywords.split(';').map((k: string) => k.trim()).filter(Boolean);
    m.keywords_count = kws.length;
    m.primary_keyword = kws.length > 0 ? kws[0] : null;
  }

  // ==== SECURITY & COMPLIANCE ====
  m.itar_controlled = topic.itarControlled !== undefined ? toBoolean(topic.itarControlled) : false;
  m.security_export = topic.itarControlled || null;

  // ==== DESCRIPTIONS ====
  if (topic.objective) {
    m.objective = topic.objective;
    m.objective_word_count = topic.objective.split(' ').filter(Boolean).length;
  }
  if (topic.description) {
    m.description = topic.description;
    m.description_word_count = topic.description.split(' ').filter(Boolean).length;
    m.description_length = topic.description.length;
  }
  m.phase_1_description = topic.phase1Description || null;
  m.phase_2_description = topic.phase2Description || null;
  m.phase_3_description = topic.phase3Description || null;

  // Consolidated description for full-text search
  const allDescs = [topic.objective, topic.description, topic.phase1Description, topic.phase2Description, topic.phase3Description].filter(Boolean);
  m.description_consolidated = allDescs.length > 0 ? allDescs.join('\n\n---\n\n') : null;

  // ==== xTECH & COMPETITION ====
  m.is_xtech = topic.isXTech !== undefined ? toBoolean(topic.isXTech) : false;
  m.prize_gating = topic.prize_gating !== undefined ? toBoolean(topic.prize_gating) : (m.is_xtech ? true : false);
  m.competition_type = topic.competition_type || null;

  // ==== REFERENCES & DOCUMENTS ====
  m.references = topic.references || null;
  // BAA instruction files should be the same as solicitation instructions download
  m.baa_instruction_files = topic.solicitationInstructionsDownload || topic.baaInstructionFiles || null;

  // ==== PHASE INFORMATION ====
  m.phases_available = topic.phases_available || null;
  m.is_direct_to_phase_ii = topic.isDirectToPhaseII !== undefined ? toBoolean(topic.isDirectToPhaseII) : false;

  // ==== PDF & DOWNLOADS ====
  m.topic_pdf_download = topic.topic_pdf_download || topic.topicPdfDownload || topic.pdf_link || null;
  m.pdf_link = m.topic_pdf_download;
  m.solicitation_instructions_download = topic.solicitationInstructionsDownload || null;
  m.component_instructions_download = topic.componentInstructionsDownload || null;
  m.solicitation_instructions_version = topic.solicitationInstructionsVersion || null;
  m.component_instructions_version = topic.componentInstructionsVersion || null;

  // ==== TPOC ====
  m.tpoc_names = topic.tpocNames || null;
  m.tpoc_emails = topic.tpocEmails || null;
  m.tpoc_centers = topic.tpocCenters || null;
  m.tpoc_count = topic.tpocCount !== undefined ? parseInt(topic.tpocCount) : 0;
  m.tpoc_email_domain = topic.tpocEmailDomain || null;
  m.show_tpoc = topic.showTpoc !== undefined ? toBoolean(topic.showTpoc) : false;

  // ==== ADDITIONAL METADATA ====
  m.owner = topic.owner || null;
  m.internal_lead = topic.internalLead || null;
  m.sponsor_component = topic.sponsorComponent || null;
  m.selection_criteria = topic.selectionCriteria || null;
  m.proposal_requirements = topic.proposalRequirements || null;
  m.submission_instructions = topic.submissionInstructions || null;
  m.eligibility_requirements = topic.eligibilityRequirements || null;
  m.historical_awards = topic.historicalAwards || null;
  m.previous_awards_count = topic.previousAwardsCount !== undefined ? parseInt(topic.previousAwardsCount) : null;
  m.success_rate = topic.successRate !== undefined ? parseFloat(topic.successRate) : null;

  // ==== ACTIONS & FLAGS ====
  // Removed obsolete fields not in new schema:
  // applicable_actions, is_active, is_archived, is_draft, is_published, allow_proposal_submission

  // ==== METADATA ====
  m.year = new Date().getFullYear();
  
  // ==== SCRAPER METADATA (CRITICAL FOR SMART UPSERT) ====
  m.scraper_source = topic.scraper_source || 'active'; // 'active' or 'historical'
  // Determine data freshness based on status
  const isLive = ['Open', 'Pre-Release', 'Active'].includes(topic.topicStatus || '');
  m.data_freshness = isLive ? 'live' : 'archived';
  
  // ==== SOLICITATION BRANCH ====
  m.solicitation_branch = topic.solicitation_branch || topic.solicitation || topic.solicitationTitle || null;

  // FILTER: Only return fields that exist in new schema
  const allowedFields = new Set([
    'topic_number', 'cycle_name', 'topic_id', 'title', 'status', 'sponsor_component', 'solicitation_branch',
    'open_date', 'close_date', 'open_datetime', 'close_datetime', 'pre_release_date', 'pre_release_date_close',
    'qa_close_date', 'last_activity_date', 'last_scraped', 'description', 'objective', 
    'phase_1_description', 'phase_2_description', 'phase_3_description', 'qa_content', 'qa_content_fetched',
    'qa_last_updated', 'topic_question_count', 'no_of_published_questions', 'qa_response_rate_percentage',
    'technology_areas', 'keywords', 'modernization_priorities', 'tpoc_names', 'tpoc_emails', 'tpoc_centers',
    'tpoc_count', 'tpoc_email_domain', 'show_tpoc', 'topic_pdf_download', 'pdf_link',
    'solicitation_instructions_download', 'solicitation_instructions_version', 
    'component_instructions_download', 'component_instructions_version', 'baa_instruction_files',
    'references', 'days_since_open', 'days_until_close', 'days_until_qa_close', 'duration_days',
    'pre_release_duration', 'urgency_level', 'proposal_window_status', 'qa_window_active',
    'solicitation_phase', 'phases_available', 'is_direct_to_phase_ii', 'is_xtech', 'prize_gating',
    'itar_controlled', 'scraper_source', 'data_freshness'
  ]);
  
  const filtered: any = {};
  Object.keys(m).forEach(key => {
    if (allowedFields.has(key)) {
      filtered[key] = m[key];
    }
  });

  return filtered;
}

