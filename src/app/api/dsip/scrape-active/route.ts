import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { DSIPRealScraper } from '@/lib/dsip-real-scraper';

// Configure route for dynamic behavior and extended timeout
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum execution time for Vercel Pro

export async function POST(request: NextRequest) {
  console.log('=== Scrape-active POST called ===');
  
  try {
    console.log('Step 1: Checking admin auth...');
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      console.log('Auth failed, returning auth response');
      return authResult;
    }
    
    console.log('Step 2: Running synchronous scraper (no job queue needed)...');
    
    // Run scraper synchronously and collect progress logs
    const scraper = new DSIPRealScraper();
    const progressLogs: string[] = [];
    let latestProgress: any = null;
    
    const results = await scraper.scrapeActiveOpportunities((progress) => {
      latestProgress = progress;
      // Store the latest log entries
      if (progress.logs) {
        progressLogs.push(...progress.logs.slice(-5)); // Keep last 5 logs
      }
      console.log(`[Scraper Progress] ${progress.phase}: ${progress.processedTopics}/${progress.totalTopics || 0}`);
    });

    console.log('Step 3: Scraping completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Active opportunities scraper completed',
      totalRecords: results.length,
      data: results,
      progress: latestProgress,
      logs: progressLogs
    });

  } catch (error) {
    console.error('Scraper API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}



