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

    // Trigger the scraper endpoint
    const scraperUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/sbir-scraper`;
    
    const response = await fetch(scraperUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
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
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
