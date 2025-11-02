#!/usr/bin/env node
/**
 * Test the production scraper with just a few known article URLs
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { parseArticleAndSave } from './src/lib/dod-news-scraper';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function markArticleComplete(articleId: number, url: string, publishedDate: string, contractsFound: number) {
  await supabase
    .from('dod_article_progress')
    .upsert({
      article_id: articleId,
      article_url: url,
      published_date: publishedDate,
      status: 'completed',
      contracts_found: contractsFound,
      contracts_inserted: contractsFound,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'article_id,article_url'
    });
}

async function testArticle(url: string, articleId: number, publishedDate: string) {
  console.log(`\n[${articleId}] Testing: ${url}`);
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    
    // Extract title
    const title = await page.$eval('h1', el => el.textContent?.trim() || 'Unknown');
    
    const contractsFound = await parseArticleAndSave(
      html,
      articleId,
      url,
      title,
      new Date(publishedDate)
    );
    
    await markArticleComplete(articleId, url, publishedDate, contractsFound);
    
    console.log(`[${articleId}] ✅ Saved ${contractsFound} contracts`);
    
  } catch (error) {
    console.error(`[${articleId}] ❌ Error:`, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║   DoD Production Scraper - Quick Test     ║
╚════════════════════════════════════════════╝

Testing with 3 known articles from September 2025...
`);

  // Test with 3 known articles
  const testArticles = [
    { url: 'https://www.defense.gov/News/Contracts/Contract/Article/4319114/', id: 4319114, date: '2025-09-30' },
    { url: 'https://www.defense.gov/News/Contracts/Contract/Article/4318564/', id: 4318564, date: '2025-09-27' },
    { url: 'https://www.defense.gov/News/Contracts/Contract/Article/4317985/', id: 4317985, date: '2025-09-26' }
  ];
  
  for (const article of testArticles) {
    await testArticle(article.url, article.id, article.date);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
  }
  
  console.log(`
╔════════════════════════════════════════════╗
║  ✅ TEST COMPLETE                          ║
╚════════════════════════════════════════════╝

Check results:
  SELECT * FROM dod_article_progress ORDER BY article_id DESC LIMIT 10;
  SELECT COUNT(*) FROM dod_contract_news WHERE article_id IN (4319114, 4318564, 4317985);
`);
}

main().catch(console.error);

