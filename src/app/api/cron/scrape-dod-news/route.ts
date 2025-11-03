import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * DoD Contract News Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 4 AM UTC to scrape yesterday's DoD contract announcements
 * 
 * Vercel Cron: 0 4 * * * (4 AM UTC = 12 AM EST / 9 PM PST)
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
    console.log('🚀 [Cron] Starting DoD contract news scraper...');
    
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
    
    console.log(`📅 Scraping date: ${dateStr}`);
    
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
    
    console.log('✅ [Cron] DoD news scraping completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `DoD contract news scraped for ${dateStr}`,
      date: dateStr,
      output: stdout.split('\n').slice(-10).join('\n') // Last 10 lines
    });
    
  } catch (error: any) {
    console.error('❌ [Cron] DoD news scraping failed:', error);
    
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

