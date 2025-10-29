/**
 * Admin API: Generate consolidated instructions for ALL active opportunities
 * 
 * This endpoint triggers bulk generation of instruction documents for:
 * - All opportunities with status: Open, Prerelease, or Active
 * - That have component_instructions_download OR solicitation_instructions_download URLs
 * - That don't already have consolidated_instructions_url
 * 
 * Use this to backfill instructions for existing active opportunities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { InstructionDocumentService } from '@/lib/instruction-document-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300; // 5 minutes max execution time

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceKey = authHeader.split('Bearer ')[1];
    if (serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      forceRegenerate = false,
      limit = 50, // Process in batches
      onlyMissing = true // Only generate for opportunities without instructions
    } = body;

    console.log('🚀 Starting bulk instruction generation', { forceRegenerate, limit, onlyMissing });

    // Query active opportunities that need instructions
    let query = supabase
      .from('sbir_final')
      .select('topic_id, topic_number, title, status, component_instructions_download, solicitation_instructions_download, consolidated_instructions_url')
      .in('status', ['Open', 'Prerelease', 'Active'])
      .limit(limit);

    // Filter based on parameters
    if (onlyMissing && !forceRegenerate) {
      query = query.is('consolidated_instructions_url', null);
    }

    const { data: opportunities, error: queryError } = await query;

    if (queryError) {
      console.error('❌ Query error:', queryError);
      return NextResponse.json({ 
        success: false, 
        error: queryError.message 
      }, { status: 500 });
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No opportunities need instruction generation',
        processed: 0,
        skipped: 0,
        failed: 0
      });
    }

    console.log(`📋 Found ${opportunities.length} opportunities to process`);

    // Filter opportunities that have at least one instruction URL
    const validOpportunities = opportunities.filter(opp => 
      opp.component_instructions_download || opp.solicitation_instructions_download
    );

    console.log(`✅ ${validOpportunities.length} have instruction URLs`);

    const results = {
      total: validOpportunities.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[]
    };

    const instructionService = new InstructionDocumentService();

    // Process each opportunity
    for (const opp of validOpportunities) {
      try {
        console.log(`\n🔄 Processing ${opp.topic_number}: ${opp.title?.substring(0, 60)}...`);
        
        // Skip if already has instructions and not forcing regeneration
        if (opp.consolidated_instructions_url && !forceRegenerate) {
          console.log(`⏭️  Skipping ${opp.topic_number} - already has instructions`);
          results.skipped++;
          continue;
        }

        // Generate instructions
        const result = await instructionService.generateForOpportunity(opp.topic_id);
        
        if (result.success) {
          console.log(`✅ Success: ${opp.topic_number}`);
          results.succeeded++;
        } else {
          console.log(`❌ Failed: ${opp.topic_number} - ${result.error}`);
          results.failed++;
          results.errors.push({
            topic_number: opp.topic_number,
            topic_id: opp.topic_id,
            error: result.error
          });
        }
        
        results.processed++;

        // Rate limiting - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error processing ${opp.topic_number}:`, error);
        results.failed++;
        results.errors.push({
          topic_number: opp.topic_number,
          topic_id: opp.topic_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\n📊 Bulk generation complete:', results);

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        message: `Processed ${results.processed} of ${results.total} opportunities`,
        succeeded: results.succeeded,
        failed: results.failed,
        skipped: results.skipped
      }
    });

  } catch (error) {
    console.error('❌ Bulk generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  try {
    // Get stats about instruction coverage
    const { data: stats, error } = await supabase.rpc('get_instruction_coverage_stats');
    
    if (error) {
      // If RPC doesn't exist, do manual query
      const { data: activeCount } = await supabase
        .from('sbir_final')
        .select('topic_id', { count: 'exact', head: true })
        .in('status', ['Open', 'Prerelease', 'Active']);

      const { data: withInstructions } = await supabase
        .from('sbir_final')
        .select('topic_id', { count: 'exact', head: true })
        .in('status', ['Open', 'Prerelease', 'Active'])
        .not('consolidated_instructions_url', 'is', null);

      const { data: withUrls } = await supabase
        .from('sbir_final')
        .select('topic_id', { count: 'exact', head: true })
        .in('status', ['Open', 'Prerelease', 'Active'])
        .or('component_instructions_download.not.is.null,solicitation_instructions_download.not.is.null');

      return NextResponse.json({
        success: true,
        stats: {
          total_active: activeCount || 0,
          with_instruction_urls: withUrls || 0,
          with_consolidated_instructions: withInstructions || 0,
          missing_instructions: (withUrls || 0) - (withInstructions || 0)
        }
      });
    }

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

