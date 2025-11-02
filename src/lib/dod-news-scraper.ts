/**
 * ============================================
 * DoD Contract News Scraper
 * ============================================
 * Scrapes daily DoD contract award announcements from defense.gov
 * Uses Puppeteer to bypass 403 blocks + Cheerio for HTML parsing
 * ============================================
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Browser Management
// ============================================

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ============================================
// Fetch Article HTML with Puppeteer
// ============================================

export async function fetchArticleHTML(url: string): Promise<string | null> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set realistic browser settings
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to article
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    if (response?.status() !== 200) {
      console.error(`[DoD] Failed to fetch ${url}: ${response?.status()}`);
      return null;
    }

    // Get HTML content
    const html = await page.content();
    return html;
    
  } catch (error) {
    console.error(`[DoD] Error fetching article:`, error);
    return null;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// ============================================
// Parse Article HTML
// ============================================

export interface ParsedArticle {
  articleId: number;
  articleUrl: string;
  articleTitle: string;
  publishedDate: Date;
  contractParagraphs: string[];
  rawHTML: string;
}

export function parseArticleHTML(html: string, url: string): ParsedArticle | null {
  try {
    const $ = cheerio.load(html);
    
    // Extract article ID from URL
    // Example: https://www.defense.gov/News/Releases/Release/Article/3981590/
    const articleIdMatch = url.match(/Article\/(\d+)/);
    const articleId = articleIdMatch ? parseInt(articleIdMatch[1]) : 0;
    
    // Extract title
    const articleTitle = $('h1.maintitle, h1, title').first().text().trim() || 'Unknown Title';
    
    // Extract published date
    let publishedDate = new Date();
    const dateText = $('.published-date, .date, time').first().text().trim();
    if (dateText) {
      publishedDate = new Date(dateText);
    }
    
    // Extract contract paragraphs
    // DoD contract announcements are in paragraph format
    const contractParagraphs: string[] = [];
    
    // Find all paragraphs in the article body
    // Try multiple selectors to find the content div
    let paragraphs = $('.body p, .article-body p, .content p, .inside p, .ntext p');
    
    paragraphs.each((i, elem) => {
      const text = $(elem).text().trim();
      
      // Skip headers and very short paragraphs
      if (text.length < 100) {
        return;
      }
      
      // Skip section headers (like "NAVY", "AIR FORCE", etc.)
      if (text.length < 50 && /^[A-Z\s]+$/.test(text)) {
        return;
      }
      
      // Filter paragraphs that look like contract announcements
      // They typically contain:
      // 1. Company name with location (e.g., "Boeing, Chicago, Illinois")
      // 2. Dollar amounts ($X or X million/billion)
      // 3. Contract-related keywords
      const hasCompanyLocation = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z][a-z]+/.test(text); // "Company Name, City, State"
      const hasDollarAmount = /\$[\d,]+|million|billion/.test(text);
      const hasContractKeywords = /\b(contract|awarded|being awarded|modification|procurement|delivery)\b/i.test(text);
      const hasContractNumber = /[A-Z]\d{5}[A-Z0-9-]+/.test(text); // Typical DoD contract number pattern
      
      // A paragraph is likely a contract if it has at least 3 of these indicators
      const indicators = [hasCompanyLocation, hasDollarAmount, hasContractKeywords, hasContractNumber];
      const indicatorCount = indicators.filter(Boolean).length;
      
      if (indicatorCount >= 3) {
        contractParagraphs.push(text);
      }
    });
    
    return {
      articleId,
      articleUrl: url,
      articleTitle,
      publishedDate,
      contractParagraphs,
      rawHTML: html
    };
    
  } catch (error) {
    console.error('[DoD] Error parsing article HTML:', error);
    return null;
  }
}

// ============================================
// Detect & Split Multiple Award Contracts
// ============================================

function splitMultipleAwardContract(paragraph: string): string[] {
  // Pattern: "Company1, City, State (Contract#); Company2, City, State (Contract#); ..."
  // This indicates a multiple award contract that should be split
  
  const multipleAwardPattern = /([^;]+?),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+)\s+\(([A-Z0-9-]+)\);/g;
  const matches = [...paragraph.matchAll(multipleAwardPattern)];
  
  if (matches.length >= 2) {
    // This is a multiple award contract - split it
    console.log(`[DoD] Detected multiple award contract with ${matches.length} vendors`);
    
    // Find the shared description (everything after the last semicolon and vendor list)
    const lastVendorEnd = matches[matches.length - 1].index! + matches[matches.length - 1][0].length;
    const sharedDescription = paragraph.substring(lastVendorEnd).trim();
    
    // Create individual paragraphs for each vendor
    return matches.map(match => {
      const [fullMatch, company, city, state, contractNum] = match;
      return `${company}, ${city}, ${state} (${contractNum}), ${sharedDescription}`;
    });
  }
  
  // Not a multiple award contract, return as-is
  return [paragraph];
}

// ============================================
// Extract Contract Data from Paragraph
// ============================================

export interface ExtractedContract {
  vendorName: string;
  vendorLocation?: string;
  vendorCity?: string;
  vendorState?: string;
  contractNumber?: string;
  awardAmount?: number;
  awardAmountText?: string;
  contractDescription: string;
  performanceLocations?: string[];
  completionDate?: Date;
  contractingActivity?: string;
  serviceBranch?: string;
  isSmallBusiness: boolean;
  rawParagraph: string;
  parsingConfidence: number;
}

export function extractContractData(paragraph: string): ExtractedContract | null {
  try {
    // Extract vendor name (usually at the start, before a comma)
    const vendorNameMatch = paragraph.match(/^([^,]+?(?:Inc\.|LLC|Corp\.|Corporation|Co\.|Company)?)/);
    const vendorName = vendorNameMatch ? vendorNameMatch[1].trim() : 'Unknown Vendor';
    
    // Extract vendor location (City, ST pattern)
    const vendorLocationMatch = paragraph.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z]{2})/);
    const vendorCity = vendorLocationMatch ? vendorLocationMatch[1] : undefined;
    const vendorState = vendorLocationMatch ? vendorLocationMatch[2] : undefined;
    const vendorLocation = vendorLocationMatch ? vendorLocationMatch[0] : undefined;
    
    // Extract award amount
    let awardAmount: number | undefined;
    let awardAmountText: string | undefined;
    
    // Pattern: $XX.X million/billion or $XXX,XXX,XXX
    const amountPatterns = [
      /\$(\d+(?:\.\d+)?)\s*(million|billion)/i,
      /\$(\d{1,3}(?:,\d{3})+)/
    ];
    
    for (const pattern of amountPatterns) {
      const match = paragraph.match(pattern);
      if (match) {
        awardAmountText = match[0];
        if (match[2] === 'billion') {
          awardAmount = parseFloat(match[1]) * 1_000_000_000;
        } else if (match[2] === 'million') {
          awardAmount = parseFloat(match[1]) * 1_000_000;
        } else {
          awardAmount = parseFloat(match[1].replace(/,/g, ''));
        }
        break;
      }
    }
    
    // Extract contract number (various formats)
    // DoD contract numbers typically: N00024-25-D-0150, W912PL-24-C-0001, etc.
    // Format: Letters + Numbers + Dashes (minimum 10 characters)
    const contractNumberPatterns = [
      /\(([A-Z]\d{5}[A-Z0-9-]{4,})\)/,  // In parentheses: (N00024-25-D-0150)
      /contract\s+(?:number\s+)?([A-Z]\d{5}[A-Z0-9-]{4,})\b/i,  // After "contract"
      /\b([A-Z]\d{5}[A-Z0-9-]{4,})\b/  // Standalone pattern
    ];
    
    let contractNumber: string | undefined;
    for (const pattern of contractNumberPatterns) {
      const match = paragraph.match(pattern);
      if (match && match[1].length >= 10) {
        contractNumber = match[1];
        break;
      }
    }
    
    // Extract contracting activity
    const contractingActivityMatch = paragraph.match(/(?:contracting activity is|awarded by)\s+([^.]+)/i);
    const contractingActivity = contractingActivityMatch ? contractingActivityMatch[1].trim() : undefined;
    
    // Extract service branch
    let serviceBranch: string | undefined;
    if (paragraph.includes('Army')) serviceBranch = 'Army';
    else if (paragraph.includes('Navy')) serviceBranch = 'Navy';
    else if (paragraph.includes('Air Force')) serviceBranch = 'Air Force';
    else if (paragraph.includes('Marine Corps')) serviceBranch = 'Marine Corps';
    else if (paragraph.includes('Space Force')) serviceBranch = 'Space Force';
    
    // Extract completion date
    let completionDate: Date | undefined;
    const completionMatch = paragraph.match(/(?:expected to be completed|completion date|work is expected)\s+(?:by\s+)?([A-Z][a-z]+\s+\d{4})/i);
    if (completionMatch) {
      completionDate = new Date(completionMatch[1]);
    }
    
    // Check if small business
    const isSmallBusiness = /small business/i.test(paragraph);
    
    // Calculate parsing confidence (0.0 - 1.0)
    let confidence = 0.5; // Base confidence
    if (vendorName !== 'Unknown Vendor') confidence += 0.1;
    if (vendorLocation) confidence += 0.1;
    if (awardAmount) confidence += 0.15;
    if (contractNumber) confidence += 0.1;
    if (contractingActivity) confidence += 0.05;
    
    return {
      vendorName,
      vendorLocation,
      vendorCity,
      vendorState,
      contractNumber,
      awardAmount,
      awardAmountText,
      contractDescription: paragraph,
      completionDate,
      contractingActivity,
      serviceBranch,
      isSmallBusiness,
      rawParagraph: paragraph,
      parsingConfidence: Math.min(confidence, 1.0)
    };
    
  } catch (error) {
    console.error('[DoD] Error extracting contract data:', error);
    return null;
  }
}

// ============================================
// Save to Database
// ============================================

export async function saveContractToDatabase(
  contract: ExtractedContract,
  articleId: number,
  articleUrl: string,
  articleTitle: string,
  publishedDate: Date
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dod_contract_news')
      .insert({
        article_id: articleId,
        article_url: articleUrl,
        article_title: articleTitle,
        published_date: publishedDate.toISOString().split('T')[0],
        
        vendor_name: contract.vendorName,
        vendor_location: contract.vendorLocation,
        vendor_city: contract.vendorCity,
        vendor_state: contract.vendorState,
        
        contract_number: contract.contractNumber,
        award_amount: contract.awardAmount,
        award_amount_text: contract.awardAmountText,
        
        contract_description: contract.contractDescription,
        work_description: contract.contractDescription, // Can be refined later
        
        completion_date: contract.completionDate?.toISOString().split('T')[0],
        
        contracting_activity: contract.contractingActivity,
        service_branch: contract.serviceBranch,
        
        is_small_business: contract.isSmallBusiness,
        
        raw_paragraph: contract.rawParagraph,
        
        parsing_confidence: contract.parsingConfidence,
        data_quality_score: Math.round(contract.parsingConfidence * 100),
        
        scraped_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('[DoD] Error saving contract:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('[DoD] Exception saving contract:', error);
    return false;
  }
}

// ============================================
// Scrape Single Article
// ============================================

export async function scrapeSingleArticle(url: string): Promise<{
  success: boolean;
  contractsFound: number;
  contractsSaved: number;
}> {
  console.log(`[DoD] Scraping article: ${url}`);
  
  try {
    // Fetch HTML
    const html = await fetchArticleHTML(url);
    if (!html) {
      return { success: false, contractsFound: 0, contractsSaved: 0 };
    }
    
    // Parse HTML
    const parsed = parseArticleHTML(html, url);
    if (!parsed) {
      return { success: false, contractsFound: 0, contractsSaved: 0 };
    }
    
    console.log(`[DoD] Found ${parsed.contractParagraphs.length} contract paragraphs`);
    
    let saved = 0;
    let totalContracts = 0;
    let sequenceNum = 1; // For fallback contract numbering
    
    // Extract and save each contract
    for (const paragraph of parsed.contractParagraphs) {
      // Check if this is a multiple award contract and split if needed
      const individualParagraphs = splitMultipleAwardContract(paragraph);
      totalContracts += individualParagraphs.length;
      
      for (const individualParagraph of individualParagraphs) {
        const contract = extractContractData(individualParagraph);
        if (contract) {
          // If no contract number found, use fallback: ARTICLE_ID-SEQ-###
          if (!contract.contractNumber || contract.contractNumber.length < 10) {
            contract.contractNumber = `${parsed.articleId}-SEQ-${String(sequenceNum).padStart(3, '0')}`;
          }
          sequenceNum++;
          
          const success = await saveContractToDatabase(
            contract,
            parsed.articleId,
            parsed.articleUrl,
            parsed.articleTitle,
            parsed.publishedDate
          );
          
          if (success) {
            saved++;
            console.log(`[DoD]   ✅ ${contract.vendorName} - ${contract.awardAmountText || 'Unknown amount'}`);
          }
        }
      }
    }
    
    return {
      success: true,
      contractsFound: totalContracts,
      contractsSaved: saved
    };
    
  } catch (error) {
    console.error('[DoD] Error scraping article:', error);
    return { success: false, contractsFound: 0, contractsSaved: 0 };
  }
}

// ============================================
// Find Contract News Articles
// ============================================

export async function findContractNewsArticles(startDate: Date, endDate: Date): Promise<string[]> {
  console.log(`[DoD] Finding articles from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  const articles: string[] = [];
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to contracts index page
    const indexUrl = 'https://www.defense.gov/News/Contracts/';
    console.log(`[DoD] Loading contracts index: ${indexUrl}`);
    await page.goto(indexUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Find all article links with "Contracts" in title
    // These are typically in <a> tags with href and contain date patterns
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      // Look for "Contracts" or "Contract" in the link text
      if ((text.includes('Contract') || href?.includes('contract')) && href) {
        let fullUrl = href;
        
        // Make absolute URL
        if (!href.startsWith('http')) {
          fullUrl = `https://www.defense.gov${href}`;
        }
        
        // Avoid duplicates and non-article links
        if (!articles.includes(fullUrl) && fullUrl.includes('/Article/')) {
          articles.push(fullUrl);
        }
      }
    });
    
    await page.close();
    
    console.log(`[DoD] Found ${articles.length} contract news articles`);
    return articles;
    
  } catch (error) {
    console.error('[DoD] Error finding articles:', error);
    return [];
  }
}

