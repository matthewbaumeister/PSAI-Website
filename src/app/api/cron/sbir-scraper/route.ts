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
    console.log('💾 Updating Supabase database...');
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
  const maxPages = 20; // With Pro plan, we can be more conservative
  let consecutivePagesWithoutActive = 0;
  const maxConsecutivePagesWithoutActive = 5; // Stop after 5 pages with no active topics
  let totalActiveFound = 0;

  console.log('🔍 Fetching topics and filtering for Open/Pre-Release/Active status...');
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
    
    console.log(`✅ Session fully initialized - ready for topic search`);
  } catch (error) {
    console.warn('⚠️ Session initialization had issues:', error);
  }

  // Longer delay before starting main scrape (give server time to process session)
  console.log('⏳ Waiting 3 seconds before search...');
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
    console.log(`🔍 Search params:`, JSON.stringify(searchParams));
    console.log(`🔗 URL: ${searchUrl.substring(0, 150)}...`);

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
        console.log(`   ⏭️ Page ${page + 1}: No active topics (${consecutivePagesWithoutActive}/${maxConsecutivePagesWithoutActive})`);
      }

      // Early termination if no active topics found in several consecutive pages
      if (consecutivePagesWithoutActive >= maxConsecutivePagesWithoutActive) {
        if (totalActiveFound > 0) {
          console.log(`   ✅ Early termination: Found ${totalActiveFound} active topics, no more in last ${maxConsecutivePagesWithoutActive} pages`);
        } else {
          console.log(`   ⚠️ Early termination: No active topics found after ${maxConsecutivePagesWithoutActive} pages`);
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
  
  console.log(`📦 Processing ${topics.length} topics with column mapper...`);
  
  for (const topic of topics) {
    try {
      // Add timestamp for last_scraped
      topic.last_scraped = new Date().toISOString();
      
      // Use the mapper to convert API response to Supabase column names
      const mappedTopic = mapToSupabaseColumns(topic);
      
      processedTopics.push(mappedTopic);
      
    } catch (error) {
      console.error(`❌ Error processing topic ${topic.topicId}:`, error);
      continue;
    }
  }

  console.log(`✅ Successfully mapped ${processedTopics.length} topics to Supabase format`);
  return processedTopics;
}

async function updateDatabase(topics: any[]) {
  let newRecords = 0;
  let updatedRecords = 0;

  try {
    console.log(`💾 Upserting ${topics.length} topics to database...`);
    
    // Get count before upsert
    const { count: countBefore } = await supabase
      .from('sbir_final')
      .select('*', { count: 'exact', head: true });
    
    // Use upsert with onConflict to handle duplicates automatically
    // This will INSERT new records or UPDATE existing ones based on the unique constraint
    const { data, error: upsertError } = await supabase
      .from('sbir_final')
      .upsert(topics, {
        onConflict: 'topic_number,cycle_name', // Matches the unique_topic_cycle constraint
        ignoreDuplicates: false // Update if exists
      })
      .select();

    if (upsertError) {
      console.error('❌ Error upserting topics:', upsertError);
      throw upsertError;
    }

    // Get count after upsert
    const { count: countAfter } = await supabase
      .from('sbir_final')
      .select('*', { count: 'exact', head: true });

    newRecords = (countAfter || 0) - (countBefore || 0);
    updatedRecords = topics.length - newRecords;

    console.log(`✅ Database upsert complete: ${newRecords} new, ${updatedRecords} updated`);

  } catch (error) {
    console.error('❌ Database update error:', error);
    throw error;
  }

  return { newRecords, updatedRecords };
}
