import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { scrapeDailyTransactions } from '@/lib/fpds-transactions-scraper';

/**
 * FPDS Daily Scraper - Vercel Cron Job
 * 
 * Now uses TRANSACTIONS endpoint to get ALL contract actions (6000+ per day)
 * Previously: Used awards endpoint (only 12 new awards per day)
 * 
 * Runs daily at 12:00 PM UTC to scrape contract transactions
 * 
 * Vercel Cron: 0 12 * * * (12:00 PM UTC = 8:00 AM EST / 5:00 AM PST)
 */

// Set max duration to 5 minutes (300 seconds) for Pro plan
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Format date helper
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = new Date();
  const dateStr = formatDate(today);

  try {
    console.log('[Cron] Starting FPDS TRANSACTIONS scraper...');
    console.log('[Cron] Using transactions endpoint - will capture 6000+ daily actions');
    console.log('[Cron] Multi-day mode: Will scrape last 3 days to handle API delays');
    
    // Get count before scraping
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get total count in database
    const { count: countBefore } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });
    
    console.log(`[Cron] Database has ${countBefore} contracts before scraping`);
    
    // Scrape last 3 days (today, yesterday, 2 days ago)
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(formatDate(date));
    }
    
    console.log(`[Cron] Scraping dates: ${dates.join(', ')}`);
    
    let totalFound = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    
    // Scrape each date using TRANSACTIONS endpoint
    for (const date of dates) {
      try {
        console.log(`[Cron] Processing ${date} (transactions)...`);
        const result = await scrapeDailyTransactions(date);
        
        totalFound += result.totalFound;
        totalInserted += result.totalInserted;
        totalUpdated += result.totalUpdated;
        totalFailed += result.totalFailed;
        
        console.log(`[Cron] ${date}: Found ${result.totalFound}, New: ${result.totalInserted}, Updated: ${result.totalUpdated}`);
      } catch (error: any) {
        console.error(`[Cron] Error scraping ${date}:`, error.message);
        // Continue with other dates even if one fails
      }
    }
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });
    
    const duration = Date.now() - startTime;
    
    console.log('[Cron] FPDS transactions scraping completed successfully');
    console.log(`[Cron] Total: ${totalFound} found, ${totalInserted} new, ${totalUpdated} updated, ${totalFailed} failed`);
    console.log(`[Cron] Database now has ${countAfter} contracts (was ${countBefore})`);
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'FPDS Contract Awards Scraper',
      success: true,
      date: dateStr,
      duration,
      stats: {
        days_scraped: 3,
        total_found: totalFound,
        new_contracts: totalInserted,
        updated_contracts: totalUpdated,
        failed: totalFailed,
        total_in_db: countAfter || 0
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `FPDS transactions scraped (last 3 days)`,
      date: dateStr,
      stats: {
        days_scraped: 3,
        total_found: totalFound,
        new: totalInserted,
        updated: totalUpdated,
        failed: totalFailed,
        total_in_db: countAfter || 0
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] FPDS scraping failed:', error);
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'FPDS Contract Awards Scraper',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stderr: error.stderr,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

