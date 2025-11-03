import { NextRequest, NextResponse } from 'next/server';
import { DSIPRealScraper } from '@/lib/dsip-real-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

/**
 * DSIP Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 12:45 PM UTC to scrape active DSIP opportunities
 * 
 * Vercel Cron: 45 12 * * * (12:45 PM UTC = 8:45 AM EST / 5:45 AM PST)
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

  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('🚀 [Cron] Starting DSIP daily scraper...');
    
    // Get count before scraping
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { count: countBefore } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('topic_status', 'Active');
    
    // Run scraper
    const scraper = new DSIPRealScraper();
    await scraper.scrapeActiveOpportunities();
    const progress = scraper.getProgress();
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('topic_status', 'Active');
    
    const duration = Date.now() - startTime;
    const newOpportunities = (countAfter || 0) - (countBefore || 0);
    
    console.log('✅ [Cron] DSIP scraping completed successfully');
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'DSIP Opportunities Scraper',
      success: true,
      date: today,
      duration,
      stats: {
        total_active_opportunities: countAfter || 0,
        new_opportunities: newOpportunities,
        total_processed: progress.processedTopics,
        with_full_details: progress.topicsWithDetails,
        errors: progress.errors.length
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `DSIP opportunities scraped`,
      date: today,
      stats: {
        total_active: countAfter,
        new: newOpportunities,
        processed: progress.processedTopics,
        errors: progress.errors.length
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] DSIP scraping failed:', error);
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'DSIP Opportunities Scraper',
      success: false,
      date: today,
      duration,
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

