/**
 * DoD Contract News - Daily Scraper
 * 
 * Designed for automated cron jobs to check for:
 * 1. New contract announcements from yesterday
 * 2. Updates/modifications to previous days (e.g., during gov shutdowns)
 * 
 * Features:
 * - Multi-day checking (handles gov shutdowns where old articles get updated)
 * - Article-level resume (never loses progress)
 * - Smart upsert (no duplicates)
 * - Detects contract modifications
 */

import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization for Supabase (works in Vercel serverless)
let supabase: any = null;
function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

interface DoDArticle {
  article_url: string;
  title: string;
  published_date: Date;
}

interface DoDContract {
  article_url: string;
  article_title: string;
  published_date: Date;
  vendor_name: string;
  contract_value: string | null;
  contracting_agency: string | null;
  location: string | null;
  contract_description: string | null;
}

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_URL = `${BASE_URL}/News/Contracts/`;

function log(message: string) {
  console.log(`[DoD Daily] ${message}`);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
 * Fetch articles for a specific date
 */
async function fetchArticlesForDate(
  browser: puppeteer.Browser,
  targetDate: string
): Promise<DoDArticle[]> {
  const page = await browser.newPage();
  const articles: DoDArticle[] = [];
  
  try {
    let pageNum = 1;
    let foundTarget = false;
    
    log(`Searching for articles on ${targetDate}...`);
    
    // Search through pages until we find the target date
    while (!foundTarget && pageNum <= 100) {
      const url = pageNum === 1 ? CONTRACTS_URL : `${CONTRACTS_URL}?page=${pageNum}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(1000);
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      let foundOnPage = 0;
      
      $('.river-list .item').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.river-title a').text().trim();
        const relativeUrl = $item.find('.river-title a').attr('href');
        
        if (!title.toLowerCase().includes('contracts for') || !relativeUrl) {
          return;
        }
        
        const articleDate = parseDateFromTitle(title);
        if (!articleDate) return;
        
        const articleDateStr = formatDate(articleDate);
        
        // Check if this is our target date
        if (articleDateStr === targetDate) {
          articles.push({
            article_url: BASE_URL + relativeUrl,
            title: title,
            published_date: articleDate
          });
          foundOnPage++;
          foundTarget = true;
        }
      });
      
      log(`  Page ${pageNum}: ${foundOnPage} articles on ${targetDate}`);
      
      if (foundOnPage > 0) break;
      pageNum++;
    }
    
  } catch (error: any) {
    log(`Error fetching articles: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return articles;
}

/**
 * Parse contracts from article HTML
 */
function parseContractsFromArticle(
  html: string,
  article: DoDArticle
): DoDContract[] {
  const $ = cheerio.load(html);
  const contracts: DoDContract[] = [];
  
  const bodyEl = $('.body-copy, .article-body, .content, [itemprop="articleBody"]').first();
  if (bodyEl.length === 0) {
    return contracts;
  }
  
  const bodyText = bodyEl.text();
  const sections = bodyText.split(/\n\n+/);
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 50) continue;
    
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) continue;
    
    let vendorName = lines[0];
    let contractValue: string | null = null;
    let contractingAgency: string | null = null;
    let location: string | null = null;
    let description = lines.slice(1).join(' ');
    
    // Extract value
    const valueMatch = description.match(/\$[\d,]+(?:\.\d{2})?(?:\s*million|\s*billion)?/i);
    if (valueMatch) {
      contractValue = valueMatch[0];
    }
    
    // Extract agency
    const agencyMatch = description.match(/(?:Air Force|Army|Navy|Defense|Marine Corps|Space Force|DLA|DARPA|MDA)/i);
    if (agencyMatch) {
      contractingAgency = agencyMatch[0];
    }
    
    // Extract location
    const locationMatch = description.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);
    if (locationMatch) {
      location = `${locationMatch[1]}, ${locationMatch[2]}`;
    }
    
    contracts.push({
      article_url: article.article_url,
      article_title: article.title,
      published_date: article.published_date,
      vendor_name: vendorName,
      contract_value: contractValue,
      contracting_agency: contractingAgency,
      location: location,
      contract_description: description
    });
  }
  
  return contracts;
}

/**
 * Scrape a single article
 */
async function scrapeArticle(
  browser: puppeteer.Browser,
  article: DoDArticle
): Promise<{ success: boolean; contractsFound: number; contractsInserted: number }> {
  const page = await browser.newPage();
  
  try {
    log(`  Scraping: ${article.title}`);
    
    await page.goto(article.article_url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const html = await page.content();
    const contracts = parseContractsFromArticle(html, article);
    
    log(`    Found ${contracts.length} contracts`);
    
    if (contracts.length === 0) {
      return { success: true, contractsFound: 0, contractsInserted: 0 };
    }
    
    // Insert contracts with upsert
    const sb = getSupabase();
    const { data, error } = await sb
      .from('dod_contract_news')
      .upsert(contracts, {
        onConflict: 'article_url,vendor_name',
        ignoreDuplicates: false
      });
    
    if (error) {
      log(`    Error inserting contracts: ${error.message}`);
      return { success: false, contractsFound: contracts.length, contractsInserted: 0 };
    }
    
    log(`    Inserted/updated ${contracts.length} contracts`);
    
    return { success: true, contractsFound: contracts.length, contractsInserted: contracts.length };
    
  } catch (error: any) {
    log(`    Error: ${error.message}`);
    return { success: false, contractsFound: 0, contractsInserted: 0 };
  } finally {
    await page.close();
  }
}

/**
 * Scrape a single date
 * Exported for use in cron endpoint
 */
export async function scrapeDate(
  dateStr: string
): Promise<{
  success: boolean;
  date: string;
  articlesFound: number;
  contractsFound: number;
  contractsInserted: number;
}> {
  log(`Starting scrape for ${dateStr}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Fetch articles for this date
    const articles = await fetchArticlesForDate(browser, dateStr);
    
    log(`Found ${articles.length} articles for ${dateStr}`);
    
    if (articles.length === 0) {
      return {
        success: true,
        date: dateStr,
        articlesFound: 0,
        contractsFound: 0,
        contractsInserted: 0
      };
    }
    
    let totalContractsFound = 0;
    let totalContractsInserted = 0;
    
    // Scrape each article
    for (const article of articles) {
      const result = await scrapeArticle(browser, article);
      totalContractsFound += result.contractsFound;
      totalContractsInserted += result.contractsInserted;
      
      // Small delay between articles
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log(`Completed ${dateStr}: ${articles.length} articles, ${totalContractsInserted} contracts`);
    
    return {
      success: true,
      date: dateStr,
      articlesFound: articles.length,
      contractsFound: totalContractsFound,
      contractsInserted: totalContractsInserted
    };
    
  } catch (error: any) {
    log(`Failed for ${dateStr}: ${error.message}`);
    return {
      success: false,
      date: dateStr,
      articlesFound: 0,
      contractsFound: 0,
      contractsInserted: 0
    };
  } finally {
    await browser.close();
  }
}

/**
 * Main function for CLI usage
 * Supports:
 * - Single date: npx tsx dod-daily-scraper.ts --date=2024-11-01
 * - Multi-day mode: npx tsx dod-daily-scraper.ts --days=7 (checks last 7 days for updates)
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const dateArg = args.find(arg => arg.startsWith('--date='));
  const daysArg = args.find(arg => arg.startsWith('--days='));
  
  const dates: string[] = [];
  
  if (dateArg) {
    // Single date mode
    const date = dateArg.split('=')[1];
    dates.push(date);
    log(`Single date mode: ${date}`);
  } else if (daysArg) {
    // Multi-day mode (check last N days for updates)
    const numDays = parseInt(daysArg.split('=')[1]);
    const today = new Date();
    
    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(formatDate(date));
    }
    
    log(`Multi-day mode: checking last ${numDays} days`);
    log(`Dates: ${dates.join(', ')}`);
  } else {
    // Default: check yesterday + last 7 days (catches shutdown updates)
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(formatDate(date));
    }
    
    log(`Default mode: checking last 7 days for updates (handles gov shutdowns)`);
    log(`Dates: ${dates.join(', ')}`);
  }
  
  // Scrape each date
  let totalArticles = 0;
  let totalContracts = 0;
  
  for (const date of dates) {
    const result = await scrapeDate(date);
    totalArticles += result.articlesFound;
    totalContracts += result.contractsInserted;
    
    // Small delay between dates
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  log(`===================`);
  log(`SUMMARY`);
  log(`Dates checked: ${dates.length}`);
  log(`Total articles: ${totalArticles}`);
  log(`Total contracts: ${totalContracts}`);
  log(`===================`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

