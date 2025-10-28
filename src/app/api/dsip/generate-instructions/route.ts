/**
 * API ENDPOINT: Generate Instruction Documents
 * 
 * POST /api/dsip/generate-instructions
 * 
 * Generates consolidated instruction PDFs for DSIP opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { InstructionDocumentService } from '@/lib/instruction-document-service';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify admin or service role
    const authHeader = request.headers.get('authorization');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!authHeader || !authHeader.includes(serviceKey || '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { opportunityIds, generateAll } = body;

    const service = new InstructionDocumentService();

    if (generateAll) {
      console.log('Generating instructions for all active opportunities...');
      const results = await service.generateForActiveOpportunities();
      
      return NextResponse.json({
        success: true,
        message: `Generated ${results.successful} instruction documents`,
        ...results
      });
    } else if (opportunityIds && Array.isArray(opportunityIds)) {
      console.log(`Generating instructions for ${opportunityIds.length} opportunities...`);
      const results = await service.generateForOpportunities(opportunityIds);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `Generated ${successful} instruction documents (${failed} failed)`,
        total: results.length,
        successful,
        failed,
        results
      });
    } else {
      return NextResponse.json(
        { error: 'Must provide opportunityIds array or generateAll: true' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in generate-instructions API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate instruction documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId parameter required' },
        { status: 400 }
      );
    }

    const service = new InstructionDocumentService();
    const result = await service.generateForOpportunity(parseInt(opportunityId));

    if (result.success) {
      return NextResponse.json({
        success: true,
        pdfUrl: result.pdfUrl,
        topicNumber: result.topicNumber
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in generate-instructions API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate instruction document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

