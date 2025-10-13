import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-middleware';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Check scraper status
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    return await checkScraperStatus();
  } catch (error) {
    console.error('SBIR scraper status check error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST - Trigger automated scraper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start_scraper') {
      return await startScraper();
    } else if (action === 'check_status') {
      return await checkScraperStatus();
    } else if (action === 'process_csv') {
      const { csvPath } = body;
      return await processCSV(csvPath);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in scraper API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function startScraper() {
  try {
    // Create the scraper script
    const scraperScript = `
import requests
import json
import csv
import os
from datetime import datetime
import pytz
import time
import re
import pandas as pd
from urllib.parse import quote

def clean_html(text):
    if not text:
        return ""
    clean = re.sub('<.*?>', '', text)
    clean = clean.replace('&nbsp;', ' ')
    clean = clean.replace('&amp;', '&')
    clean = clean.replace('&lt;', '<')
    clean = clean.replace('&gt;', '>')
    clean = clean.replace('&quot;', '"')
    clean = clean.replace('&#39;', "'")
    clean = clean.replace('&emsp;', '  ')
    clean = clean.replace('&rsquo;', "'")
    clean = clean.replace('&mdash;', '-')
    clean = re.sub(r'\\s+', ' ', clean)
    return clean.strip()

def format_date(timestamp):
    if timestamp:
        try:
            return datetime.fromtimestamp(timestamp/1000).strftime('%m/%d/%Y')
        except:
            return ""
    return ""

def calculate_days_until(timestamp):
    if not timestamp:
        return ''
    try:
        target_date = datetime.fromtimestamp(timestamp/1000, pytz.timezone('US/Eastern'))
        now = datetime.now(pytz.timezone('US/Eastern'))
        delta = (target_date - now).days
        return str(delta) if delta > 0 else '0'
    except:
        return ''

def calculate_days_since(timestamp):
    if not timestamp:
        return ''
    try:
        past_date = datetime.fromtimestamp(timestamp/1000, pytz.timezone('US/Eastern'))
        now = datetime.now(pytz.timezone('US/Eastern'))
        delta = (now - past_date).days
        return str(delta) if delta > 0 else '0'
    except:
        return ''

def get_window_status(start_timestamp, end_timestamp):
    if not start_timestamp or not end_timestamp:
        return 'Unknown'

    now = datetime.now(pytz.timezone('US/Eastern'))
    try:
        start = datetime.fromtimestamp(start_timestamp/1000, pytz.timezone('US/Eastern'))
        end = datetime.fromtimestamp(end_timestamp/1000, pytz.timezone('US/Eastern'))

        if now < start:
            return 'Upcoming'
        elif now > end:
            return 'Closed'
        else:
            return 'Open'
    except:
        return 'Unknown'

def get_urgency_level(days_until_close):
    if not days_until_close:
        return ''
    try:
        days = int(days_until_close)
        if days <= 3:
            return 'Critical'
        elif days <= 7:
            return 'High'
        elif days <= 14:
            return 'Medium'
        else:
            return 'Low'
    except:
        return ''

def expand_component_name(component):
    component_map = {
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
    }
    return component_map.get(str(component).upper(), component) if component else ''

print(" AUTOMATED SBIR SCRAPER - DAILY UPDATE")
print("="*50)
print(f" Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(" Automated extraction for database update")
print("="*50)

base_url = "https://www.dodsbirsttr.mil"
session = requests.Session()

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

session.headers.update(headers)

print(" Initializing session...")
try:
    main_page = session.get(f"{base_url}/topics-app/", timeout=10)
    print(f"   Session initialized (status: {main_page.status_code})")
    time.sleep(1)

    api_headers = {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    }
    session.headers.update(api_headers)
except Exception as e:
    print(f"   Warning: Could not initialize session: {e}")

# Fetch all topics
print("\\n📡 Fetching all topics...")
all_topics = []
page = 0
size = 100

while True:
    search_params = {
        "searchText": None,
        "components": None,
        "programYear": None,
        "solicitationCycleNames": None,
        "releaseNumbers": [],
        "topicReleaseStatus": [],
        "modernizationPriorities": [],
        "sortBy": "finalTopicCode,asc",
        "technologyAreaIds": [],
        "component": None,
        "program": None
    }

    encoded_params = quote(json.dumps(search_params))
    search_url = f"{base_url}/topics/api/public/topics/search?searchParam={encoded_params}&size={size}&page={page}"

    if page % 10 == 0:
        print(f"   Fetching page {page + 1}...")

    try:
        response = session.get(search_url, timeout=30)

        if response.status_code == 200:
            data = response.json()

            if isinstance(data, dict) and 'data' in data:
                topics = data['data']
                total = data.get('total', 0)

                if page == 0:
                    print(f"   ✓ Total topics available: {total}")

                all_topics.extend(topics)

                if len(topics) < size or len(all_topics) >= total:
                    print(f"\\n Retrieved all {len(all_topics)} topics")
                    break

                page += 1
                time.sleep(0.2)
            else:
                break
        else:
            break

    except Exception as e:
        print(f"   Error on page {page}: {e}")
        break

print(f"\\n Processing {len(all_topics)} topics...")

# Process topics (simplified for speed)
formatted_topics = []
start_time = time.time()

for idx, topic in enumerate(all_topics):
    if idx % 1000 == 0:
        print(f"   Processing topic {idx + 1}/{len(all_topics)}...")

    topic_id = topic.get('topicId', '')
    if not topic_id:
        continue

    # Basic processing (skip detailed fetching for speed)
    days_until_close = calculate_days_until(topic.get('topicEndDate'))
    days_since_open = calculate_days_since(topic.get('topicStartDate'))
    proposal_window_status = get_window_status(topic.get('topicStartDate'), topic.get('topicEndDate'))

    formatted_topic = {
        'topic_number': topic.get('topicCode', ''),
        'topic_id': topic_id[:2000],  # Truncate for index safety
        'title': topic.get('topicTitle', ''),
        'short_title': topic.get('topicTitle', '')[:50] if topic.get('topicTitle') else '',
        'component': topic.get('component', ''),
        'component_full_name': expand_component_name(topic.get('component', '')),
        'command': topic.get('command', ''),
        'program': topic.get('program', ''),
        'program_type': 'SBIR' if 'SBIR' in topic.get('program', '') else 'STTR' if 'STTR' in topic.get('program', '') else 'Other',
        'title_1': topic.get('solicitationTitle', ''),
        'solicitation_number': topic.get('solicitationNumber', ''),
        'cycle_name': topic.get('cycleName', ''),
        'release_number': str(topic.get('releaseNumber', '')),
        'solicitation_phase': '',
        'status_topicstatus': topic.get('topicStatus', ''),
        'topic_status': topic.get('topicStatus', ''),
        'status': proposal_window_status,
        'days_until_close': str(days_until_close) if days_until_close else '',
        'days_since_open': str(days_since_open) if days_since_open else '',
        'days_until_close_1': get_urgency_level(days_until_close),
        'open_date': format_date(topic.get('topicStartDate')),
        'close_date': format_date(topic.get('topicEndDate')),
        'open_datetime': format_date(topic.get('topicStartDate')),
        'close_datetime': format_date(topic.get('topicEndDate')),
        'duration_days': '',
        'pre_release_start': format_date(topic.get('topicPreReleaseStartDate')),
        'pre_release_end': format_date(topic.get('topicPreReleaseEndDate')),
        'pre_release_duration': '',
        'created_date': format_date(topic.get('createdDate')),
        'updated_date': format_date(topic.get('updatedDate')),
        'modified_date': format_date(topic.get('modifiedDate')),
        'last_activity_date': '',
        'qanda_start_topicqastartdate': format_date(topic.get('topicQAStartDate')),
        'qanda_end_topicqaenddate': format_date(topic.get('topicQAEndDate')),
        'tpoc': '',
        'tpoc_1': '',
        'qanda_status_topicqastatus': topic.get('topicQAStatus', ''),
        'qanda_status_display_topicqastatusdisplay': topic.get('topicQAStatusDisplay', ''),
        'qanda_open_topicqaopen_boolean': 'Yes' if topic.get('topicQAOpen') else 'No',
        'qa_start': '',
        'days_until_qa_close': str(calculate_days_until(topic.get('topicQAEndDate'))),
        'total_questions': str(topic.get('topicQuestionCount', 0) if topic.get('topicQuestionCount') is not None else 0),
        'published_questions': str(topic.get('noOfPublishedQuestions', 0) if topic.get('noOfPublishedQuestions') is not None else 0),
        'published_questions_1': str((topic.get('topicQuestionCount', 0) if topic.get('topicQuestionCount') is not None else 0) - (topic.get('noOfPublishedQuestions', 0) if topic.get('noOfPublishedQuestions') is not None else 0)),
        'qa_response_rate_percentage': '',
        'hasqa_1_if_topicquestioncount_gt_0': '1' if (topic.get('topicQuestionCount', 0) if topic.get('topicQuestionCount') is not None else 0) > 0 else '0',
        'qa_data_topicquestioncount_duplicate': str(topic.get('topicQuestionCount', 0) if topic.get('topicQuestionCount') is not None else 0),
        'qa_content_fetched': '',  # Skip Q&A content for speed
        'qa_last_updated': '',
        'technology_areas_details_technologyareas_array_joined': '',
        'technology_areas_count_count_of_comma_separated_values': '0',
        'primary_technology_area_first_item_in_technologyareas': '',
        'tech_modernization_details_focusareas_mapped': '',
        'modernization_priorities_details_focusareas_array_joined': '',
        'modernization_priority_count_count_of_pipe_separated_values': '0',
        'keywords_details_keywords': '',
        'keywords_count_count_of_semicolon_separated_values': '0',
        'primary_keyword_first_keyword_before_semicolon': '',
        'itar_controlled_details_itar_boolean_to_yes_no': '',
        'requiresitar_1_if_itar_is_yes_else_0': '0',
        'security_export_details_itar_duplicate': '',
        'security_clearance_required_keywords_in_description': '',
        'objective_details_objective_with_html_removed': '',
        'objective_word_count_space_separated_word_count': '0',
        'key_requirements_details_objective_duplicate': '',
        'description_details_description_with_html_removed': '',
        'description_word_count_space_separated_word_count': '0',
        'description_length_character_count': '0',
        'has_technical_details_1_if_description_gt_500_chars': '0',
        'isxtech_xtech_mentioned_in_description': 'No',
        'is_xtech_xtech_keyword_search_duplicate': 'No',
        'prize_gating_yes_if_xtech_detected': 'No',
        'competition_type_based_on_xtech_and_dp2_detection': '',
        'phase_i_description_details_phase1description_with_html_removed': '',
        'phase_ii_description_details_phase2description_with_html_removed': '',
        'phase_iii_dual_use_details_phase3description_with_html_removed': '',
        'has_commercial_potential_1_if_phase3description_exists': '0',
        'references_details_referencedocuments_array_formatted': '',
        'reference_docs_details_referencedocuments_duplicate': '',
        'reference_count_count_of_semicolon_separated_refs': '0',
        'has_references_1_if_references_exist': '0',
        'phase_phasehierarchy_parsed_or_default_phase_i': '',
        'phases_available_phasehierarchy_config_displayvalue_joined': '',
        'phase_types_phasehierarchy_parsed_pipe_separated': '',
        'phase_count_count_of_phase_types': '0',
        'is_direct_to_phase_ii_dp2_or_direct_to_phase_ii_in_text': '0',
        'phase_funding_dollar_amounts_from_phase_descriptions': '',
        'funding_max_maximum_dollar_amount_found': '',
        'award_amount_phase_i_dollar_amount_from_phase1description': '',
        'award_amount_phase_ii_dollar_amount_from_phase2description': '',
        'award_duration_phase_i_months_from_phase1description': '',
        'award_duration_phase_ii_months_from_phase2description': '',
        'total_potential_award_sum_of_all_phase_amounts_found': '',
        'funding_type_cost_plus_or_fixed_price_keywords': '',
        'topic_pdf_download_topics_api_public_topics_id_download_pdf': f"{base_url}/topics/api/public/topics/{topic_id}/download/PDF" if topic_id else '',
        'pdf_link_topic_pdf_duplicate': f"{base_url}/topics/api/public/topics/{topic_id}/download/PDF" if topic_id else '',
        'solicitation_instructions_download_submissions_api_public_download_url': '',
        'solicitationinstructionsurl_solicitation_download_duplicate': '',
        'component_instructions_download_component_specific_download_url': '',
        'componentinstructionsurl_component_download_duplicate': '',
        'has_pdf_1_if_pdf_link_exists': '1' if topic_id else '0',
        'has_solicitation_instructions_1_if_solicitation_link_exists': '0',
        'has_component_instructions_1_if_component_link_exists': '0',
        'solicitation_instructions_version_baaprefaceuploadtitle': '',
        'component_instructions_version_baainstructions_filename_match': '',
        'tpoc_topicmanagers_where_assignmenttype_tpoc_names_joined': '',
        'tpoc_names_topicmanagers_name_array': '',
        'tpoc_emails_topicmanagers_email_array': '',
        'tpoc_centers_topicmanagers_center_array': '',
        'tpoc_count_number_of_tpocs': '0',
        'has_tpoc_1_if_tpoc_exists': '0',
        'show_tpoc_showtpoc_boolean': 'Yes' if topic.get('showTpoc') else 'No',
        'tpoc_email_domain_domain_from_first_tpoc_email': '',
        'owner_owner_field': topic.get('owner', ''),
        'internal_lead_internallead_field': topic.get('internalLead', ''),
        'sponsor_component_sponsorcomponent_or_component_fallback': topic.get('sponsorComponent', topic.get('component', '')),
        'evaluation_weights_evaluationweights_or_evaluationcriteria': '',
        'selection_criteria_selectioncriteria': topic.get('selectionCriteria', ''),
        'has_evaluation_criteria_1_if_evaluation_weights_exist': '0',
        'historical_awards_historicalawards': str(topic.get('historicalAwards', '')),
        'previous_awards_count_previousawardscount': str(topic.get('previousAwardsCount', '')),
        'success_rate_successrate': str(topic.get('successRate', '')),
        'competition_level_based_on_historicalawards_thresholds': '',
        'year_current_year': str(datetime.now().year),
        'solicitation_year_year_from_cyclename_using_regex': '',
        'program_year_programyear': topic.get('programYear', ''),
        'fiscal_year_based_on_oct_1_fiscal_year_start': '',
        'quarter_calendar_quarter_from_topicstartdate': '',
        'baa_preface_upload_id_baaprefaceuploadid': str(topic.get('baaPrefaceUploadId', '')),
        'baa_preface_title_baaprefaceuploadtitle': topic.get('baaPrefaceUploadTitle', ''),
        'is_release_preface_isreleasepreface_boolean': 'Yes' if topic.get('isReleasePreface') else 'No',
        'baa_instruction_files_baainstructions_filename_array_joined': '',
        'baa_files_count_length_of_baainstructions_array': '0',
        'has_baa_instructions_1_if_baainstructions_exists': '0',
        'applicable_actions_applicableactions_array_joined': ', '.join(topic.get('applicableActions', [])) if topic.get('applicableActions') else '',
        'actions_count_length_of_applicableactions': str(len(topic.get('applicableActions', [])) if topic.get('applicableActions') else 0),
        'is_active_isactive_boolean': 'Yes' if topic.get('isActive') else 'No',
        'is_archived_isarchived_boolean': 'Yes' if topic.get('isArchived') else 'No',
        'is_draft_isdraft_boolean': 'Yes' if topic.get('isDraft') else 'No',
        'is_published_ispublished_boolean': 'Yes' if topic.get('isPublished') else 'No',
        'allow_proposal_submission_allowproposalsubmission_boolean': 'Yes' if topic.get('allowProposalSubmission') else 'No',
        'is_open_for_submission_1_if_topicstatus_is_open': '1' if topic.get('topicStatus') == 'Open' else '0',
        'proposal_requirements_proposalrequirements': topic.get('proposalRequirements', ''),
        'submission_instructions_submissioninstructions': topic.get('submissionInstructions', ''),
        'eligibility_requirements_eligibilityrequirements': topic.get('eligibilityRequirements', ''),
        'has_special_requirements_special_keywords_detected': '',
        'information_quality_based_on_key_field_lengths': '',
        'data_completeness_score_percentage_of_filled_fields': '',
        'last_scraped': datetime.now(pytz.timezone('US/Eastern')).strftime('%Y-%m-%d %H:%M:%S'),
        'search_tags_component_program_status_combined': '',
        'category_tags_tech_categories_from_keywords': '',
        'priority_score_multi_factor_scoring_algorithm': '',
        'relevance_score_user_defined_empty_for_custom_scoring': '',
        'record_id_topiccode_topicid_first_8_chars': f"{topic.get('topicCode', '')}_{topic.get('topicId', '')[:8]}",
        'unique_id_cyclename_topiccode': f"{topic.get('cycleName', '')}_{topic.get('topicCode', '')}",
        'tracking_number_trackingnumber_if_exists': topic.get('trackingNumber', ''),
        'version_version_or_default_1': topic.get('version', '1'),
    }

    formatted_topics.append(formatted_topic)

# Save CSV
eastern = pytz.timezone('US/Eastern')
now_eastern = datetime.now(eastern)
output_file = f"/tmp/sbir_update_{now_eastern.strftime('%Y%m%d_%H%M%S')}.csv"

final_df = pd.DataFrame(formatted_topics)
final_df.to_csv(output_file, index=False)

elapsed_hours = (time.time() - start_time) / 3600
print(f"\\n Scraping completed in {elapsed_hours:.1f} hours")
print(f" Processed {len(formatted_topics):,} topics")
print(f" Saved: {output_file}")

print("\\n AUTOMATED SCRAPER COMPLETED!")
`;

    // Write the scraper script to a temporary file
    const scriptPath = '/tmp/sbir_scraper.py';
    fs.writeFileSync(scriptPath, scraperScript);

    // Execute the scraper
    console.log('Starting automated SBIR scraper...');
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    console.log('Scraper output:', stdout);
    if (stderr) console.error('Scraper errors:', stderr);

    // Find the generated CSV file
    const csvFiles = fs.readdirSync('/tmp').filter(file => file.startsWith('sbir_update_'));
    if (csvFiles.length === 0) {
      throw new Error('No CSV file generated');
    }

    const latestCsv = csvFiles.sort().pop();
    const csvPath = `/tmp/${latestCsv}`;

    // Process the CSV and update database
    return await processCSV(csvPath);

  } catch (error) {
    console.error('Error starting scraper:', error);
    return NextResponse.json({ error: 'Failed to start scraper' }, { status: 500 });
  }
}

async function processCSV(csvPath: string) {
  try {
    console.log(`Processing CSV: ${csvPath}`);

    // Read and process the CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');

    console.log(`Found ${lines.length - 1} records to process`);

    // Clear existing data
    console.log('Clearing existing SBIR data...');
    const { error: deleteError } = await supabase
      .from('sbir_final')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.error('Error clearing data:', deleteError);
      return NextResponse.json({ error: 'Failed to clear existing data' }, { status: 500 });
    }

    // Insert new data in batches
    const batchSize = 1000;
    let processed = 0;

    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const records = [];

      for (const line of batch) {
        if (line.trim()) {
          const values = line.split(',');
          const record: any = {};

          headers.forEach((header, index) => {
            const value = values[index] || '';
            // Clean the header name to match database columns
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            record[cleanHeader] = value.replace(/^"|"$/g, ''); // Remove quotes
          });

          records.push(record);
        }
      }

      if (records.length > 0) {
        const { error: insertError } = await supabase
          .from('sbir_final')
          .insert(records);

        if (insertError) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
          continue;
        }

        processed += records.length;
        console.log(`Processed ${processed} records...`);
      }
    }

    // Clean up
    fs.unlinkSync(csvPath);

    return NextResponse.json({
      success: true,
      message: `Successfully updated database with ${processed} records`,
      processed
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
  }
}

async function checkScraperStatus() {
  try {
    // Check for recent scraping activity in the database
    const { data: recentActivity, error } = await supabase
      .from('sbir_final')
      .select('last_scraped')
      .order('last_scraped', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking scraper status:', error);
      return NextResponse.json({
        isRunning: false,
        status: 'idle',
        error: error.message
      });
    }

    // Check if there's recent activity (within last 24 hours)
    const isRecentlyActive = recentActivity && recentActivity.length > 0;
    let lastScraped = null;
    
    if (isRecentlyActive && recentActivity[0].last_scraped) {
      lastScraped = recentActivity[0].last_scraped;
    }

    return NextResponse.json({
      isRunning: false, // Always false for serverless environment
      status: 'idle',
      lastScraped,
      totalRecords: recentActivity?.length || 0,
      message: 'SBIR scraper status checked via database'
    });
  } catch (error) {
    console.error('Error in checkScraperStatus:', error);
    return NextResponse.json({
      isRunning: false,
      status: 'idle',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
