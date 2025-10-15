/**
 * SBIR Column Mapper
 * Maps scraper output field names to actual Supabase sbir_final table column names
 */

export interface ScraperTopic {
  [key: string]: any;
}

/**
 * Map scraper output to sbir_final table columns
 * This ensures exact column name matching for Supabase inserts
 */
export function mapToSupabaseColumns(scrapedTopic: ScraperTopic): Record<string, any> {
  const mapped: Record<string, any> = {};

  // Core identification fields
  if (scrapedTopic.topicCode) mapped.topic_number = scrapedTopic.topicCode;
  if (scrapedTopic.topicId) mapped.topic_id = scrapedTopic.topicId;
  if (scrapedTopic.topicTitle) {
    mapped.title = scrapedTopic.topicTitle;
    mapped.short_title = scrapedTopic.topicTitle.substring(0, 50);
  }

  // Component and program info
  if (scrapedTopic.component) {
    mapped.component = scrapedTopic.component;
    mapped.component_full_name = expandComponentName(scrapedTopic.component);
  }
  if (scrapedTopic.command) mapped.command = scrapedTopic.command;
  if (scrapedTopic.program) {
    mapped.program = scrapedTopic.program;
    // Derive program type
    if (scrapedTopic.program.includes('SBIR')) {
      mapped.program_type = 'SBIR';
    } else if (scrapedTopic.program.includes('STTR')) {
      mapped.program_type = 'STTR';
    }
  }

  // Solicitation info
  if (scrapedTopic.solicitationTitle) mapped.title_1 = scrapedTopic.solicitationTitle;
  if (scrapedTopic.solicitationNumber) mapped.solicitation_number = scrapedTopic.solicitationNumber;
  if (scrapedTopic.cycleName) mapped.cycle_name = scrapedTopic.cycleName;
  if (scrapedTopic.releaseNumber) mapped.release_number = String(scrapedTopic.releaseNumber);

  // Status fields
  if (scrapedTopic.topicStatus) {
    mapped.status_topicstatus = scrapedTopic.topicStatus;
    mapped.topic_status = scrapedTopic.topicStatus;
    mapped.status = scrapedTopic.topicStatus;
  }

  // Date fields
  if (scrapedTopic.topicStartDate) {
    mapped.open_date = formatDate(scrapedTopic.topicStartDate);
    mapped.open_datetime = formatDate(scrapedTopic.topicStartDate);
    // Add timestamp for proper chronological sorting
    mapped.open_date_ts = new Date(scrapedTopic.topicStartDate).toISOString();
  }
  if (scrapedTopic.topicEndDate) {
    mapped.close_date = formatDate(scrapedTopic.topicEndDate);
    mapped.close_datetime = formatDate(scrapedTopic.topicEndDate);
    // Add timestamp for proper chronological sorting
    mapped.close_date_ts = new Date(scrapedTopic.topicEndDate).toISOString();
  }
  if (scrapedTopic.topicPreReleaseStartDate) {
    mapped.pre_release_start = formatDate(scrapedTopic.topicPreReleaseStartDate);
  }
  if (scrapedTopic.topicPreReleaseEndDate) {
    mapped.pre_release_end = formatDate(scrapedTopic.topicPreReleaseEndDate);
  }
  if (scrapedTopic.createdDate) mapped.created_date = formatDate(scrapedTopic.createdDate);
  if (scrapedTopic.updatedDate) mapped.updated_date = formatDate(scrapedTopic.updatedDate);
  if (scrapedTopic.modifiedDate) mapped.modified_date = formatDate(scrapedTopic.modifiedDate);

  // Q&A fields
  if (scrapedTopic.topicQAStartDate) {
    mapped.qanda_start_topicqastartdate = formatDate(scrapedTopic.topicQAStartDate);
    mapped.qa_start = formatDate(scrapedTopic.topicQAStartDate);
  }
  if (scrapedTopic.topicQAEndDate) {
    mapped.qanda_end_topicqaenddate = formatDate(scrapedTopic.topicQAEndDate);
  }
  if (scrapedTopic.topicQAStatus) mapped.qanda_status_topicqastatus = scrapedTopic.topicQAStatus;
  if (scrapedTopic.topicQAStatusDisplay) mapped.qanda_status_display_topicqastatusdisplay = scrapedTopic.topicQAStatusDisplay;
  if (scrapedTopic.topicQAOpen !== undefined) {
    mapped.qanda_open_topicqaopen_boolean = scrapedTopic.topicQAOpen ? 'Yes' : 'No';
  }
  if (scrapedTopic.topicQuestionCount !== undefined) {
    mapped.total_questions = String(scrapedTopic.topicQuestionCount);
    mapped.qa_data = String(scrapedTopic.topicQuestionCount);
    mapped.hasqa_1_if_topicquestioncount_gt_0 = scrapedTopic.topicQuestionCount > 0 ? '1' : '0';
  }
  if (scrapedTopic.noOfPublishedQuestions !== undefined && scrapedTopic.noOfPublishedQuestions !== null) {
    mapped.published_questions = String(scrapedTopic.noOfPublishedQuestions);
    mapped.published_questions_1 = String(scrapedTopic.noOfPublishedQuestions);
  }
  // Q&A Content (formatted questions and answers)
  if (scrapedTopic.qaContent) {
    mapped.qa_content = scrapedTopic.qaContent;
  }

  // Technology and keywords
  if (scrapedTopic.technologyAreas) {
    mapped.technology_areas = scrapedTopic.technologyAreas;
    const areas = scrapedTopic.technologyAreas.split(',');
    mapped.technology_areas_count = String(areas.length);
    if (areas.length > 0) mapped.primary_technology_area = areas[0].trim();
  }
  if (scrapedTopic.modernizationPriorities) {
    mapped.tech_modernization = scrapedTopic.modernizationPriorities;
    mapped.modernization_priorities = scrapedTopic.modernizationPriorities;
    const priorities = scrapedTopic.modernizationPriorities.split('|');
    mapped.modernization_priority_count = String(priorities.length);
  }
  if (scrapedTopic.keywords) {
    mapped.keywords = scrapedTopic.keywords;
    mapped.keywords_1 = scrapedTopic.keywords;
    const kws = scrapedTopic.keywords.split(';');
    mapped.keywords_count = String(kws.length);
    if (kws.length > 0) mapped.primary_keyword = kws[0].trim();
  }

  // ITAR
  if (scrapedTopic.itarControlled) {
    mapped.itar_controlled = scrapedTopic.itarControlled;
    mapped.security_export = scrapedTopic.itarControlled;
    mapped.requiresitar_1_if_itar_is_yes_else_0 = scrapedTopic.itarControlled === 'Yes' ? '1' : '0';
  }

  // Descriptions
  if (scrapedTopic.objective) {
    mapped.objective = scrapedTopic.objective;
    mapped.objective_1 = scrapedTopic.objective;
    mapped.objective_word_count = String(scrapedTopic.objective.split(' ').length);
  }
  if (scrapedTopic.description) {
    mapped.description = scrapedTopic.description;
    mapped.description_1 = scrapedTopic.description;
    mapped.description_word_count = String(scrapedTopic.description.split(' ').length);
    mapped.description_length = String(scrapedTopic.description.length);
  }
  if (scrapedTopic.phase1Description) mapped.description_3 = scrapedTopic.phase1Description;
  if (scrapedTopic.phase2Description) mapped.description_4 = scrapedTopic.phase2Description;
  if (scrapedTopic.phase3Description) {
    mapped.description_5 = scrapedTopic.phase3Description;
    mapped.description_6 = scrapedTopic.phase3Description;
  }

  // xTech detection
  if (scrapedTopic.isXTech) {
    mapped.is_xtech_xtech_keyword_search_duplicate = scrapedTopic.isXTech;
    mapped.prize_gating = scrapedTopic.isXTech === 'Yes' ? 'Yes' : 'No';
  }

  // References
  if (scrapedTopic.references) {
    mapped.references_data = scrapedTopic.references;
    mapped.reference_docs = scrapedTopic.references;
    mapped.references_1_data = scrapedTopic.references;
    const refs = scrapedTopic.references.split(';');
    mapped.reference_count = String(refs.length);
  }
  
  // BAA Instruction Files
  if (scrapedTopic.baaInstructionFiles) {
    mapped.baa_instruction_files = scrapedTopic.baaInstructionFiles;
  }

  // Direct to Phase II
  if (scrapedTopic.isDirectToPhaseII) {
    mapped.is_direct_to_phase_ii = scrapedTopic.isDirectToPhaseII;
  }

  // PDF and instructions
  if (scrapedTopic.topicPdfDownload) {
    mapped.topic_pdf_download = scrapedTopic.topicPdfDownload;
    mapped.pdf_link = scrapedTopic.topicPdfDownload;
    mapped.pdf_link_1 = scrapedTopic.topicPdfDownload;
  }
  if (scrapedTopic.solicitationInstructionsDownload) {
    mapped.solicitation_instructions_download = scrapedTopic.solicitationInstructionsDownload;
    mapped.solicitationinstructionsurl_solicitation_download_duplicate = scrapedTopic.solicitationInstructionsDownload;
    mapped.has_solicitation_instructions = scrapedTopic.solicitationInstructionsDownload ? '1' : '0';
  }
  if (scrapedTopic.componentInstructionsDownload) {
    mapped.component_instructions_download = scrapedTopic.componentInstructionsDownload;
  }
  if (scrapedTopic.solicitationInstructionsVersion) mapped.title_2 = scrapedTopic.solicitationInstructionsVersion;
  if (scrapedTopic.componentInstructionsVersion) mapped.component_4 = scrapedTopic.componentInstructionsVersion;

  // TPOC fields
  if (scrapedTopic.tpocNames) {
    mapped.tpoc = scrapedTopic.tpocNames;
    mapped.tpoc_1 = scrapedTopic.tpocNames;
    mapped.tpoc_names = scrapedTopic.tpocNames;
    mapped.tpoc_names_1 = scrapedTopic.tpocNames;
  }
  if (scrapedTopic.tpocEmails) mapped.tpoc_emails = scrapedTopic.tpocEmails;
  if (scrapedTopic.tpocCenters) mapped.tpoc_centers = scrapedTopic.tpocCenters;
  if (scrapedTopic.tpocCount) {
    mapped.tpoc_count = String(scrapedTopic.tpocCount);
    mapped.tpoc_2 = scrapedTopic.tpocCount > 0 ? '1' : '0';
  }
  if (scrapedTopic.showTpoc !== undefined) mapped.tpoc_3 = scrapedTopic.showTpoc ? 'Yes' : 'No';
  if (scrapedTopic.tpocEmailDomain) mapped.tpoc_email_domain = scrapedTopic.tpocEmailDomain;

  // Additional metadata
  if (scrapedTopic.owner) mapped.owner = scrapedTopic.owner;
  if (scrapedTopic.internalLead) mapped.internal_lead = scrapedTopic.internalLead;
  if (scrapedTopic.sponsorComponent) mapped.component_5 = scrapedTopic.sponsorComponent;
  if (scrapedTopic.selectionCriteria) mapped.selection_criteria = scrapedTopic.selectionCriteria;
  if (scrapedTopic.historicalAwards) mapped.historical_awards = String(scrapedTopic.historicalAwards);
  if (scrapedTopic.previousAwardsCount) mapped.previous_awards_count = String(scrapedTopic.previousAwardsCount);
  if (scrapedTopic.successRate) mapped.success_rate = String(scrapedTopic.successRate);
  if (scrapedTopic.programYear) mapped.program_1 = scrapedTopic.programYear;
  
  // Year fields
  const now = new Date();
  mapped.year = String(now.getFullYear());

  // BAA fields
  if (scrapedTopic.baaPrefaceUploadId) mapped.baa_preface_upload_id = String(scrapedTopic.baaPrefaceUploadId);
  if (scrapedTopic.baaPrefaceUploadTitle) mapped.title_3 = scrapedTopic.baaPrefaceUploadTitle;
  if (scrapedTopic.isReleasePreface !== undefined) {
    mapped.is_release_preface = scrapedTopic.isReleasePreface ? 'Yes' : 'No';
  }
  if (scrapedTopic.baaInstructionFiles) {
    mapped.baa_instruction_files = scrapedTopic.baaInstructionFiles;
    const files = scrapedTopic.baaInstructionFiles.split(';');
    mapped.baa_files_count = String(files.length);
    mapped.has_baa_instructions = files.length > 0 ? '1' : '0';
  }

  // Actions and status flags
  if (scrapedTopic.applicableActions) {
    // Handle both array and string formats
    const actions = Array.isArray(scrapedTopic.applicableActions) 
      ? scrapedTopic.applicableActions 
      : scrapedTopic.applicableActions.split(',');
    mapped.applicable_actions = actions.join(', ');
    mapped.actions_count = String(actions.length);
  }
  if (scrapedTopic.isActive !== undefined) mapped.is_active = scrapedTopic.isActive ? 'Yes' : 'No';
  if (scrapedTopic.isArchived !== undefined) mapped.is_archived = scrapedTopic.isArchived ? 'Yes' : 'No';
  if (scrapedTopic.isDraft !== undefined) mapped.is_draft = scrapedTopic.isDraft ? 'Yes' : 'No';
  if (scrapedTopic.isPublished !== undefined) mapped.is_published = scrapedTopic.isPublished ? 'Yes' : 'No';
  if (scrapedTopic.allowProposalSubmission !== undefined) {
    mapped.allow_proposal_submission = scrapedTopic.allowProposalSubmission ? 'Yes' : 'No';
  }
  if (scrapedTopic.topicStatus === 'Open') {
    mapped.is_open_for_submission = '1';
  } else {
    mapped.is_open_for_submission = '0';
  }

  // Requirements
  if (scrapedTopic.proposalRequirements) mapped.proposal_requirements = scrapedTopic.proposalRequirements;
  if (scrapedTopic.submissionInstructions) mapped.submission_instructions = scrapedTopic.submissionInstructions;
  if (scrapedTopic.eligibilityRequirements) mapped.eligibility_requirements = scrapedTopic.eligibilityRequirements;

  // Unique identifiers
  if (scrapedTopic.topicCode && scrapedTopic.topicId) {
    mapped.record_id = `${scrapedTopic.topicCode}_${scrapedTopic.topicId.substring(0, 8)}`;
  }
  if (scrapedTopic.cycleName && scrapedTopic.topicCode) {
    mapped.unique_id = `${scrapedTopic.cycleName}_${scrapedTopic.topicCode}`;
  }
  if (scrapedTopic.trackingNumber) mapped.tracking_number = scrapedTopic.trackingNumber;
  if (scrapedTopic.version) mapped.version = String(scrapedTopic.version);

  // **CRITICAL: Last scraped timestamp**
  if (scrapedTopic.last_scraped) {
    mapped.last_scraped = scrapedTopic.last_scraped;
  }

  return mapped;
}

/**
 * Expand component abbreviations to full names
 */
function expandComponentName(component: string): string {
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
}

/**
 * Format timestamp to MM/DD/YYYY
 */
function formatDate(timestamp: number | null | undefined): string {
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
}

