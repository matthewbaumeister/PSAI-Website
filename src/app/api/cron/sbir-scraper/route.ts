import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting automated SBIR scraper...');
    
    const result = await scrapeAndUpdateSBIR();
    
    return NextResponse.json({
      success: true,
      message: 'SBIR scraper completed successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ SBIR scraper error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function scrapeAndUpdateSBIR() {
  const baseUrl = "https://www.dodsbirsttr.mil";
  
  try {
    // Step 1: Fetch all active/open/pre-release topics
    console.log('📡 Fetching active/open/pre-release topics...');
    const topics = await fetchActiveTopics(baseUrl);
    console.log(`✅ Found ${topics.length} active topics`);

    // Step 2: Process and format topics
    console.log('🔄 Processing topics...');
    const processedTopics = await processTopics(topics, baseUrl);
    console.log(`✅ Processed ${processedTopics.length} topics`);

    // Step 3: Update database with incremental changes
    console.log('💾 Updating database...');
    const updateResult = await updateDatabase(processedTopics);
    
    return {
      totalTopics: topics.length,
      processedTopics: processedTopics.length,
      newRecords: updateResult.newRecords,
      updatedRecords: updateResult.updatedRecords,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

async function fetchActiveTopics(baseUrl: string) {
  const allTopics: any[] = [];
  let page = 0;
  const size = 100;
  const maxPages = 50; // Safety limit
  let consecutivePagesWithoutActive = 0;
  const maxConsecutivePagesWithoutActive = 10; // Early termination
  let totalActiveFound = 0;

  console.log('🔍 Fetching topics and filtering for Open/Pre-Release/Active status...');
  console.log('📡 API Base URL:', baseUrl);

  while (page < maxPages) {
    const searchParams = {
      searchText: null,
      components: null,
      programYear: null,
      solicitationCycleNames: null,
      releaseNumbers: [],
      topicReleaseStatus: [], // Don't filter here - we'll filter by topicStatus after fetching
      modernizationPriorities: [],
      sortBy: "modifiedDate,desc", // Get most recently modified first
      technologyAreaIds: [],
      component: null,
      program: null
    };

    const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
    const searchUrl = `${baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=${size}&page=${page}`;

    console.log(`📡 Fetching page ${page + 1}...`);

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Authorization': 'Bearer null',
          'Referer': 'https://www.dodsbirsttr.mil/topics-app/'
        }
      });

      console.log(`📡 Page ${page + 1} response status: ${response.status}`);

      if (response.status !== 200) {
        console.warn(`⚠️ Non-200 response on page ${page}: ${response.status}`);
        const errorText = await response.text();
        console.error(`⚠️ Error response:`, errorText.substring(0, 200));
        break;
      }

      const data = await response.json();
      console.log(`📡 Page ${page + 1} data structure:`, {
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        total: data.total,
        dataKeys: data.data?.[0] ? Object.keys(data.data[0]).slice(0, 10) : []
      });
      
      if (!data.data || data.data.length === 0) {
        break;
      }

      // Debug: Log first page's status distribution
      if (page === 0 && data.data.length > 0) {
        const statusCounts: Record<string, number> = {};
        data.data.forEach((topic: any) => {
          const status = topic.topicStatus || 'Unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('📊 Status distribution in first page:', statusCounts);
        console.log('📊 Sample topic:', {
          topicCode: data.data[0]?.topicCode,
          topicStatus: data.data[0]?.topicStatus,
          topicTitle: data.data[0]?.topicTitle?.substring(0, 50)
        });
      }

      // Filter for only Open, Pre-Release, and Active topics
      const activeTopicsInPage = data.data.filter((topic: any) => {
        const status = topic.topicStatus;
        return status === 'Open' || status === 'Pre-Release' || status === 'Active';
      });

      totalActiveFound += activeTopicsInPage.length;

      if (activeTopicsInPage.length > 0) {
        consecutivePagesWithoutActive = 0;
        console.log(`   ✓ Page ${page + 1}: Found ${activeTopicsInPage.length} active topics (total: ${totalActiveFound})`);
        allTopics.push(...activeTopicsInPage);
      } else {
        consecutivePagesWithoutActive++;
        console.log(`   ⏭️ Page ${page + 1}: No active topics (${consecutivePagesWithoutActive}/${maxConsecutivePagesWithoutActive})`);
      }

      // Early termination if no active topics found in several consecutive pages
      if (consecutivePagesWithoutActive >= maxConsecutivePagesWithoutActive && totalActiveFound > 0) {
        console.log(`   ✅ Early termination: Found ${totalActiveFound} active topics, no more in last ${maxConsecutivePagesWithoutActive} pages`);
        break;
      }
      
      if (data.data.length < size) {
        break; // Last page
      }
      
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      console.error(`❌ Error details:`, error);
      break;
    }
  }

  console.log(`✅ Finished fetching topics. Total active found: ${allTopics.length}`);
  console.log(`📊 Sample of first topic:`, allTopics[0] ? {
    topicCode: allTopics[0].topicCode,
    topicStatus: allTopics[0].topicStatus,
    topicTitle: allTopics[0].topicTitle?.substring(0, 50)
  } : 'No topics found');

  return allTopics;
}

async function processTopics(topics: any[], baseUrl: string) {
  const processedTopics = [];
  const currentDate = new Date();
  
  for (const topic of topics) {
    try {
      // Calculate days until close
      const endDate = topic.topicEndDate ? new Date(topic.topicEndDate) : null;
      const daysUntilClose = endDate ? Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
      
      // Calculate days since open
      const startDate = topic.topicStartDate ? new Date(topic.topicStartDate) : null;
      const daysSinceOpen = startDate ? Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
      
      // Determine status
      let status = 'Unknown';
      if (startDate && endDate) {
        if (currentDate < startDate) {
          status = 'Upcoming';
        } else if (currentDate > endDate) {
          status = 'Closed';
        } else {
          status = 'Open';
        }
      }

      // Determine urgency
      let urgencyLevel = '';
      if (daysUntilClose !== null) {
        if (daysUntilClose <= 3) urgencyLevel = 'Critical';
        else if (daysUntilClose <= 7) urgencyLevel = 'High';
        else if (daysUntilClose <= 14) urgencyLevel = 'Medium';
        else urgencyLevel = 'Low';
      }

      // Format dates
      const formatDate = (timestamp: number) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleDateString('en-US');
      };

      // Expand component name
      const componentMap: { [key: string]: string } = {
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
        'TRANSCOM': 'Transportation Command'
      };

      const componentFullName = componentMap[topic.component?.toUpperCase()] || topic.component || '';

      const processedTopic = {
        topic_number: topic.topicCode || '',
        topic_id: topic.topicId || '',
        title: topic.topicTitle || '',
        short_title: (topic.topicTitle || '').substring(0, 50),
        component: topic.component || '',
        component_full_name: componentFullName,
        command: topic.command || '',
        program: topic.program || '',
        program_type: (topic.program || '').includes('SBIR') ? 'SBIR' : 
                     (topic.program || '').includes('STTR') ? 'STTR' : 'Other',
        title_1: topic.solicitationTitle || '',
        solicitation_number: topic.solicitationNumber || '',
        cycle_name: topic.cycleName || '',
        release_number: String(topic.releaseNumber || ''),
        solicitation_phase: '',
        status_topicstatus: topic.topicStatus || '',
        topic_status: topic.topicStatus || '',
        status: status,
        days_until_close: String(daysUntilClose || ''),
        days_since_open: String(daysSinceOpen || ''),
        days_until_close_1: urgencyLevel,
        open_date: formatDate(topic.topicStartDate),
        close_date: formatDate(topic.topicEndDate),
        open_datetime: formatDate(topic.topicStartDate),
        close_datetime: formatDate(topic.topicEndDate),
        duration_days: '',
        pre_release_start: formatDate(topic.topicPreReleaseStartDate),
        pre_release_end: formatDate(topic.topicPreReleaseEndDate),
        pre_release_duration: '',
        created_date: formatDate(topic.createdDate),
        updated_date: formatDate(topic.updatedDate),
        modified_date: formatDate(topic.modifiedDate),
        last_activity_date: '',
        qanda_start_topicqastartdate: formatDate(topic.topicQAStartDate),
        qanda_end_topicqaenddate: formatDate(topic.topicQAEndDate),
        tpoc: '',
        tpoc_1: '',
        qanda_status_topicqastatus: topic.topicQAStatus || '',
        qanda_status_display_topicqastatusdisplay: topic.topicQAStatusDisplay || '',
        qanda_open_topicqaopen_boolean: topic.topicQAOpen ? 'Yes' : 'No',
        qa_start: '',
        days_until_qa_close: String(daysUntilClose || ''),
        total_questions: String(topic.topicQuestionCount || 0),
        published_questions: String(topic.noOfPublishedQuestions || 0),
        published_questions_1: String((topic.topicQuestionCount || 0) - (topic.noOfPublishedQuestions || 0)),
        qa_response_rate_percentage: '',
        hasqa_1_if_topicquestioncount_gt_0: (topic.topicQuestionCount || 0) > 0 ? '1' : '0',
        qa_data_topicquestioncount_duplicate: String(topic.topicQuestionCount || 0),
        qa_content_fetched: '',
        qa_last_updated: '',
        technology_areas_details_technologyareas_array_joined: '',
        technology_areas_count_count_of_comma_separated_values: '0',
        primary_technology_area_first_item_in_technologyareas: '',
        tech_modernization_details_focusareas_mapped: '',
        modernization_priorities_details_focusareas_array_joined: '',
        modernization_priority_count_count_of_pipe_separated_values: '0',
        keywords_details_keywords: '',
        keywords_count_count_of_semicolon_separated_values: '0',
        primary_keyword_first_keyword_before_semicolon: '',
        itar_controlled_details_itar_boolean_to_yes_no: '',
        requiresitar_1_if_itar_is_yes_else_0: '0',
        security_export_details_itar_duplicate: '',
        security_clearance_required_keywords_in_description: '',
        objective_details_objective_with_html_removed: '',
        objective_word_count_space_separated_word_count: '0',
        key_requirements_details_objective_duplicate: '',
        description_details_description_with_html_removed: '',
        description_word_count_space_separated_word_count: '0',
        description_length_character_count: '0',
        has_technical_details_1_if_description_gt_500_chars: '0',
        isxtech_xtech_mentioned_in_description: 'No',
        is_xtech_xtech_keyword_search_duplicate: 'No',
        prize_gating_yes_if_xtech_detected: 'No',
        competition_type_based_on_xtech_and_dp2_detection: '',
        phase_i_description_details_phase1description_with_html_removed: '',
        phase_ii_description_details_phase2description_with_html_removed: '',
        phase_iii_dual_use_details_phase3description_with_html_removed: '',
        has_commercial_potential_1_if_phase3description_exists: '0',
        references_details_referencedocuments_array_formatted: '',
        reference_docs_details_referencedocuments_duplicate: '',
        reference_count_count_of_semicolon_separated_refs: '0',
        has_references_1_if_references_exist: '0',
        phase_phasehierarchy_parsed_or_default_phase_i: '',
        phases_available_phasehierarchy_config_displayvalue_joined: '',
        phase_types_phasehierarchy_parsed_pipe_separated: '',
        phase_count_count_of_phase_types: '0',
        is_direct_to_phase_ii_dp2_or_direct_to_phase_ii_in_text: '0',
        phase_funding_dollar_amounts_from_phase_descriptions: '',
        funding_max_maximum_dollar_amount_found: '',
        award_amount_phase_i_dollar_amount_from_phase1description: '',
        award_amount_phase_ii_dollar_amount_from_phase2description: '',
        award_duration_phase_i_months_from_phase1description: '',
        award_duration_phase_ii_months_from_phase2description: '',
        total_potential_award_sum_of_all_phase_amounts_found: '',
        funding_type_cost_plus_or_fixed_price_keywords: '',
        topic_pdf_download_topics_api_public_topics_id_download_pdf: topic.topicId ? `${baseUrl}/topics/api/public/topics/${topic.topicId}/download/PDF` : '',
        pdf_link_topic_pdf_duplicate: topic.topicId ? `${baseUrl}/topics/api/public/topics/${topic.topicId}/download/PDF` : '',
        solicitation_instructions_download_submissions_api_public_download_url: '',
        solicitationinstructionsurl_solicitation_download_duplicate: '',
        component_instructions_download_component_specific_download_url: '',
        componentinstructionsurl_component_download_duplicate: '',
        has_pdf_1_if_pdf_link_exists: topic.topicId ? '1' : '0',
        has_solicitation_instructions_1_if_solicitation_link_exists: '0',
        has_component_instructions_1_if_component_link_exists: '0',
        solicitation_instructions_version_baaprefaceuploadtitle: '',
        component_instructions_version_baainstructions_filename_match: '',
        tpoc_topicmanagers_where_assignmenttype_tpoc_names_joined: '',
        tpoc_names_topicmanagers_name_array: '',
        tpoc_emails_topicmanagers_email_array: '',
        tpoc_centers_topicmanagers_center_array: '',
        tpoc_count_number_of_tpocs: '0',
        has_tpoc_1_if_tpoc_exists: '0',
        show_tpoc_showtpoc_boolean: topic.showTpoc ? 'Yes' : 'No',
        tpoc_email_domain_domain_from_first_tpoc_email: '',
        owner_owner_field: topic.owner || '',
        internal_lead_internallead_field: topic.internalLead || '',
        sponsor_component_sponsorcomponent_or_component_fallback: topic.sponsorComponent || topic.component || '',
        evaluation_weights_evaluationweights_or_evaluationcriteria: '',
        selection_criteria_selectioncriteria: topic.selectionCriteria || '',
        has_evaluation_criteria_1_if_evaluation_weights_exist: '0',
        historical_awards_historicalawards: String(topic.historicalAwards || ''),
        previous_awards_count_previousawardscount: String(topic.previousAwardsCount || ''),
        success_rate_successrate: String(topic.successRate || ''),
        competition_level_based_on_historicalawards_thresholds: '',
        year_current_year: String(new Date().getFullYear()),
        solicitation_year_year_from_cyclename_using_regex: '',
        program_year_programyear: topic.programYear || '',
        fiscal_year_based_on_oct_1_fiscal_year_start: '',
        quarter_calendar_quarter_from_topicstartdate: '',
        baa_preface_upload_id_baaprefaceuploadid: String(topic.baaPrefaceUploadId || ''),
        baa_preface_title_baaprefaceuploadtitle: topic.baaPrefaceUploadTitle || '',
        is_release_preface_isreleasepreface_boolean: topic.isReleasePreface ? 'Yes' : 'No',
        baa_instruction_files_baainstructions_filename_array_joined: '',
        baa_files_count_length_of_baainstructions_array: '0',
        has_baa_instructions_1_if_baainstructions_exists: '0',
        applicable_actions_applicableactions_array_joined: topic.applicableActions ? topic.applicableActions.join(', ') : '',
        actions_count_length_of_applicableactions: String(topic.applicableActions ? topic.applicableActions.length : 0),
        is_active_isactive_boolean: topic.isActive ? 'Yes' : 'No',
        is_archived_isarchived_boolean: topic.isArchived ? 'Yes' : 'No',
        is_draft_isdraft_boolean: topic.isDraft ? 'Yes' : 'No',
        is_published_ispublished_boolean: topic.isPublished ? 'Yes' : 'No',
        allow_proposal_submission_allowproposalsubmission_boolean: topic.allowProposalSubmission ? 'Yes' : 'No',
        is_open_for_submission_1_if_topicstatus_is_open: topic.topicStatus === 'Open' ? '1' : '0',
        proposal_requirements_proposalrequirements: topic.proposalRequirements || '',
        submission_instructions_submissioninstructions: topic.submissionInstructions || '',
        eligibility_requirements_eligibilityrequirements: topic.eligibilityRequirements || '',
        has_special_requirements_special_keywords_detected: '',
        information_quality_based_on_key_field_lengths: '',
        data_completeness_score_percentage_of_filled_fields: '',
        last_scraped: new Date().toISOString(),
        search_tags_component_program_status_combined: '',
        category_tags_tech_categories_from_keywords: '',
        priority_score_multi_factor_scoring_algorithm: '',
        relevance_score_user_defined_empty_for_custom_scoring: '',
        record_id_topiccode_topicid_first_8_chars: `${topic.topicCode || ''}_${(topic.topicId || '').substring(0, 8)}`,
        unique_id_cyclename_topiccode: `${topic.cycleName || ''}_${topic.topicCode || ''}`,
        tracking_number_trackingnumber_if_exists: topic.trackingNumber || '',
        version_version_or_default_1: topic.version || '1'
      };

      processedTopics.push(processedTopic);
      
    } catch (error) {
      console.error(`❌ Error processing topic ${topic.topicId}:`, error);
      continue;
    }
  }

  return processedTopics;
}

async function updateDatabase(topics: any[]) {
  let newRecords = 0;
  let updatedRecords = 0;

  try {
    // Get existing topic IDs for comparison
    const { data: existingTopics, error: fetchError } = await supabase
      .from('sbir_final')
      .select('topic_id, updated_date');

    if (fetchError) {
      console.error('❌ Error fetching existing topics:', fetchError);
      throw fetchError;
    }

    const existingTopicMap = new Map(
      existingTopics?.map(topic => [topic.topic_id, topic.updated_date]) || []
    );

    // Process topics in batches
    const batchSize = 100;
    for (let i = 0; i < topics.length; i += batchSize) {
      const batch = topics.slice(i, i + batchSize);
      
      for (const topic of batch) {
        const existingDate = existingTopicMap.get(topic.topic_id);
        
        if (!existingDate) {
          // New record - insert
          const { error: insertError } = await supabase
            .from('sbir_final')
            .insert(topic);
          
          if (insertError) {
            console.error(`❌ Error inserting topic ${topic.topic_id}:`, insertError);
            console.error(`❌ Insert error code: ${insertError.code}`);
            console.error(`❌ Insert error message: ${insertError.message}`);
            console.error(`❌ First few keys of topic being inserted:`, Object.keys(topic).slice(0, 20));
            
            // Try to extract column name from error message
            if (insertError.message.includes('does not exist')) {
              const match = insertError.message.match(/column [^.]+\.(\S+) does not exist/);
              if (match) {
                console.error(`❌ Problem column: ${match[1]}`);
              }
            }
            continue;
          }
          
          newRecords++;
        } else {
          // Existing record - check if update needed
          const topicUpdatedDate = new Date(topic.updated_date).getTime();
          const existingUpdatedDate = new Date(existingDate).getTime();
          
          if (topicUpdatedDate > existingUpdatedDate) {
            // Update needed
            const { error: updateError } = await supabase
              .from('sbir_final')
              .update(topic)
              .eq('topic_id', topic.topic_id);
            
            if (updateError) {
              console.error(`❌ Error updating topic ${topic.topic_id}:`, updateError);
              continue;
            }
            
            updatedRecords++;
          }
        }
      }
    }

    console.log(`✅ Database update complete: ${newRecords} new, ${updatedRecords} updated`);

  } catch (error) {
    console.error('❌ Database update error:', error);
    throw error;
  }

  return { newRecords, updatedRecords };
}
