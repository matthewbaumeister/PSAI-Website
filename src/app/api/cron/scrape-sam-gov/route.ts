import { NextRequest, NextResponse } from 'next/server';
import { scrapeSAMGovOpportunities } from '@/lib/sam-gov-opportunities-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

/**
 * SAM.gov Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 12:30 PM UTC to scrape recent contract opportunities
 * with full details (descriptions, attachments, contacts)
 * 
 * Features:
 * - Checks last 3 days (handles API delays and updates)
 * - Full details mode (complete descriptions, attachments, contacts)
 * - Rate limit detection with graceful handling
 * - Smart upsert (no duplicates)
 * 
 * Vercel Cron: 30 12 * * * (12:30 PM UTC = 8:30 AM EST / 5:30 AM PST)
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

  // Format as MM/dd/yyyy for SAM.gov API
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  try {
    console.log('[Cron] Starting SAM.gov daily scraper...');
    
    // Check last 3 days (handles API delays and updates)
    const today = new Date();
    const dates = [];
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    console.log(`[Cron] Checking dates: ${dates.map(d => formatDate(d)).join(', ')}`);
    console.log(`[Cron] (Multi-day check handles API delays and updates)`);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get count before scraping
    const { count: countBefore } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true });
    
    let totalOpportunities = 0;
    let rateLimit = false;
    
    // Scrape each date
    for (const date of dates) {
      const dateStr = formatDate(date);
      
      try {
        console.log(`[Cron] Scraping ${dateStr}...`);
        
        await scrapeSAMGovOpportunities({
          postedFrom: dateStr,
          postedTo: dateStr,
          limit: 100,
          includeAwards: true,
          fullDetails: true  // Get complete descriptions and attachments
        });
        
        // Small delay between dates to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`[Cron] Error scraping ${dateStr}:`, error.message);
        
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          console.log('[Cron] Rate limit reached, stopping further requests');
          rateLimit = true;
          break;
        }
        // Continue with other dates even if one fails
      }
    }
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true });
    
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    const newOpportunities = (countAfter || 0) - (countBefore || 0);
    
    console.log('[Cron] SAM.gov scraping completed');
    console.log(`[Cron] Total: ${newOpportunities} new/updated opportunities`);
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'SAM.gov Opportunities Scraper',
      success: true,
      date: formatDate(dates[0]), // Yesterday's date for display
      duration: durationSeconds,
      stats: {
        dates_checked: dates.map(d => formatDate(d)).join(', '),
        total_opportunities: countAfter || 0,
        new_updated_opportunities: newOpportunities,
        mode: 'full-details',
        includes: 'descriptions, attachments, contacts',
        rate_limited: rateLimit
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `SAM.gov opportunities scraped for ${dates.map(d => formatDate(d)).join(', ')}`,
      dates_checked: dates.map(d => formatDate(d)),
      mode: 'full-details',
      stats: {
        total_opportunities: countAfter,
        new_updated: newOpportunities,
        rate_limited: rateLimit
      },
      duration_seconds: durationSeconds
    });
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    console.error('[Cron] SAM.gov scraping failed:', error);
    
    // Check if it's a rate limit error
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'SAM.gov Opportunities Scraper',
      success: false,
      date: new Date().toISOString().split('T')[0],
      duration: durationSeconds,
      error: error.message || 'Unknown error'
    });
    
    if (isRateLimit) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'SAM.gov API daily quota reached. Will retry tomorrow at 12:30 PM UTC.',
        nextAttempt: 'Tomorrow at 12:30 PM UTC'
      }, { status: 429 });
    }
    
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

