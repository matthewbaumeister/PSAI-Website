import { NextRequest, NextResponse } from 'next/server';
import { sendCronSuccessEmail, sendCronFailureEmail } from '@/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import { getBrowser, closeBrowser, fetchArticleHTML, parseArticleAndSave } from '@/lib/dod-news-scraper';
import * as cheerio from 'cheerio';

// Vercel Pro timeout (5 minutes)
export const maxDuration = 300;

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_URL = `${BASE_URL}/News/Contracts/`;

/**
 * Parse date from DoD article title
 * E.g., "Contracts For October 31, 2024" -> 2024-10-31
 */
function parseDateFromTitle(title: string): Date | null {
  const match = title.match(/Contracts\s+For\s+([A-Za-z]+)\s+(\d+),?\s+(\d{4})/i);
  if (!match) return null;
  
  const [, monthStr, day, year] = match;
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const month = monthNames.indexOf(monthStr.toLowerCase());
  
  if (month === -1) return null;
  
  return new Date(parseInt(year), month, parseInt(day));
}

/**
 * Fetch articles for a specific date from DoD website
 */
async function fetchArticlesForDate(targetDateStr: string): Promise<Array<{
  id: number;
  url: string;
  title: string;
  publishedDate: Date;
}>> {
  const articles: Array<{ id: number; url: string; title: string; publishedDate: Date }> = [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    let pageNum = 1;
    let foundTarget = false;
    
    // Search through pages until we find the target date
    while (!foundTarget && pageNum <= 100) {
      const url = pageNum === 1 ? CONTRACTS_URL : `${CONTRACTS_URL}?page=${pageNum}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      let foundOnPage = 0;
      let articleIdCounter = 1000000 + pageNum * 100;
      
      $('.river-list .item').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.river-title a').text().trim();
        const relativeUrl = $item.find('.river-title a').attr('href');
        
        if (!title.toLowerCase().includes('contracts for') || !relativeUrl) {
          return;
        }
        
        const articleDate = parseDateFromTitle(title);
        if (!articleDate) return;
        
        const articleDateStr = articleDate.toISOString().split('T')[0];
        
        // Check if this is our target date
        if (articleDateStr === targetDateStr) {
          articles.push({
            id: articleIdCounter++,
            url: BASE_URL + relativeUrl,
            title: title,
            publishedDate: articleDate
          });
          foundOnPage++;
          foundTarget = true;
        }
      });
      
      if (foundOnPage > 0) break;
      pageNum++;
    }
    
  } finally {
    await page.close();
  }
  
  return articles;
}

/**
 * DoD Contract News Daily Scraper - Vercel Cron Job
 * 
 * Runs daily at 12:15 PM UTC to scrape DoD contract announcements
 * 
 * Features:
 * - Checks yesterday + last 3 days (catches gov shutdown updates)
 * - Detects contract modifications
 * - Smart upsert (no duplicates)
 * 
 * Vercel Cron: 15 12 * * * (12:15 PM UTC = 8:15 AM EST / 5:15 AM PST)
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

  try {
    console.log('[Cron] Starting DoD contract news scraper...');
    
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check today + last 3 days (covers gov shutdown catch-up)
    const today = new Date();
    const dates = [];
    for (let i = 0; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(formatDate(date));
    }
    
    console.log(`[Cron] Checking dates: ${dates.join(', ')}`);
    console.log(`[Cron] (Today + last 3 days - handles weekends and gov shutdowns)`);
    
    // Get count before scraping
    
    const { count: countBefore } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true });
    
    // Scrape each date using production scraper logic
    let totalArticles = 0;
    let totalContracts = 0;
    
    for (const date of dates) {
      try {
        console.log(`[Cron] Scraping ${date}...`);
        
        // Find articles for this date
        const articles = await fetchArticlesForDate(date);
        console.log(`[Cron] ${date}: Found ${articles.length} articles`);
        
        if (articles.length === 0) {
          console.log(`[Cron] ${date}: No articles found (likely weekend/holiday)`);
          continue;
        }
        
        totalArticles += articles.length;
        
        // Scrape each article using production parser
        for (const article of articles) {
          try {
            const html = await fetchArticleHTML(article.url);
            if (html) {
              const contractsFound = await parseArticleAndSave(
                html,
                article.id,
                article.url,
                article.title,
                article.publishedDate
              );
              totalContracts += contractsFound;
              console.log(`[Cron]   ${article.title}: ${contractsFound} contracts`);
            }
          } catch (error: any) {
            console.error(`[Cron]   Error scraping article ${article.url}:`, error.message);
            // Continue with other articles
          }
          
          // Small delay between articles
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Small delay between dates
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`[Cron] Error scraping ${date}:`, error.message);
        // Continue with other dates even if one fails
      }
    }
    
    // Close browser
    await closeBrowser();
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true });
    
    // Get last government updated date (most recent published_date in database)
    const { data: finalGovData } = await supabase
      .from('dod_contract_news')
      .select('published_date')
      .order('published_date', { ascending: false })
      .limit(1);
    
    const lastGovUpdatedDate = finalGovData && finalGovData.length > 0 
      ? finalGovData[0].published_date 
      : 'No data';
    
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    const newContracts = (countAfter || 0) - (countBefore || 0);
    
    console.log('[Cron] DoD news scraping completed successfully');
    console.log(`[Cron] Total: ${totalArticles} articles, ${newContracts} new/updated contracts`);
    console.log(`[Cron] Last Gov Updated Date: ${lastGovUpdatedDate}`);
    
    // Send success email
    await sendCronSuccessEmail({
      jobName: 'DoD Contract News Scraper',
      success: true,
      date: formatDate(new Date()),
      duration: durationSeconds,
      stats: {
        dates_scraped: dates.join(', '),
        last_gov_updated_date: lastGovUpdatedDate,
        total_contracts_in_db: countAfter || 0,
        new_updated_contracts: newContracts,
        articles_found: totalArticles,
        contracts_inserted: totalContracts
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `DoD contract news scraped for ${dates.join(', ')}`,
      dates_checked: dates,
      stats: {
        total_articles: totalArticles,
        total_contracts: totalContracts,
        new_updated: newContracts,
        database_total: countAfter
      },
      duration_seconds: durationSeconds
    });
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    console.error('[Cron] DoD news scraping failed:', error);
    
    // Send failure email
    await sendCronFailureEmail({
      jobName: 'DoD Contract News Scraper',
      success: false,
      date: formatDate(new Date()),
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

