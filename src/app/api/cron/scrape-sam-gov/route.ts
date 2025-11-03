import { NextRequest, NextResponse } from 'next/server';
import { scrapeSAMGovOpportunities } from '@/lib/sam-gov-opportunities-scraper';

/**
 * SAM.gov Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 6 AM UTC to scrape yesterday's contract opportunities
 * with full details (descriptions, attachments, contacts)
 * 
 * Vercel Cron: 0 6 * * * (6 AM UTC = 2 AM EST / 11 PM PST)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🚀 [Cron] Starting SAM.gov daily scraper...');
    
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
    
    console.log(`📅 Scraping date: ${postedFrom}`);
    
    // Run scraper with full details
    await scrapeSAMGovOpportunities({
      postedFrom,
      postedTo,
      limit: 100,
      includeAwards: true,
      fullDetails: true  // Get complete descriptions and attachments
    });
    
    console.log('✅ [Cron] SAM.gov scraping completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `SAM.gov opportunities scraped for ${postedFrom}`,
      date: postedFrom,
      mode: 'full-details'
    });
    
  } catch (error: any) {
    console.error('❌ [Cron] SAM.gov scraping failed:', error);
    
    // Check if it's a rate limit error
    if (error.message?.includes('429') || error.message?.includes('quota')) {
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

