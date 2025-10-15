import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapToSupabaseColumns } from '@/lib/sbir-column-mapper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering and set max duration
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Pro plan

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(' Starting automated SBIR scraper...');
    
    const result = await scrapeAndUpdateSBIR();
    
    return NextResponse.json({
      success: true,
      message: 'SBIR scraper completed successfully',
      ...result
    });

  } catch (error) {
    console.error(' SBIR scraper error:', error);
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
    console.log(` Found ${topics.length} active topics`);

    // Step 2: Process and format topics
    console.log(' Processing topics...');
    const processedTopics = await processTopics(topics, baseUrl);
    console.log(` Processed ${processedTopics.length} topics`);

    // Step 3: Update database with incremental changes
    console.log(' Updating Supabase database...');
    const updateResult = await updateDatabase(processedTopics);
    
    return {
      totalTopics: topics.length,
      processedTopics: processedTopics.length,
      newRecords: updateResult.newRecords,
      updatedRecords: updateResult.updatedRecords,
      skippedRecords: updateResult.skippedRecords,
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
  const maxPages = 20; // With Pro plan, we can be more conservative
  let consecutivePagesWithoutActive = 0;
  const maxConsecutivePagesWithoutActive = 5; // Stop after 5 pages with no active topics
  let totalActiveFound = 0;

  console.log(' Fetching topics and filtering for Open/Pre-Release/Active status...');
  console.log('📡 API Base URL:', baseUrl);

  // CRITICAL: Multi-step session initialization (like Python script does)
  console.log('🔐 Initializing session with multi-step process...');
  
  try {
    // Step 1: Visit main HTML page
    console.log('   Step 1: Visiting main page...');
    const initResponse = await fetch(`${baseUrl}/topics-app/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log(`   ✓ Main page loaded (status: ${initResponse.status})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Fetch component instructions (establishes API session)
    console.log('   Step 2: Fetching component instructions...');
    const compResponse = await fetch(`${baseUrl}/core/api/public/dropdown/components`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer null',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
      }
    });
    console.log(`   ✓ Component API called (status: ${compResponse.status})`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(` Session fully initialized - ready for topic search`);
  } catch (error) {
    console.warn(' Session initialization had issues:', error);
  }

  // Longer delay before starting main scrape (give server time to process session)
  console.log(' Waiting 3 seconds before search...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  while (page < maxPages) {
    // Sort by END DATE desc - currently open topics have future/recent end dates!
    const searchParams = {
      searchText: null,
      components: null,
      programYear: null,
      solicitationCycleNames: null,
      releaseNumbers: [],
      topicReleaseStatus: [],
      modernizationPriorities: [],
      sortBy: "topicEndDate,desc", // Active topics haven't closed yet - end dates in future!
      technologyAreaIds: [],
      component: null,
      program: null
    };

    const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
    const searchUrl = `${baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=${size}&page=${page}`;

    console.log(`📡 Fetching page ${page + 1}...`);
    console.log(` Search params:`, JSON.stringify(searchParams));
    console.log(` URL: ${searchUrl.substring(0, 150)}...`);

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Authorization': 'Bearer null',
          'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
          'Origin': 'https://www.dodsbirsttr.mil'
        }
      });

      console.log(`📡 Page ${page + 1} response status: ${response.status}`);

      if (response.status !== 200) {
        console.warn(` Non-200 response on page ${page}: ${response.status}`);
        const errorText = await response.text();
        console.error(` Error response:`, errorText.substring(0, 200));
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
        console.log(' Status distribution in first page:', statusCounts);
        console.log(' Sample topic:', {
          topicCode: data.data[0]?.topicCode,
          topicStatus: data.data[0]?.topicStatus,
          topicTitle: data.data[0]?.topicTitle?.substring(0, 50)
        });
      }

      // Filter for Open, Pre-Release, and Active topics (client-side)
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
        console.log(`    Page ${page + 1}: No active topics (${consecutivePagesWithoutActive}/${maxConsecutivePagesWithoutActive})`);
      }

      // Early termination if no active topics found in several consecutive pages
      if (consecutivePagesWithoutActive >= maxConsecutivePagesWithoutActive) {
        if (totalActiveFound > 0) {
          console.log(`    Early termination: Found ${totalActiveFound} active topics, no more in last ${maxConsecutivePagesWithoutActive} pages`);
        } else {
          console.log(`    Early termination: No active topics found after ${maxConsecutivePagesWithoutActive} pages`);
        }
        break;
      }
      
      if (data.data.length < size) {
        break; // Last page
      }
      
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(` Error fetching page ${page}:`, error);
      console.error(` Error details:`, error);
      break;
    }
  }

  console.log(` Finished fetching topics. Total active found: ${allTopics.length}`);
  console.log(` Sample of first topic:`, allTopics[0] ? {
    topicCode: allTopics[0].topicCode,
    topicStatus: allTopics[0].topicStatus,
    topicTitle: allTopics[0].topicTitle?.substring(0, 50)
  } : 'No topics found');

  return allTopics;
}

async function processTopics(topics: any[], baseUrl: string) {
  const processedTopics = [];
  
  console.log(` Processing ${topics.length} topics - fetching detailed info...`);
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    try {
      // Fetch detailed information for this topic
      console.log(`   [${i + 1}/${topics.length}] Fetching details for ${topic.topicCode}...`);
      const detailedTopic = await fetchTopicDetails(baseUrl, topic.topicId, topic.topicCode);
      
      // Merge basic list data with detailed data
      const fullTopic = { ...topic, ...detailedTopic };
      
      // Add timestamp for last_scraped
      fullTopic.last_scraped = new Date().toISOString();
      
      // Use the mapper to convert API response to Supabase column names
      const mappedTopic = mapToSupabaseColumns(fullTopic);
      
      processedTopics.push(mappedTopic);
      
      // Rate limiting - don't hammer the API
      if (i < topics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      console.error(`  Error processing topic ${topic.topicId}:`, error);
      continue;
    }
  }

  console.log(` Successfully mapped ${processedTopics.length} topics to Supabase format`);
  return processedTopics;
}

/**
 * Clean HTML tags from text (matching Python scraper exactly)
 */
function cleanHtml(text: string): string {
  if (!text) return '';
  
  let clean = text.replace(/<.*?>/g, '');
  clean = clean.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/&amp;/g, '&');
  clean = clean.replace(/&lt;/g, '<');
  clean = clean.replace(/&gt;/g, '>');
  clean = clean.replace(/&quot;/g, '"');
  clean = clean.replace(/&#39;/g, "'");
  clean = clean.replace(/&emsp;/g, '  ');
  clean = clean.replace(/&rsquo;/g, "'");
  clean = clean.replace(/&mdash;/g, '-');
  clean = clean.replace(/\s+/g, ' ');
  
  return clean.trim();
}

async function fetchTopicDetails(baseUrl: string, topicId: string, topicCode: string) {
  const detailedData: any = {};
  
  try {
    // STEP 1: Fetch detailed information (CORRECT endpoint from Python)
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
      
      // Extract focusAreas → modernization_priorities (CRITICAL MAPPING!)
      if (details.focusAreas && Array.isArray(details.focusAreas)) {
        const focusAreas = details.focusAreas.map((area: any) => 
          typeof area === 'object' ? area.name : String(area)
        ).filter(Boolean);
        detailedData.modernizationPriorities = focusAreas.join(' | ');
      }
      
      // Extract and clean keywords
      if (details.keywords) {
        if (Array.isArray(details.keywords)) {
          detailedData.keywords = details.keywords.join('; ');
        } else {
          detailedData.keywords = String(details.keywords).replace(/;/g, '; ').replace(/  /g, ' ').trim();
        }
      }
      
      // ITAR status
      if ('itar' in details) {
        detailedData.itarControlled = details.itar ? 'Yes' : 'No';
      }
      
      // Clean descriptions (remove HTML)
      if (details.objective) {
        detailedData.objective = cleanHtml(details.objective);
      }
      
      if (details.description) {
        detailedData.description = cleanHtml(details.description);
        // Check for xTech
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
      
      // Log success for first topic
      console.log(`    ✓ Details: tech=${!!detailedData.technologyAreas}, keywords=${!!detailedData.keywords}, desc=${!!detailedData.description}`);
      
    } else {
      console.error(`    Failed to fetch details: ${detailsResponse.status}`);
    }
    
  } catch (error) {
    console.error(`    Error fetching details:`, error);
  }
  
  // STEP 2: Fetch Q&A data if available
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
    // Q&A fetch is optional, don't log error
  }
  
  return detailedData;
}

async function updateDatabase(topics: any[]) {
  let newRecords = 0;
  let updatedRecords = 0;
  let skippedRecords = 0;

  try {
    console.log(` Upserting ${topics.length} topics to database...`);
    
    // Get existing records with their modified dates to track actual changes
    const topicKeys = topics.map(t => ({ 
      topic_number: t.topic_number, 
      cycle_name: t.cycle_name 
    }));
    
    const { data: existingRecords } = await supabase
      .from('sbir_final')
      .select('topic_number, cycle_name, modified_date')
      .in('topic_number', topics.map(t => t.topic_number));
    
    const existingMap = new Map(
      existingRecords?.map(r => [
        `${r.topic_number}_${r.cycle_name}`, 
        r.modified_date
      ]) || []
    );
    
    // Count records before
    const countBefore = existingMap.size;
    
    // Use upsert with onConflict to handle duplicates automatically
    const { error: upsertError } = await supabase
      .from('sbir_final')
      .upsert(topics, {
        onConflict: 'topic_number,cycle_name',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error(' Error upserting topics:', upsertError);
      throw upsertError;
    }

    // Determine new vs updated by checking which existed before
    topics.forEach(topic => {
      const key = `${topic.topic_number}_${topic.cycle_name}`;
      const existingModifiedDate = existingMap.get(key);
      
      if (!existingModifiedDate) {
        newRecords++;
      } else if (topic.modified_date && topic.modified_date !== existingModifiedDate) {
        updatedRecords++;
      } else {
        skippedRecords++;
      }
    });

    console.log(` Database upsert complete: ${newRecords} new, ${updatedRecords} updated, ${skippedRecords} unchanged`);

  } catch (error) {
    console.error(' Database update error:', error);
    throw error;
  }

  return { newRecords, updatedRecords, skippedRecords };
}
