#!/usr/bin/env node
/**
 * GitHub Actions Runner: DOD Contract News Daily Scraper
 */

import 'dotenv/config';
import { getBrowser, closeBrowser, scrapeSingleArticle } from '../src/lib/dod-news-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_URL = `${BASE_URL}/News/Contracts/`;

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

async function main() {
  const startTime = Date.now();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const targetDateStr = yesterday.toISOString().split('T')[0];
  
  const { data: logEntry } = await supabase
    .from('dod_news_scraper_log')
    .insert({
      scrape_type: 'daily',
      date_range: targetDateStr,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting DOD contract news scraper...');
    console.log(`[GitHub Actions] Target date: ${targetDateStr}`);
    
    const { count: countBefore } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true });
    
    const browser = await getBrowser();
    const page = await browser.newPage();
    const articles: Array<{ url: string; title: string; publishedDate: Date }> = [];
    
    let pageNum = 1;
    let foundTarget = false;
    
    while (!foundTarget && pageNum <= 100) {
      const url = pageNum === 1 ? CONTRACTS_URL : `${CONTRACTS_URL}?page=${pageNum}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      $('.river-list .item').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.river-title a').text().trim();
        const relativeUrl = $item.find('.river-title a').attr('href');
        
        if (!title.toLowerCase().includes('contracts for') || !relativeUrl) return;
        
        const articleDate = parseDateFromTitle(title);
        if (!articleDate) return;
        
        const articleDateStr = articleDate.toISOString().split('T')[0];
        
        if (articleDateStr === targetDateStr) {
          articles.push({
            url: BASE_URL + relativeUrl,
            title: title,
            publishedDate: articleDate
          });
          foundTarget = true;
        }
      });
      
      if (!foundTarget) pageNum++;
    }
    
    await page.close();
    
    console.log(`[GitHub Actions] Found ${articles.length} article(s) for ${targetDateStr}`);
    
    let inserted = 0;
    let updated = 0;
    
    for (const article of articles) {
      try {
        const result = await scrapeSingleArticle(article.url);
        if (result) {
          console.log(`[GitHub Actions] Processed: ${article.title}`);
          inserted++;
        }
      } catch (error: any) {
        console.error(`[GitHub Actions] Error processing article: ${error.message}`);
      }
    }
    
    await closeBrowser();
    
    const { count: countAfter } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (logEntry) {
      await supabase
        .from('dod_news_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          records_found: articles.length,
          records_inserted: inserted,
          records_updated: updated
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'DOD Contract News Scraper',
      success: true,
      date: targetDateStr,
      duration,
      stats: {
        articles_found: articles.length,
        contracts_inserted: inserted,
        contracts_updated: updated,
        total_in_db: countAfter || 0
      }
    });
    
    console.log('[GitHub Actions] ✅ DOD news scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ DOD news scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('dod_news_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await closeBrowser();
    
    await sendCronFailureEmail({
      jobName: 'DOD Contract News Scraper',
      success: false,
      date: targetDateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

