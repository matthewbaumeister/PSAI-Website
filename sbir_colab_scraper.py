#!/usr/bin/env python3
"""
SBIR HISTORICAL BULK SCRAPER - GOOGLE COLAB VERSION
Matches sbir_final table schema exactly
Automatically downloads CSV when complete
"""

# Install dependencies (Colab doesn't have pytz by default)
import subprocess
import sys
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pytz"])

import requests
import json
import csv
import os
from datetime import datetime
import pytz
import time
import re
from urllib.parse import quote

# ============================================================================
# HELPER FUNCTIONS - EXACT MATCH TO TypeScript mapper
# ============================================================================

def clean_html(text):
    """Remove HTML tags from text - matches TypeScript version"""
    if not text:
        return ""
    clean = re.sub('<.*?>', '', str(text))
    clean = clean.replace('&nbsp;', ' ')
    clean = clean.replace('&amp;', '&')
    clean = clean.replace('&lt;', '<')
    clean = clean.replace('&gt;', '>')
    clean = clean.replace('&quot;', '"')
    clean = clean.replace('&#39;', "'")
    clean = clean.replace('&emsp;', '  ')
    clean = clean.replace('&rsquo;', "'")
    clean = clean.replace('&mdash;', '-')
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def format_date(timestamp):
    """Convert timestamp to MM/DD/YYYY - matches TypeScript formatDate"""
    if not timestamp:
        return None
    try:
        return datetime.fromtimestamp(timestamp/1000).strftime('%m/%d/%Y')
    except:
        return None

def format_datetime_iso(timestamp):
    """Convert timestamp to ISO string - for open_datetime, close_datetime"""
    if not timestamp:
        return None
    try:
        return datetime.fromtimestamp(timestamp/1000).isoformat()
    except:
        return None

def calculate_days(start_ts, end_ts):
    """Calculate days between two timestamps"""
    if start_ts and end_ts:
        try:
            days = (end_ts - start_ts) / (1000 * 60 * 60 * 24)
            return int(days)
        except:
            return None
    return None

def calculate_days_until(timestamp):
    """Days until future date"""
    if not timestamp:
        return None
    try:
        target = datetime.fromtimestamp(timestamp/1000, pytz.timezone('US/Eastern'))
        now = datetime.now(pytz.timezone('US/Eastern'))
        delta = (target - now).days
        return delta if delta > 0 else 0
    except:
        return None

def calculate_days_since(timestamp):
    """Days since past date"""
    if not timestamp:
        return None
    try:
        past = datetime.fromtimestamp(timestamp/1000, pytz.timezone('US/Eastern'))
        now = datetime.now(pytz.timezone('US/Eastern'))
        delta = (now - past).days
        return delta if delta > 0 else 0
    except:
        return None

def get_window_status(start_ts, end_ts):
    """Determine submission window status"""
    if not start_ts or not end_ts:
        return None
    
    now = datetime.now(pytz.timezone('US/Eastern'))
    try:
        start = datetime.fromtimestamp(start_ts/1000, pytz.timezone('US/Eastern'))
        end = datetime.fromtimestamp(end_ts/1000, pytz.timezone('US/Eastern'))
        
        if now < start:
            return 'Upcoming'
        elif now > end:
            return 'Closed'
        else:
            return 'Open'
    except:
        return None

def get_urgency_level(days):
    """Urgency level based on days until close"""
    if days is None:
        return None
    try:
        d = int(days)
        if d <= 3:
            return 'Critical'
        elif d <= 7:
            return 'High'
        elif d <= 14:
            return 'Medium'
        else:
            return 'Low'
    except:
        return None

def expand_component_name(component):
    """Expand component abbreviations"""
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
    return component_map.get(str(component).upper(), component) if component else None

def to_boolean(val):
    """Convert various values to boolean"""
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ['yes', '1', 'true']
    return False

# ============================================================================
# MAIN SCRAPER
# ============================================================================

print("="*70)
print("🚀 SBIR HISTORICAL BULK SCRAPER - GOOGLE COLAB VERSION")
print("="*70)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("Matches: sbir_final table schema")
print("Output: CSV for Supabase import")
print("="*70)

base_url = "https://www.dodsbirsttr.mil"
session = requests.Session()

# ============================================================================
# SESSION INITIALIZATION - Exact match to Quick Scrape
# ============================================================================

print("\n🔐 Initializing session...")
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

session.headers.update(headers)

try:
    # Step 1: Visit main page
    print("   Step 1: Visiting main page...")
    main_page = session.get(f"{base_url}/topics-app/", timeout=10)
    print(f"   ✓ Main page loaded (status: {main_page.status_code})")
    time.sleep(1)
    
    # Step 2: Fetch component instructions (establishes API session)
    print("   Step 2: Fetching component instructions...")
    api_headers = {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
        'Origin': 'https://www.dodsbirsttr.mil',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    }
    
    comp_response = session.get(f"{base_url}/core/api/public/dropdown/components", headers=api_headers, timeout=10)
    print(f"   ✓ Component API called (status: {comp_response.status_code})")
    time.sleep(0.5)
    
    print("   ✓ Session fully initialized")
except Exception as e:
    print(f"   ⚠️ Session initialization warning: {e}")

# Longer delay before search
print("   Waiting 2 seconds before search...")
time.sleep(2)

# ============================================================================
# FETCH ALL TOPICS
# ============================================================================

print("\n📡 Fetching ALL topics (no status filter)...")
all_topics = []
page = 0
size = 2000  # Large page size for efficiency
max_pages = 20  # Safety limit

while page < max_pages:
    search_params = {
        "searchText": None,
        "components": None,
        "programYear": None,
        "solicitationCycleNames": None,
        "releaseNumbers": [],
        "topicReleaseStatus": [],  # EMPTY = all statuses
        "modernizationPriorities": [],
        "sortBy": "topicEndDate,desc",  # Sort by end date
        "technologyAreaIds": [],
        "component": None,
        "program": None
    }
    
    encoded_params = quote(json.dumps(search_params))
    search_url = f"{base_url}/topics/api/public/topics/search?searchParam={encoded_params}&size={size}&page={page}"
    
    print(f"   📄 Fetching page {page + 1}...")
    
    try:
        response = session.get(search_url, headers=api_headers, timeout=60)
        
        if response.status_code != 200:
            print(f"   ❌ Non-200 response: {response.status_code}")
            break
        
        data = response.json()
        
        # API returns data in data.data array
        if not data.get('data'):
            break
        
        page_topics = data['data']
        total = data.get('total', 0)
        
        if page == 0:
            print(f"   ✓ Total topics available: {total:,}")
        
        print(f"   ✓ Page {page + 1}: {len(page_topics):,} topics (total so far: {len(all_topics) + len(page_topics):,})")
        
        all_topics.extend(page_topics)
        
        # Stop if we've fetched everything
        if len(page_topics) < size or len(all_topics) >= total:
            break
        
        page += 1
        time.sleep(0.2)  # Rate limiting
        
    except Exception as e:
        print(f"   ❌ Error on page {page}: {e}")
        break

print(f"\n✅ Retrieved {len(all_topics):,} topics")

# ============================================================================
# PROCESS TOPICS WITH DETAILED EXTRACTION
# ============================================================================

print(f"\n🔄 Processing {len(all_topics):,} topics with detailed extraction...")
print("-"*70)

formatted_topics = []
start_time = time.time()
details_fetched = 0
qa_fetched = 0

for idx, topic in enumerate(all_topics):
    topic_id = topic.get('topicId')
    topic_code = topic.get('topicCode', 'Unknown')
    
    # Progress every 100 topics
    if (idx + 1) % 100 == 0:
        elapsed = time.time() - start_time
        rate = (idx + 1) / elapsed if elapsed > 0 else 1
        remaining_secs = (len(all_topics) - idx - 1) / rate
        
        print(f"   [{idx + 1:,}/{len(all_topics):,}] {((idx + 1)/len(all_topics))*100:.1f}% | "
              f"{elapsed/60:.1f}min elapsed, ~{remaining_secs/60:.1f}min remaining | "
              f"Details: {details_fetched:,}, Q&A: {qa_fetched:,}")
    
    # ========================================================================
    # FETCH DETAILED INFO - Matches Quick Scrape fetchTopicDetails
    # ========================================================================
    
    detailed_info = {}
    qa_content = None
    
    if topic_id:
        try:
            # Fetch /details endpoint
            details_url = f"{base_url}/topics/api/public/topics/{topic_id}/details"
            details_response = session.get(details_url, headers=api_headers, timeout=15)
            
            if details_response.status_code == 200:
                detailed_info = details_response.json()
                details_fetched += 1
            
            # Fetch Q&A if available
            question_count = topic.get('topicQuestionCount', 0) or topic.get('noOfPublishedQuestions', 0)
            if question_count and question_count > 0:
                qa_url = f"{base_url}/topics/api/public/topics/{topic_id}/questions"
                qa_response = session.get(qa_url, headers=api_headers, timeout=10)
                
                if qa_response.status_code == 200:
                    qa_data = qa_response.json()
                    if qa_data:
                        qa_fetched += 1
                        qa_formatted = []
                        
                        for q in qa_data:
                            q_text = clean_html(q.get('question', ''))
                            q_no = q.get('questionNo', '')
                            q_date = format_date(q.get('questionSubmittedOn'))
                            
                            a_text = ''
                            if q.get('answers') and len(q['answers']) > 0:
                                answer_json = q['answers'][0].get('answer', '{}')
                                try:
                                    answer_data = json.loads(answer_json)
                                    a_text = clean_html(answer_data.get('content', ''))
                                except:
                                    a_text = clean_html(answer_json)
                            
                            qa_formatted.append(f"Q{q_no} ({q_date}): {q_text}\nA: {a_text}")
                        
                        qa_content = '\n\n'.join(qa_formatted)
            
            time.sleep(0.15)  # Rate limiting
            
        except Exception as e:
            # Expected for older/closed topics
            pass
    
    # ========================================================================
    # MERGE TOPIC + DETAILED_INFO - EXACT MATCH TO TypeScript mapper
    # ========================================================================
    
    # Merge original topic with detailed info (same as TypeScript processTopicsSync)
    merged_topic = {**topic, **detailed_info}
    
    # Now extract fields matching mapToSupabaseColumns EXACTLY
    
    # Technology Areas
    tech_areas = None
    tech_areas_count = 0
    primary_tech_area = None
    if detailed_info.get('technologyAreas'):
        areas = []
        for area in detailed_info['technologyAreas']:
            if isinstance(area, dict):
                areas.append(area.get('name', ''))
            else:
                areas.append(str(area))
        tech_areas = ', '.join(filter(None, areas))
        tech_areas_count = len(areas)
        primary_tech_area = areas[0] if areas else None
    
    # Modernization Priorities (focusAreas)
    mod_priorities = None
    mod_priority_count = 0
    if detailed_info.get('focusAreas'):
        priorities = []
        for area in detailed_info['focusAreas']:
            if isinstance(area, dict):
                priorities.append(area.get('name', ''))
            else:
                priorities.append(str(area))
        mod_priorities = ' | '.join(filter(None, priorities))
        mod_priority_count = len(priorities)
    
    # Keywords
    keywords = None
    keywords_count = 0
    primary_keyword = None
    if detailed_info.get('keywords'):
        kw = detailed_info['keywords']
        if isinstance(kw, list):
            keywords = '; '.join(kw)
            keywords_count = len(kw)
            primary_keyword = kw[0] if kw else None
        else:
            keywords = str(kw).replace(';', '; ').strip()
            kw_list = keywords.split(';')
            keywords_count = len(kw_list)
            primary_keyword = kw_list[0].strip() if kw_list else None
    
    # ITAR
    itar_controlled = to_boolean(detailed_info.get('itar', False))
    
    # Descriptions
    objective = clean_html(detailed_info.get('objective')) if detailed_info.get('objective') else None
    description = clean_html(detailed_info.get('description')) if detailed_info.get('description') else None
    phase1_desc = clean_html(detailed_info.get('phase1Description')) if detailed_info.get('phase1Description') else None
    phase2_desc = clean_html(detailed_info.get('phase2Description')) if detailed_info.get('phase2Description') else None
    phase3_desc = clean_html(detailed_info.get('phase3Description')) if detailed_info.get('phase3Description') else None
    
    # Check for xTech
    is_xtech = False
    if description and ('xtech' in description.lower() or 'x-tech' in description.lower()):
        is_xtech = True
    
    # References
    references = None
    ref_count = 0
    if detailed_info.get('referenceDocuments'):
        refs = []
        for ref_doc in detailed_info['referenceDocuments']:
            ref_title = clean_html(ref_doc.get('referenceTitle', ''))
            if ref_title:
                refs.append(ref_title)
        references = '; '.join(refs)
        ref_count = len(refs)
    
    # BAA Instructions
    baa_instruction_files = None
    if detailed_info.get('baaInstructions'):
        files = []
        for instruction in detailed_info['baaInstructions']:
            file_name = instruction.get('fileName', '')
            if file_name:
                files.append(file_name)
        baa_instruction_files = '; '.join(files)
    
    # TPOC
    tpoc_names = []
    tpoc_emails = []
    tpoc_centers = []
    if detailed_info.get('topicManagers'):
        for manager in detailed_info['topicManagers']:
            if manager.get('topicManagerName'):
                tpoc_names.append(manager['topicManagerName'])
            if manager.get('topicManagerEmail'):
                tpoc_emails.append(manager['topicManagerEmail'])
            if manager.get('topicManagerCenter'):
                tpoc_centers.append(manager['topicManagerCenter'])
    
    tpoc_names_str = '; '.join(tpoc_names) if tpoc_names else None
    tpoc_emails_str = '; '.join(tpoc_emails) if tpoc_emails else None
    tpoc_centers_str = '; '.join(tpoc_centers) if tpoc_centers else None
    tpoc_count = len(tpoc_names)
    tpoc_email_domain = None
    if tpoc_emails and '@' in tpoc_emails[0]:
        tpoc_email_domain = tpoc_emails[0].split('@')[1]
    
    # Calculate date fields
    days_until_close = calculate_days_until(topic.get('topicEndDate'))
    days_since_open = calculate_days_since(topic.get('topicStartDate'))
    duration_days = calculate_days(topic.get('topicStartDate'), topic.get('topicEndDate'))
    pre_release_duration = calculate_days(topic.get('topicPreReleaseStartDate'), topic.get('topicPreReleaseEndDate'))
    proposal_window_status = get_window_status(topic.get('topicStartDate'), topic.get('topicEndDate'))
    urgency_level = get_urgency_level(days_until_close)
    days_until_qa_close = calculate_days_until(topic.get('topicQAEndDate'))
    
    # Program type
    program = topic.get('program', '')
    program_type = None
    if program:
        if 'SBIR' in program:
            program_type = 'SBIR'
        elif 'STTR' in program:
            program_type = 'STTR'
    
    # Q&A calculations
    topic_question_count = topic.get('topicQuestionCount', 0) or 0
    no_of_published_questions = topic.get('noOfPublishedQuestions', 0) or 0
    qa_response_rate = None
    if topic_question_count and topic_question_count > 0:
        qa_response_rate = int((no_of_published_questions / topic_question_count) * 100)
    
    # Instructions URLs
    solicitation_instructions_download = None
    solicitation_instructions_version = None
    component_instructions_download = None
    component_instructions_version = None
    
    if topic.get('baaPrefaceUploadId') and topic.get('topicStatus') in ['Open', 'Pre-Release']:
        solicitation_instructions_download = f"{base_url}/submissions/api/public/download/{topic['baaPrefaceUploadId']}"
    
    if topic.get('baaPrefaceUploadTitle'):
        solicitation_instructions_version = topic['baaPrefaceUploadTitle']
    
    if baa_instruction_files:
        component_instructions_version = baa_instruction_files
    
    # Topic PDF
    topic_pdf_download = None
    if topic_id:
        topic_pdf_download = f"{base_url}/topics/api/public/topics/{topic_id}/download/PDF"
    
    # Direct to Phase II detection
    is_direct_to_phase_ii = False
    if detailed_info.get('isDirectToPhaseII'):
        is_direct_to_phase_ii = to_boolean(detailed_info['isDirectToPhaseII'])
    
    # Current timestamp
    now_eastern = datetime.now(pytz.timezone('US/Eastern'))
    last_scraped = now_eastern.isoformat()
    
    # ========================================================================
    # BUILD RECORD - MATCHES sbir_final SCHEMA EXACTLY
    # ========================================================================
    
    record = {
        # Core identification
        'topic_number': topic.get('topicCode'),
        'topic_id': topic_id,
        'title': topic.get('topicTitle'),
        'short_title': topic.get('topicTitle', '')[:50] if topic.get('topicTitle') else None,
        
        # Component & Program
        'component': topic.get('component'),
        'component_full_name': expand_component_name(topic.get('component')),
        'command': topic.get('command'),
        'program': program,
        'program_type': program_type,
        
        # Solicitation info
        'solicitation_title': topic.get('solicitationTitle'),
        'solicitation_number': topic.get('solicitationNumber'),
        'cycle_name': topic.get('cycleName'),  # CRITICAL for composite key!
        'release_number': str(topic.get('releaseNumber')) if topic.get('releaseNumber') else None,
        'solicitation_phase': None,  # Not in API
        
        # Status
        'status': topic.get('topicStatus'),
        'proposal_window_status': proposal_window_status,
        'urgency_level': urgency_level,
        
        # Dates
        'open_date': format_date(topic.get('topicStartDate')),
        'close_date': format_date(topic.get('topicEndDate')),
        'open_datetime': format_datetime_iso(topic.get('topicStartDate')),
        'close_datetime': format_datetime_iso(topic.get('topicEndDate')),
        'pre_release_date': format_date(topic.get('topicPreReleaseStartDate')),
        'pre_release_date_close': format_date(topic.get('topicPreReleaseEndDate')),
        'created_date': format_date(topic.get('createdDate')),
        'updated_date': format_date(topic.get('updatedDate')),
        'modified_date': format_date(topic.get('modifiedDate')),
        'last_activity_date': None,  # Not calculated in Python
        'last_scraped': last_scraped,
        
        # Date calculations
        'days_until_close': days_until_close,
        'days_since_open': days_since_open,
        'duration_days': duration_days,
        'pre_release_duration': pre_release_duration,
        
        # Q&A information
        'qa_close_date': format_date(topic.get('topicQAEndDate')),
        'qa_window_active': False,  # Not calculated in Python
        'topic_question_count': topic_question_count,
        'no_of_published_questions': no_of_published_questions,
        'qa_response_rate_percentage': qa_response_rate,
        'days_until_qa_close': days_until_qa_close,
        'qa_content': qa_content,
        'qa_content_fetched': True if qa_content else False,
        'qa_last_updated': None,  # Not extracted
        
        # Technology & Keywords
        'technology_areas': tech_areas,
        'technology_areas_count': tech_areas_count,
        'primary_technology_area': primary_tech_area,
        'modernization_priorities': mod_priorities,
        'modernization_priority_count': mod_priority_count,
        'keywords': keywords,
        'keywords_count': keywords_count,
        'primary_keyword': primary_keyword,
        
        # Security & Compliance
        'itar_controlled': itar_controlled,
        'security_export': itar_controlled,
        
        # Descriptions
        'objective': objective,
        'objective_word_count': len(objective.split()) if objective else 0,
        'description': description,
        'description_word_count': len(description.split()) if description else 0,
        'description_length': len(description) if description else 0,
        'phase_1_description': phase1_desc,
        'phase_2_description': phase2_desc,
        'phase_3_description': phase3_desc,
        
        # References
        'references': references,
        'reference_count': ref_count,
        
        # xTech & Competition
        'is_xtech': is_xtech,
        
        # Phase & Funding
        'is_direct_to_phase_ii': is_direct_to_phase_ii,
        
        # PDFs & Instructions
        'topic_pdf_download': topic_pdf_download,
        'solicitation_instructions_download': solicitation_instructions_download,
        'solicitation_instructions_version': solicitation_instructions_version,
        'component_instructions_download': component_instructions_download,
        'component_instructions_version': component_instructions_version,
        'baa_instruction_files': baa_instruction_files,
        
        # TPOC
        'tpoc_names': tpoc_names_str,
        'tpoc_emails': tpoc_emails_str,
        'tpoc_centers': tpoc_centers_str,
        'tpoc_count': tpoc_count,
        'tpoc_email_domain': tpoc_email_domain,
        'show_tpoc': to_boolean(topic.get('showTpoc', False)),
        
        # Additional fields
        'owner': detailed_info.get('owner'),
        'internal_lead': detailed_info.get('internalLead'),
        'sponsor_component': detailed_info.get('sponsorComponent') or topic.get('component'),
        'selection_criteria': clean_html(detailed_info.get('selectionCriteria')) if detailed_info.get('selectionCriteria') else None,
        'proposal_requirements': clean_html(detailed_info.get('proposalRequirements')) if detailed_info.get('proposalRequirements') else None,
        'submission_instructions': clean_html(detailed_info.get('submissionInstructions')) if detailed_info.get('submissionInstructions') else None,
        'eligibility_requirements': clean_html(detailed_info.get('eligibilityRequirements')) if detailed_info.get('eligibilityRequirements') else None,
        
        # BAA fields
        'baa_preface_upload_id': str(topic.get('baaPrefaceUploadId')) if topic.get('baaPrefaceUploadId') else None,
        'baa_preface_upload_title': topic.get('baaPrefaceUploadTitle'),
        'is_release_preface': to_boolean(topic.get('isReleasePreface', False)),
        
        # Metadata
        'scraper_source': 'historical',  # Mark as historical scrape
        'data_freshness': 'archived' if topic.get('topicStatus') in ['Closed'] else 'live',
    }
    
    formatted_topics.append(record)

# ============================================================================
# SAVE TO CSV
# ============================================================================

print(f"\n💾 Saving {len(formatted_topics):,} topics to CSV...")

output_file = f"sbir_historical_bulk_{now_eastern.strftime('%Y%m%d_%H%M%S')}.csv"

# Get all unique keys from all records
all_keys = set()
for record in formatted_topics:
    all_keys.update(record.keys())

# Write CSV
with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=sorted(all_keys))
    writer.writeheader()
    writer.writerows(formatted_topics)

file_size_mb = os.path.getsize(output_file) / (1024 * 1024)

# ============================================================================
# SUMMARY
# ============================================================================

elapsed = time.time() - start_time

print("\n" + "="*70)
print("✅ SCRAPING COMPLETE!")
print("="*70)
print(f"\n📊 Statistics:")
print(f"   Total topics: {len(formatted_topics):,}")
print(f"   Details fetched: {details_fetched:,}")
print(f"   Q&A fetched: {qa_fetched:,}")
print(f"   Columns: {len(all_keys)}")
print(f"\n⏱️  Runtime: {elapsed/60:.1f} minutes ({elapsed/3600:.1f} hours)")
print(f"💾 Output: {output_file} ({file_size_mb:.1f} MB)")

# ============================================================================
# GOOGLE COLAB AUTO-DOWNLOAD
# ============================================================================

try:
    from google.colab import files
    print(f"\n📥 Downloading {output_file}...")
    files.download(output_file)
    print("✅ Download started! Check your browser's download folder.")
except:
    print("\n⚠️ Not running in Google Colab - file saved locally")
    print(f"   Location: {os.path.abspath(output_file)}")

print(f"\n📋 Next Steps:")
print(f"   1. Open Supabase Table Editor → sbir_final")
print(f"   2. Click 'Import data via CSV'")
print(f"   3. Upload {output_file}")
print(f"   4. Map columns (should auto-match)")
print(f"   5. Import!")
print("\n✨ Done!")

