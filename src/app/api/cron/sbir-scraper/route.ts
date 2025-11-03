import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapToSupabaseColumns } from '@/lib/sbir-column-mapper-clean';
import { smartUpsertTopics } from '@/lib/smart-upsert-logic';
import { InstructionDocumentService } from '@/lib/instruction-document-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering and set max duration
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Pro plan

// Global log collector for sending detailed logs to UI
const detailedLogs: string[] = [];

function log(message: string) {
  console.log(message);
  detailedLogs.push(message);
}

export async function GET(request: NextRequest) {
  let runId: number | null = null;
  const startTime = Date.now();
  
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this was triggered manually or by cron
    const triggerSource = request.headers.get('x-trigger-source') || 'vercel_cron';
    const userId = request.headers.get('x-user-id') || null;
    const userEmail = request.headers.get('x-user-email') || null;
    const runType = triggerSource === 'admin_ui' ? 'manual' : 'cron';

    // Record the start of this run
    const { data: runRecord, error: insertError } = await supabase
      .from('dsip_scraper_runs')
      .insert({
        run_type: runType,
        trigger_source: triggerSource,
        user_id: userId,
        user_email: userEmail,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error(' Failed to record scraper run:', insertError);
    } else {
      runId = runRecord?.id || null;
      log(` Scraper run recorded with ID: ${runId}`);
    }

    // Clear previous logs
    detailedLogs.length = 0;
    log(` Starting automated SBIR scraper (${runType})...`);
    if (userEmail) {
      log(` Triggered by: ${userEmail}`);
    }
    
    const result = await scrapeAndUpdateSBIR();
    
    // Update the run record with results
    if (runId) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      await supabase
        .from('dsip_scraper_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          total_topics: result.totalTopics || 0,
          processed_topics: result.processedTopics || 0,
          new_records: result.newRecords || 0,
          updated_records: result.updatedRecords || 0,
          preserved_records: result.preservedRecords || 0
        })
        .eq('id', runId);
      
      log(` Run completed in ${durationSeconds}s - Record updated`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'SBIR scraper completed successfully',
      ...result,
      detailedLogs: detailedLogs // Send logs to UI
    });

  } catch (error) {
    console.error(' SBIR scraper error:', error);
    
    // Update the run record with error
    if (runId) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      await supabase
        .from('dsip_scraper_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_details: error instanceof Error ? error.stack : String(error)
        })
        .eq('id', runId);
    }
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      detailedLogs: detailedLogs
    }, { status: 500 });
  }
}

async function scrapeAndUpdateSBIR() {
  const baseUrl = "https://www.dodsbirsttr.mil";
  
  try {
    // Step 1: Fetch all active/open/pre-release topics
    log('📡 Step 1/3: Fetching active/open/pre-release topics...');
    const topics = await fetchActiveTopics(baseUrl);
    log(` ✓ Found ${topics.length} active topics`);

    // Step 2: Process and format topics with detailed info
    log(` Step 2/3: Processing ${topics.length} topics with detailed data extraction...`);
    log(`   Starting detailed extraction for ${topics.length} topics...`);
    log('   ============================================================');
    const processedTopics = await processTopics(topics, baseUrl);
    log('   ============================================================');
    log(` ✓ Processing complete: ${processedTopics.length} success, ${topics.length - processedTopics.length} errors`);
    log(` ✓ Successfully processed ${processedTopics.length} topics with full metadata`);

    // Step 3: Update database with smart upsert logic
    log(` Step 3/4: Updating Supabase database with smart upsert...`);
    const updateResult = await smartUpsertTopics(processedTopics, {
      scraperType: 'active',
      logFn: log
    });
    log(` ✓ Database update complete: ${updateResult.newRecords} new, ${updateResult.updatedRecords} updated, ${updateResult.preservedRecords} preserved`);
    
    // Step 4: Generate/update consolidated instructions for active opportunities
    log(` Step 4/4: Generating consolidated instructions for active opportunities...`);
    const instructionResult = await generateInstructionsForActiveOpportunities(log);
    log(` ✓ Instruction generation complete: ${instructionResult.generated} generated, ${instructionResult.skipped} skipped, ${instructionResult.failed} failed`);
    
    return {
      totalTopics: topics.length,
      processedTopics: processedTopics.length,
      newRecords: updateResult.newRecords,
      updatedRecords: updateResult.updatedRecords,
      preservedRecords: updateResult.preservedRecords,
      instructionsGenerated: instructionResult.generated,
      instructionsSkipped: instructionResult.skipped,
      instructionsFailed: instructionResult.failed,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    log(` Scraping error: ${error instanceof Error ? error.message : String(error)}`);
    log(` Error details: ${error instanceof Error ? error.stack : String(error)}`);
    throw error;
  }
}

/**
 * Generate/update consolidated instructions for active opportunities
 * Only runs for Open and Prerelease opportunities (not Closed)
 */
async function generateInstructionsForActiveOpportunities(log: (msg: string) => void): Promise<{
  generated: number;
  skipped: number;
  failed: number;
}> {
  const instructionService = new InstructionDocumentService();
  
  try {
    // Query active opportunities (Open/Prerelease) that have instruction URLs
    const { data: opportunities, error } = await supabase
      .from('sbir_final')
      .select('id, topic_id, topic_number, status, component_instructions_download, solicitation_instructions_download, consolidated_instructions_url, instructions_generated_at')
      .or('status.ilike.Open,status.ilike.Prerelease,status.ilike.Pre-Release,status.ilike.PreRelease')
      .or('component_instructions_download.not.is.null,solicitation_instructions_download.not.is.null');

    if (error) {
      log(`     ⚠️ Error querying opportunities: ${error.message}`);
      return { generated: 0, skipped: 0, failed: 0 };
    }

    if (!opportunities || opportunities.length === 0) {
      log(`     ℹ️ No active opportunities with instruction URLs found`);
      return { generated: 0, skipped: 0, failed: 0 };
    }

    log(`     Found ${opportunities.length} active opportunities with instruction URLs`);

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const opp of opportunities) {
      try {
        // Skip if instructions already exist and were generated recently (within 24 hours)
        if (opp.consolidated_instructions_url && opp.instructions_generated_at) {
          const generatedDate = new Date(opp.instructions_generated_at);
          const hoursSince = (Date.now() - generatedDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSince < 24) {
            log(`     ⏭️  ${opp.topic_number}: Skipping (generated ${Math.round(hoursSince)}h ago)`);
            skipped++;
            continue;
          }
        }

        // Generate instructions
        log(`     🔄 ${opp.topic_number}: Generating instructions...`);
        const result = await instructionService.generateForOpportunity(opp.topic_id);
        
        if (result.success) {
          log(`     ✅ ${opp.topic_number}: Instructions generated successfully`);
          generated++;
        } else {
          log(`     ❌ ${opp.topic_number}: Failed - ${result.error}`);
          failed++;
        }

        // Rate limiting - don't hammer the PDF servers
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        log(`     ❌ ${opp.topic_number}: Error - ${error instanceof Error ? error.message : 'Unknown'}`);
        failed++;
      }
    }

    return { generated, skipped, failed };

  } catch (error) {
    log(`     ❌ Instruction generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return { generated: 0, skipped: 0, failed: 0 };
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
  let successCount = 0;
  let errorCount = 0;
  
  log(`   Starting detailed extraction for ${topics.length} topics...`);
  log(`   ${'='.repeat(60)}`);
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const topicCode = topic.topicCode || 'UNKNOWN';
    const topicTitle = (topic.topicTitle || 'No title').substring(0, 60);
    
    try {
      // Show progress percentage and topic details
      const progress = Math.floor(((i + 1) / topics.length) * 100);
      log(`   [${progress}%] [${i + 1}/${topics.length}] ${topicCode}: ${topicTitle}...`);
      
      // DEBUG: Check if instruction URLs are in initial topic data
      if (i === 0) { // Only for first topic to avoid spam
        const topicKeys = Object.keys(topic);
        const topicInstrKeys = topicKeys.filter(key => 
          key.toLowerCase().includes('instruction') || 
          key.toLowerCase().includes('baa') ||
          key.toLowerCase().includes('solicitation') ||
          key.toLowerCase().includes('component')
        );
        if (topicInstrKeys.length > 0) {
          log(`      DEBUG: Initial topic data has keys: ${topicInstrKeys.join(', ')}`);
          // Show the actual values
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
      
      // Fetch detailed information for this topic
      const detailedTopic = await fetchTopicDetails(baseUrl, topic.topicId, topicCode);
      
      // Extract instruction URLs from initial topic data (not in detailed endpoint!)
      // URLs format: /submissions/api/public/download/solicitationDocuments?solicitation=DOD_SBIR_2025_P1_C4&release=12&documentType=RELEASE_PREFACE
      if (topic.cycleName && topic.releaseNumber && topic.component) {
        // Construct solicitation instructions URL (BAA Preface)
        const solUrl = `${baseUrl}/submissions/api/public/download/solicitationDocuments?solicitation=${topic.cycleName}&release=${topic.releaseNumber}&documentType=RELEASE_PREFACE`;
        detailedTopic.solicitationInstructionsDownload = solUrl;
        detailedTopic.solicitationInstructionsVersion = topic.baaPrefaceUploadTitle || '';
        if (i === 0) log(`      DEBUG: Constructed solicitation URL: ${solUrl}`);
        
        // Construct component instructions URL
        const compUrl = `${baseUrl}/submissions/api/public/download/solicitationDocuments?solicitation=${topic.cycleName}&documentType=INSTRUCTIONS&component=${topic.component}&release=${topic.releaseNumber}`;
        detailedTopic.componentInstructionsDownload = compUrl;
        if (topic.baaInstructions && Array.isArray(topic.baaInstructions) && topic.baaInstructions.length > 0) {
          detailedTopic.componentInstructionsVersion = topic.baaInstructions[0].fileName || '';
        }
        if (i === 0) log(`      DEBUG: Constructed component URL: ${compUrl}`);
      }
      
      // Log what was successfully extracted
      const hasSolInstr = !!detailedTopic.solicitationInstructionsDownload;
      const hasCompInstr = !!detailedTopic.componentInstructionsDownload;
      log(`      ✓ Extracted: tech=${!!detailedTopic.technologyAreas}, keywords=${!!detailedTopic.keywords}, desc=${!!detailedTopic.description}, qa=${!!detailedTopic.qaContent}, tpoc=${!!detailedTopic.tpocNames}, sol_instr=${hasSolInstr}, comp_instr=${hasCompInstr}`);
      
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
        
        // Urgency level based on days until close
        if (fullTopic.days_until_close <= 7) fullTopic.urgency_level = 'Critical';
        else if (fullTopic.days_until_close <= 14) fullTopic.urgency_level = 'High';
        else if (fullTopic.days_until_close <= 30) fullTopic.urgency_level = 'Medium';
        else fullTopic.urgency_level = 'Low';
      }
      
      // Duration between open and close
      if (topic.topicStartDate && topic.topicEndDate) {
        const openDate = new Date(topic.topicStartDate);
        const closeDate = new Date(topic.topicEndDate);
        fullTopic.duration_days = Math.floor((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Pre-release duration
      if (topic.topicPreReleaseStartDate && topic.topicPreReleaseEndDate) {
        const preStart = new Date(topic.topicPreReleaseStartDate);
        const preEnd = new Date(topic.topicPreReleaseEndDate);
        fullTopic.pre_release_duration = Math.floor((preEnd.getTime() - preStart.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Q&A window calculations
      if (topic.topicQAEndDate) {
        const qaEndDate = new Date(topic.topicQAEndDate);
        fullTopic.days_until_qa_close = Math.floor((qaEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Q&A response rate
      if (topic.topicQuestionCount && topic.noOfPublishedQuestions) {
        const total = parseInt(topic.topicQuestionCount) || 0;
        const published = parseInt(topic.noOfPublishedQuestions) || 0;
        if (total > 0) {
          fullTopic.qa_response_rate_percentage = Math.round((published / total) * 100);
        }
      }
      
      // Last activity date (max of updated, modified, qa end)
      const activityDates = [
        topic.updatedDate,
        topic.modifiedDate,
        topic.topicQAEndDate
      ].filter(Boolean).map(d => new Date(d).getTime());
      
      if (activityDates.length > 0) {
        fullTopic.last_activity_date = new Date(Math.max(...activityDates)).toISOString();
      }
      
      // Proposal window status
      if (topic.topicStartDate && topic.topicEndDate) {
        const openDate = new Date(topic.topicStartDate);
        const closeDate = new Date(topic.topicEndDate);
        if (now < openDate) fullTopic.proposal_window_status = 'Not Open';
        else if (now > closeDate) fullTopic.proposal_window_status = 'Closed';
        else fullTopic.proposal_window_status = 'Open';
      }
      
      // Q&A window active
      if (topic.topicQAStartDate && topic.topicQAEndDate) {
        const qaStart = new Date(topic.topicQAStartDate);
        const qaEnd = new Date(topic.topicQAEndDate);
        fullTopic.qa_window_active = (now >= qaStart && now <= qaEnd) ? 'Yes' : 'No';
      }
      
      // Extract solicitation phase from cycle_name (e.g., "DOD_SBIR_2025_P1_C4" -> "Phase I")
      if (topic.cycleName) {
        const phaseMatch = topic.cycleName.match(/_P(\d+)_/);
        if (phaseMatch) {
          const phaseNum = phaseMatch[1];
          fullTopic.solicitation_phase = `Phase ${phaseNum === '1' ? 'I' : phaseNum === '2' ? 'II' : phaseNum === '3' ? 'III' : phaseNum}`;
        }
      }
      
      // Parse phase information from descriptions
      const allText = `${detailedTopic.description || ''} ${detailedTopic.phase1Description || ''} ${detailedTopic.phase2Description || ''}`.toLowerCase();
      
      // Check for Direct to Phase II
      if (allText.includes('direct to phase ii') || allText.includes('direct phase ii') || allText.includes('dtp2')) {
        fullTopic.isDirectToPhaseII = 'Yes';
      } else {
        fullTopic.isDirectToPhaseII = fullTopic.isDirectToPhaseII || 'No';
      }
      
      // Determine phases available
      const phasesAvailable: string[] = [];
      if (detailedTopic.phase1Description) phasesAvailable.push('Phase I');
      if (detailedTopic.phase2Description) phasesAvailable.push('Phase II');
      if (detailedTopic.phase3Description) phasesAvailable.push('Phase III');
      if (phasesAvailable.length > 0) {
        fullTopic.phases_available = phasesAvailable.join(', ');
      }
      
      // Set xTech default to "No" if not detected
      if (!fullTopic.isXTech) {
        fullTopic.isXTech = 'No';
      }
      
      // Set prize_gating default
      if (!fullTopic.prize_gating) {
        fullTopic.prize_gating = fullTopic.isXTech === 'Yes' ? 'Yes' : 'No';
      }
      
      // Construct PDF link (correct API format)
      if (topic.topicId && topic.topicCode) {
        fullTopic.topic_pdf_download = `https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/download/PDF`;
        fullTopic.pdf_link = fullTopic.topic_pdf_download;
      }
      
      // Q&A content tracking
      if (detailedTopic.qaContent) {
        fullTopic.qa_content_fetched = 'Yes';
        fullTopic.qa_last_updated = now.toISOString();
      } else {
        fullTopic.qa_content_fetched = 'No';
      }
      
      // Add timestamp for last_scraped
      fullTopic.last_scraped = new Date().toISOString();
      
      // Tag with scraper source for smart upsert logic
      fullTopic.scraper_source = 'active';
      
      // Use the mapper to convert API response to Supabase column names
      const mappedTopic = mapToSupabaseColumns(fullTopic);
      
      processedTopics.push(mappedTopic);
      successCount++;
      
      // Rate limiting - don't hammer the API
      if (i < topics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      errorCount++;
      log(`       ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      continue;
    }
  }

  log(`   ${'='.repeat(60)}`);
  log(`   ✓ Processing complete: ${successCount} success, ${errorCount} errors`);
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
      
      // DEBUG: Log all available keys to find instruction URL field names
      const allKeys = Object.keys(details);
      const instructionKeys = allKeys.filter(key => 
        key.toLowerCase().includes('instruction') || 
        key.toLowerCase().includes('baa') ||
        key.toLowerCase().includes('solicitation') ||
        key.toLowerCase().includes('component')
      );
      if (instructionKeys.length > 0) {
        log(`      DEBUG: Found instruction-related keys: ${instructionKeys.join(', ')}`);
        instructionKeys.forEach(key => {
          const value = details[key];
          if (value && typeof value === 'string' && value.includes('http')) {
            log(`      DEBUG: ${key} = ${value.substring(0, 80)}...`);
          } else if (value && typeof value === 'object') {
            log(`      DEBUG: ${key} = [object with keys: ${Object.keys(value).join(', ')}]`);
          }
        });
      }
      
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
      
      // Extract and clean keywords (REMOVE HTML TAGS!)
      if (details.keywords) {
        let keywordText = '';
        if (Array.isArray(details.keywords)) {
          keywordText = details.keywords.join('; ');
        } else {
          keywordText = String(details.keywords);
        }
        // Clean HTML tags from keywords
        detailedData.keywords = cleanHtml(keywordText).replace(/;/g, '; ').replace(/  /g, ' ').trim();
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
      
      // TPOC (Technical Point of Contact) - Extract from topicManagers
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
        
        // Extract email domain from first email
        if (emails.length > 0 && emails[0].includes('@')) {
          detailedData.tpocEmailDomain = emails[0].split('@')[1];
        }
      }
      
      // Additional fields from details endpoint
      if (details.owner) detailedData.owner = details.owner;
      if (details.internalLead) detailedData.internalLead = details.internalLead;
      if (details.sponsorComponent) detailedData.sponsorComponent = details.sponsorComponent;
      if (details.selectionCriteria) detailedData.selectionCriteria = cleanHtml(details.selectionCriteria);
      if (details.proposalRequirements) detailedData.proposalRequirements = cleanHtml(details.proposalRequirements);
      if (details.submissionInstructions) detailedData.submissionInstructions = cleanHtml(details.submissionInstructions);
      if (details.eligibilityRequirements) detailedData.eligibilityRequirements = cleanHtml(details.eligibilityRequirements);
      
      // Phase II specific
      if (details.isDirectToPhaseII !== undefined) {
        detailedData.isDirectToPhaseII = details.isDirectToPhaseII ? 'Yes' : 'No';
      }
      
      // PDF and download links (using correct API field names)
      if (details.topicPdfDownload) detailedData.topicPdfDownload = details.topicPdfDownload;
      
      // Instruction URLs - API returns "Url" not "Download"
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
      const actualQACount = (qaData && Array.isArray(qaData)) ? qaData.length : 0;
      
      // Detect DSIP data inconsistencies (count says questions exist but API returns empty)
      const reportedCount = detailedData.topicQuestionCount || 0;
      if (reportedCount > 0 && actualQACount === 0) {
        console.log(`    ⚠️  Q&A Inconsistency: DSIP reports ${reportedCount} question(s) but API returned ${actualQACount}. Likely unpublished/draft questions.`);
      }
      
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
        console.log(`    ✓ Q&A: ${qaData.length} questions fetched successfully`);
      } else if (reportedCount > 0) {
        // Count says questions exist, but we got none - DSIP data issue
        console.log(`    ℹ️  No Q&A content available (despite reported count of ${reportedCount})`);
      }
    }
    
  } catch (error) {
    // Q&A fetch is optional, don't log error unless count indicated questions should exist
    if (detailedData.topicQuestionCount && detailedData.topicQuestionCount > 0) {
      console.log(`    ⚠️  Failed to fetch Q&A (API error, but count reports ${detailedData.topicQuestionCount} questions)`);
    }
  }
  
  return detailedData;
}

async function updateDatabase(topics: any[]) {
  let newRecords = 0;
  let updatedRecords = 0;
  let unchangedRecords = 0;

  try {
    log(`   Upserting ${topics.length} topics to database...`);
    
    // Get existing records to determine what's new vs updated
    const topicNumbers = topics.map(t => t.topic_number).filter(Boolean);
    
    if (topicNumbers.length === 0) {
      log(`   ⚠ Warning: No valid topic_number values found in scraped data`);
      return { newRecords: 0, updatedRecords: 0, skippedRecords: 0 };
    }
    
    const { data: existingRecords } = await supabase
      .from('sbir_final')
      .select('topic_number, cycle_name, last_scraped')
      .in('topic_number', topicNumbers);
    
    // Create a Set of composite keys (topic_number + cycle_name) for accurate matching
    const existingCompositeKeys = new Set(
      existingRecords?.map(r => `${r.topic_number}||${r.cycle_name || ''}`) || []
    );
    
    log(`   Found ${existingCompositeKeys.size} existing records in database`);
    
    // Debug: Show first few composite keys for comparison
    if (topics.length > 0 && existingRecords && existingRecords.length > 0) {
      log(`   Sample scraped: "${topics[0].topic_number}" + "${topics[0].cycle_name}"`);
      log(`   Sample existing: "${existingRecords[0].topic_number}" + "${existingRecords[0].cycle_name}"`);
    }
    
    // Categorize records BEFORE upsert using composite key (topic_number + cycle_name)
    topics.forEach(topic => {
      const compositeKey = `${topic.topic_number}||${topic.cycle_name || ''}`;
      if (existingCompositeKeys.has(compositeKey)) {
        updatedRecords++;
      } else {
        newRecords++;
      }
    });
    
    // Use upsert with onConflict to handle duplicates automatically
    const { error: upsertError } = await supabase
      .from('sbir_final')
      .upsert(topics, {
        onConflict: 'topic_number,cycle_name',
        ignoreDuplicates: false  // This will UPDATE existing records
      });

    if (upsertError) {
      log(`   Upsert error: ${upsertError.message}`);
      log(`   - Code: ${upsertError.code}`);
      log(`   - Details: ${upsertError.details}`);
      log(`   - Hint: ${upsertError.hint}`);
      
      // If it's a duplicate key error, try individual upserts
      if (upsertError.code === '23505' || upsertError.message?.includes('duplicate')) {
        log('   ⚠ Duplicate key constraint - attempting individual updates...');
        
        let successCount = 0;
        let failCount = 0;
        
        for (const topic of topics) {
          try {
            await supabase
              .from('sbir_final')
              .upsert([topic], {
                onConflict: 'topic_number,cycle_name'
              });
            successCount++;
          } catch {
            failCount++;
          }
        }
        
        log(`   ✓ Individual updates complete: ${successCount} success, ${failCount} failed`);
      } else {
        throw upsertError;
      }
    }

    log(`   ✓ Database upsert complete: ${newRecords} new, ${updatedRecords} updated, ${unchangedRecords} unchanged`);

  } catch (error) {
    log(`   Database update error: ${error instanceof Error ? error.message : String(error)}`);
    log(`   Error stack: ${error instanceof Error ? error.stack : String(error)}`);
    throw error;
  }

  return { newRecords, updatedRecords, skippedRecords: unchangedRecords };
}

// Support POST as well (for consistency with other cron endpoints)
export async function POST(request: NextRequest) {
  return GET(request);
}
