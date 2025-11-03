/**
 * ============================================
 * Congress.gov Daily Scraper - Cron Endpoint
 * ============================================
 * 
 * Vercel Cron Job endpoint for daily legislative updates.
 * 
 * Schedule: Daily at 6:30 AM EST (11:30 AM UTC)
 * (After Congress.gov completes overnight updates)
 * 
 * Security: Requires CRON_SECRET header
 * 
 * ============================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDailyScraper } from '@/scripts/congress-daily-scraper';

// ============================================
// Cron Job Handler
// ============================================

export async function GET(request: NextRequest) {
  // Security: Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Starting Congress.gov daily scraper...');
    
    // Run the scraper
    const result = await runDailyScraper();

    if (result.success) {
      console.log('[Cron] Congress.gov scraper completed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Congress.gov daily scraper completed',
        stats: result.stats,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('[Cron] Congress.gov scraper failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        stats: result.stats,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Cron] Congress.gov scraper exception:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ============================================
// POST Handler (for manual triggers)
// ============================================

export async function POST(request: NextRequest) {
  // Security: Verify cron secret or admin auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Manual] Starting Congress.gov daily scraper...');
    
    const result = await runDailyScraper();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Congress.gov scraper completed (manual trigger)',
        stats: result.stats,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        stats: result.stats,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

