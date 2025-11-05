#!/usr/bin/env tsx
/**
 * ManTech Historical Scraper - Standalone Script
 * 
 * Scrapes all available news articles from dodmantech.mil
 * 
 * Usage:
 *   npm run scrape:mantech:historical
 *   tsx src/scripts/mantech-historical-scraper.ts
 */

import { scrapeRecentNews, closeBrowser } from '../lib/mantech-scraper';

async function main() {
  console.log('='.repeat(60));
  console.log('DOD ManTech Historical Scraper');
  console.log('='.repeat(60));
  console.log('');
  console.log('This will scrape ALL available news articles from dodmantech.mil');
  console.log('Estimated time: 30-60 minutes');
  console.log('');
  
  try {
    // Scrape all available articles (historical backfill)
    const limit = 10000; // High limit to get everything (will stop when no more pages found)
    console.log(`Fetching all available news articles (limit: ${limit})...\n`);
    
    const startTime = Date.now();
    const result = await scrapeRecentNews(limit);
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('');
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`);
    console.log(`Articles Found: ${result.articlesFound}`);
    console.log(`Already Scraped: ${result.articlesSkipped}`);
    console.log(`New Projects Saved: ${result.projectsSaved}`);
    console.log(`Success Rate: ${(result.articlesFound - result.articlesSkipped) > 0 ? Math.round((result.projectsSaved / (result.articlesFound - result.articlesSkipped)) * 100) : 0}%`);
    console.log('');
    
    console.log('Historical scraping complete!');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await closeBrowser();
    process.exit(1);
  }
}

main();

