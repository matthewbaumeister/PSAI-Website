import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { scrapeDate } from '@/scripts/dod-daily-scraper';

// Vercel Pro timeout (5 minutes)
export const maxDuration = 300;

/**
 * DoD Contract News Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 12:15 PM UTC to scrape DoD contract announcements
 * 
 * Features:
 * - Checks yesterday + last 3 days (catches gov shutdown updates)
 * - Detects contract modifications
 * - Smart upsert (no duplicates)
 * 
 * Vercel Cron: 15 12 * * * (12:15 PM UTC = 8:15 AM EST / 5:15 AM PST)
 */
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

  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  try {
    console.log('[Cron] Starting DoD contract news scraper...');
    
    // Check last 3 days (handles gov shutdowns where old articles get updated)
    const today = new Date();
    const dates = [];
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(formatDate(date));
    }
    
    console.log(`[Cron] Checking dates: ${dates.join(', ')}`);
    console.log(`[Cron] (Multi-day check handles gov shutdowns and contract mods)`);
    
    // Get count before scraping
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { count: countBefore } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true });
    
    // Scrape each date
    let totalArticles = 0;
    let totalContracts = 0;
    
    for (const date of dates) {
      try {
        console.log(`[Cron] Scraping ${date}...`);
        const result = await scrapeDate(date);
        
        if (result.success) {
          totalArticles += result.articlesFound;
          totalContracts += result.contractsInserted;
          console.log(`[Cron] ${date}: ${result.articlesFound} articles, ${result.contractsInserted} contracts`);
        } else {
          console.error(`[Cron] Failed to scrape ${date}`);
        }
        
        // Small delay between dates
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`[Cron] Error scraping ${date}:`, error.message);
        // Continue with other dates even if one fails
      }
    }
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true });
    
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    const newContracts = (countAfter || 0) - (countBefore || 0);
    
    console.log('[Cron] DoD news scraping completed successfully');
    console.log(`[Cron] Total: ${totalArticles} articles, ${newContracts} new/updated contracts`);
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'DoD Contract News Scraper',
      success: true,
      date: dates[0], // Yesterday's date for display
      duration: durationSeconds,
      stats: {
        dates_checked: dates.join(', '),
        total_contracts: countAfter || 0,
        new_updated_contracts: newContracts,
        articles_found: totalArticles,
        contracts_inserted: totalContracts
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `DoD contract news scraped for ${dates.join(', ')}`,
      dates_checked: dates,
      stats: {
        total_articles: totalArticles,
        total_contracts: totalContracts,
        new_updated: newContracts,
        database_total: countAfter
      },
      duration_seconds: durationSeconds
    });
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    console.error('[Cron] DoD news scraping failed:', error);
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'DoD Contract News Scraper',
      success: false,
      date: formatDate(new Date()),
      duration: durationSeconds,
      error: error.message || 'Unknown error'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

