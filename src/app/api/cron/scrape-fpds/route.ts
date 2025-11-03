import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * FPDS Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 12:00 PM UTC to scrape previous day's contract awards
 * 
 * Vercel Cron: 0 12 * * * (12:00 PM UTC = 8:00 AM EST / 5:00 AM PST)
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
  
  // Format as YYYY-MM-DD for FPDS
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const dateStr = formatDate(yesterday);

  try {
    console.log('🚀 [Cron] Starting FPDS daily scraper...');
    console.log(`📅 Scraping date: ${dateStr}`);
    
    // Get count before scraping
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { count: countBefore } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true })
      .gte('last_modified_date', `${dateStr}T00:00:00`)
      .lt('last_modified_date', `${formatDate(today)}T00:00:00`);
    
    // Run FPDS daily scraper (optimized for single-day automated runs)
    const { stdout, stderr } = await execAsync(
      `npx tsx src/scripts/fpds-daily-scraper.ts --date=${dateStr}`,
      {
        cwd: process.cwd(),
        timeout: 3600000 // 1 hour timeout
      }
    );
    
    if (stderr && !stderr.includes('[FPDS')) {
      console.error('⚠️  [Cron] FPDS scraper stderr:', stderr);
    }
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true })
      .gte('last_modified_date', `${dateStr}T00:00:00`)
      .lt('last_modified_date', `${formatDate(today)}T00:00:00`);
    
    const duration = Date.now() - startTime;
    const newContracts = (countAfter || 0) - (countBefore || 0);
    
    // Extract stats from output
    const lastLines = stdout.split('\n').slice(-20).join('\n');
    const newMatch = lastLines.match(/New: (\d+)/);
    const updatedMatch = lastLines.match(/Updated: (\d+)/);
    const errorsMatch = lastLines.match(/Errors: (\d+)/);
    
    console.log('✅ [Cron] FPDS scraping completed successfully');
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'FPDS Contract Awards Scraper',
      success: true,
      date: dateStr,
      duration,
      stats: {
        total_contracts: countAfter || 0,
        new_contracts: newMatch ? parseInt(newMatch[1]) : newContracts,
        updated_contracts: updatedMatch ? parseInt(updatedMatch[1]) : 0,
        errors: errorsMatch ? parseInt(errorsMatch[1]) : 0
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `FPDS contracts scraped for ${dateStr}`,
      date: dateStr,
      stats: {
        total: countAfter,
        new: newContracts
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

