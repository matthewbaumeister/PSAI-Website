/**
 * ============================================
 * Army Innovation Daily Scraper Cron Job
 * ============================================
 * 
 * Runs daily to check for updates to active XTECH/FUZE competitions
 * 
 * GET /api/cron/army-innovation-scraper
 * 
 * Vercel Cron: 0 6 * * * (6 AM UTC daily)
 * 
 * ============================================
 */

import { NextRequest, NextResponse } from 'next/server';
import ArmyXTechScraper from '@/lib/army-xtech-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';

// Verify cron authorization
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  // Check for cron secret
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check for Vercel Cron header
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check authorization
  if (!isAuthorized(request)) {
    console.error('Unauthorized army innovation scraper attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('🚀 Starting Army Innovation daily scraper cron job...');

  try {
    // Run XTECH scraper in ACTIVE mode (only checks open competitions)
    const xtechScraper = new ArmyXTechScraper();
    const xtechStats = await xtechScraper.scrapeActive();

    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const currentDate = new Date().toISOString().split('T')[0];

    const result = {
      success: true,
      message: 'Army Innovation daily scraper completed successfully',
      timestamp: new Date().toISOString(),
      duration_seconds: durationSeconds,
      xtech: {
        competitions_found: xtechStats.competitionsFound,
        competitions_processed: xtechStats.competitionsProcessed,
        competitions_inserted: xtechStats.competitionsInserted,
        competitions_updated: xtechStats.competitionsUpdated,
        winners_found: xtechStats.winnersFound,
        finalists_found: xtechStats.finalistsFound,
        errors: xtechStats.errors
      }
    };

    console.log('✅ Army Innovation scraper completed:', result);

    // Send success email notification
    await sendCronSuccessEmail({
      jobName: 'Army XTECH Innovation Tracker',
      success: true,
      date: currentDate,
      duration: durationSeconds,
      stats: {
        active_competitions_found: xtechStats.competitionsFound,
        competitions_processed: xtechStats.competitionsProcessed,
        new_competitions: xtechStats.competitionsInserted,
        updated_competitions: xtechStats.competitionsUpdated,
        new_winners: xtechStats.winnersFound,
        new_finalists: xtechStats.finalistsFound,
        errors: xtechStats.errors
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Army Innovation scraper error:', error);
    
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const currentDate = new Date().toISOString().split('T')[0];
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Send failure email notification
    await sendCronFailureEmail({
      jobName: 'Army XTECH Innovation Tracker',
      success: false,
      date: currentDate,
      duration: durationSeconds,
      error: errorMessage
    });
    
    return NextResponse.json(
      {
        success: false,
        message: 'Army Innovation scraper failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        duration_seconds: durationSeconds
      },
      { status: 500 }
    );
  }
}

// Prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

