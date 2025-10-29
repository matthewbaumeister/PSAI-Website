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
    // Verify authorization (require service role key in header)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes(process.env.SUPABASE_SERVICE_ROLE_KEY!)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { opportunityId } = await context.params;
    
    console.log(`[LLM Analysis] Starting for opportunity: ${opportunityId}`);

    // Step 1: Fetch opportunity from database
    const isNumericId = /^\d+$/.test(opportunityId);
    const { data: opportunity, error: fetchError } = await supabase
      .from('sbir_final')
      .select('*')
      .eq(isNumericId ? 'id' : 'topic_id', opportunityId)
      .single();

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

    if (componentUrl) {
      try {
        console.log(`[LLM Analysis] Extracting component text...`);
        componentText = await extractTextFromPdf(componentUrl);
        console.log(`[LLM Analysis] Component text extracted: ${componentText.length} chars`);
      } catch (error) {
        console.error('[LLM Analysis] Failed to extract component text:', error);
      }
    }

    if (baaUrl) {
      try {
        console.log(`[LLM Analysis] Extracting BAA text...`);
        baaText = await extractTextFromPdf(baaUrl);
        console.log(`[LLM Analysis] BAA text extracted: ${baaText.length} chars`);
      } catch (error) {
        console.error('[LLM Analysis] Failed to extract BAA text:', error);
      }
    }

    if (!componentText && !baaText) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to extract text from instruction documents',
          message: 'Could not read PDF content from either document'
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
    console.log(`  - Requirements found: ${analysisResult.compliance_checklist.length}`);
    console.log(`  - Conflicts detected: ${analysisResult.conflicts_detected.length}`);
    console.log(`  - Superseding notes: ${analysisResult.superseding_notes.length}`);

    // Step 5: Format for display
    const formattedText = formatAnalysisForDisplay(analysisResult);

    // Step 6: Store in database
    console.log(`[LLM Analysis] Saving to database...`);
    const { error: updateError } = await supabase
      .from('sbir_final')
      .update({
        instructions_checklist: analysisResult as any,
        instructions_generated_at: new Date().toISOString(),
      })
      .eq(isNumericId ? 'id' : 'topic_id', opportunityId);

    if (updateError) {
      console.error('[LLM Analysis] Failed to save to database:', updateError);
      // Don't fail the request, still return the results
    } else {
      console.log(`[LLM Analysis] Saved to database successfully`);
    }

    // Step 7: Return results
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
 * Extract text from a PDF URL using unpdf
 */
async function extractTextFromPdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
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

