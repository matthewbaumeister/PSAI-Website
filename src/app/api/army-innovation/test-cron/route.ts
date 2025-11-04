/**
 * Manual Test Endpoint for Army Innovation Daily Scraper
 * 
 * GET /api/army-innovation/test-cron
 * 
 * Test the daily scraper without waiting for cron schedule
 * Requires CRON_SECRET authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import ArmyXTechScraper from '@/lib/army-xtech-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized - requires CRON_SECRET' },
      { status: 401 }
    );
  }

  console.log('🧪 Starting Army Innovation TEST scraper...');

  try {
    // Run XTECH scraper in ACTIVE mode
    const xtechScraper = new ArmyXTechScraper();
    const xtechStats = await xtechScraper.scrapeActive();

    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const currentDate = new Date().toISOString().split('T')[0];

    const result = {
      success: true,
      test_mode: true,
      message: 'Army Innovation TEST scraper completed',
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

    console.log('✅ TEST scraper completed:', result);

    // Send test email notification
    await sendCronSuccessEmail({
      jobName: 'Army XTECH Innovation Tracker (TEST)',
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
      },
      message: `✅ TEST RUN SUCCESSFUL! Scraped ${xtechStats.competitionsFound} active competitions. Found ${xtechStats.competitionsUpdated} updates, ${xtechStats.winnersFound} new winners, ${xtechStats.finalistsFound} new finalists.`
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ TEST scraper error:', error);
    
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const currentDate = new Date().toISOString().split('T')[0];
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'Army XTECH Innovation Tracker (TEST)',
      success: false,
      date: currentDate,
      duration: durationSeconds,
      error: errorMessage,
      message: `❌ TEST RUN FAILED: ${errorMessage}`
    });
    
    return NextResponse.json(
      {
        success: false,
        test_mode: true,
        message: 'Army Innovation TEST scraper failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        duration_seconds: durationSeconds
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

