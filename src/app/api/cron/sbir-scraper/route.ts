import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapToSupabaseColumns } from '@/lib/sbir-column-mapper';

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
