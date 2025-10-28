/**
 * API ENDPOINT: Generate Instruction Document for Single Opportunity
 * 
 * POST /api/dsip/generate-instructions/[opportunityId]
 * GET /api/dsip/generate-instructions/[opportunityId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { InstructionDocumentService } from '@/lib/instruction-document-service';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const { opportunityId: opportunityIdParam } = await params;
    const opportunityId = parseInt(opportunityIdParam);

    if (isNaN(opportunityId)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID' },
        { status: 400 }
      );
    }

    const service = new InstructionDocumentService();
    const result = await service.generateForOpportunity(opportunityId);

    if (result.success) {
    return NextResponse.json({
      success: true,
      pdfUrl: result.pdfUrl,
      topicNumber: result.topicNumber,
      message: 'Instruction document generated successfully',
      debug: result.debug // Add debug info
    });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          topicNumber: result.topicNumber
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating instruction document:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate instruction document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const { opportunityId: opportunityIdParam } = await params;
    const opportunityId = parseInt(opportunityIdParam);

    if (isNaN(opportunityId)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID' },
        { status: 400 }
      );
    }

    const service = new InstructionDocumentService();
    const result = await service.generateForOpportunity(opportunityId);

    if (result.success) {
      // Redirect to the PDF
      return NextResponse.redirect(result.pdfUrl!);
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
    console.error('Error generating instruction document:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate instruction document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

