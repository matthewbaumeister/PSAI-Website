import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * DoD Contract News Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 12:15 PM UTC to scrape yesterday's DoD contract announcements
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

  // Calculate yesterday's date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Format as YYYY-MM-DD for DoD scraper
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const dateStr = formatDate(yesterday);

  try {
    console.log('🚀 [Cron] Starting DoD contract news scraper...');
    console.log(`📅 Scraping date: ${dateStr}`);
    
    // Get count before scraping
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { count: countBefore } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true })
      .gte('published_date', `${dateStr}T00:00:00`)
      .lt('published_date', `${formatDate(today)}T00:00:00`);
    
    // Run DoD production scraper (article-level with smart resume)
    const { stdout, stderr } = await execAsync(
      `npx tsx scrape-dod-production.ts ${dateStr} ${dateStr}`,
      {
        cwd: process.cwd(),
        timeout: 1800000 // 30 minute timeout (usually quick for 1 day)
      }
    );
    
    if (stderr) {
      console.error('⚠️  [Cron] DoD scraper stderr:', stderr);
    }
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true })
      .gte('published_date', `${dateStr}T00:00:00`)
      .lt('published_date', `${formatDate(today)}T00:00:00`);
    
    const duration = Date.now() - startTime;
    const newContracts = (countAfter || 0) - (countBefore || 0);
    
    // Count articles
    const { count: articlesCount } = await supabase
      .from('dod_contract_news')
      .select('article_url', { count: 'exact', head: true })
      .gte('published_date', `${dateStr}T00:00:00`)
      .lt('published_date', `${formatDate(today)}T00:00:00`);
    
    console.log('✅ [Cron] DoD news scraping completed successfully');
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'DoD Contract News Scraper',
      success: true,
      date: dateStr,
      duration,
      stats: {
        total_contracts: countAfter || 0,
        new_contracts: newContracts,
        articles_processed: articlesCount || 0
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `DoD contract news scraped for ${dateStr}`,
      date: dateStr,
      stats: {
        total: countAfter,
        new: newContracts,
        articles: articlesCount
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] DoD news scraping failed:', error);
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'DoD Contract News Scraper',
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

