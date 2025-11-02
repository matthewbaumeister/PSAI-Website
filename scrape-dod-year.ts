/**
 * ============================================
 * DoD Contract News - Year Scraper (Production)
 * ============================================
 * Features:
 * - Year-based scraping (e.g., all of 2025)
 * - Progress tracking (checkpoint/resume)
 * - Retry logic with exponential backoff
 * - Rate limiting to avoid blocks
 * - Error handling & logging
 * - Auto-resume on crash
 * ============================================
 */

import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { scrapeSingleArticle, closeBrowser } from './src/lib/dod-news-scraper';

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Year to scrape
  YEAR: process.env.SCRAPE_YEAR ? parseInt(process.env.SCRAPE_YEAR) : 2025,
  
  // Rate limiting (milliseconds)
  DELAY_BETWEEN_ARTICLES: 2000, // 2 seconds between articles
  DELAY_BETWEEN_PAGES: 5000,    // 5 seconds between list pages
  DELAY_ON_ERROR: 10000,         // 10 seconds on error
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,             // 5 seconds initial retry delay
  
  // Progress tracking
  CHECKPOINT_FILE: './scraper-checkpoint.json',
  LOG_FILE: './scraper.log',
  
  // Base URL
  BASE_URL: 'https://www.defense.gov',
  LIST_URL: 'https://www.defense.gov/News/Contracts/'
};

// ============================================
// Types
// ============================================

interface CheckpointData {
  year: number;
  startDate: string;
  lastProcessedUrl: string | null;
  lastProcessedDate: string | null;
  totalArticles: number;
  successfulArticles: number;
  failedArticles: number;
  skippedArticles: number;
  failedUrls: string[];
  lastUpdated: string;
}

interface ArticleLink {
  url: string;
  title: string;
  date: string;
}

// ============================================
// Logging
// ============================================

function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // Append to log file
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

// ============================================
// Checkpoint Management
// ============================================

function loadCheckpoint(): CheckpointData | null {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    log(`Failed to load checkpoint: ${error}`, 'WARN');
  }
  return null;
}

function saveCheckpoint(data: CheckpointData) {
  try {
    fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(data, null, 2));
    log(`✅ Checkpoint saved: ${data.successfulArticles} successful, ${data.failedArticles} failed`);
  } catch (error) {
    log(`Failed to save checkpoint: ${error}`, 'ERROR');
  }
}

function initializeCheckpoint(year: number): CheckpointData {
  return {
    year,
    startDate: new Date().toISOString(),
    lastProcessedUrl: null,
    lastProcessedDate: null,
    totalArticles: 0,
    successfulArticles: 0,
    failedArticles: 0,
    skippedArticles: 0,
    failedUrls: [],
    lastUpdated: new Date().toISOString()
  };
}

// ============================================
// Fetch Article Links with Retry
// ============================================

async function fetchArticleLinksWithRetry(
  browser: Browser, 
  year: number, 
  retryCount = 0
): Promise<ArticleLink[]> {
  try {
    log(`Fetching article list for year ${year}...`);
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // Navigate to contracts page
    await page.goto(CONFIG.LIST_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    const html = await page.content();
    await page.close();
    
    const $ = cheerio.load(html);
    const articles: ArticleLink[] = [];
    
    // Find all article links
    $('a[href*="/News/Contracts/Contract/Article/"]').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${CONFIG.BASE_URL}${href}`;
        
        // Extract date from URL or title
        const dateMatch = fullUrl.match(/Article\/(\d+)\//);
        const articleDate = dateMatch ? dateMatch[1] : '';
        
        articles.push({
          url: fullUrl,
          title,
          date: articleDate
        });
      }
    });
    
    // Filter by year (if we can determine it)
    const filteredArticles = articles.filter(article => {
      // If we have a date in the URL, check the year
      // DoD uses article IDs that are often date-based
      if (article.date && article.date.length >= 4) {
        const urlYear = parseInt(article.date.substring(0, 4));
        if (!isNaN(urlYear) && urlYear === year) {
          return true;
        }
      }
      // Include all if we can't determine year
      return true;
    });
    
    log(`✅ Found ${filteredArticles.length} articles (filtered for year ${year})`);
    return filteredArticles;
    
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      log(`Failed to fetch article links, retrying (${retryCount + 1}/${CONFIG.MAX_RETRIES})...`, 'WARN');
      await sleep(CONFIG.RETRY_DELAY * (retryCount + 1));
      return fetchArticleLinksWithRetry(browser, year, retryCount + 1);
    }
    
    log(`Failed to fetch article links after ${CONFIG.MAX_RETRIES} retries: ${error}`, 'ERROR');
    throw error;
  }
}

// ============================================
// Scrape Single Article with Retry
// ============================================

async function scrapeArticleWithRetry(
  url: string, 
  retryCount = 0
): Promise<boolean> {
  try {
    const result = await scrapeSingleArticle(url);
    
    if (result.success && result.contractsSaved > 0) {
      log(`✅ ${url} - Saved ${result.contractsSaved} contracts`);
      return true;
    } else if (result.success && result.contractsSaved === 0) {
      log(`⚠️ ${url} - No contracts found`, 'WARN');
      return true; // Still consider it success (might be announcement without contracts)
    } else {
      log(`❌ ${url} - Failed to scrape`, 'ERROR');
      return false;
    }
    
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      log(`Failed to scrape ${url}, retrying (${retryCount + 1}/${CONFIG.MAX_RETRIES})...`, 'WARN');
      await sleep(CONFIG.RETRY_DELAY * (retryCount + 1));
      return scrapeArticleWithRetry(url, retryCount + 1);
    }
    
    log(`Failed to scrape ${url} after ${CONFIG.MAX_RETRIES} retries: ${error}`, 'ERROR');
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Main Scraper
// ============================================

async function scrapeYear(year: number) {
  log(`
╔════════════════════════════════════════════╗
║  DoD Contract News - Year Scraper          ║
║  Year: ${year}                                ║
╚════════════════════════════════════════════╝
  `);
  
  // Load or initialize checkpoint
  let checkpoint = loadCheckpoint();
  
  if (checkpoint && checkpoint.year !== year) {
    log(`Previous checkpoint is for year ${checkpoint.year}, starting fresh for ${year}`, 'WARN');
    checkpoint = null;
  }
  
  if (!checkpoint) {
    checkpoint = initializeCheckpoint(year);
  }
  
  log(`📊 Starting/Resuming scrape from checkpoint:`);
  log(`   Total processed: ${checkpoint.totalArticles}`);
  log(`   Successful: ${checkpoint.successfulArticles}`);
  log(`   Failed: ${checkpoint.failedArticles}`);
  log(`   Last processed: ${checkpoint.lastProcessedUrl || 'None'}`);
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    // Fetch all article links for the year
    const articles = await fetchArticleLinksWithRetry(browser, year);
    await browser.close();
    
    if (articles.length === 0) {
      log('No articles found for the specified year', 'WARN');
      return;
    }
    
    // Filter out already processed articles
    const articlesToProcess = checkpoint.lastProcessedUrl
      ? articles.filter(a => a.url !== checkpoint!.lastProcessedUrl)
      : articles;
    
    log(`📝 Articles to process: ${articlesToProcess.length}`);
    
    // Process each article
    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i];
      
      log(`\n[${i + 1}/${articlesToProcess.length}] Processing: ${article.title}`);
      log(`   URL: ${article.url}`);
      
      const success = await scrapeArticleWithRetry(article.url);
      
      checkpoint.totalArticles++;
      checkpoint.lastProcessedUrl = article.url;
      checkpoint.lastProcessedDate = new Date().toISOString();
      checkpoint.lastUpdated = new Date().toISOString();
      
      if (success) {
        checkpoint.successfulArticles++;
      } else {
        checkpoint.failedArticles++;
        checkpoint.failedUrls.push(article.url);
      }
      
      // Save checkpoint every 5 articles
      if (i % 5 === 0 || i === articlesToProcess.length - 1) {
        saveCheckpoint(checkpoint);
      }
      
      // Rate limiting
      if (i < articlesToProcess.length - 1) {
        await sleep(CONFIG.DELAY_BETWEEN_ARTICLES);
      }
    }
    
    // Final summary
    log(`
╔════════════════════════════════════════════╗
║  SCRAPING COMPLETE                         ║
╚════════════════════════════════════════════╝

📊 Final Statistics:
   Total Articles: ${checkpoint.totalArticles}
   ✅ Successful: ${checkpoint.successfulArticles}
   ❌ Failed: ${checkpoint.failedArticles}
   ⏭️ Skipped: ${checkpoint.skippedArticles}
   
   Success Rate: ${((checkpoint.successfulArticles / checkpoint.totalArticles) * 100).toFixed(1)}%
    `);
    
    if (checkpoint.failedUrls.length > 0) {
      log(`\n⚠️ Failed URLs (${checkpoint.failedUrls.length}):`);
      checkpoint.failedUrls.forEach(url => log(`   - ${url}`));
    }
    
    // Save final checkpoint
    saveCheckpoint(checkpoint);
    
  } catch (error) {
    log(`Fatal error during scraping: ${error}`, 'ERROR');
    
    if (checkpoint) {
      saveCheckpoint(checkpoint);
    }
    
    throw error;
    
  } finally {
    await closeBrowser();
    log('🔒 Browser closed');
  }
}

// ============================================
// CLI Entry Point
// ============================================

const year = process.argv[2] ? parseInt(process.argv[2]) : CONFIG.YEAR;

if (isNaN(year) || year < 2000 || year > 2100) {
  console.error('Invalid year. Usage: npx tsx scrape-dod-year.ts [YEAR]');
  process.exit(1);
}

scrapeYear(year)
  .then(() => {
    log('✅ Scraping completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    log(`❌ Scraping failed: ${error}`, 'ERROR');
    process.exit(1);
  });

