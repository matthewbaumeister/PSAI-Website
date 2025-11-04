import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { scrapeDate } from '@/scripts/fpds-daily-scraper';

/**
 * FPDS Daily Scraper - Vercel Cron Job
 * 
 * Uses AWARDS endpoint to get all contract awards (10,000+ per day)
 * 
 * Note: Vercel has 5-minute timeout, but scraper has resume logic.
 * Each run processes ~600 contracts, picks up where it left off next time.
 * A full day (10,000 contracts) takes ~17 runs (80 minutes total).
 * 
 * Runs every 5 minutes to handle resume logic automatically.
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
    console.log('[Cron] Starting FPDS daily scraper...');
    console.log('[Cron] Will scrape yesterday and day before (2 days)');
    console.log('[Cron] Processes ALL pages until complete, may take multiple runs');
    
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
    
    // Scrape yesterday and day before (2 days to account for reporting delays)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);
    
    const dates = [formatDate(yesterday), formatDate(dayBefore)];
    
    console.log(`[Cron] Target dates: ${dates.join(', ')}`);
    
    let totalFound = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    let daysCompleted = 0;
    const completedDates: string[] = [];
    
    // Scrape each date - will process as many pages as possible before timeout
    for (const date of dates) {
      try {
        console.log(`[Cron] Processing ${date}...`);
        const result = await scrapeDate(date);
        
        totalFound += result.totalFound;
        totalInserted += result.totalInserted;
        totalUpdated += result.totalUpdated;
        totalFailed += result.totalFailed;
        
        console.log(`[Cron] ${date}: Found ${result.totalFound}, New: ${result.totalInserted}, Updated: ${result.totalUpdated}`);
        
        // Check if this date is fully complete (no more pages)
        const { data: lastPage } = await supabase
          .from('fpds_page_progress')
          .select('contracts_found')
          .eq('date', date)
          .eq('status', 'completed')
          .order('page_number', { ascending: false })
          .limit(1)
          .single();
        
        if (lastPage && lastPage.contracts_found < 100) {
          daysCompleted++;
          completedDates.push(date);
          console.log(`[Cron] ✅ ${date} is COMPLETE!`);
        } else {
          console.log(`[Cron] ⏳ ${date} still in progress (will resume next run)`);
        }
        
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
    
    console.log('[Cron] FPDS scraping run completed');
    console.log(`[Cron] This run: ${totalInserted} new, ${totalUpdated} updated`);
    console.log(`[Cron] Days completed: ${daysCompleted}/${dates.length}`);
    console.log(`[Cron] Database: ${countBefore} → ${countAfter} (+${(countAfter || 0) - (countBefore || 0)})`);
    
    // Only send email if at least one full day was completed
    if (daysCompleted > 0) {
      console.log(`[Cron] 📧 Sending completion email for: ${completedDates.join(', ')}`);
      
      await sendCronSuccessEmail({
        jobName: 'FPDS Contract Awards Scraper',
        success: true,
        date: dateStr,
        duration,
        stats: {
          days_scraped: daysCompleted,
          total_found: totalFound,
          new_contracts: totalInserted,
          updated_contracts: totalUpdated,
          failed: totalFailed,
          total_in_db: countAfter || 0
        }
      });
    } else {
      console.log(`[Cron] ⏭️  No days completed yet, skipping email (will resume next run)`);
    }
    
    return NextResponse.json({
      success: true,
      message: `FPDS scraping run completed`,
      date: dateStr,
      stats: {
        days_targeted: dates.length,
        days_completed: daysCompleted,
        completed_dates: completedDates,
        total_found: totalFound,
        new: totalInserted,
        updated: totalUpdated,
        failed: totalFailed,
        total_in_db: countAfter || 0,
        db_growth: (countAfter || 0) - (countBefore || 0)
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

