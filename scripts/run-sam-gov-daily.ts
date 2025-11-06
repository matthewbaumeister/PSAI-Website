#!/usr/bin/env node
/**
 * GitHub Actions Runner: SAM.gov Opportunities Daily Scraper
 */

import 'dotenv/config';
import { scrapeSAMGovOpportunities } from '../src/lib/sam-gov-opportunities-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const today = new Date();
  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }

  const { data: logEntry } = await supabase
    .from('sam_gov_scraper_log')
    .insert({
      scrape_type: 'daily',
      date_range: dates.map(d => formatDate(d)).join(', '),
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting SAM.gov daily scraper...');
    console.log(`[GitHub Actions] Checking dates: ${dates.map(d => formatDate(d)).join(', ')}`);
    
    const { count: countBefore } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true });
    
    const dateRanges = dates.map(d => formatDate(d)).join(',');
    await scrapeSAMGovOpportunities({
      postDate: dateRanges,
      fullDetails: true
    });
    
    const { count: countAfter } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newOpps = (countAfter || 0) - (countBefore || 0);
    
    if (logEntry) {
      await supabase
        .from('sam_gov_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          records_found: newOpps,
          records_inserted: newOpps > 0 ? newOpps : 0
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'SAM.gov Opportunities Scraper',
      success: true,
      date: formatDate(today),
      duration,
      stats: {
        dates_checked: dates.length,
        new_opportunities: newOpps,
        total_in_db: countAfter || 0
      }
    });
    
    console.log('[GitHub Actions] ✅ SAM.gov scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ SAM.gov scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('sam_gov_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronFailureEmail({
      jobName: 'SAM.gov Opportunities Scraper',
      success: false,
      date: formatDate(today),
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

