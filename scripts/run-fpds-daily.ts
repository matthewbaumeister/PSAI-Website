#!/usr/bin/env node
/**
 * GitHub Actions Runner: FPDS Daily Scraper
 * 
 * Runs the FPDS daily scraper and sends email notifications
 */

import 'dotenv/config';
import { scrapeDate } from '../src/scripts/fpds-daily-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  const today = new Date();
  
  // Format date helper
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = formatDate(today);
  
  // Create scraper log entry
  const { data: logEntry } = await supabase
    .from('fpds_scraper_log')
    .insert({
      scrape_type: 'daily',
      date_range: `${formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000))} to ${formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000))}`,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting FPDS daily scraper...');
    console.log('[GitHub Actions] Will scrape yesterday and day before (2 days)');
    
    // Get count before scraping
    const { count: countBefore } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });
    
    // Scrape yesterday and day before (2 days to account for reporting delays)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);
    
    const dates = [formatDate(yesterday), formatDate(dayBefore)];
    
    console.log(`[GitHub Actions] Target dates: ${dates.join(', ')}`);
    
    let totalFound = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    let daysCompleted = 0;
    const completedDates: string[] = [];
    
    // Scrape each date
    for (const date of dates) {
      try {
        console.log(`[GitHub Actions] Processing ${date}...`);
        const result = await scrapeDate(date);
        
        totalFound += result.totalFound;
        totalInserted += result.totalInserted;
        totalUpdated += result.totalUpdated;
        totalFailed += result.totalFailed;
        
        console.log(`[GitHub Actions] ${date}: Found ${result.totalFound}, New: ${result.totalInserted}, Updated: ${result.totalUpdated}`);
        
        // Check if this date is fully complete
        const { data: lastPage } = await supabase
          .from('fpds_page_progress')
          .select('contracts_found')
          .eq('date', date)
          .eq('status', 'completed')
          .order('page_number', { ascending: false })
          .limit(1)
          .single();
        
        if (lastPage && lastPage.contracts_found < 100) {
          daysCompleted++;
          completedDates.push(date);
          console.log(`[GitHub Actions] ✅ ${date} is COMPLETE!`);
        } else {
          console.log(`[GitHub Actions] ⏳ ${date} still in progress (will resume next run)`);
        }
        
      } catch (error: any) {
        console.error(`[GitHub Actions] Error scraping ${date}:`, error.message);
      }
    }
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('[GitHub Actions] FPDS scraping run completed');
    console.log(`[GitHub Actions] This run: ${totalInserted} new, ${totalUpdated} updated`);
    console.log(`[GitHub Actions] Days completed: ${daysCompleted}/${dates.length}`);
    console.log(`[GitHub Actions] Database: ${countBefore} → ${countAfter} (+${(countAfter || 0) - (countBefore || 0)})`);
    
    // Update scraper log
    if (logEntry) {
      await supabase
        .from('fpds_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          records_found: totalFound,
          records_inserted: totalInserted,
          records_updated: totalUpdated,
          records_errors: totalFailed
        })
        .eq('id', logEntry.id);
    }
    
    // Send email if at least one full day was completed
    if (daysCompleted > 0) {
      console.log(`[GitHub Actions] 📧 Sending completion email for: ${completedDates.join(', ')}`);
      
      await sendCronSuccessEmail({
        jobName: 'FPDS Contract Awards Scraper',
        success: true,
        date: dateStr,
        duration,
        stats: {
          days_scraped: daysCompleted,
          total_found: totalFound,
          new_contracts: totalInserted,
          updated_contracts: totalUpdated,
          failed: totalFailed,
          total_in_db: countAfter || 0
        }
      });
    } else {
      console.log(`[GitHub Actions] ⏭️  No days completed yet, skipping email (will resume next run)`);
    }
    
    console.log('[GitHub Actions] ✅ FPDS scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ FPDS scraping failed:', error);
    
    // Update scraper log
    if (logEntry) {
      await supabase
        .from('fpds_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'FPDS Contract Awards Scraper',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

