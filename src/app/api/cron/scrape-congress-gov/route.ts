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
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Cron Job Handler
// ============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Security: Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Create scraper log entry
  const { data: logEntry, error: logError } = await supabase
    .from('congress_scraper_log')
    .insert({
      scrape_type: 'daily',
      date_range: 'Last 2 days',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (logError) {
    console.error('[Cron] Failed to create scraper log:', logError);
  }

  try {
    console.log('[Cron] Starting Congress.gov daily scraper...');
    
    // Get count before scraping
    const { count: countBefore } = await supabase
      .from('congressional_bills')
      .select('*', { count: 'exact', head: true });
    
    // Run the scraper
    const result = await runDailyScraper();
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('congressional_bills')
      .select('*', { count: 'exact', head: true });
    
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    const newBills = (countAfter || 0) - (countBefore || 0);

    if (result.success) {
      console.log('[Cron] Congress.gov scraper completed successfully');
      console.log(`[Cron] Total: ${newBills} new/updated bills`);
      
      // Update scraper log with results
      if (logEntry) {
        await supabase
          .from('congress_scraper_log')
          .update({
            status: 'completed',
            duration_seconds: durationSeconds,
            records_found: result.stats.found,
            records_inserted: result.stats.new,
            records_updated: result.stats.updated,
            records_errors: result.stats.failed
          })
          .eq('id', logEntry.id);
      }
      
      // Send success email
      await sendCronSuccessEmail({
        jobName: 'Congress.gov Legislative Scraper',
        success: true,
        date: new Date().toISOString().split('T')[0],
        duration: durationSeconds,
        stats: {
          total_bills_in_db: countAfter || 0,
          new_updated_bills: newBills,
          bills_found: result.stats.found,
          bills_processed: result.stats.new + result.stats.updated,
          new_bills: result.stats.new,
          updated_bills: result.stats.updated,
          failed_bills: result.stats.failed,
          api_calls_made: result.stats.apiCalls,
          window: 'Last 2 days (today + yesterday)',
          mode: 'comprehensive',
          includes: 'summaries, actions, cosponsors, amendments, text versions, related bills'
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Congress.gov daily scraper completed',
        stats: {
          total_bills: countAfter,
          new_updated: newBills,
          found: result.stats.found,
          new: result.stats.new,
          updated: result.stats.updated,
          failed: result.stats.failed,
          api_calls: result.stats.apiCalls
        },
        duration_seconds: durationSeconds,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('[Cron] Congress.gov scraper failed:', result.error);
      
      // Update scraper log with failure
      if (logEntry) {
        await supabase
          .from('congress_scraper_log')
          .update({
            status: 'failed',
            duration_seconds: durationSeconds,
            error_message: result.error || 'Unknown error'
          })
          .eq('id', logEntry.id);
      }
      
      // Send failure email
      await sendCronFailureEmail({
        jobName: 'Congress.gov Legislative Scraper',
        success: false,
        date: new Date().toISOString().split('T')[0],
        duration: durationSeconds,
        error: result.error || 'Unknown error'
      });
      
      return NextResponse.json({
        success: false,
        error: result.error,
        stats: result.stats,
        duration_seconds: durationSeconds,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    console.error('[Cron] Congress.gov scraper exception:', error);
    
    // Update scraper log with exception
    if (logEntry) {
      await supabase
        .from('congress_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: durationSeconds,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'Congress.gov Legislative Scraper',
      success: false,
      date: new Date().toISOString().split('T')[0],
      duration: durationSeconds,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_seconds: durationSeconds,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ============================================
// POST Handler (for manual triggers)
// ============================================

export async function POST(request: NextRequest) {
  // Manual triggers use the same logic as cron
  return GET(request);
}

