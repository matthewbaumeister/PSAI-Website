import { NextRequest, NextResponse } from 'next/server';
import { scrapeSAMGovOpportunities } from '@/lib/sam-gov-opportunities-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

/**
 * SAM.gov Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 6 AM UTC to scrape yesterday's contract opportunities
 * with full details (descriptions, attachments, contacts)
 * 
 * Vercel Cron: 0 6 * * * (6 AM UTC = 2 AM EST / 11 PM PST)
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

  // Calculate yesterday's date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Format as MM/dd/yyyy for SAM.gov API
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  const postedFrom = formatDate(yesterday);
  const postedTo = formatDate(yesterday);

  try {
    console.log('🚀 [Cron] Starting SAM.gov daily scraper...');
    console.log(`📅 Scraping date: ${postedFrom}`);
    
    // Get count before scraping
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { count: countBefore } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true })
      .gte('posted_date', yesterday.toISOString().split('T')[0])
      .lt('posted_date', today.toISOString().split('T')[0]);
    
    // Run scraper with full details
    await scrapeSAMGovOpportunities({
      postedFrom,
      postedTo,
      limit: 100,
      includeAwards: true,
      fullDetails: true  // Get complete descriptions and attachments
    });
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true })
      .gte('posted_date', yesterday.toISOString().split('T')[0])
      .lt('posted_date', today.toISOString().split('T')[0]);
    
    const duration = Date.now() - startTime;
    const inserted = (countAfter || 0) - (countBefore || 0);
    
    console.log('✅ [Cron] SAM.gov scraping completed successfully');
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'SAM.gov Opportunities Scraper',
      success: true,
      date: postedFrom,
      duration,
      stats: {
        total_opportunities: countAfter || 0,
        new_opportunities: inserted,
        mode: 'full-details',
        includes: 'descriptions, attachments, contacts'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `SAM.gov opportunities scraped for ${postedFrom}`,
      date: postedFrom,
      mode: 'full-details',
      stats: {
        total: countAfter,
        inserted
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] SAM.gov scraping failed:', error);
    
    // Check if it's a rate limit error
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'SAM.gov Opportunities Scraper',
      success: false,
      date: postedFrom,
      duration,
      error: error.message || 'Unknown error'
    });
    
    if (isRateLimit) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'SAM.gov API daily quota reached. Will retry tomorrow.',
        nextAttempt: 'Next day at 6 AM UTC'
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

