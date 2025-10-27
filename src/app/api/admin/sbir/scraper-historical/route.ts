import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapToSupabaseColumns } from '@/lib/sbir-column-mapper-clean';
import { smartUpsertTopics } from '@/lib/smart-upsert-logic';

export const maxDuration = 300; // 5 minutes (max for Vercel)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = 'https://www.dodsbirsttr.mil';
const FETCH_TIMEOUT = 30000; // 30 second timeout for each fetch
const SEARCH_API_TIMEOUT = 300000; // 5 minutes for search API (can be slow with large results)

// Helper function for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
}

// Helper function to update job progress in database
async function updateJobProgress(
  jobId: string, 
  updates: {
    total_topics?: number;
    processed_topics?: number;
    progress_percentage?: number;
    current_step?: string;
    current_topic_code?: string;
    current_topic_title?: string;
    new_records?: number;
    updated_records?: number;
    preserved_records?: number;
    status?: string;
    error_message?: string;
    error_details?: string;
    completed_at?: string;
    logs?: any[];
  }
) {
  try {
    // If we're adding logs, append them to existing logs
    if (updates.logs) {
      const { data: existingJob } = await supabase
        .from('scraping_jobs')
        .select('logs')
        .eq('id', jobId)
        .single();
      
      if (existingJob) {
        const existingLogs = existingJob.logs || [];
        updates.logs = [...existingLogs, ...updates.logs];
      }
    }
    
    await supabase
      .from('scraping_jobs')
      .update(updates)
      .eq('id', jobId);
  } catch (error) {
    console.error(`Failed to update job ${jobId}:`, error);
  }
}

function log(jobId: string, message: string) {
  console.log(message);
  // Add log to database (async, don't wait)
  updateJobProgress(jobId, {
    logs: [{ timestamp: new Date().toISOString(), message }]
  }).catch(() => {});
}

export async function POST(request: Request) {
  const detailedLogs: string[] = [];
  
  try {
    const { monthFrom, yearFrom, monthTo, yearTo } = await request.json();
    
    if (!monthFrom || !yearFrom || !monthTo || !yearTo) {
      return NextResponse.json({
        success: false,
        message: 'All date fields (from and to) are required'
      }, { status: 400 });
    }
    
    const dateRange = `${monthFrom} ${yearFrom} to ${monthTo} ${yearTo}`;
    
    console.log(`🗓️ Starting historical SBIR scraper for ${dateRange}...`);
    detailedLogs.push(`🗓️ Starting historical SBIR scraper for ${dateRange}...`);
    
    // Run scraping synchronously - WAIT for completion
    const result = await scrapeHistoricalDataSync(monthFrom, yearFrom, monthTo, yearTo, detailedLogs);
    
    return NextResponse.json({
      success: true,
      message: 'Historical SBIR scraper completed successfully',
      ...result,
      detailedLogs: detailedLogs
    });
    
  } catch (error) {
    console.error(`❌ Historical scraper error: ${error instanceof Error ? error.message : String(error)}`);
    detailedLogs.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      detailedLogs: detailedLogs
    }, { status: 500 });
  }
}

// NEW SYNCHRONOUS SCRAPER - Works like quick scrape but with date range
async function scrapeHistoricalDataSync(
  monthFrom: string, 
  yearFrom: string, 
  monthTo: string, 
  yearTo: string,
  detailedLogs: string[]
) {
  const log = (message: string) => {
    console.log(message);
    detailedLogs.push(message);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fromMonthIndex = monthNames.indexOf(monthFrom);
  const toMonthIndex = monthNames.indexOf(monthTo);

  const fromDate = new Date(Date.UTC(parseInt(yearFrom), fromMonthIndex, 1, 0, 0, 0, 0));
  const toDate = new Date(Date.UTC(parseInt(yearTo), toMonthIndex + 1, 0, 23, 59, 59, 999));

  log(`📅 Date range: ${fromDate.toISOString()} to ${toDate.toISOString()}`);

  // Step 1: Fetch topics
  log('📡 Step 1/3: Fetching topics by date range...');
  const topics = await fetchTopicsByDateRangeSync(fromDate, toDate, log);
  log(`✓ Found ${topics.length} topics in date range`);

  if (topics.length === 0) {
    log('⚠️ No topics found in this date range');
    return {
      totalTopics: 0,
      processedTopics: 0,
      newRecords: 0,
      updatedRecords: 0,
      preservedRecords: 0
    };
  }

  // Step 2: Process topics with detailed extraction
  log(`📝 Step 2/3: Processing ${topics.length} topics with detailed data extraction...`);
  const { processedTopics, successCount, errorCount } = await processTopicsSync(topics, log);
  log(`✓ Processing complete: ${successCount} success, ${errorCount} errors`);

  // Step 3: Update database
  log('💾 Step 3/3: Updating Supabase database with smart upsert...');
  const upsertResult = await smartUpsertTopics(processedTopics, {
    scraperType: 'historical',
    logFn: log
  });
  log(`✅ Database update complete: ${upsertResult.newRecords} new, ${upsertResult.updatedRecords} updated, ${upsertResult.preservedRecords} preserved`);

  return {
    totalTopics: topics.length,
    processedTopics: successCount,
    newRecords: upsertResult.newRecords,
    updatedRecords: upsertResult.updatedRecords,
    preservedRecords: upsertResult.preservedRecords,
    timestamp: new Date().toISOString()
  };
}

// Synchronous version of fetchTopicsByDateRange
async function fetchTopicsByDateRangeSync(fromDate: Date, toDate: Date, log: (msg: string) => void): Promise<any[]> {
  // CRITICAL: Multi-step session initialization (required by DoD website)
  log('   🔐 Initializing session...');
  
  try {
    // Step 1: Visit main HTML page to establish session
    log('      Step 1: Visiting main page...');
    await fetchWithTimeout(`${baseUrl}/topics-app/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, FETCH_TIMEOUT);
    log('      ✓ Main page loaded');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Fetch component instructions to establish API session
    log('      Step 2: Fetching component instructions...');
    await fetchWithTimeout(`${baseUrl}/core/api/public/dropdown/components`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
      }
    }, FETCH_TIMEOUT);
    log('      ✓ Component API called');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log('   ✓ Session initialized');
  } catch (error) {
    log('   ⚠ Session initialization had issues (continuing anyway)');
  }

  // Wait before main search
  log('   Waiting 2 seconds before search...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  log('   Fetching topics from search API...');
  
  // Use public GET endpoint but without status filter to get ALL topics
  // Quick Scrape filters to ['Open', 'Pre-Release'] but we want EVERYTHING for historical
  const searchParams = {
    searchText: null,
    components: null,
    programYear: null,
    solicitationCycleNames: null,
    releaseNumbers: [],
    topicReleaseStatus: [], // Empty array = ALL statuses (Open, Closed, Pre-Release, etc.)
    modernizationPriorities: [],
    sortBy: "topicEndDate,desc",
    technologyAreaIds: [],
    component: null,
    program: null
  };

  log(`   🔍 Fetching ALL topics with pagination (no status filter)...`);
  
  // PAGINATION: Fetch pages until we're past the date range (sorted by topicEndDate desc)
  const allTopics: any[] = [];
  let page = 0;
  const pageSize = 2000; // API page size
  const maxPages = 20; // Safety limit (20 pages * 2000 = 40,000 topics max)
  let consecutivePagesWithNoMatches = 0;
  const maxConsecutivePagesWithNoMatches = 2; // Stop after 2 pages with no date range matches
  
  while (page < maxPages) {
    const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
    const searchUrl = `${baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=${pageSize}&page=${page}`;
    
    log(`   📄 Fetching page ${page + 1}...`);
    
    const apiResponse = await fetchWithTimeout(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
        'Origin': 'https://www.dodsbirsttr.mil'
      }
    }, SEARCH_API_TIMEOUT);

    if (!apiResponse.ok) {
      log(`   ⚠️ Page ${page + 1} failed with status ${apiResponse.status}`);
      break;
    }

    const data = await apiResponse.json();
    const pageTopics = data.data || [];
    
    if (pageTopics.length === 0) {
      log(`   ✓ No more topics (page ${page + 1} empty)`);
      break;
    }
    
    // Check if any topics in this page are in our date range
    const topicsInRange = pageTopics.filter((topic: any) => {
      const topicCloseDate = topic.topicCloseDate || topic.closeDate || topic.endDate;
      if (!topicCloseDate) return false;
      const closeDate = new Date(topicCloseDate);
      return closeDate >= fromDate; // Still potentially in range
    });
    
    allTopics.push(...pageTopics);
    log(`   ✓ Page ${page + 1}: ${pageTopics.length} topics (${topicsInRange.length} potentially in range, total: ${allTopics.length})`);
    
    // Early termination: If no topics in this page could be in our date range, count it
    if (topicsInRange.length === 0) {
      consecutivePagesWithNoMatches++;
      log(`   ⚠️ No topics in date range on page ${page + 1} (${consecutivePagesWithNoMatches}/${maxConsecutivePagesWithNoMatches})`);
      
      if (consecutivePagesWithNoMatches >= maxConsecutivePagesWithNoMatches) {
        log(`   ✓ Early termination: ${maxConsecutivePagesWithNoMatches} consecutive pages with no date range matches`);
        break;
      }
    } else {
      consecutivePagesWithNoMatches = 0; // Reset counter
    }
    
    // If we got less than page size, we're on the last page
    if (pageTopics.length < pageSize) {
      log(`   ✓ Last page reached (partial page with ${pageTopics.length} topics)`);
      break;
    }
    
    page++;
  }
  
  log(`   ✓ Fetched ${allTopics.length} total topics from API`);
  log(`   📊 Total topics in database: 32641`);

  // Log status distribution for debugging
  const statusCounts: Record<string, number> = {};
  allTopics.forEach((topic: any) => {
    const status = topic.topicStatus || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  log(`   📊 Status distribution: ${JSON.stringify(statusCounts)}`);

  // DEBUG: Show actual field names for first topic to identify date fields
  if (allTopics.length > 0) {
    const sampleTopic = allTopics[0];
    const dateRelatedFields = Object.keys(sampleTopic).filter(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('open') || 
      key.toLowerCase().includes('close')
    );
    log(`   🔍 Sample topic date fields: ${JSON.stringify(dateRelatedFields)}`);
    const dateValues: any = {};
    dateRelatedFields.forEach(field => {
      dateValues[field] = sampleTopic[field];
    });
    log(`   🔍 Sample topic date values: ${JSON.stringify(dateValues)}`);
  }

  // SIMPLE LOGIC: Find ALL topics that overlap with the date range (any status)
  // A topic overlaps if it was available/active at any point during our date range
  const filteredTopics = allTopics.filter((topic: any) => {
    // Parse dates - check different possible field names
    const topicCloseDate = topic.topicCloseDate || topic.closeDate || topic.endDate;
    const topicOpenDate = topic.topicOpenDate || topic.openDate || topic.startDate;
    
    // Must have an open date
    if (!topicOpenDate) return false;
    
    const openDate = new Date(topicOpenDate);
    const closeDate = topicCloseDate ? new Date(topicCloseDate) : null;
    
    // Topic overlaps with range if:
    // - It opened on or before the range ended (openDate <= toDate)
    // - AND it closed on or after the range started (closeDate >= fromDate) OR is still open (no closeDate)
    
    if (openDate > toDate) return false; // Opened after our range ended
    
    if (closeDate) {
      // Has a close date - must have closed during or after our range started
      if (closeDate < fromDate) return false; // Closed before our range started
    }
    // else: No close date = still open = definitely overlaps if it opened before range ended
    
    return true;
  });

  log(`   ✓ Filtered to ${filteredTopics.length} topics that were active during date range`);
  log(`   📊 Date range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
  
  // Log sample of filtered topics for debugging
  if (filteredTopics.length > 0) {
    const sample = filteredTopics[0];
    log(`   📋 Sample topic: ${sample.topicCode || 'No code'} - Status: ${sample.topicStatus} - Open: ${sample.topicOpenDate || 'N/A'} - Close: ${sample.topicCloseDate || 'Still open'}`);
  }
  
  return filteredTopics;
}

// Synchronous version of processTopics
async function processTopicsSync(topics: any[], log: (msg: string) => void) {
  log(`   Starting detailed extraction for ${topics.length} topics...`);
  log('   ============================================================');
  
  const processedTopics: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const progress = Math.round(((i + 1) / topics.length) * 100);
    const topicCode = topic.topicNumber || 'Unknown';
    const topicTitle = topic.title || 'No title';
    const displayTitle = topicTitle.length > 60 ? topicTitle.substring(0, 60) + '...' : topicTitle;
    
    log(`   [${progress}%] [${i + 1}/${topics.length}] ${topicCode}: ${displayTitle}`);

    try {
      const detailedTopic = await fetchTopicDetails(baseUrl, topic.topicId, topicCode);
      
      const hasDescription = !!detailedTopic.description && detailedTopic.description.length > 100;
      const hasKeywords = !!detailedTopic.keywords && detailedTopic.keywords.length > 10;
      const hasTechnology = !!detailedTopic.technology && detailedTopic.technology.length > 100;
      const hasQA = !!detailedTopic.qa && detailedTopic.qa.length > 20;
      const hasSolicitationInstructions = !!detailedTopic.solicitation_instructions_url;
      const hasComponentInstructions = !!detailedTopic.component_instructions_url;
      
      log(`      ✓ Extracted: tech=${hasTechnology}, keywords=${hasKeywords}, desc=${hasDescription}, qa=${hasQA}, tpoc=false, sol_instr=${hasSolicitationInstructions}, comp_instr=${hasComponentInstructions}`);
      
      processedTopics.push(detailedTopic);
      successCount++;
    } catch (error) {
      log(`      ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
      processedTopics.push(topic);
      errorCount++;
    }
  }
  
  log('   ============================================================');
  return { processedTopics, successCount, errorCount };
}

// OLD ASYNC SCRAPER - Keep for reference, can be removed later
async function scrapeHistoricalData(jobId: string, monthFrom: string, yearFrom: string, monthTo: string, yearTo: string) {
  try {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthIndexFrom = monthNames.indexOf(monthFrom);
    const monthIndexTo = monthNames.indexOf(monthTo);
    
    const startDate = new Date(parseInt(yearFrom), monthIndexFrom, 1);
    const endDate = new Date(parseInt(yearTo), monthIndexTo + 1, 0, 23, 59, 59);
    
    log(jobId, `📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    await updateJobProgress(jobId, { current_step: 'Fetching topics...' });
    
    let topics: any[] = [];
    try {
      topics = await fetchTopicsByDateRange(jobId, startDate, endDate);
    } catch (fetchError) {
      log(jobId, `❌ Error fetching topics: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      throw fetchError;
    }
    
    const dateRange = `${monthFrom} ${yearFrom} to ${monthTo} ${yearTo}`;
    log(jobId, `✓ Found ${topics.length} topics from ${dateRange}`);
    
    await updateJobProgress(jobId, {
      total_topics: topics.length,
      current_step: `Found ${topics.length} topics`
    });
    
    if (topics.length === 0) {
      await updateJobProgress(jobId, {
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        current_step: 'No topics found in date range'
      });
      return {
        totalTopics: 0,
        processedTopics: 0,
        newRecords: 0,
        updatedRecords: 0,
        preservedRecords: 0
      };
    }

    log(jobId, `📋 Step 2/3: Processing ${topics.length} topics with detailed data extraction...`);
    await updateJobProgress(jobId, { current_step: 'Processing topics...' });
    const processedTopics = await processTopics(jobId, topics, baseUrl);

    log(jobId, `💾 Step 3/3: Updating Supabase database with smart upsert...`);
    await updateJobProgress(jobId, { current_step: 'Updating database...' });
    
    const { newRecords, updatedRecords, preservedRecords } = await smartUpsertTopics(processedTopics, {
      scraperType: 'historical',
      logFn: (msg: string) => log(jobId, msg)
    });

    await updateJobProgress(jobId, {
      status: 'completed',
      progress_percentage: 100,
      new_records: newRecords,
      updated_records: updatedRecords,
      preserved_records: preservedRecords,
      completed_at: new Date().toISOString(),
      current_step: 'Complete!'
    });
    
    log(jobId, `✅ Scraping completed: ${newRecords} new, ${updatedRecords} updated, ${preservedRecords} preserved`);

    return {
      totalTopics: topics.length,
      processedTopics: processedTopics.length,
      newRecords,
      updatedRecords,
      preservedRecords
    };
  } catch (error) {
    // Catch ANY error and update job status
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    log(jobId, `❌ FATAL ERROR: ${errorMessage}`);
    log(jobId, `Stack: ${errorStack}`);
    
    await updateJobProgress(jobId, {
      status: 'failed',
      error_message: errorMessage,
      error_details: errorStack,
      completed_at: new Date().toISOString(),
      current_step: 'Failed: ' + errorMessage
    });
    
    throw error;
  }
}

async function fetchTopicsByDateRange(jobId: string, startDate: Date, endDate: Date) {
  const allTopics: any[] = [];
  let pageNum = 0;
  const pageSize = 100;
  let consecutivePagesWithoutMatch = 0;
  const maxConsecutivePagesWithoutMatch = 10;
  
  log(jobId, `📡 Fetching topics page by page...`);
  
  // Initialize session - MATCH WORKING ACTIVE SCRAPER
  log(jobId, `🔐 Initializing session with multi-step process...`);
  
  try {
    log(jobId, `   Step 1: Visiting main page...`);
    const initResponse = await fetchWithTimeout(`${baseUrl}/topics-app/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    log(jobId, `   ✓ Main page loaded (status: ${initResponse.status})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    log(jobId, `   Step 2: Fetching component dropdown...`);
    const compResponse = await fetchWithTimeout(`${baseUrl}/core/api/public/dropdown/components`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
      }
    });
    log(jobId, `   ✓ Component API called (status: ${compResponse.status})`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log(jobId, `   Session fully initialized - ready for topic search`);
  } catch (error) {
    log(jobId, `   ⚠ Session initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to initialize session: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  log(jobId, `   Waiting 3 seconds before search...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  while (true) {
    log(jobId, `📡 Fetching page ${pageNum + 1}...`);
    
    const searchParams = {
      searchText: null,
      components: null,
      programYear: null,
      solicitationCycleNames: null,
      releaseNumbers: [],
      topicReleaseStatus: [],
      modernizationPriorities: [],
      sortBy: "topicEndDate,desc",
      technologyAreaIds: [],
      component: null,
      program: null
    };
    
    const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
    const url = `${baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=${pageSize}&page=${pageNum}`;
    
    let response;
    try {
      response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Authorization': 'Bearer null',
          'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
          'Origin': 'https://www.dodsbirsttr.mil'
        }
      });
    } catch (fetchError) {
      log(jobId, `❌ Fetch timeout/error on page ${pageNum}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      throw fetchError;
    }
    
    if (!response.ok) {
      log(jobId, `⚠ API error on page ${pageNum}: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    const topics = data.data || data.content || [];
    
    if (topics.length === 0) {
      log(jobId, `   No more topics found`);
      break;
    }
    
    let matchingTopicsInPage = 0;
    let allTopicsBeforeRange = true;
    
    for (const topic of topics) {
      const topicDate = topic.topicEndDate ? new Date(topic.topicEndDate) : 
                        topic.topicStartDate ? new Date(topic.topicStartDate) : 
                        topic.modifiedDate ? new Date(topic.modifiedDate) : null;
      
      // Check if this topic is before our date range
      if (topicDate && topicDate < startDate) {
        // Topic is before range, continue checking
      } else {
        // Topic is within or after range
        allTopicsBeforeRange = false;
      }
      
      if (topicDate && topicDate >= startDate && topicDate <= endDate) {
        allTopics.push(topic);
        matchingTopicsInPage++;
      }
    }
    
    log(jobId, `   ✓ Page ${pageNum + 1}: Found ${matchingTopicsInPage} matching topics (total: ${allTopics.length})`);
    
    // Smart early termination: if ALL topics on this page are before our start date,
    // and we're sorted by date descending, we've passed the date range entirely
    if (allTopicsBeforeRange && topics.length > 0) {
      log(jobId, `   ✅ Date range fully searched - all remaining topics are before ${startDate.toISOString().split('T')[0]}`);
      log(jobId, `   Stopping pagination (found ${allTopics.length} total matches)`);
      break;
    }
    
    if (matchingTopicsInPage === 0) {
      consecutivePagesWithoutMatch++;
      if (consecutivePagesWithoutMatch >= maxConsecutivePagesWithoutMatch) {
        log(jobId, `   Early termination: No matching topics in last ${maxConsecutivePagesWithoutMatch} pages`);
        break;
      }
    } else {
      consecutivePagesWithoutMatch = 0;
    }
    
    pageNum++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  log(jobId, `   Finished fetching topics. Total matching found: ${allTopics.length}`);
  
  return allTopics;
}

// ========================================
// COMPREHENSIVE DATA PROCESSING FROM ACTIVE SCRAPER
// ========================================

async function processTopics(jobId: string, topics: any[], baseUrl: string) {
  const processedTopics = [];
  let successCount = 0;
  let errorCount = 0;
  
  log(jobId, `   Starting detailed extraction for ${topics.length} topics...`);
  log(jobId, `   ${'='.repeat(60)}`);
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const topicCode = topic.topicCode || 'UNKNOWN';
    const topicTitle = (topic.topicTitle || 'No title').substring(0, 60);
    
    try {
      const progress = Math.floor(((i + 1) / topics.length) * 100);
      log(jobId, `   [${progress}%] [${i + 1}/${topics.length}] ${topicCode}: ${topicTitle}...`);
      
      // Update progress in database every 10 topics
      if (i % 10 === 0 || i === topics.length - 1) {
        await updateJobProgress(jobId, {
          processed_topics: i + 1,
          progress_percentage: progress,
          current_topic_code: topicCode,
          current_topic_title: topicTitle,
          current_step: `Processing topic ${i + 1}/${topics.length} (${progress}%)`
        });
      }
      
      // Fetch detailed information for this topic
      const detailedTopic = await fetchTopicDetails(baseUrl, topic.topicId, topicCode);
      
      // Extract instruction URLs from initial topic data
      if (topic.cycleName && topic.releaseNumber && topic.component) {
        const solUrl = `${baseUrl}/submissions/api/public/download/solicitationDocuments?solicitation=${topic.cycleName}&release=${topic.releaseNumber}&documentType=RELEASE_PREFACE`;
        detailedTopic.solicitationInstructionsDownload = solUrl;
        detailedTopic.solicitationInstructionsVersion = topic.baaPrefaceUploadTitle || '';
        
        const compUrl = `${baseUrl}/submissions/api/public/download/solicitationDocuments?solicitation=${topic.cycleName}&documentType=INSTRUCTIONS&component=${topic.component}&release=${topic.releaseNumber}`;
        detailedTopic.componentInstructionsDownload = compUrl;
        if (topic.baaInstructions && Array.isArray(topic.baaInstructions) && topic.baaInstructions.length > 0) {
          detailedTopic.componentInstructionsVersion = topic.baaInstructions[0].fileName || '';
        }
      }
      
      // Log extraction status
      const hasSolInstr = !!detailedTopic.solicitationInstructionsDownload;
      const hasCompInstr = !!detailedTopic.componentInstructionsDownload;
      log(jobId, `      ✓ Extracted: tech=${!!detailedTopic.technologyAreas}, keywords=${!!detailedTopic.keywords}, desc=${!!detailedTopic.description}, qa=${!!detailedTopic.qaContent}, tpoc=${!!detailedTopic.tpocNames}, sol_instr=${hasSolInstr}, comp_instr=${hasCompInstr}`);
      
      // Extract TPOC from initial topic list if not in detailed data
      if (!detailedTopic.tpocNames && topic.topicManagers && Array.isArray(topic.topicManagers)) {
        const names: string[] = [];
        const emails: string[] = [];
        const centers: string[] = [];
        
        topic.topicManagers.forEach((manager: any) => {
          if (manager.topicManagerName) names.push(manager.topicManagerName);
          if (manager.topicManagerEmail) emails.push(manager.topicManagerEmail);
          if (manager.topicManagerCenter) centers.push(manager.topicManagerCenter);
        });
        
        if (names.length > 0) detailedTopic.tpocNames = names.join('; ');
        if (emails.length > 0) detailedTopic.tpocEmails = emails.join('; ');
        if (centers.length > 0) detailedTopic.tpocCenters = centers.join('; ');
        detailedTopic.tpocCount = names.length;
        detailedTopic.showTpoc = names.length > 0;
        
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
      
      if (topic.component) {
        fullTopic.sponsorComponent = topic.component;
      }
      
      if (topic.topicStartDate) {
        const openDate = new Date(topic.topicStartDate);
        fullTopic.days_since_open = Math.floor((now.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (topic.topicEndDate) {
        const closeDate = new Date(topic.topicEndDate);
        fullTopic.days_until_close = Math.floor((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (fullTopic.days_until_close <= 7) fullTopic.urgency_level = 'Critical';
        else if (fullTopic.days_until_close <= 14) fullTopic.urgency_level = 'High';
        else if (fullTopic.days_until_close <= 30) fullTopic.urgency_level = 'Medium';
        else fullTopic.urgency_level = 'Low';
      }
      
      if (topic.topicStartDate && topic.topicEndDate) {
        const openDate = new Date(topic.topicStartDate);
        const closeDate = new Date(topic.topicEndDate);
        fullTopic.duration_days = Math.floor((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (topic.topicPreReleaseStartDate && topic.topicPreReleaseEndDate) {
        const preStart = new Date(topic.topicPreReleaseStartDate);
        const preEnd = new Date(topic.topicPreReleaseEndDate);
        fullTopic.pre_release_duration = Math.floor((preEnd.getTime() - preStart.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (topic.topicQAEndDate) {
        const qaEndDate = new Date(topic.topicQAEndDate);
        fullTopic.days_until_qa_close = Math.floor((qaEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (topic.topicQuestionCount && topic.noOfPublishedQuestions) {
        const total = parseInt(topic.topicQuestionCount) || 0;
        const published = parseInt(topic.noOfPublishedQuestions) || 0;
        if (total > 0) {
          fullTopic.qa_response_rate_percentage = Math.round((published / total) * 100);
        }
      }
      
      const activityDates = [
        topic.updatedDate,
        topic.modifiedDate,
        topic.topicQAEndDate
      ].filter(Boolean).map(d => new Date(d).getTime());
      
      if (activityDates.length > 0) {
        fullTopic.last_activity_date = new Date(Math.max(...activityDates)).toISOString();
      }
      
      if (topic.topicStartDate && topic.topicEndDate) {
        const openDate = new Date(topic.topicStartDate);
        const closeDate = new Date(topic.topicEndDate);
        if (now < openDate) fullTopic.proposal_window_status = 'Not Open';
        else if (now > closeDate) fullTopic.proposal_window_status = 'Closed';
        else fullTopic.proposal_window_status = 'Open';
      }
      
      if (topic.topicQAStartDate && topic.topicQAEndDate) {
        const qaStart = new Date(topic.topicQAStartDate);
        const qaEnd = new Date(topic.topicQAEndDate);
        fullTopic.qa_window_active = (now >= qaStart && now <= qaEnd) ? 'Yes' : 'No';
      }
      
      if (topic.cycleName) {
        const phaseMatch = topic.cycleName.match(/_P(\d+)_/);
        if (phaseMatch) {
          const phaseNum = phaseMatch[1];
          fullTopic.solicitation_phase = `Phase ${phaseNum === '1' ? 'I' : phaseNum === '2' ? 'II' : phaseNum === '3' ? 'III' : phaseNum}`;
        }
      }
      
      const allText = `${detailedTopic.description || ''} ${detailedTopic.phase1Description || ''} ${detailedTopic.phase2Description || ''}`.toLowerCase();
      
      if (allText.includes('direct to phase ii') || allText.includes('direct phase ii') || allText.includes('dtp2')) {
        fullTopic.isDirectToPhaseII = 'Yes';
      } else {
        fullTopic.isDirectToPhaseII = fullTopic.isDirectToPhaseII || 'No';
      }
      
      const phasesAvailable: string[] = [];
      if (detailedTopic.phase1Description) phasesAvailable.push('Phase I');
      if (detailedTopic.phase2Description) phasesAvailable.push('Phase II');
      if (detailedTopic.phase3Description) phasesAvailable.push('Phase III');
      if (phasesAvailable.length > 0) {
        fullTopic.phases_available = phasesAvailable.join(', ');
      }
      
      if (!fullTopic.isXTech) {
        fullTopic.isXTech = 'No';
      }
      
      if (!fullTopic.prize_gating) {
        fullTopic.prize_gating = fullTopic.isXTech === 'Yes' ? 'Yes' : 'No';
      }
      
      if (topic.topicId && topic.topicCode) {
        fullTopic.topic_pdf_download = `https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/download/PDF`;
        fullTopic.pdf_link = fullTopic.topic_pdf_download;
      }
      
      if (detailedTopic.qaContent) {
        fullTopic.qa_content_fetched = 'Yes';
        fullTopic.qa_last_updated = now.toISOString();
      } else {
        fullTopic.qa_content_fetched = 'No';
      }
      
      fullTopic.last_scraped = new Date().toISOString();
      
      // Tag with scraper source for smart upsert logic
      fullTopic.scraper_source = 'historical';
      
      // Use the comprehensive mapper
      const mappedTopic = mapToSupabaseColumns(fullTopic);
      
      processedTopics.push(mappedTopic);
      successCount++;
      
      if (i < topics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      errorCount++;
      log(jobId, `       ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      continue;
    }
  }

  log(jobId, `   ${'='.repeat(60)}`);
  log(jobId, `   ✓ Processing complete: ${successCount} success, ${errorCount} errors`);
  return processedTopics;
}

function cleanHtml(text: string): string {
  if (!text) return '';
  
  let clean = text.replace(/<.*?>/g, '');
  clean = clean.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/&amp;/g, '&');
  clean = clean.replace(/&lt;/g, '<');
  clean = clean.replace(/&gt;/g, '>');
  clean = clean.replace(/&quot;/g, '"');
  clean = clean.replace(/&#39;/g, "'");
  clean = clean.replace(/&apos;/g, "'");
  clean = clean.replace(/&emsp;/g, '  ');
  clean = clean.replace(/&rsquo;/g, "'");
  clean = clean.replace(/&mdash;/g, '-');
  clean = clean.replace(/\s+/g, ' ');
  
  return clean.trim();
}

async function fetchTopicDetails(baseUrl: string, topicId: string, topicCode: string) {
  const detailedData: any = {};
  
  try {
    // STEP 1: Fetch detailed information from /details endpoint
    const detailsResponse = await fetch(`${baseUrl}/topics/api/public/topics/${topicId}/details`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${baseUrl}/topics-app/`,
        'Origin': baseUrl
      }
    });

    if (detailsResponse.ok) {
      const details = await detailsResponse.json();
      
      // Extract and process technology areas
      if (details.technologyAreas && Array.isArray(details.technologyAreas)) {
        const areas = details.technologyAreas.map((area: any) => 
          typeof area === 'object' ? area.name : String(area)
        ).filter(Boolean);
        detailedData.technologyAreas = areas.join(', ');
      }
      
      // Extract focusAreas → modernization_priorities
      if (details.focusAreas && Array.isArray(details.focusAreas)) {
        const focusAreas = details.focusAreas.map((area: any) => 
          typeof area === 'object' ? area.name : String(area)
        ).filter(Boolean);
        detailedData.modernizationPriorities = focusAreas.join(' | ');
      }
      
      // Extract and clean keywords
      if (details.keywords) {
        let keywordText = '';
        if (Array.isArray(details.keywords)) {
          keywordText = details.keywords.join('; ');
        } else {
          keywordText = String(details.keywords);
        }
        detailedData.keywords = cleanHtml(keywordText).replace(/;/g, '; ').replace(/  /g, ' ').trim();
      }
      
      // ITAR status
      if ('itar' in details) {
        detailedData.itarControlled = details.itar ? 'Yes' : 'No';
      }
      
      // Clean descriptions
      if (details.objective) {
        detailedData.objective = cleanHtml(details.objective);
      }
      
      if (details.description) {
        detailedData.description = cleanHtml(details.description);
        if (detailedData.description.toLowerCase().includes('xtech') || 
            detailedData.description.toLowerCase().includes('x-tech')) {
          detailedData.isXTech = 'Yes';
        }
      }
      
      if (details.phase1Description) {
        detailedData.phase1Description = cleanHtml(details.phase1Description);
      }
      
      if (details.phase2Description) {
        detailedData.phase2Description = cleanHtml(details.phase2Description);
      }
      
      if (details.phase3Description) {
        detailedData.phase3Description = cleanHtml(details.phase3Description);
      }
      
      // Extract references
      if (details.referenceDocuments && Array.isArray(details.referenceDocuments)) {
        const refs = details.referenceDocuments
          .map((ref: any) => cleanHtml(ref.referenceTitle || ''))
          .filter(Boolean);
        detailedData.references = refs.join('; ');
      }
      
      // BAA Instructions
      if (details.baaInstructions && Array.isArray(details.baaInstructions)) {
        const baaFiles = details.baaInstructions
          .map((instruction: any) => instruction.fileName)
          .filter(Boolean);
        detailedData.baaInstructionFiles = baaFiles.join('; ');
      }
      
      // TPOC extraction
      if (details.topicManagers && Array.isArray(details.topicManagers)) {
        const names: string[] = [];
        const emails: string[] = [];
        const centers: string[] = [];
        
        details.topicManagers.forEach((manager: any) => {
          if (manager.topicManagerName) names.push(manager.topicManagerName);
          if (manager.topicManagerEmail) emails.push(manager.topicManagerEmail);
          if (manager.topicManagerCenter) centers.push(manager.topicManagerCenter);
        });
        
        if (names.length > 0) detailedData.tpocNames = names.join('; ');
        if (emails.length > 0) detailedData.tpocEmails = emails.join('; ');
        if (centers.length > 0) detailedData.tpocCenters = centers.join('; ');
        detailedData.tpocCount = names.length;
        detailedData.showTpoc = names.length > 0;
        
        if (emails.length > 0 && emails[0].includes('@')) {
          detailedData.tpocEmailDomain = emails[0].split('@')[1];
        }
      }
      
      // Additional fields
      if (details.owner) detailedData.owner = details.owner;
      if (details.internalLead) detailedData.internalLead = details.internalLead;
      if (details.sponsorComponent) detailedData.sponsorComponent = details.sponsorComponent;
      if (details.selectionCriteria) detailedData.selectionCriteria = cleanHtml(details.selectionCriteria);
      if (details.proposalRequirements) detailedData.proposalRequirements = cleanHtml(details.proposalRequirements);
      if (details.submissionInstructions) detailedData.submissionInstructions = cleanHtml(details.submissionInstructions);
      if (details.eligibilityRequirements) detailedData.eligibilityRequirements = cleanHtml(details.eligibilityRequirements);
      
      if (details.isDirectToPhaseII !== undefined) {
        detailedData.isDirectToPhaseII = details.isDirectToPhaseII ? 'Yes' : 'No';
      }
      
      if (details.topicPdfDownload) detailedData.topicPdfDownload = details.topicPdfDownload;
      
      if (details.solicitationInstructionsUrl) {
        detailedData.solicitationInstructionsDownload = details.solicitationInstructionsUrl;
      }
      if (details.componentInstructionsUrl) {
        detailedData.componentInstructionsDownload = details.componentInstructionsUrl;
      }
      if (details.baaPrefaceUploadTitle) {
        detailedData.solicitationInstructionsVersion = details.baaPrefaceUploadTitle;
      }
      if (details.baaInstructions && Array.isArray(details.baaInstructions)) {
        detailedData.componentInstructionsVersion = details.baaInstructions
          .map((i: any) => i.fileName || '').join(', ');
      }
      
    } else {
      console.error(`    Failed to fetch details: ${detailsResponse.status}`);
    }
    
  } catch (error) {
    console.error(`    Error fetching details:`, error);
  }
  
  // STEP 2: Fetch Q&A data
  try {
    const qaResponse = await fetch(`${baseUrl}/topics/api/public/topics/${topicId}/questions`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${baseUrl}/topics-app/`,
        'Origin': baseUrl
      }
    });
    
    if (qaResponse.ok) {
      const qaData = await qaResponse.json();
      if (qaData && Array.isArray(qaData) && qaData.length > 0) {
        const qaFormatted: string[] = [];
        
        for (const q of qaData) {
          const questionText = (q.question || '').replace(/<p>/g, '').replace(/<\/p>/g, '').trim();
          const questionNo = q.questionNo || '';
          
          let answerText = '';
          if (q.answers && Array.isArray(q.answers) && q.answers.length > 0) {
            try {
              const answerData = JSON.parse(q.answers[0].answer || '{}');
              answerText = (answerData.content || '').replace(/<p>/g, '').replace(/<\/p>/g, '').trim();
            } catch {
              answerText = q.answers[0].answer || '';
            }
          }
          
          if (questionText) {
            qaFormatted.push(`Q${questionNo}: ${questionText}\nA: ${answerText}`);
          }
        }
        
        detailedData.qaContent = qaFormatted.join('\n\n');
        console.log(`    ✓ Q&A: ${qaData.length} questions`);
      }
    }
    
  } catch (error) {
    // Q&A fetch is optional
  }
  
  return detailedData;
}

