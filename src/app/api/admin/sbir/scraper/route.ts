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

def strip_html(html_text):
    """Remove HTML tags and decode entities"""
    if not html_text:
        return ''
    import html
    import re
    # Decode HTML entities
    text = html.unescape(str(html_text))
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Clean up whitespace
    text = re.sub(r'\\s+', ' ', text).strip()
    return text

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

print(f"\\n Filtering for ACTIVE opportunities only...")

# Filter for ONLY Open and Pre-Release topics
active_topics = [t for t in all_topics if t.get('topicStatus') in ['Open', 'Pre-Release']]
print(f"   ✓ Found {len(active_topics)} active opportunities (Open/Pre-Release)")
print(f"   Skipping {len(all_topics) - len(active_topics)} closed opportunities")

# Process topics with FULL DETAILED DATA
formatted_topics = []
start_time = time.time()

print(f"\\n Fetching FULL DETAILS for each opportunity...")
for idx, topic in enumerate(active_topics):
    topic_id = topic.get('topicId', '')
    topic_code = topic.get('topicCode', 'Unknown')
    
    if not topic_id:
        continue
    
    # Calculate progress percentage
    progress_pct = int(((idx + 1) / len(active_topics)) * 100)
    print(f"   [{progress_pct}%] Processing {idx + 1}/{len(active_topics)}: {topic_code} - {topic.get('topicTitle', '')[:60]}...")
    
    # FETCH DETAILED TOPIC DATA
    try:
        detail_url = f"{base_url}/topics/api/public/topics/{topic_id}"
        detail_response = session.get(detail_url, timeout=20)
        
        if detail_response.status_code == 200:
            detailed = detail_response.json()
            # Merge detailed data with basic topic data
            topic.update(detailed if isinstance(detailed, dict) else {})
            print(f"      ✓ Fetched detailed data")
        else:
            print(f"      ⚠ Could not fetch details (status {detail_response.status_code})")
    except Exception as e:
        print(f"      ⚠ Error fetching details: {e}")
    
    # FETCH Q&A CONTENT if questions exist
    qa_content = ''
    if topic.get('topicQuestionCount', 0) > 0:
        try:
            qa_url = f"{base_url}/topics/api/public/topics/{topic_id}/questions"
            qa_response = session.get(qa_url, timeout=15)
            
            if qa_response.status_code == 200:
                qa_data = qa_response.json()
                if isinstance(qa_data, list) and len(qa_data) > 0:
                    qa_content = '\\n\\n'.join([
                        f"Q: {q.get('question', '')}\\nA: {q.get('answer', '')}"
                        for q in qa_data if q.get('question')
                    ])
                    print(f"      ✓ Fetched {len(qa_data)} Q&A items")
        except Exception as e:
            print(f"      ⚠ Error fetching Q&A: {e}")
    
    # Calculate fields
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
        'qa_content_fetched': qa_content,
        'qa_last_updated': format_date(topic.get('updatedDate')) if qa_content else '',
        
        # TECHNOLOGY AREAS - Extract from detailed data
        'technology_areas_details_technologyareas_array_joined': ', '.join([ta.get('name', '') for ta in topic.get('technologyAreas', [])]) if topic.get('technologyAreas') else '',
        'technology_areas_count_count_of_comma_separated_values': str(len(topic.get('technologyAreas', []))),
        'primary_technology_area_first_item_in_technologyareas': topic.get('technologyAreas', [{}])[0].get('name', '') if topic.get('technologyAreas') else '',
        
        # MODERNIZATION PRIORITIES
        'tech_modernization_details_focusareas_mapped': ' | '.join([fa.get('name', '') for fa in topic.get('focusAreas', [])]) if topic.get('focusAreas') else '',
        'modernization_priorities_details_focusareas_array_joined': ' | '.join([fa.get('name', '') for fa in topic.get('focusAreas', [])]) if topic.get('focusAreas') else '',
        'modernization_priority_count_count_of_pipe_separated_values': str(len(topic.get('focusAreas', []))),
        
        # KEYWORDS
        'keywords_details_keywords': '; '.join([kw.get('name', '') or str(kw) for kw in (topic.get('keywords', []) if isinstance(topic.get('keywords'), list) else [])]) if topic.get('keywords') else '',
        'keywords_count_count_of_semicolon_separated_values': str(len(topic.get('keywords', []) if isinstance(topic.get('keywords'), list) else [])),
        'primary_keyword_first_keyword_before_semicolon': (topic.get('keywords', [{}])[0].get('name', '') if isinstance(topic.get('keywords'), list) and len(topic.get('keywords', [])) > 0 else ''),
        
        # ITAR / SECURITY
        'itar_controlled_details_itar_boolean_to_yes_no': 'Yes' if topic.get('itar') else 'No',
        'requiresitar_1_if_itar_is_yes_else_0': '1' if topic.get('itar') else '0',
        'security_export_details_itar_duplicate': 'Yes' if topic.get('itar') else 'No',
        'security_clearance_required_keywords_in_description': 'Yes' if ('clearance' in str(topic.get('description', '')).lower() or 'secret' in str(topic.get('description', '')).lower()) else 'No',
        
        # DESCRIPTIONS - Remove HTML
        'objective_details_objective_with_html_removed': strip_html(topic.get('objective', '')),
        'objective_word_count_space_separated_word_count': str(len(strip_html(topic.get('objective', '')).split())) if topic.get('objective') else '0',
        'key_requirements_details_objective_duplicate': strip_html(topic.get('objective', '')),
        'description_details_description_with_html_removed': strip_html(topic.get('description', '')),
        'description_word_count_space_separated_word_count': str(len(strip_html(topic.get('description', '')).split())) if topic.get('description') else '0',
        'description_length_character_count': str(len(strip_html(topic.get('description', '')))) if topic.get('description') else '0',
        'has_technical_details_1_if_description_gt_500_chars': '1' if len(strip_html(topic.get('description', ''))) > 500 else '0',
        'isxtech_xtech_mentioned_in_description': 'Yes' if 'xtech' in str(topic.get('description', '')).lower() else 'No',
        'is_xtech_xtech_keyword_search_duplicate': 'Yes' if 'xtech' in str(topic.get('description', '')).lower() or 'xtech' in str(topic.get('title', '')).lower() else 'No',
        'prize_gating_yes_if_xtech_detected': 'Yes' if 'xtech' in str(topic.get('description', '')).lower() else 'No',
        'competition_type_based_on_xtech_and_dp2_detection': 'xTech' if 'xtech' in str(topic.get('description', '')).lower() else ('DP2' if 'direct to phase ii' in str(topic.get('description', '')).lower() else 'Standard'),
        
        # PHASE DESCRIPTIONS
        'phase_i_description_details_phase1description_with_html_removed': strip_html(topic.get('phase1Description', '')),
        'phase_ii_description_details_phase2description_with_html_removed': strip_html(topic.get('phase2Description', '')),
        'phase_iii_dual_use_details_phase3description_with_html_removed': strip_html(topic.get('phase3Description', '')),
        'has_commercial_potential_1_if_phase3description_exists': '1' if topic.get('phase3Description') else '0',
        
        # REFERENCES
        'references_details_referencedocuments_array_formatted': '; '.join([ref.get('title', '') or ref.get('name', '') or str(ref) for ref in (topic.get('referenceDocuments', []) if isinstance(topic.get('referenceDocuments'), list) else [])]) if topic.get('referenceDocuments') else '',
        'reference_docs_details_referencedocuments_duplicate': '; '.join([ref.get('title', '') or ref.get('name', '') or str(ref) for ref in (topic.get('referenceDocuments', []) if isinstance(topic.get('referenceDocuments'), list) else [])]) if topic.get('referenceDocuments') else '',
        'reference_count_count_of_semicolon_separated_refs': str(len(topic.get('referenceDocuments', []) if isinstance(topic.get('referenceDocuments'), list) else [])),
        'has_references_1_if_references_exist': '1' if topic.get('referenceDocuments') and len(topic.get('referenceDocuments', [])) > 0 else '0',
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
        # PDF DOWNLOADS
        'topic_pdf_download_topics_api_public_topics_id_download_pdf': f"{base_url}/topics/api/public/topics/{topic_id}/download/PDF" if topic_id else '',
        'pdf_link_topic_pdf_duplicate': f"{base_url}/topics/api/public/topics/{topic_id}/download/PDF" if topic_id else '',
        
        # SOLICITATION & COMPONENT INSTRUCTIONS (using database schema names)
        'solicitation_instructions_download': topic.get('solicitationInstructionsUrl', ''),
        'solicitation_instructions_url': topic.get('solicitationInstructionsUrl', ''),
        'component_instructions_download': topic.get('componentInstructionsUrl', ''),
        'component_instructions_url': topic.get('componentInstructionsUrl', ''),
        'has_pdf': '1' if topic_id else '0',
        'has_solicitation_instructions': '1' if topic.get('solicitationInstructionsUrl') else '0',
        'has_component_instructions': '1' if topic.get('componentInstructionsUrl') else '0',
        'solicitation_instructions_version': topic.get('baaPrefaceUploadTitle', ''),
        'component_instructions_version': ', '.join([instr.get('fileName', '') for instr in (topic.get('baaInstructions', []) if isinstance(topic.get('baaInstructions'), list) else [])]) if topic.get('baaInstructions') else '',
        
        # TPOC (Technical Point of Contact) - Extract from topicManagers
        'tpoc_topicmanagers_where_assignmenttype_tpoc_names_joined': ', '.join([tm.get('name', '') for tm in (topic.get('topicManagers', []) if isinstance(topic.get('topicManagers'), list) else []) if tm.get('assignmentType') == 'TPOC']),
        'tpoc_names_topicmanagers_name_array': ', '.join([tm.get('name', '') for tm in (topic.get('topicManagers', []) if isinstance(topic.get('topicManagers'), list) else [])]) if topic.get('topicManagers') else '',
        'tpoc_emails_topicmanagers_email_array': ', '.join([tm.get('email', '') for tm in (topic.get('topicManagers', []) if isinstance(topic.get('topicManagers'), list) else []) if tm.get('email')]) if topic.get('topicManagers') else '',
        'tpoc_centers_topicmanagers_center_array': ', '.join([tm.get('center', '') for tm in (topic.get('topicManagers', []) if isinstance(topic.get('topicManagers'), list) else []) if tm.get('center')]) if topic.get('topicManagers') else '',
        'tpoc_count_number_of_tpocs': str(len([tm for tm in (topic.get('topicManagers', []) if isinstance(topic.get('topicManagers'), list) else []) if tm.get('assignmentType') == 'TPOC'])),
        'has_tpoc_1_if_tpoc_exists': '1' if any(tm.get('assignmentType') == 'TPOC' for tm in (topic.get('topicManagers', []) if isinstance(topic.get('topicManagers'), list) else [])) else '0',
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
    console.log('CSV Headers (first 10):', headers.slice(0, 10));
    
    // Check if instruction columns exist in CSV
    const hasInstructionCols = headers.some(h => h.includes('instruction'));
    console.log('Has instruction columns in CSV:', hasInstructionCols);
    if (hasInstructionCols) {
      const instructionHeaders = headers.filter(h => h.toLowerCase().includes('instruction'));
      console.log('Instruction-related headers:', instructionHeaders);
    }

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
        // Debug: Log first record's instruction fields
        if (i === 1 && records.length > 0) {
          const firstRecord = records[0];
          console.log('Sample record instruction fields:', {
            solicitation_instructions_download: firstRecord.solicitation_instructions_download,
            component_instructions_download: firstRecord.component_instructions_download,
            topic_number: firstRecord.topic_number
          });
        }
        
        const { error: insertError } = await supabase
          .from('sbir_final')
          .insert(records);

        if (insertError) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
          console.error('Sample failed record keys:', Object.keys(records[0] || {}));
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
