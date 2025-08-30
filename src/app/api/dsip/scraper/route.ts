import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { dsipScraper } from '@/lib/dsip-scraper';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    // Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { action, type } = await request.json();

    switch (action) {
      case 'start':
        if (type === 'full') {
          const jobId = await dsipScraper.startFullRefresh();
          return NextResponse.json({ 
            success: true, 
            jobId,
            message: 'Full refresh started. This will take 5-6 hours to complete.' 
          });
        } else if (type === 'quick') {
          const jobId = await dsipScraper.startQuickCheck();
          return NextResponse.json({ 
            success: true, 
            jobId,
            message: 'Quick check started. This will check for new/updated opportunities.' 
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid type. Use "full" or "quick".' 
          }, { status: 400 });
        }

      case 'stop':
        await dsipScraper.stopScraper();
        return NextResponse.json({ 
          success: true, 
          message: 'Scraper paused successfully.' 
        });

      case 'resume':
        await dsipScraper.resumeScraper();
        return NextResponse.json({ 
          success: true, 
          message: 'Scraper resumed successfully.' 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use "start", "stop", or "resume".' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Scraper API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    // Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    const currentJob = dsipScraper.getCurrentJob();
    const isRunning = dsipScraper.isScraperRunning();

    return NextResponse.json({
      success: true,
      isRunning,
      currentJob,
      status: currentJob?.status || 'idle'
    });

  } catch (error) {
    console.error('Scraper status API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
