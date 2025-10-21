import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapToSupabaseColumns } from '@/lib/sbir-column-mapper-clean';

export const maxDuration = 300; // 5 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = 'https://www.dodsbirsttr.mil';

// Global log collector
const detailedLogs: string[] = [];

function log(message: string) {
  console.log(message);
  detailedLogs.push(message);
}

export async function POST(request: Request) {
  detailedLogs.length = 0; // Clear previous logs
  
  try {
    const { monthFrom, yearFrom, monthTo, yearTo } = await request.json();
    
    if (!monthFrom || !yearFrom || !monthTo || !yearTo) {
      return NextResponse.json({
        success: false,
        message: 'All date fields (from and to) are required'
      }, { status: 400 });
    }
    
    const dateRange = `${monthFrom} ${yearFrom} to ${monthTo} ${yearTo}`;
    log(`🗓️ Starting historical SBIR scraper for ${dateRange}...`);
    log(`📡 Step 1/3: Fetching topics from ${dateRange}...`);
    
    const result = await scrapeHistoricalData(monthFrom, yearFrom, monthTo, yearTo);
    
    return NextResponse.json({
      success: true,
      message: 'Historical SBIR scraper completed successfully',
      ...result,
      detailedLogs: detailedLogs
    });
  } catch (error) {
    log(`❌ Historical scraper error: ${error instanceof Error ? error.message : String(error)}`);
    log(`📍 Error stack: ${error instanceof Error ? error.stack : String(error)}`);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      detailedLogs: detailedLogs
    }, { status: 500 });
  }
}

async function scrapeHistoricalData(monthFrom: string, yearFrom: string, monthTo: string, yearTo: string) {
  // Calculate date range from start month/year to end month/year
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndexFrom = monthNames.indexOf(monthFrom);
  const monthIndexTo = monthNames.indexOf(monthTo);
  
  const startDate = new Date(parseInt(yearFrom), monthIndexFrom, 1);
  const endDate = new Date(parseInt(yearTo), monthIndexTo + 1, 0, 23, 59, 59);
  
  log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Step 1: Fetch all topics from the selected date range
  const topics = await fetchTopicsByDateRange(startDate, endDate);
  const dateRange = `${monthFrom} ${yearFrom} to ${monthTo} ${yearTo}`;
  log(`✓ Found ${topics.length} topics from ${dateRange}`);
  
  if (topics.length === 0) {
    return {
      totalTopics: 0,
      processedTopics: 0,
      newRecords: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      timestamp: new Date().toISOString()
    };
  }
  
  // Step 2: Process topics with detailed data extraction
  log(` Step 2/3: Processing ${topics.length} topics with detailed data extraction...`);
  const processedTopics = await processTopics(topics);
  
  // Step 3: Update database
  log(` Step 3/3: Updating Supabase database...`);
  const dbResult = await updateDatabase(processedTopics);
  
  log(`✓ Historical scrape complete: ${dbResult.newRecords} new, ${dbResult.updatedRecords} updated, ${dbResult.skippedRecords} skipped`);
  
  return {
    totalTopics: topics.length,
    processedTopics: processedTopics.length,
    newRecords: dbResult.newRecords,
    updatedRecords: dbResult.updatedRecords,
    skippedRecords: dbResult.skippedRecords,
    timestamp: new Date().toISOString()
  };
}

async function fetchTopicsByDateRange(startDate: Date, endDate: Date) {
  const allTopics: any[] = [];
  let pageNum = 0;
  const pageSize = 100;
  let consecutivePagesWithoutMatch = 0;
  const maxConsecutivePagesWithoutMatch = 10;
  
  log(`📡 Fetching topics page by page...`);
  
  // Initialize session - MATCH WORKING ACTIVE SCRAPER
  log(`🔐 Initializing session with multi-step process...`);
  
  try {
    log(`   Step 1: Visiting main page...`);
    const initResponse = await fetch(`${baseUrl}/topics-app/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    log(`   ✓ Main page loaded (status: ${initResponse.status})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    log(`   Step 2: Fetching component dropdown...`);
    const compResponse = await fetch(`${baseUrl}/core/api/public/dropdown/components`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
      }
    });
    log(`   ✓ Component API called (status: ${compResponse.status})`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log(`   Session fully initialized - ready for topic search`);
  } catch (error) {
    log(`   ⚠ Session initialization had issues: ${error}`);
  }
  
  log(`   Waiting 3 seconds before search...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  while (true) {
    log(`📡 Fetching page ${pageNum + 1}...`);
    
    const searchParams = {
      searchText: null,
      components: null,
      programYear: null,
      solicitationCycleNames: null,
      releaseNumbers: [],
      topicReleaseStatus: [],
      modernizationPriorities: [],
      sortBy: 'modifiedDate,desc',
      technologyAreaIds: [],
      component: null,
      program: null
    };
    
    const url = `${baseUrl}/topics/api/public/topics/search?searchParam=${encodeURIComponent(JSON.stringify(searchParams))}&page=${pageNum}&size=${pageSize}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
        'Origin': 'https://www.dodsbirsttr.mil'
      }
    });
    
    if (!response.ok) {
      log(`⚠ API error on page ${pageNum}: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    const topics = data.data || data.content || [];
    
    if (topics.length === 0) {
      log(`   No more topics found`);
      break;
    }
    
    // Filter topics by date range
    let matchingTopics = 0;
    for (const topic of topics) {
      const topicDate = topic.topicEndDate ? new Date(topic.topicEndDate) : 
                        topic.topicStartDate ? new Date(topic.topicStartDate) : 
                        topic.modifiedDate ? new Date(topic.modifiedDate) : null;
      
      if (topicDate && topicDate >= startDate && topicDate <= endDate) {
        allTopics.push(topic);
        matchingTopics++;
      }
    }
    
    log(`   ✓ Page ${pageNum + 1}: Found ${matchingTopics} matching topics (total: ${allTopics.length})`);
    
    if (matchingTopics === 0) {
      consecutivePagesWithoutMatch++;
      if (consecutivePagesWithoutMatch >= maxConsecutivePagesWithoutMatch) {
        log(`   Early termination: No matching topics in last ${maxConsecutivePagesWithoutMatch} pages`);
        break;
      }
    } else {
      consecutivePagesWithoutMatch = 0;
    }
    
    pageNum++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  log(`   Finished fetching topics. Total matching found: ${allTopics.length}`);
  
  return allTopics;
}

async function processTopics(topics: any[]) {
  const processedTopics: any[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  log(`   Starting detailed extraction for ${topics.length} topics...`);
  log(`   ============================================================`);
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const percentage = Math.round(((i + 1) / topics.length) * 100);
    const topicCode = topic.topicCode || 'Unknown';
    const topicTitle = topic.topicTitle || '';
    const truncatedTitle = topicTitle.length > 50 ? topicTitle.substring(0, 50) + '...' : topicTitle;
    
    log(`   [${percentage}%] [${i + 1}/${topics.length}] ${topicCode}: ${truncatedTitle}...`);
    
    try {
      // Log instruction-related fields from initial topic data for first topic only
      if (i === 0) {
        const topicKeys = Object.keys(topic);
        const topicInstrKeys = topicKeys.filter(key => 
          key.toLowerCase().includes('instruction') || 
          key.toLowerCase().includes('baa') ||
          key.toLowerCase().includes('solicitation') ||
          key.toLowerCase().includes('component')
        );
        if (topicInstrKeys.length > 0) {
          log(`      DEBUG: Initial topic data has keys: ${topicInstrKeys.join(', ')}`);
          topicInstrKeys.forEach(key => {
            const value = topic[key];
            if (value && typeof value === 'string') {
              log(`      DEBUG: ${key} = "${value}"`);
            } else if (Array.isArray(value)) {
              log(`      DEBUG: ${key} = [array with ${value.length} items]`);
              if (value.length > 0) {
                log(`      DEBUG: ${key}[0] = ${JSON.stringify(value[0]).substring(0, 150)}`);
              }
            } else if (value && typeof value === 'object') {
              log(`      DEBUG: ${key} = ${JSON.stringify(value).substring(0, 150)}`);
            } else {
              log(`      DEBUG: ${key} = ${value}`);
            }
          });
        }
      }
      
      // Fetch detailed information
      const detailedTopic = await fetchTopicDetails(topic.topicId);
      
      // Extract instruction URLs from initial topic data (not in detailed endpoint!)
      if (topic.cycleName && topic.releaseNumber && topic.component) {
        const solUrl = `${baseUrl}/submissions/api/public/download/solicitationDocuments?solicitation=${topic.cycleName}&release=${topic.releaseNumber}&documentType=RELEASE_PREFACE`;
        detailedTopic.solicitationInstructionsDownload = solUrl;
        detailedTopic.solicitationInstructionsVersion = topic.baaPrefaceUploadTitle || '';
        if (i === 0) log(`      DEBUG: Constructed solicitation URL: ${solUrl}`);
        
        const compUrl = `${baseUrl}/submissions/api/public/download/solicitationDocuments?solicitation=${topic.cycleName}&documentType=INSTRUCTIONS&component=${topic.component}&release=${topic.releaseNumber}`;
        detailedTopic.componentInstructionsDownload = compUrl;
        if (topic.baaInstructions && Array.isArray(topic.baaInstructions) && topic.baaInstructions.length > 0) {
          detailedTopic.componentInstructionsVersion = topic.baaInstructions[0].fileName || '';
        }
        if (i === 0) log(`      DEBUG: Constructed component URL: ${compUrl}`);
      }
      
      // Fetch Q&A
      const qaContent = await fetchTopicQA(topic.topicId);
      if (qaContent) {
        detailedTopic.qaContent = qaContent;
      }
      
      // Extract TPOC email domain
      if (detailedTopic.tpocEmail) {
        const emails = detailedTopic.tpocEmail.split(/[,;]/).map((e: string) => e.trim());
        if (emails.length > 0 && emails[0].includes('@')) {
          detailedTopic.tpocEmailDomain = emails[0].split('@')[1];
        }
      }
      
      // Merge basic list data with detailed data
      const fullTopic = { ...topic, ...detailedTopic };
      
      // ========================================
      // CALCULATED FIELDS
      // ========================================
      
      const now = new Date();
      
      // Set sponsor_component from component field
      if (topic.component) {
        fullTopic.sponsorComponent = topic.component;
      }
      
      // Calculate date-based fields
      if (topic.topicStartDate) {
        const openDate = new Date(topic.topicStartDate);
        fullTopic.days_since_open = Math.floor((now.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (topic.topicEndDate) {
        const closeDate = new Date(topic.topicEndDate);
        fullTopic.days_until_close = Math.floor((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        fullTopic.is_closing_soon = fullTopic.days_until_close <= 30 && fullTopic.days_until_close >= 0;
        fullTopic.is_recently_opened = fullTopic.days_since_open <= 30;
      }
      
      // Set PDF download link
      if (topic.topicId && topic.topicCode) {
        fullTopic.topic_pdf_download = `${baseUrl}/topics/api/public/topics/${topic.topicId}/download/PDF`;
        fullTopic.pdf_link = fullTopic.topic_pdf_download;
      }
      
      // Map to database columns
      const mappedTopic = mapToDatabase(fullTopic);
      processedTopics.push(mappedTopic);
      successCount++;
      
      const statusFlags = [
        detailedTopic.technologyAreas ? 'tech=true' : 'tech=false',
        detailedTopic.keywords ? 'keywords=true' : 'keywords=false',
        detailedTopic.description ? 'desc=true' : 'desc=false',
        qaContent ? 'qa=true' : 'qa=false',
        detailedTopic.tpocEmail ? 'tpoc=true' : 'tpoc=false',
        detailedTopic.solicitationInstructionsDownload ? 'sol_instr=true' : 'sol_instr=false',
        detailedTopic.componentInstructionsDownload ? 'comp_instr=true' : 'comp_instr=false'
      ].join(', ');
      log(`      ✓ Extracted: ${statusFlags}`);
      
    } catch (error) {
      log(`      ❌ Error processing topic: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }
  }
  
  log(`   ============================================================`);
  log(`   ✓ Processing complete: ${successCount} success, ${errorCount} errors`);
  log(`   ============================================================`);
  log(` ✓ Processing complete: ${successCount} success, ${errorCount} errors`);
  log(` ✓ Successfully processed ${successCount} topics with full metadata`);
  
  return processedTopics;
}

async function fetchTopicDetails(topicId: string): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/topics/api/public/topics/${topicId}`, {
      headers: {
        'Accept': 'application/json',
        'Referer': `${baseUrl}/topics-app/`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) return {};
    
    const details = await response.json();
    
    return {
      description: details.topicDescription || '',
      technologyAreas: details.technologyAreas?.map((ta: any) => ta.name).join(', ') || '',
      keywords: details.keywords?.map((kw: any) => kw.name).join(', ') || '',
      tpocName: details.topicManagers?.[0]?.name || '',
      tpocEmail: details.topicManagers?.[0]?.email || '',
      tpocPhone: details.topicManagers?.[0]?.phone || ''
    };
  } catch (error) {
    return {};
  }
}

async function fetchTopicQA(topicId: string) {
  try {
    const response = await fetch(`${baseUrl}/topics/api/public/topics/${topicId}/questions-and-answers`, {
      headers: {
        'Accept': 'application/json',
        'Referer': `${baseUrl}/topics-app/`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) return '';
    
    const qaData = await response.json();
    if (!qaData || qaData.length === 0) return '';
    
    const qaFormatted = qaData.map((qa: any) => {
      return `Q: ${qa.question || ''}\nA: ${qa.answer || ''}`;
    }).join('\n\n');
    
    return qaFormatted;
  } catch (error) {
    return '';
  }
}

function mapToDatabase(topic: any) {
  return {
    topic_id: topic.topicId || '',
    topic_number: topic.topicCode || '',
    cycle_name: topic.cycleName || topic.solicitationTitle || '',
    title: topic.topicTitle || '',
    sponsor_component: topic.sponsorComponent || topic.component || '',
    technology_areas: topic.technologyAreas || '',
    keywords: topic.keywords || '',
    description: topic.description || topic.topicDescription || '',
    qa_content: topic.qaContent || '',
    tpoc_name: topic.tpocName || '',
    tpoc_email: topic.tpocEmail || '',
    tpoc_phone: topic.tpocPhone || '',
    tpoc_email_domain: topic.tpocEmailDomain || '',
    topic_status: topic.topicStatus || '',
    topic_start_date: topic.topicStartDate || null,
    topic_end_date: topic.topicEndDate || null,
    days_since_open: topic.days_since_open || null,
    days_until_close: topic.days_until_close || null,
    is_closing_soon: topic.is_closing_soon || false,
    is_recently_opened: topic.is_recently_opened || false,
    topic_pdf_download: topic.topic_pdf_download || '',
    pdf_link: topic.pdf_link || '',
    solicitation_instructions_download: topic.solicitationInstructionsDownload || '',
    solicitation_instructions_version: topic.solicitationInstructionsVersion || '',
    component_instructions_download: topic.componentInstructionsDownload || '',
    component_instructions_version: topic.componentInstructionsVersion || '',
    last_scraped: new Date().toISOString(),
    modernization_priorities: topic.modernizationPriorities?.map((mp: any) => mp.name).join(', ') || ''
  };
}

async function updateDatabase(topics: any[]) {
  let newRecords = 0;
  let updatedRecords = 0;
  let unchangedRecords = 0;

  try {
    log(`   Upserting ${topics.length} topics to database...`);
    
    const topicNumbers = topics.map(t => t.topic_number).filter(Boolean);
    
    if (topicNumbers.length === 0) {
      log(`   ⚠ Warning: No valid topic_number values found in scraped data`);
      return { newRecords: 0, updatedRecords: 0, skippedRecords: 0 };
    }
    
    const { data: existingRecords } = await supabase
      .from('sbir_final')
      .select('topic_number, cycle_name, last_scraped')
      .in('topic_number', topicNumbers);
    
    const existingTopicNumbers = new Set(
      existingRecords?.map(r => r.topic_number) || []
    );
    
    log(`   Found ${existingTopicNumbers.size} existing records in database`);
    
    // Categorize records BEFORE upsert
    topics.forEach(topic => {
      if (existingTopicNumbers.has(topic.topic_number)) {
        updatedRecords++;
      } else {
        newRecords++;
      }
    });
    
    const { error: upsertError } = await supabase
      .from('sbir_final')
      .upsert(topics, {
        onConflict: 'topic_number,cycle_name',
        ignoreDuplicates: false
      });

    if (upsertError) {
      log(`   ⚠ Bulk upsert failed, trying individual inserts: ${upsertError.message}`);
      
      for (const topic of topics) {
        try {
          const { error: individualError } = await supabase
            .from('sbir_final')
            .upsert(topic, {
              onConflict: 'topic_number,cycle_name',
              ignoreDuplicates: false
            });
          
          if (individualError) {
            log(`   ⚠ Failed to upsert topic ${topic.topic_number}: ${individualError.message}`);
          }
        } catch (err) {
          log(`   ⚠ Error upserting topic ${topic.topic_number}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      log(`   ✓ Database upsert complete: ${newRecords} new, ${updatedRecords} updated, ${unchangedRecords} unchanged`);
    }

  } catch (error) {
    log(`   Database update error: ${error instanceof Error ? error.message : String(error)}`);
    log(`   Error stack: ${error instanceof Error ? error.stack : String(error)}`);
    throw error;
  }

  return { newRecords, updatedRecords, skippedRecords: unchangedRecords };
}

