#!/usr/bin/env tsx
/**
 * ManTech News Scraper - Standalone Script
 * 
 * Usage:
 *   npm run scrape:mantech:news
 *   tsx src/scripts/mantech-news-scraper.ts
 */

import { scrapeRecentNews, closeBrowser } from '../lib/mantech-scraper';

async function main() {
  console.log('='.repeat(60));
  console.log('DOD ManTech News Scraper');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const limit = parseInt(process.argv[2]) || 20;
    console.log(`Fetching last ${limit} news articles from dodmantech.mil...\n`);
    
    const result = await scrapeRecentNews(limit);
    
    console.log('');
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Articles Found: ${result.articlesFound}`);
    console.log(`Already Scraped: ${result.articlesSkipped}`);
    console.log(`New Projects Saved: ${result.projectsSaved}`);
    console.log(`Success Rate: ${(result.articlesFound - result.articlesSkipped) > 0 ? Math.round((result.projectsSaved / (result.articlesFound - result.articlesSkipped)) * 100) : 0}%`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await closeBrowser();
    process.exit(1);
  }
}

main();

