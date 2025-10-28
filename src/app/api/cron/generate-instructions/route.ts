/**
 * CRON JOB: Generate Instruction Documents
 * 
 * Runs after DSIP scraper to generate consolidated instruction PDFs
 * for all active opportunities that don't have them yet
 * 
 * Can be triggered:
 * - Automatically via Vercel cron (daily after scraper)
 * - Manually from admin UI
 * - Via API call with proper auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { InstructionDocumentService } from '@/lib/instruction-document-service';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('\n=== INSTRUCTION DOCUMENT GENERATOR CRON ===\n');

  try {
    // Verify cron secret or service role key
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isAuthorized =
      authHeader?.includes(cronSecret || '') ||
      authHeader?.includes(serviceKey || '') ||
      request.headers.get('x-vercel-cron') === 'true';

    if (!isAuthorized) {
      console.log(' Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(' Starting instruction document generation...');

    const service = new InstructionDocumentService();
    const results = await service.generateForActiveOpportunities();

    console.log('\n=== GENERATION COMPLETE ===');
    console.log(` Total: ${results.total}`);
    console.log(` Successful: ${results.successful}`);
    console.log(` Failed: ${results.failed}`);

    // Return detailed results
    return NextResponse.json({
      success: true,
      message: `Generated ${results.successful} instruction documents (${results.failed} failed)`,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      results: results.results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('\n=== GENERATION ERROR ===');
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate instruction documents',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for manual triggers from admin UI
  return GET(request);
}

