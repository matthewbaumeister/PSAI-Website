#!/usr/bin/env node
/**
 * GitHub Actions Runner: Congress.gov Daily Scraper
 */

import 'dotenv/config';
import { runDailyScraper } from '../src/scripts/congress-daily-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  
  const { data: logEntry } = await supabase
    .from('congress_scraper_log')
    .insert({
      scrape_type: 'daily',
      date_range: 'Last 2 days',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting Congress.gov daily scraper...');
    
    const { count: countBefore } = await supabase
      .from('congressional_bills')
      .select('*', { count: 'exact', head: true });
    
    const result = await runDailyScraper();
    
    const { count: countAfter } = await supabase
      .from('congressional_bills')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newBills = (countAfter || 0) - (countBefore || 0);

    if (result.success) {
      console.log('[GitHub Actions] Congress.gov scraper completed successfully');
      
      if (logEntry) {
        await supabase
          .from('congress_scraper_log')
          .update({
            status: 'completed',
            duration_seconds: duration,
            records_found: result.stats.found,
            records_inserted: result.stats.new,
            records_updated: result.stats.updated,
            records_errors: result.stats.failed
          })
          .eq('id', logEntry.id);
      }
      
      await sendCronSuccessEmail({
        jobName: 'Congress.gov Legislative Scraper',
        success: true,
        date: dateStr,
        duration,
        stats: {
          total_bills_in_db: countAfter || 0,
          new_updated_bills: newBills,
          bills_found: result.stats.found,
          new_bills: result.stats.new,
          updated_bills: result.stats.updated,
          failed_bills: result.stats.failed,
          api_calls_made: result.stats.apiCalls
        }
      });
      
      console.log('[GitHub Actions] ✅ Congress.gov scraper completed successfully');
      process.exit(0);
    } else {
      throw new Error(result.error || 'Unknown error');
    }

  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ Congress.gov scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('congress_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronFailureEmail({
      jobName: 'Congress.gov Legislative Scraper',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();


