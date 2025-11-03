#!/usr/bin/env node
/**
 * ============================================
 * DoD Contract News - Production Scraper
 * ============================================
 * 
 * The ULTIMATE resilient scraper for DoD news!
 * 
 * Key Features:
 * - Processes ONE ARTICLE at a time
 * - Saves progress after EACH article
 * - Retries failed articles 20x with smart backoff
 * - Never loses progress (can resume from exact article)
 * - Smart upsert (no duplicate errors)
 * - Date range support
 * 
 * Usage:
 *   npx tsx scrape-dod-production.ts
 *   npx tsx scrape-dod-production.ts --start=2025-01-01 --end=2024-01-01
 *   npx tsx scrape-dod-production.ts --start=2025-11-01 --end=2025-10-01
 * 
 * ============================================
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';

// Validate environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure .env file exists with these variables.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// Types
// ============================================

interface ArticleInfo {
  id: number;
  url: string;
  title: string;
  publishedDate: Date;
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Progress Tracking
// ============================================

async function markArticleProcessing(articleId: number, url: string, publishedDate: string): Promise<void> {
  await supabase
    .from('dod_article_progress')
    .upsert({
      article_id: articleId,
      article_url: url,
      published_date: publishedDate,
      status: 'processing',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'article_id,article_url'
    });
}

async function markArticleComplete(
  articleId: number,
  url: string,
  publishedDate: string,
  contractsFound: number,
  contractsInserted: number
): Promise<void> {
  await supabase
    .from('dod_article_progress')
    .upsert({
      article_id: articleId,
      article_url: url,
      published_date: publishedDate,
      status: 'completed',
      contracts_found: contractsFound,
      contracts_inserted: contractsInserted,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'article_id,article_url'
    });
}

async function markArticleFailed(
  articleId: number,
  url: string,
  publishedDate: string,
  errorMsg: string,
  retryCount: number
): Promise<void> {
  await supabase
    .from('dod_article_progress')
    .upsert({
      article_id: articleId,
      article_url: url,
      published_date: publishedDate,
      status: 'failed',
      error_message: errorMsg.substring(0, 500),
      retry_count: retryCount,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'article_id,article_url'
    });
}

async function isArticleCompleted(articleId: number): Promise<boolean> {
  const { data } = await supabase
    .from('dod_article_progress')
    .select('status')
    .eq('article_id', articleId)
    .eq('status', 'completed')
    .single();
  
  return !!data;
}

// ============================================
// Article List Scraping
// ============================================

async function getArticleListPage(browser: Browser, pageNum: number = 1): Promise<ArticleInfo[]> {
  const listUrl = pageNum === 1 
    ? 'https://www.defense.gov/News/Contracts/'
    : `https://www.defense.gov/News/Contracts/?Page=${pageNum}`;
  
  console.log(`   🌐 Fetching article list page ${pageNum}...`);
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  
  try {
    await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const articles: ArticleInfo[] = [];
    
    // Find all links that contain "Contracts For" in the text
    $('a').each((_, el) => {
      const $el = $(el);
      const title = $el.text().trim();
      const href = $el.attr('href');
      
      // Only process links with "Contracts For" in title
      if (!title.includes('Contracts For') || !href) return;
      
      // Extract date from title like "Contracts For Sept. 30, 2025"
      const dateMatch = title.match(/Contracts For (.+)/);
      if (!dateMatch) return;
      
      const dateStr = dateMatch[1].trim();
      const publishedDate = new Date(dateStr);
      
      // Invalid date check
      if (isNaN(publishedDate.getTime())) {
        console.log(`   ⚠️  Could not parse date from: "${title}"`);
        return;
      }
      
      const fullUrl = href.startsWith('http') 
        ? href 
        : `https://www.defense.gov${href}`;
      
      // Extract article ID from URL: /News/Contracts/Contract/Article/4319114/
      const articleIdMatch = fullUrl.match(/\/Article\/(\d+)\//);
      if (!articleIdMatch) return;
      
      const articleId = parseInt(articleIdMatch[1]);
      
      articles.push({
        id: articleId,
        url: fullUrl,
        title,
        publishedDate
      });
    });
    
    console.log(`   Found ${articles.length} contract articles on this page`);
    
    return articles;
  } finally {
    await page.close();
  }
}

async function getArticlesForDateRange(browser: Browser, startDate: string, endDate: string, startPage: number = 1): Promise<ArticleInfo[]> {
  console.log(`\n📋 Collecting articles from ${startDate} to ${endDate}...`);
  console.log(`   Starting from page ${startPage}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allArticles: ArticleInfo[] = [];
  let pageNum = startPage;
  let foundOldEnough = false;
  
  while (!foundOldEnough && pageNum < 300) { // Safety limit (total ~281 pages)
    const articles = await getArticleListPage(browser, pageNum);
    
    if (articles.length === 0) {
      console.log(`   ℹ️  No more articles found`);
      break;
    }
    
    // Track dates on this page
    let pageNewestDate = '';
    let pageOldestDate = '';
    let addedThisPage = 0;
    
    for (const article of articles) {
      const articleDate = new Date(article.publishedDate);
      const dateStr = formatDate(articleDate);
      
      if (!pageNewestDate) pageNewestDate = dateStr;
      pageOldestDate = dateStr;
      
      // Check if article is in date range
      if (articleDate >= end && articleDate <= start) {
        allArticles.push(article);
        addedThisPage++;
      }
      
      // Check if we've gone past the end date
      if (articleDate < end) {
        foundOldEnough = true;
        break;
      }
    }
    
    const dateRangeStr = pageNewestDate === pageOldestDate 
      ? pageNewestDate 
      : `${pageNewestDate} to ${pageOldestDate}`;
    console.log(`   Page ${pageNum} (${dateRangeStr}): Found ${addedThisPage} articles, total ${allArticles.length} in range`);
    
    if (foundOldEnough) break;
    
    pageNum++;
    await delay(2000); // Rate limit between list pages
  }
  
  // Sort by date descending (newest first)
  allArticles.sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
  
  console.log(`\n✅ Found ${allArticles.length} articles in date range\n`);
  
  return allArticles;
}

// ============================================
// Article Scraping with Retry
// ============================================

async function scrapeArticle(browser: Browser, article: ArticleInfo): Promise<{ success: boolean; contractsFound: number }> {
  const maxAttempts = 20;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      const dateStr = formatDate(article.publishedDate);
      const prefix = `[${dateStr}:${article.id}]`;
      
      if (attempt > 1) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 60000); // Max 60s
        console.log(`${prefix} ⏳ Retry ${attempt}/${maxAttempts} after ${backoffMs}ms...`);
        await delay(backoffMs);
      }
      
      // Mark as processing
      await markArticleProcessing(article.id, article.url, dateStr);
      
      // Fetch article page
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      
      try {
        await page.goto(article.url, { waitUntil: 'networkidle2', timeout: 30000 });
        const html = await page.content();
        
        // Parse contracts (import the scraper logic)
        const { parseArticleAndSave } = await import('./src/lib/dod-news-scraper');
        const contractsFound = await parseArticleAndSave(html, article.id, article.url, article.title, article.publishedDate);
        
        await page.close();
        
        // Mark as complete
        await markArticleComplete(article.id, article.url, dateStr, contractsFound, contractsFound);
        
        if (attempt === 1) {
          console.log(`${prefix} ✅ ${contractsFound} contracts`);
        } else {
          console.log(`${prefix} ✅ ${contractsFound} contracts (succeeded on attempt ${attempt})`);
        }
        
        return { success: true, contractsFound };
        
      } finally {
        await page.close().catch(() => {});
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${article.id}] ❌ Attempt ${attempt} failed: ${errorMsg}`);
      
      if (attempt >= maxAttempts) {
        await markArticleFailed(article.id, article.url, formatDate(article.publishedDate), errorMsg, attempt);
        return { success: false, contractsFound: 0 };
      }
    }
  }
  
  return { success: false, contractsFound: 0 };
}

// ============================================
// Main Function
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const startArg = args.find(arg => arg.startsWith('--start='))?.split('=')[1];
  const endArg = args.find(arg => arg.startsWith('--end='))?.split('=')[1];
  const startPageArg = args.find(arg => arg.startsWith('--start-page='))?.split('=')[1];
  
  // Default to last 30 days if no dates specified
  const startDate = startArg || formatDate(new Date());
  const endDate = endArg || formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const startPage = startPageArg ? parseInt(startPageArg) : 1;
  
  console.log(`
╔════════════════════════════════════════════╗
║   DoD Contract News - Production Scraper  ║
╚════════════════════════════════════════════╝

📅 Date Range: ${startDate} → ${endDate}
📖 Starting Page: ${startPage}
📄 Granularity: ARTICLE-LEVEL (most resilient!)

⏱️  Process per article:
   1️⃣  Check if already completed
   2️⃣  Fetch article HTML
   3️⃣  Parse all contracts
   4️⃣  Smart upsert (no duplicates)
   5️⃣  Mark complete in progress tracker
   6️⃣  Move to next article

✨ Benefits:
   - Never loses progress
   - Retries failed articles up to 20x
   - Resumes from exact article on restart
   - Smart upsert prevents duplicates
   - Maximum data capture

💡 Tip: Use --start-page to skip already-scraped data
   Total pages available: ~281

Starting in 5 seconds...
`);

  await delay(5000);
  
  // Launch browser
  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Get all articles in date range
    const articles = await getArticlesForDateRange(browser, startDate, endDate, startPage);
    
    if (articles.length === 0) {
      console.log('ℹ️  No articles found in date range');
      return;
    }
    
    // Process each article
    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let totalContracts = 0;
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const progress = `[${i + 1}/${articles.length}]`;
      
      console.log(`\n${progress} Processing article ${article.id}...`);
      
      // Check if already completed
      if (await isArticleCompleted(article.id)) {
        console.log(`${progress} ⏭️  Already completed - skipping`);
        totalSkipped++;
        continue;
      }
      
      // Scrape article
      const result = await scrapeArticle(browser, article);
      
      if (result.success) {
        totalProcessed++;
        totalContracts += result.contractsFound;
      } else {
        totalFailed++;
        console.log(`${progress} ❌ Failed after ${20} attempts`);
      }
      
      // Rate limiting
      await delay(2000);
      
      // Show running totals every 10 articles
      if ((i + 1) % 10 === 0) {
        console.log(`
📊 Running Totals:
   Articles Processed: ${totalProcessed}
   Articles Skipped: ${totalSkipped}
   Articles Failed: ${totalFailed}
   Total Contracts: ${totalContracts}
`);
      }
    }
    
    console.log(`
╔════════════════════════════════════════════╗
║  🎉 SCRAPING COMPLETE!                    ║
╚════════════════════════════════════════════╝

📊 Final Statistics:
   Date Range: ${startDate} → ${endDate}
   Articles in Range: ${articles.length}
   Articles Processed: ${totalProcessed}
   Articles Skipped: ${totalSkipped}
   Articles Failed: ${totalFailed}
   Total Contracts: ${totalContracts}

Done! ✅
`);
    
  } finally {
    await browser.close();
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

