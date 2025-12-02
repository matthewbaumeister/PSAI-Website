#!/usr/bin/env node
/**
 * GitHub Actions Runner: ManTech Projects Daily Scraper
 */

import 'dotenv/config';
import { scrapeRecentNews, closeBrowser } from '../src/lib/mantech-scraper';
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
    .from('mantech_scraper_log')
    .insert({
      scrape_type: 'news',
      scrape_date: dateStr,
      component: 'News',
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by: 'github_actions'
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting ManTech news scraper...');
    console.log('[GitHub Actions] Fetching recent articles from dodmantech.mil...');
    
    const { count: countBefore } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true });
    
    const result = await scrapeRecentNews(10);
    
    await closeBrowser();
    
    const { count: countAfter } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true });
    
    const { count: companyCount } = await supabase
      .from('mantech_company_mentions')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newProjects = (countAfter || 0) - (countBefore || 0);
    
    if (logEntry) {
      await supabase
        .from('mantech_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          articles_found: result.articlesFound,
          articles_scraped: result.articlesFound,
          articles_failed: result.articlesFound - result.projectsSaved,
          projects_created: newProjects > 0 ? newProjects : 0,
          companies_extracted: companyCount || 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'DOD ManTech Projects Scraper',
      success: true,
      date: dateStr,
      duration,
      stats: {
        articles_found: result.articlesFound,
        articles_skipped: result.articlesSkipped,
        projects_saved: result.projectsSaved,
        new_projects: newProjects,
        total_projects_in_db: countAfter || 0,
        total_companies_tracked: companyCount || 0
      }
    });
    
    console.log('[GitHub Actions] ✅ ManTech scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ ManTech scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('mantech_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error',
          error_details: { stack: error.stack },
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }
    
    await closeBrowser();
    
    await sendCronFailureEmail({
      jobName: 'DOD ManTech Projects Scraper',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();


