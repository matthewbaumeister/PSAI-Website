/**
 * API Endpoint: Analyze Instructions with LLM
 * 
 * POST /api/admin/analyze-instructions/[opportunityId]
 * 
 * Fetches instruction documents, analyzes with GPT-4o-mini,
 * generates compliance checklist with superseding guidance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInstructionDocuments, formatAnalysisForDisplay, InstructionAnalysisResult } from '@/lib/llm-instruction-analyzer';
import { extractText } from 'unpdf';
import { requireAuth } from '@/lib/auth-middleware';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{
    opportunityId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Authenticate the request using JWT auth system
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      // Auth failed - return the error response
      return authResult;
    }

    const { user } = authResult;
    console.log(`[LLM Analysis] Authenticated user: ${user.email}`);

    const { opportunityId } = await context.params;
    
    console.log(`[LLM Analysis] Starting for opportunity: ${opportunityId}`);

    // Step 1: Fetch opportunity from database
    // Try to match by topic_number first (most common from URL), then topic_id, then numeric id
    let opportunity: any = null;
    let fetchError: any = null;
    
    // Try topic_number first (from URL like /opportunities/SF254-D1205)
    const { data: oppByTopicNumber, error: err1 } = await supabase
      .from('sbir_final')
      .select('*')
      .eq('topic_number', opportunityId)
      .maybeSingle();
    
    if (oppByTopicNumber) {
      opportunity = oppByTopicNumber;
      console.log(`[LLM Analysis] Found by topic_number: ${opportunity.topic_number}`);
    } else {
      // Try topic_id (UUID-like identifier)
      const { data: oppByTopicId, error: err2 } = await supabase
        .from('sbir_final')
        .select('*')
        .eq('topic_id', opportunityId)
        .maybeSingle();
      
      if (oppByTopicId) {
        opportunity = oppByTopicId;
        console.log(`[LLM Analysis] Found by topic_id: ${opportunity.topic_number}`);
      } else {
        // Try numeric id as last resort
        const isNumericId = /^\d+$/.test(opportunityId);
        if (isNumericId) {
          const { data: oppById, error: err3 } = await supabase
            .from('sbir_final')
            .select('*')
            .eq('id', parseInt(opportunityId))
            .maybeSingle();
          
          if (oppById) {
            opportunity = oppById;
            console.log(`[LLM Analysis] Found by id: ${opportunity.topic_number}`);
          } else {
            fetchError = err3 || { message: 'Not found by id' };
          }
        } else {
          fetchError = err2 || { message: 'Not found by topic_id' };
        }
      }
    }

    if (fetchError || !opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    console.log(`[LLM Analysis] Found opportunity: ${opportunity.topic_number} - ${opportunity.title}`);

    // Step 2: Get instruction document URLs
    const componentUrl = opportunity.component_instructions_download;
    const baaUrl = opportunity.solicitation_instructions_download;

    if (!componentUrl && !baaUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No instruction documents available',
          message: 'This opportunity does not have component or BAA instruction URLs'
        },
        { status: 400 }
      );
    }

    console.log(`[LLM Analysis] Component URL: ${componentUrl ? 'Found' : 'Missing'}`);
    console.log(`[LLM Analysis] BAA URL: ${baaUrl ? 'Found' : 'Missing'}`);

    // Step 3: Extract text from PDFs (if not already in database)
    let componentText = '';
    let baaText = '';

    let componentError: any = null;
    let baaError: any = null;

    if (componentUrl) {
      try {
        console.log(`[LLM Analysis] Extracting component text from: ${componentUrl}`);
        componentText = await extractTextFromPdf(componentUrl);
        console.log(`[LLM Analysis] Component text extracted: ${componentText.length} chars`);
      } catch (error) {
        componentError = error;
        console.error('[LLM Analysis] Failed to extract component text:', error);
      }
    }

    if (baaUrl) {
      try {
        console.log(`[LLM Analysis] Extracting BAA text from: ${baaUrl}`);
        baaText = await extractTextFromPdf(baaUrl);
        console.log(`[LLM Analysis] BAA text extracted: ${baaText.length} chars`);
      } catch (error) {
        baaError = error;
        console.error('[LLM Analysis] Failed to extract BAA text:', error);
      }
    }

    if (!componentText && !baaText) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to extract text from instruction documents',
          message: 'Could not read PDF content from either document',
          debug: {
            componentUrl,
            baaUrl,
            componentError: componentError?.message || String(componentError),
            baaError: baaError?.message || String(baaError)
          }
        },
        { status: 500 }
      );
    }

    // If only one document exists, use it as both (self-analysis)
    if (!componentText) componentText = baaText;
    if (!baaText) baaText = componentText;

    // Step 4: Analyze with LLM
    console.log(`[LLM Analysis] Sending to GPT-4o-mini...`);
    const analysisResult = await analyzeInstructionDocuments(
      componentText,
      baaText,
      {
        topic_number: opportunity.topic_number || 'Unknown',
        title: opportunity.title || 'Unknown',
        component: opportunity.sponsor_component || 'Unknown'
      }
    );

    console.log(`[LLM Analysis] Analysis complete!`);
    console.log(`  - Volumes found: ${analysisResult.volumes.length}`);
    console.log(`  - Total requirements: ${analysisResult.volumes.reduce((sum, vol) => sum + vol.required_sections.reduce((secSum, sec) => secSum + sec.requirements.length, 0), 0)}`);
    console.log(`  - Critical notes: ${analysisResult.critical_notes.length}`);
    console.log(`  - Quick reference items: ${analysisResult.quick_reference.length}`);

    // Step 5: Format for display
    const formattedText = formatAnalysisForDisplay(analysisResult);

    // Step 6: Reconcile discovered metadata with existing data
    console.log(`[LLM Analysis] Reconciling metadata...`);
    const reconciliation = reconcileMetadata(opportunity, analysisResult);
    
    // Step 7: Store in database (including corrected metadata)
    console.log(`[LLM Analysis] Preparing database update...`);
    const timestamp = new Date().toISOString();
    const updateData: any = {
      instructions_checklist: analysisResult as any,
      instructions_generated_at: timestamp,
    };
    
    console.log(`[LLM Analysis] Setting instructions_generated_at to: ${timestamp}`);
    console.log(`[LLM Analysis] Analysis result contains:`);
    console.log(`  - proposal_phase: ${analysisResult.proposal_phase}`);
    console.log(`  - TOC component_structure: ${analysisResult.toc_reconciliation.component_structure.length} items`);
    console.log(`  - TOC baa_structure: ${analysisResult.toc_reconciliation.baa_structure.length} items`);
    console.log(`  - volumes: ${analysisResult.volumes.length} volumes`);
    console.log(`  - discovered_metadata.is_direct_to_phase_ii: ${analysisResult.discovered_metadata?.is_direct_to_phase_ii}`);
    
    // Apply metadata corrections if any were found
    if (reconciliation.updates && Object.keys(reconciliation.updates).length > 0) {
      console.log(`[LLM Analysis] Applying ${Object.keys(reconciliation.updates).length} metadata corrections:`);
      for (const [key, value] of Object.entries(reconciliation.updates)) {
        console.log(`  - ${key}: ${opportunity[key]} → ${value}`);
      }
      Object.assign(updateData, reconciliation.updates);
    }
    
    // Update using topic_number (most reliable identifier)
    console.log(`[LLM Analysis] Updating opportunity with topic_number = ${opportunity.topic_number}`);
    const { data: updatedData, error: updateError } = await supabase
      .from('sbir_final')
      .update(updateData)
      .eq('topic_number', opportunity.topic_number)
      .select('topic_number, instructions_generated_at, instructions_checklist, phase_1_award_amount, phase_2_award_amount, is_direct_to_phase_ii, phases_available')
      .single();

    if (updateError) {
      console.error('[LLM Analysis] Database UPDATE FAILED:', updateError);
      console.error('[LLM Analysis] Error details:', JSON.stringify(updateError, null, 2));
      // Don't fail the request, still return the results
    } else {
      console.log(`[LLM Analysis] ✅ DATABASE UPDATE SUCCESSFUL`);
      console.log(`[LLM Analysis] Verification - Database now shows:`);
      console.log(`  - topic_number: ${updatedData?.topic_number}`);
      console.log(`  - instructions_generated_at: ${updatedData?.instructions_generated_at}`);
      console.log(`  - phase_1_award_amount: ${updatedData?.phase_1_award_amount}`);
      console.log(`  - phase_2_award_amount: ${updatedData?.phase_2_award_amount}`);
      console.log(`  - is_direct_to_phase_ii: ${updatedData?.is_direct_to_phase_ii}`);
      console.log(`  - phases_available: ${updatedData?.phases_available}`);
      
      // Verify TOC structure
      const checklist = updatedData?.instructions_checklist as any;
      if (checklist) {
        console.log(`  - instructions_checklist exists: YES`);
        console.log(`  - proposal_phase: ${checklist.proposal_phase || 'MISSING'}`);
        console.log(`  - TOC component_structure items: ${checklist.toc_reconciliation?.component_structure?.length || 0}`);
        console.log(`  - TOC baa_structure items: ${checklist.toc_reconciliation?.baa_structure?.length || 0}`);
        console.log(`  - volumes count: ${checklist.volumes?.length || 0}`);
      } else {
        console.log(`  - instructions_checklist: NULL or EMPTY`);
      }
    }

    // Step 8: Return results
    return NextResponse.json({
      success: true,
      opportunity: {
        id: opportunity.id,
        topic_number: opportunity.topic_number,
        topic_id: opportunity.topic_id,
        title: opportunity.title,
      },
      analysis: analysisResult,
      formatted_display: formattedText,
      reconciliation: reconciliation, // Include reconciliation results
      metadata: {
        component_url: componentUrl,
        baa_url: baaUrl,
        component_text_length: componentText.length,
        baa_text_length: baaText.length,
        model_used: 'gpt-4o-mini',
        analyzed_at: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[LLM Analysis] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Reconcile LLM-discovered metadata with existing database values
 * Returns updates to apply and change log
 */
function reconcileMetadata(opportunity: any, analysis: InstructionAnalysisResult) {
  const discovered = analysis.discovered_metadata;
  const updates: any = {};
  const changes: string[] = [];
  
  if (!discovered) {
    return { updates, changes };
  }

  // Check Direct to Phase II flag
  if (discovered.is_direct_to_phase_ii !== undefined) {
    const existingValue = opportunity.is_direct_to_phase_ii?.toLowerCase();
    const discoveredValue = discovered.is_direct_to_phase_ii ? 'Yes' : 'No';
    
    if (existingValue !== discoveredValue.toLowerCase()) {
      updates.is_direct_to_phase_ii = discoveredValue;
      changes.push(`Direct to Phase II: "${existingValue || 'null'}" → "${discoveredValue}" (from instruction analysis)`);
    }
  }

  // Check Phases Available
  if (discovered.phases_available && discovered.phases_available.length > 0) {
    const existingPhases = opportunity.phases_available;
    const discoveredPhases = discovered.phases_available.join(', ');
    
    if (existingPhases !== discoveredPhases) {
      updates.phases_available = discoveredPhases;
      changes.push(`Phases Available: "${existingPhases || 'null'}" → "${discoveredPhases}" (from instruction analysis)`);
    }
  }

  // Check Phase 1 Funding
  if (discovered.phase_1_max_funding && discovered.phase_1_max_funding > 0) {
    const existingFunding = opportunity.phase_1_award_amount;
    if (!existingFunding || existingFunding === 0) {
      updates.phase_1_award_amount = discovered.phase_1_max_funding;
      changes.push(`Phase 1 Funding: $${existingFunding || 0} → $${discovered.phase_1_max_funding} (from instruction analysis)`);
    }
  }

  // Check Phase 1 Duration
  if (discovered.phase_1_duration_months && discovered.phase_1_duration_months > 0) {
    const existingDuration = opportunity.phase_1_duration_months;
    if (!existingDuration || existingDuration === 0) {
      updates.phase_1_duration_months = discovered.phase_1_duration_months;
      changes.push(`Phase 1 Duration: ${existingDuration || 0} → ${discovered.phase_1_duration_months} months (from instruction analysis)`);
    }
  }

  // Check Phase 2 Funding
  if (discovered.phase_2_max_funding && discovered.phase_2_max_funding > 0) {
    const existingFunding = opportunity.phase_2_award_amount;
    if (!existingFunding || existingFunding === 0) {
      updates.phase_2_award_amount = discovered.phase_2_max_funding;
      changes.push(`Phase 2 Funding: $${existingFunding || 0} → $${discovered.phase_2_max_funding} (from instruction analysis)`);
    }
  }

  // Check Phase 2 Duration
  if (discovered.phase_2_duration_months && discovered.phase_2_duration_months > 0) {
    const existingDuration = opportunity.phase_2_duration_months;
    if (!existingDuration || existingDuration === 0) {
      updates.phase_2_duration_months = discovered.phase_2_duration_months;
      changes.push(`Phase 2 Duration: ${existingDuration || 0} → ${discovered.phase_2_duration_months} months (from instruction analysis)`);
    }
  }

  return {
    updates,
    changes,
    data_quality_notes: discovered.data_quality_notes || [],
    applied: changes.length > 0
  };
}

/**
 * Extract text from a PDF URL using unpdf
 * Includes browser headers to bypass 403 Forbidden errors from government websites
 */
async function extractTextFromPdf(url: string): Promise<string> {
  try {
    // Add browser headers to mimic a real browser request
    // This helps bypass 403 Forbidden errors from DoD SBIR website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/x-pdf,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.dodsbirsttr.mil/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const { text } = await extractText(uint8Array, {
      mergePages: true
    });
    
    return text;
  } catch (error) {
    console.error(`Error extracting text from ${url}:`, error);
    throw error;
  }
}

