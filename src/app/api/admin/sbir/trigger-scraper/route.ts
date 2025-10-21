import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';

// Force dynamic rendering and set max duration for Vercel Pro
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Pro plan

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log(' Manual SBIR scraper trigger initiated by admin');

    // Trigger the admin scraper endpoint (not the cron one - it's outdated)
    const scraperUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/sbir/scraper`;
    
    const response = await fetch(scraperUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'start_scraper' })
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'SBIR scraper triggered successfully',
        result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to trigger scraper',
        details: result
      }, { status: 500 });
    }

  } catch (error) {
    console.error(' Manual scraper trigger error:', error);
    console.error(' Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
}
