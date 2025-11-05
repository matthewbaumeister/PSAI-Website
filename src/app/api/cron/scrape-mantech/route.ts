import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { scrapeRecentNews, closeBrowser } from '@/lib/mantech-scraper';

// Vercel Pro timeout (5 minutes)
export const maxDuration = 300;

/**
 * DOD ManTech Projects Daily Scraper - Vercel Cron Job
 * 
 * Runs daily to scrape manufacturing technology news and projects from dodmantech.mil
 * 
 * Features:
 * - Scrapes news articles from main ManTech site
 * - Extracts companies, technologies, and transition data
 * - Links to SBIR/STTR and contracts
 * 
 * Vercel Cron: 30 12 * * * (12:30 PM UTC = 8:30 AM EST / 5:30 AM PST)
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

  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const scrapeDate = formatDate(new Date());
  
  // Create scraper log entry
  const { data: logEntry, error: logError } = await supabase
    .from('mantech_scraper_log')
    .insert({
      scrape_type: 'news',
      scrape_date: scrapeDate,
      component: 'News',
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by: 'cron'
    })
    .select()
    .single();
    
  if (logError) {
    console.error('[ManTech Cron] Failed to create scraper log:', logError);
  }

  try {
    console.log('[ManTech Cron] Starting ManTech news scraper...');
    console.log('[ManTech Cron] Fetching recent articles from dodmantech.mil...');
    
    // Get count before scraping
    const { count: countBefore } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true });
    
    // Scrape recent news (last 10 articles)
    const result = await scrapeRecentNews(10);
    
    // Close browser
    await closeBrowser();
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true });
    
    // Get company mentions count
    const { count: companyCount } = await supabase
      .from('mantech_company_mentions')
      .select('*', { count: 'exact', head: true });
    
    // Get most recent project
    const { data: recentProject } = await supabase
      .from('mantech_projects')
      .select('article_title, published_date, mantech_component')
      .order('scraped_at', { ascending: false })
      .limit(1);
    
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    const newProjects = (countAfter || 0) - (countBefore || 0);
    
    console.log('[ManTech Cron] Scraping completed successfully');
    console.log(`[ManTech Cron] Found: ${result.articlesFound} articles`);
    console.log(`[ManTech Cron] Already Scraped: ${result.articlesSkipped} articles`);
    console.log(`[ManTech Cron] New Projects Saved: ${result.projectsSaved}`);
    console.log(`[ManTech Cron] New/Updated: ${newProjects} projects`);
    console.log(`[ManTech Cron] Total Companies: ${companyCount || 0}`);
    
    // Update scraper log with results
    if (logEntry) {
      await supabase
        .from('mantech_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: durationSeconds,
          articles_found: result.articlesFound,
          articles_scraped: result.articlesFound,
          articles_failed: result.articlesFound - result.projectsSaved,
          projects_created: newProjects > 0 ? newProjects : 0,
          projects_updated: newProjects < 0 ? Math.abs(newProjects) : 0,
          companies_extracted: companyCount || 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'DOD ManTech Projects Scraper',
      success: true,
      date: scrapeDate,
      duration: durationSeconds,
      stats: {
        articles_found: result.articlesFound,
        articles_skipped: result.articlesSkipped,
        projects_saved: result.projectsSaved,
        new_projects: newProjects,
        total_projects_in_db: countAfter || 0,
        total_companies_tracked: companyCount || 0,
        most_recent_article: recentProject && recentProject.length > 0 
          ? `${recentProject[0].article_title} (${recentProject[0].mantech_component})`
          : 'None'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'ManTech news scraping completed',
      stats: {
        articles_found: result.articlesFound,
        articles_skipped: result.articlesSkipped,
        projects_saved: result.projectsSaved,
        new_projects: newProjects,
        total_projects: countAfter,
        total_companies: companyCount
      },
      duration_seconds: durationSeconds
    });
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    console.error('[ManTech Cron] Scraping failed:', error);
    
    // Update scraper log with failure
    if (logEntry) {
      await supabase
        .from('mantech_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: durationSeconds,
          error_message: error.message || 'Unknown error',
          error_details: { stack: error.stack },
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'DOD ManTech Projects Scraper',
      success: false,
      date: scrapeDate,
      duration: durationSeconds,
      error: error.message || 'Unknown error'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

