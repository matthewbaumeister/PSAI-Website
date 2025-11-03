import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * FPDS Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 3 AM UTC to scrape previous day's contract awards
 * 
 * Vercel Cron: 0 3 * * * (3 AM UTC = 11 PM EST / 8 PM PST)
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
    console.log('🚀 [Cron] Starting FPDS daily scraper...');
    
    // Calculate yesterday's date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Format as YYYY-MM-DD for FPDS
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const dateStr = formatDate(yesterday);
    
    console.log(`📅 Scraping date: ${dateStr}`);
    
    // Run FPDS page-level scraper
    const { stdout, stderr } = await execAsync(
      `npx tsx src/scripts/fpds-page-level-scraper.ts --from=${dateStr} --to=${dateStr}`,
      {
        cwd: process.cwd(),
        timeout: 3600000 // 1 hour timeout
      }
    );
    
    if (stderr && !stderr.includes('[FPDS')) {
      console.error('⚠️  [Cron] FPDS scraper stderr:', stderr);
    }
    
    console.log('✅ [Cron] FPDS scraping completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `FPDS contracts scraped for ${dateStr}`,
      date: dateStr,
      output: stdout.split('\n').slice(-10).join('\n') // Last 10 lines
    });
    
  } catch (error: any) {
    console.error('❌ [Cron] FPDS scraping failed:', error);
    
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

