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
  contractParagraphs: Array<{ text: string; serviceBranch?: string }>;
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
    const contractParagraphs: Array<{ text: string; serviceBranch?: string }> = [];
    let currentServiceBranch: string | undefined = undefined;
    
    // Find all paragraphs in the article body
    // Try multiple selectors to find the content div
    let paragraphs = $('.body p, .article-body p, .content p, .inside p, .ntext p');
    
    paragraphs.each((i, elem) => {
      const text = $(elem).text().trim();
      
      // Check for service branch headers FIRST (before skipping short paragraphs)
      // Headers are short, all caps, and match known branch names
      const serviceBranchPattern = /^(NAVY|AIR FORCE|ARMY|MARINE CORPS|SPACE FORCE|DEFENSE LOGISTICS AGENCY|DEFENSE ADVANCED RESEARCH PROJECTS AGENCY)$/i;
      const branchMatch = text.match(serviceBranchPattern);
      
      if (branchMatch) {
        currentServiceBranch = branchMatch[1];
        console.log(`[DoD] Found service branch header: ${currentServiceBranch}`);
        return;
      }
      
      // Skip very short paragraphs (after checking for service branch)
      if (text.length < 100) {
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
        contractParagraphs.push({
          text,
          serviceBranch: currentServiceBranch
        });
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
// Enhanced Extraction Helper Functions
// ============================================

// Extract Contract Types
function extractContractTypes(text: string): {
  types: string[];
  isIDIQ: boolean;
  isMultipleAward: boolean;
  isHybridContract: boolean;
} {
  const types: string[] = [];
  let isIDIQ = false;
  let isMultipleAward = false;
  let isHybridContract = false;
  
  // Contract type patterns
  const typePatterns: Record<string, RegExp> = {
    'firm-fixed-price': /\bfirm-fixed-price\b/i,
    'cost-plus-fixed-fee': /\bcost-plus-fixed-fee\b/i,
    'cost-plus-incentive-fee': /\bcost-plus-incentive-fee\b/i,
    'fixed-price-incentive-fee': /\bfixed-price-incentive-fee\b/i,
    'cost-reimbursable': /\bcost-reimbursable\b/i,
    'cost-only': /\bcost-only\b/i,
    'time-and-materials': /\btime-and-materials\b/i,
  };
  
  // Check for each type
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(text)) {
      types.push(type);
    }
  }
  
  // Check for IDIQ
  if (/indefinite-delivery\/indefinite-quantity|IDIQ/i.test(text)) {
    types.push('IDIQ');
    isIDIQ = true;
  }
  
  // Check for multiple award
  if (/multiple award/i.test(text)) {
    isMultipleAward = true;
  }
  
  // Check if hybrid
  if (/hybrid/i.test(text) || types.length > 2) {
    isHybridContract = true;
  }
  
  return { types, isIDIQ, isMultipleAward, isHybridContract };
}

// Extract Options & Cumulative Value
function extractOptionsInfo(text: string, baseAmount?: number): {
  hasOptions: boolean;
  optionsValue: number | null;
  cumulativeValue: number | null;
  optionsPeriodEndDate: Date | null;
} {
  let hasOptions = false;
  let optionsValue: number | null = null;
  let cumulativeValue: number | null = null;
  let optionsPeriodEndDate: Date | null = null;
  
  // Check for options
  if (/includes options|optional line items|if exercised/i.test(text)) {
    hasOptions = true;
  }
  
  // Extract cumulative value
  const cumulativePattern = /(?:cumulative value|increase.*?to|total value).*?\$(\d+(?:,\d{3})*(?:\.\d+)?)/i;
  const cumulativeMatch = text.match(cumulativePattern);
  if (cumulativeMatch) {
    cumulativeValue = parseFloat(cumulativeMatch[1].replace(/,/g, ''));
    if (baseAmount && cumulativeValue) {
      optionsValue = cumulativeValue - baseAmount;
    }
  }
  
  // Extract options period end date
  const optionsDatePattern = /options are exercised.*?(?:through|until)\s+(\w+\s+\d{4})/i;
  const optionsDateMatch = text.match(optionsDatePattern);
  if (optionsDateMatch) {
    optionsPeriodEndDate = new Date(optionsDateMatch[1]);
  }
  
  return { hasOptions, optionsValue, cumulativeValue, optionsPeriodEndDate };
}

// Extract Performance Locations with Percentages
function extractPerformanceLocations(text: string): {
  locations: string[];
  cities: string[];
  states: string[];
  breakdown: Array<{location: string; city: string; state: string; percentage: number}>;
} {
  const locations: string[] = [];
  const cities: string[] = [];
  const states: string[] = [];
  const breakdown: Array<{location: string; city: string; state: string; percentage: number}> = [];
  
  const workLocationPattern = /Work will be performed in ([^.]+?)(?:,\s*and is expected|\.|;and)/i;
  const workMatch = text.match(workLocationPattern);
  
  if (workMatch) {
    const locationText = workMatch[1];
    
    // Match each location with percentage: "Norfolk, Virginia (35%)"
    const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d+(?:\.\d+)?)%\)/g;
    let match;
    
    while ((match = locationRegex.exec(locationText)) !== null) {
      const city = match[1].trim();
      const state = match[2].trim();
      const percentage = parseFloat(match[3]);
      const location = `${city}, ${state}`;
      
      locations.push(location);
      cities.push(city);
      states.push(state);
      breakdown.push({ location, city, state, percentage });
    }
  }
  
  return { locations, cities, states, breakdown };
}

// Extract Funding Sources
function extractFundingSources(text: string): {
  sources: Array<{fiscal_year: number; type: string; amount: number; percentage: number}>;
  totalObligated: number;
  fundsExpire: boolean;
} {
  const sources: Array<{fiscal_year: number; type: string; amount: number; percentage: number}> = [];
  let totalObligated = 0;
  let fundsExpire = true;
  
  const fundingPattern = /Fiscal\s+(\d{4})\s+([^)]+)\)\s+funds\s+in\s+the\s+amount\s+of\s+\$(\d+(?:,\d{3})*)\s*(?:\((\d+)%\))?/gi;
  let match;
  
  while ((match = fundingPattern.exec(text)) !== null) {
    const fiscal_year = parseInt(match[1]);
    const type = match[2].trim();
    const amount = parseFloat(match[3].replace(/,/g, ''));
    const percentage = match[4] ? parseInt(match[4]) : 0;
    
    sources.push({ fiscal_year, type, amount, percentage });
    totalObligated += amount;
  }
  
  if (/will not expire at the end of the current fiscal year/i.test(text)) {
    fundsExpire = false;
  }
  
  return { sources, totalObligated, fundsExpire };
}

// Extract Foreign Military Sales Info
function extractFMSInfo(text: string): {
  isFMS: boolean;
  countries: string[];
  amount: number | null;
  percentage: number | null;
} {
  let isFMS = false;
  const countries: string[] = [];
  let amount: number | null = null;
  let percentage: number | null = null;
  
  if (/Foreign Military Sale|FMS/i.test(text)) {
    isFMS = true;
    
    // Extract countries - IMPROVED with validation
    // Pattern 1: "Foreign Military Sales to [country/countries]"
    const fmsToPattern = /Foreign Military Sales?\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*(?:and\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/i;
    let countryMatch = text.match(fmsToPattern);
    
    if (countryMatch) {
      const countryList = countryMatch[1]
        .split(/,\s*(?:and\s+)?|and\s+/)
        .map(c => c.trim())
        .filter(c => {
          // Filter out invalid entries
          if (c.length < 3) return false;  // Too short
          if (c.match(/will be|completed?|expect|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|fund/i)) return false;  // Sentence fragments
          if (/\d/.test(c)) return false;  // Contains numbers
          if (c.match(/^(the|and|or|be|by|in|at|on|for|with|to)$/i)) return false;  // Common words
          return true;
        });
      
      countries.push(...countryList);
    }
    
    // Pattern 2: "for [country]" (when single country)
    if (countries.length === 0) {
      const forCountryPattern = /\bfor\s+(the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Foreign Military Sales|FMS)/i;
      countryMatch = text.match(forCountryPattern);
      if (countryMatch && countryMatch[2]) {
        const country = countryMatch[2].trim();
        if (country.length > 2 && !/\d/.test(country)) {
          countries.push(country);
        }
      }
    }
    
    // Extract FMS funding
    const fmsAmountPattern = /funding from foreign partners.*?\$(\d+(?:,\d{3})*)\s*\((\d+)%\)/i;
    const fmsMatch = text.match(fmsAmountPattern);
    if (fmsMatch) {
      amount = parseFloat(fmsMatch[1].replace(/,/g, ''));
      percentage = parseInt(fmsMatch[2]);
    }
  }
  
  return { 
    isFMS, 
    countries: countries.length > 0 ? countries : [], 
    amount, 
    percentage 
  };
}

// Extract Competition Info
function extractCompetitionInfo(text: string): {
  isCompeted: boolean | null;
  competitionType: string | null;
  numberOfOffers: number | null;
  nonCompeteAuthority: string | null;
  nonCompeteJustification: string | null;
} {
  let isCompeted: boolean | null = null;
  let competitionType: string | null = null;
  let numberOfOffers: number | null = null;
  let nonCompeteAuthority: string | null = null;
  let nonCompeteJustification: string | null = null;
  
  if (/contract was not competed|not competitively procured|sole-source|sole source/i.test(text)) {
    isCompeted = false;
    competitionType = 'sole source';
    
    const authorityPattern = /authority of\s+([^,\.]+)/i;
    const authorityMatch = text.match(authorityPattern);
    if (authorityMatch) {
      nonCompeteAuthority = authorityMatch[1].trim();
    }
    
    const justPattern = /as implemented by\s+([^,\.]+)/i;
    const justMatch = text.match(justPattern);
    if (justMatch) {
      nonCompeteJustification = justMatch[1].trim();
    }
  } else if (/full and open/i.test(text)) {
    isCompeted = true;
    competitionType = 'full and open';
  }
  
  // Extract number of offers
  const offersPattern = /(\w+)\s+offers?\s+received/i;
  const offersMatch = text.match(offersPattern);
  if (offersMatch) {
    const numberWord = offersMatch[1].toLowerCase();
    const numberMap: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5
    };
    numberOfOffers = numberMap[numberWord] || parseInt(numberWord) || null;
  }
  
  return { isCompeted, competitionType, numberOfOffers, nonCompeteAuthority, nonCompeteJustification };
}

// Extract Modification Info
function extractModificationInfo(text: string): {
  isModification: boolean;
  modificationNumber: string | null;
  baseContractNumber: string | null;
  isOptionExercise: boolean;
  modificationType: string | null;
} {
  let isModification = false;
  let modificationNumber: string | null = null;
  let baseContractNumber: string | null = null;
  let isOptionExercise = false;
  let modificationType: string | null = null;
  
  if (/modification.*?to previously awarded|contract modification/i.test(text)) {
    isModification = true;
    
    const modNumPattern = /modification\s*\(([A-Z0-9]+)\)/i;
    const modNumMatch = text.match(modNumPattern);
    if (modNumMatch) {
      modificationNumber = modNumMatch[1];
    }
    
    const basePattern = /previously awarded.*?contract\s*\(([A-Z0-9-]+)\)/i;
    const baseMatch = text.match(basePattern);
    if (baseMatch) {
      baseContractNumber = baseMatch[1];
    }
    
    if (/to exercise options/i.test(text)) {
      isOptionExercise = true;
      modificationType = 'option exercise';
    } else {
      modificationType = 'other modification';
    }
  }
  
  return { isModification, modificationNumber, baseContractNumber, isOptionExercise, modificationType };
}

// Extract SBIR Info
function extractSBIRInfo(text: string): {
  isSBIR: boolean;
  sbirPhase: string | null;
  isSBIRSoleSource: boolean;
} {
  let isSBIR = false;
  let sbirPhase: string | null = null;
  let isSBIRSoleSource = false;
  
  if (/SBIR|STTR|Small Business Innovative Research/i.test(text)) {
    isSBIR = true;
    
    const phasePattern = /(?:SBIR|STTR)\s+Phase\s+(I{1,3})/i;
    const phaseMatch = text.match(phasePattern);
    if (phaseMatch) {
      sbirPhase = `Phase ${phaseMatch[1]}`;
    }
    
    if (/sole-source.*?SBIR|SBIR.*?sole-source/i.test(text)) {
      isSBIRSoleSource = true;
    }
  }
  
  return { isSBIR, sbirPhase, isSBIRSoleSource };
}

// Extract Set-Aside Info
function extractSetAsideInfo(text: string): {
  isSmallBusinessSetAside: boolean;
  setAsideType: string | null;
} {
  let isSmallBusinessSetAside = false;
  let setAsideType: string | null = null;
  
  // Check for set-aside keywords
  if (/set-aside|set aside/i.test(text)) {
    isSmallBusinessSetAside = true;
    
    // Identify specific set-aside type
    const setAsidePatterns = [
      { regex: /8\(a\)\s+(?:sole\s+source|set-?aside|business development)/i, type: '8(a) Business Development' },
      { regex: /HUBZone\s+set-?aside/i, type: 'HUBZone' },
      { regex: /service-disabled\s+veteran-owned\s+small\s+business|SDVOSB/i, type: 'Service-Disabled Veteran-Owned Small Business (SDVOSB)' },
      { regex: /woman-owned\s+small\s+business(?!\s+economically)|WOSB(?!\s+economically)/i, type: 'Woman-Owned Small Business (WOSB)' },
      { regex: /economically\s+disadvantaged\s+woman-owned|EDWOSB/i, type: 'Economically Disadvantaged Woman-Owned Small Business (EDWOSB)' },
      { regex: /total\s+small\s+business\s+set-?aside/i, type: 'Total Small Business Set-Aside' },
      { regex: /small\s+business\s+set-?aside/i, type: 'Small Business Set-Aside' }
    ];
    
    for (const pattern of setAsidePatterns) {
      if (pattern.regex.test(text)) {
        setAsideType = pattern.type;
        break;
      }
    }
    
    // Default if we found set-aside but no specific type
    if (!setAsideType) {
      setAsideType = 'Small Business Set-Aside';
    }
  }
  
  return { isSmallBusinessSetAside, setAsideType };
}

// Extract Teaming/Multiple Vendor Info with Work Share Percentages
function extractTeamingInfo(text: string, primaryVendor: string): {
  isTeaming: boolean;
  teamMembers: string[];
  primeContractor: string | null;
  subcontractors: string[];
  teamWorkShare: Array<{
    company: string;
    role: string;
    percentage: number;
  }>;
} {
  const isTeaming = /team(?:ing)?\s+with|in partnership with|along with|joint venture|subcontractor|prime contractor/i.test(text);
  
  const teamMembers: string[] = [];
  let primeContractor: string | null = null;
  const subcontractors: string[] = [];
  const teamWorkShare: Array<{ company: string; role: string; percentage: number }> = [];
  
  if (!isTeaming) {
    return { isTeaming: false, teamMembers: [], primeContractor: null, subcontractors: [], teamWorkShare: [] };
  }
  
  // Extract prime contractor
  const primePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Corp\.|Co\.|Inc\.|LLC))?)(?:\s+\(prime contractor\)|,\s+as\s+prime)/i;
  const primeMatch = text.match(primePattern);
  if (primeMatch) {
    primeContractor = primeMatch[1].trim();
  } else {
    primeContractor = primaryVendor;  // Assume first vendor is prime
  }
  
  // Extract team members
  const teamPattern = /team(?:ing)?\s+with\s+([^.;]+)/i;
  const teamMatch = text.match(teamPattern);
  if (teamMatch) {
    const members = teamMatch[1]
      .split(/,\s*(?:and\s+)?|and\s+/)
      .map(m => m.trim())
      .filter(m => m.length > 3 && /[A-Z]/.test(m) && !m.match(/will|expected|completed/i));
    teamMembers.push(...members);
  }
  
  // Extract subcontractors
  const subPattern = /subcontractor[s]?\s+(?:include\s+)?([^.;]+)/i;
  const subMatch = text.match(subPattern);
  if (subMatch) {
    const subs = subMatch[1]
      .split(/,\s*(?:and\s+)?|and\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && /[A-Z]/.test(s) && !s.match(/will|expected|completed/i));
    subcontractors.push(...subs);
  }
  
  // Extract work share percentages
  // Pattern 1: "Company Name (XX%)" or "Company Name, XX%"
  // IMPORTANT: Must have company indicators (Corp., Inc., LLC, etc.) or be multi-word to avoid matching states
  const percentPattern1 = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+(?:Corp\.|Co\.|Inc\.|LLC|Ltd\.|Group|Systems|Technologies|Solutions|International|Aerospace|Defense|Industries))?\s*(?:Corp\.|Co\.|Inc\.|LLC|Ltd\.|Group)?)\s*[,(]\s*(\d+)%/gi;
  
  // Common U.S. states to exclude
  const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 
    'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 
    'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
  
  let percentMatch1;
  while ((percentMatch1 = percentPattern1.exec(text)) !== null) {
    const company = percentMatch1[1].trim();
    const percentage = parseInt(percentMatch1[2]);
    
    // Skip if it's a U.S. state (performance location, not a team member)
    if (US_STATES.includes(company)) {
      continue;
    }
    
    // Skip if it's a single word without company suffix (likely a location)
    const wordCount = company.split(/\s+/).length;
    const hasCompanySuffix = /Corp\.|Co\.|Inc\.|LLC|Ltd\.|Group|Systems|Technologies|Solutions|International|Aerospace|Defense|Industries/i.test(company);
    if (wordCount === 1 && !hasCompanySuffix) {
      continue;
    }
    
    // Determine role
    let role = 'team_member';
    if (company === primeContractor || text.toLowerCase().includes(company.toLowerCase() + ' (prime')) {
      role = 'prime';
    } else if (subcontractors.some(s => s.includes(company))) {
      role = 'subcontractor';
    }
    
    teamWorkShare.push({ company, role, percentage });
  }
  
  // Pattern 2: "will perform XX% of" or "XX% share"
  const percentPattern2 = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Corp\.|Co\.|Inc\.|LLC))?)\s+(?:will\s+perform|performing|responsible for|allocated)\s+(\d+)%/gi;
  let percentMatch2;
  while ((percentMatch2 = percentPattern2.exec(text)) !== null) {
    const company = percentMatch2[1].trim();
    const percentage = parseInt(percentMatch2[2]);
    
    // Skip if it's a U.S. state
    if (US_STATES.includes(company)) {
      continue;
    }
    
    // Only add if not already added
    if (!teamWorkShare.some(w => w.company === company)) {
      let role = 'team_member';
      if (company === primeContractor) role = 'prime';
      else if (subcontractors.some(s => s.includes(company))) role = 'subcontractor';
      
      teamWorkShare.push({ company, role, percentage });
    }
  }
  
  // Pattern 3: "prime: XX%, sub: YY%" format
  const primePercentMatch = text.match(/prime\s*contractor?\s*[:-]?\s*(\d+)%/i);
  if (primePercentMatch && primeContractor) {
    const percentage = parseInt(primePercentMatch[1]);
    if (!teamWorkShare.some(w => w.company === primeContractor)) {
      teamWorkShare.push({ company: primeContractor, role: 'prime', percentage });
    }
  }
  
  return { isTeaming, teamMembers, primeContractor, subcontractors, teamWorkShare };
}

// Extract NAICS Code
function extractNAICS(text: string): string | null {
  // Pattern: NAICS followed by 6-digit code
  const naicsMatch = text.match(/NAICS\s+(?:code\s+)?(\d{6})/i);
  if (naicsMatch) {
    return naicsMatch[1];
  }
  return null;
}

// Extract Solicitation Number
function extractSolicitationNumber(text: string): string | null {
  // Pattern 1: "solicitation number..."
  let match = text.match(/solicitation\s+(?:number\s+)?([A-Z0-9-]+)/i);
  if (match && match[1].length > 5) {
    return match[1];
  }
  
  // Pattern 2: "RFP number..."
  match = text.match(/RFP\s+(?:number\s+)?([A-Z0-9-]+)/i);
  if (match && match[1].length > 5) {
    return match[1];
  }
  
  return null;
}

// Extract Keywords/Tags
function extractKeywords(description: string): {
  industryTags: string[];
  technologyTags: string[];
  serviceTags: string[];
} {
  const industryTags: string[] = [];
  const technologyTags: string[] = [];
  const serviceTags: string[] = [];
  
  const text = description.toLowerCase();
  
  // Industry patterns
  const industries = [
    { pattern: /aircraft|aviation|aerospace|fighter|bomber/i, tag: 'aerospace' },
    { pattern: /ship|vessel|naval|submarine|maritime/i, tag: 'maritime' },
    { pattern: /cyber|information security|network security/i, tag: 'cybersecurity' },
    { pattern: /software|application|system development/i, tag: 'software' },
    { pattern: /ammunition|weapon|missile|ordnance/i, tag: 'munitions' },
    { pattern: /vehicle|truck|transport|JLTV/i, tag: 'ground_vehicles' },
    { pattern: /satellite|space|orbital/i, tag: 'space' },
    { pattern: /construction|facility|infrastructure/i, tag: 'construction' },
    { pattern: /medical|healthcare|hospital/i, tag: 'medical' },
    { pattern: /training|education|instruction/i, tag: 'training' }
  ];
  
  // Technology patterns
  const technologies = [
    { pattern: /artificial intelligence|AI|machine learning|ML/i, tag: 'ai_ml' },
    { pattern: /cloud|AWS|Azure|GCP/i, tag: 'cloud' },
    { pattern: /radar|sensor|detection/i, tag: 'sensors' },
    { pattern: /communication|radio|datalink/i, tag: 'communications' },
    { pattern: /autonomous|unmanned|drone|UAV|UAS/i, tag: 'autonomous' },
    { pattern: /propulsion|engine|turbine/i, tag: 'propulsion' }
  ];
  
  // Service patterns
  const services = [
    { pattern: /maintenance|repair|overhaul|MRO/i, tag: 'maintenance' },
    { pattern: /research|development|R&D|RDT&E/i, tag: 'research' },
    { pattern: /logistics|supply chain|distribution/i, tag: 'logistics' },
    { pattern: /engineering|design|technical/i, tag: 'engineering' },
    { pattern: /consulting|advisory|analysis/i, tag: 'consulting' },
    { pattern: /training|instruction|education/i, tag: 'training' },
    { pattern: /support|sustainment|operations/i, tag: 'support' },
    { pattern: /integration|installation|implementation/i, tag: 'integration' }
  ];
  
  // Extract matches
  for (const industry of industries) {
    if (industry.pattern.test(text)) {
      industryTags.push(industry.tag);
    }
  }
  
  for (const tech of technologies) {
    if (tech.pattern.test(text)) {
      technologyTags.push(tech.tag);
    }
  }
  
  for (const service of services) {
    if (service.pattern.test(text)) {
      serviceTags.push(service.tag);
    }
  }
  
  return { industryTags, technologyTags, serviceTags };
}

// Improved Contracting Activity Extraction
function improvedContractingActivity(text: string): string | null {
  // Pattern 1: "The contracting activity is..."
  let match = text.match(/[Tt]he\s+contracting\s+activity\s+is\s+([^.()]+?)(?:\s+\(|\.)/);
  if (match) {
    return match[1].trim();
  }
  
  // Pattern 2: "..., [Location], is the contracting activity"
  match = text.match(/([^,]+,\s+[^,]+),\s+is\s+the\s+contracting\s+activity/);
  if (match) {
    return match[1].trim();
  }
  
  // Pattern 3: End of paragraph with location in parentheses
  match = text.match(/\(([^)]+)\s+is\s+the\s+contracting\s+activity\)/);
  if (match) {
    return match[1].trim();
  }
  
  return null;
}

// ============================================
// Extract Contract Data from Paragraph
// ============================================

export interface ExtractedContract {
  // Basic Info
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
  
  // Contract Types & Structure
  contractTypes?: string[];
  isIDIQ?: boolean;
  isMultipleAward?: boolean;
  isHybridContract?: boolean;
  
  // Options & Value
  hasOptions?: boolean;
  baseContractValue?: number;
  optionsValue?: number;
  cumulativeValueWithOptions?: number;
  optionsPeriodEndDate?: Date;
  
  // Modifications
  isModification?: boolean;
  modificationNumber?: string;
  baseContractNumber?: string;
  isOptionExercise?: boolean;
  modificationType?: string;
  
  // Foreign Military Sales
  isFMS?: boolean;
  fmsCountries?: string[];
  fmsAmount?: number;
  fmsPercentage?: number;
  
  // Competition
  isCompeted?: boolean | null;
  competitionType?: string;
  numberOfOffersReceived?: number;
  nonCompeteAuthority?: string;
  nonCompeteJustification?: string;
  
  // SBIR/STTR
  isSBIR?: boolean;
  sbirPhase?: string;
  isSBIRSoleSource?: boolean;
  
  // Multiple Award
  numberOfAwardees?: number;
  isCombinedAnnouncement?: boolean;
  originalAnnouncementDate?: Date;
  
  // Performance Locations (Enhanced)
  performanceLocationBreakdown?: Array<{
    location: string;
    city: string;
    state: string;
    percentage: number;
  }>;
  
  // Funding
  fundingSources?: Array<{
    fiscal_year: number;
    type: string;
    amount: number;
    percentage: number;
  }>;
  totalObligatedAmount?: number;
  fundsExpire?: boolean;
  fundsExpireDate?: Date;
  
  // Set-Aside
  isSmallBusinessSetAside?: boolean;
  setAsideType?: string;
  
  // Teaming/Multiple Vendors
  isTeaming?: boolean;
  teamMembers?: string[];
  primeContractor?: string;
  subcontractors?: string[];
  teamWorkShare?: Array<{
    company: string;
    role: string;
    percentage: number;
  }>;
  
  // Additional Fields
  naicsCode?: string;
  solicitationNumber?: string;
  industryTags?: string[];
  technologyTags?: string[];
  serviceTags?: string[];
}

export function extractContractData(paragraph: string, serviceBranchFromHeader?: string): ExtractedContract | null {
  try {
    // Extract vendor name (usually at the start, before a comma or opening paren)
    // Match everything up to first comma, asterisk, or opening paren
    const vendorNameMatch = paragraph.match(/^([^,(*]+)/);
    const vendorName = vendorNameMatch ? vendorNameMatch[1].trim() : 'Unknown Vendor';
    
    // Extract vendor location (City, State pattern)
    // Pattern: "Company,* City, State (Contract)" or "Company, City, State,"
    // The asterisk denotes small business, state can be multi-word (e.g., "New York")
    const vendorLocationMatch = paragraph.match(/,\s*\*?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    
    const vendorCity = vendorLocationMatch ? vendorLocationMatch[1].trim() : undefined;
    const vendorState = vendorLocationMatch ? vendorLocationMatch[2].trim() : undefined;
    const vendorLocation = (vendorCity && vendorState) ? `${vendorCity}, ${vendorState}` : undefined;
    
    // DEBUG: Log extraction results
    if (Math.random() < 0.1) { // Log ~10% of contracts
      console.log('[DEBUG] Extracted - City:', vendorCity, '| State:', vendorState);
    }
    
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
    
    // Extract service branch - prefer header value, then extract from paragraph
    let serviceBranch: string | undefined = serviceBranchFromHeader;
    if (!serviceBranch) {
      if (paragraph.includes('Army')) serviceBranch = 'Army';
      else if (paragraph.includes('Navy')) serviceBranch = 'Navy';
      else if (paragraph.includes('Air Force')) serviceBranch = 'Air Force';
      else if (paragraph.includes('Marine Corps')) serviceBranch = 'Marine Corps';
      else if (paragraph.includes('Space Force')) serviceBranch = 'Space Force';
    }
    
    // Extract completion date
    let completionDate: Date | undefined;
    const completionMatch = paragraph.match(/(?:expected to be completed|completion date|work is expected)\s+(?:by\s+)?([A-Z][a-z]+\s+\d{4})/i);
    if (completionMatch) {
      completionDate = new Date(completionMatch[1]);
    }
    
    // Check if small business
    const isSmallBusiness = /small business/i.test(paragraph);
    
    // ============================================
    // ENHANCED EXTRACTION: Call all helper functions
    // ============================================
    
    // Contract types & structure
    const contractTypesInfo = extractContractTypes(paragraph);
    
    // Options & cumulative value
    const optionsInfo = extractOptionsInfo(paragraph, awardAmount);
    
    // Performance locations with percentages
    const performanceInfo = extractPerformanceLocations(paragraph);
    
    // Funding sources
    const fundingInfo = extractFundingSources(paragraph);
    
    // Foreign Military Sales
    const fmsInfo = extractFMSInfo(paragraph);
    
    // Competition info
    const competitionInfo = extractCompetitionInfo(paragraph);
    
    // Modification info
    const modificationInfo = extractModificationInfo(paragraph);
    
    // SBIR/STTR info
    const sbirInfo = extractSBIRInfo(paragraph);
    
    // Set-Aside info
    const setAsideInfo = extractSetAsideInfo(paragraph);
    
    // Teaming info
    const teamingInfo = extractTeamingInfo(paragraph, vendorName);
    
    // NAICS code
    const naicsCode = extractNAICS(paragraph);
    
    // Solicitation number
    const solicitationNumber = extractSolicitationNumber(paragraph);
    
    // Keywords/tags
    const keywordInfo = extractKeywords(paragraph);
    
    // Improved contracting activity
    const improvedContractingActivityValue = improvedContractingActivity(paragraph);
    const finalContractingActivity = improvedContractingActivityValue || contractingActivity;
    
    // Calculate parsing confidence (0.0 - 1.0)
    let confidence = 0.5; // Base confidence
    if (vendorName !== 'Unknown Vendor') confidence += 0.1;
    if (vendorLocation) confidence += 0.1;
    if (awardAmount) confidence += 0.15;
    if (contractNumber) confidence += 0.1;
    if (finalContractingActivity) confidence += 0.05;
    
    // Bonus confidence for enhanced data
    if (contractTypesInfo.types.length > 0) confidence += 0.05;
    if (performanceInfo.breakdown.length > 0) confidence += 0.05;
    if (fundingInfo.sources.length > 0) confidence += 0.05;
    
    return {
      // Basic Info
      vendorName,
      vendorLocation,
      vendorCity,
      vendorState,
      contractNumber,
      awardAmount,
      awardAmountText,
      contractDescription: paragraph,
      performanceLocations: performanceInfo.locations,
      completionDate,
      contractingActivity: finalContractingActivity,
      serviceBranch,
      isSmallBusiness,
      rawParagraph: paragraph,
      parsingConfidence: Math.min(confidence, 1.0),
      
      // Contract Types & Structure
      contractTypes: contractTypesInfo.types.length > 0 ? contractTypesInfo.types : undefined,
      isIDIQ: contractTypesInfo.isIDIQ,
      isMultipleAward: contractTypesInfo.isMultipleAward,
      isHybridContract: contractTypesInfo.isHybridContract,
      
      // Options & Value
      hasOptions: optionsInfo.hasOptions,
      baseContractValue: awardAmount,
      optionsValue: optionsInfo.optionsValue || undefined,
      cumulativeValueWithOptions: optionsInfo.cumulativeValue || undefined,
      optionsPeriodEndDate: optionsInfo.optionsPeriodEndDate || undefined,
      
      // Modifications
      isModification: modificationInfo.isModification,
      modificationNumber: modificationInfo.modificationNumber || undefined,
      baseContractNumber: modificationInfo.baseContractNumber || undefined,
      isOptionExercise: modificationInfo.isOptionExercise,
      modificationType: modificationInfo.modificationType || undefined,
      
      // Foreign Military Sales
      isFMS: fmsInfo.isFMS,
      fmsCountries: fmsInfo.countries.length > 0 ? fmsInfo.countries : undefined,
      fmsAmount: fmsInfo.amount || undefined,
      fmsPercentage: fmsInfo.percentage || undefined,
      
      // Competition
      isCompeted: competitionInfo.isCompeted,
      competitionType: competitionInfo.competitionType || undefined,
      numberOfOffersReceived: competitionInfo.numberOfOffers || undefined,
      nonCompeteAuthority: competitionInfo.nonCompeteAuthority || undefined,
      nonCompeteJustification: competitionInfo.nonCompeteJustification || undefined,
      
      // SBIR/STTR
      isSBIR: sbirInfo.isSBIR,
      sbirPhase: sbirInfo.sbirPhase || undefined,
      isSBIRSoleSource: sbirInfo.isSBIRSoleSource,
      
      // Performance Locations (Enhanced)
      performanceLocationBreakdown: performanceInfo.breakdown.length > 0 ? performanceInfo.breakdown : undefined,
      
      // Funding
      fundingSources: fundingInfo.sources.length > 0 ? fundingInfo.sources : undefined,
      totalObligatedAmount: fundingInfo.totalObligated > 0 ? fundingInfo.totalObligated : undefined,
      fundsExpire: fundingInfo.fundsExpire,
      
      // Set-Aside
      isSmallBusinessSetAside: setAsideInfo.isSmallBusinessSetAside,
      setAsideType: setAsideInfo.setAsideType || undefined,
      
      // Teaming/Multiple Vendors
      isTeaming: teamingInfo.isTeaming,
      teamMembers: teamingInfo.teamMembers.length > 0 ? teamingInfo.teamMembers : undefined,
      primeContractor: teamingInfo.primeContractor || undefined,
      subcontractors: teamingInfo.subcontractors.length > 0 ? teamingInfo.subcontractors : undefined,
      teamWorkShare: teamingInfo.teamWorkShare.length > 0 ? teamingInfo.teamWorkShare : undefined,
      
      // Additional Fields
      naicsCode: naicsCode || undefined,
      solicitationNumber: solicitationNumber || undefined,
      industryTags: keywordInfo.industryTags.length > 0 ? keywordInfo.industryTags : undefined,
      technologyTags: keywordInfo.technologyTags.length > 0 ? keywordInfo.technologyTags : undefined,
      serviceTags: keywordInfo.serviceTags.length > 0 ? keywordInfo.serviceTags : undefined,
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
    // DEBUG: Log what we're about to insert
    if (Math.random() < 0.05) {
      console.log('[DEBUG] Inserting to DB - vendor_city:', contract.vendorCity, '| vendor_state:', contract.vendorState);
    }
    
    const { data: insertedContract, error } = await supabase
      .from('dod_contract_news')
      .insert({
        // Basic Info
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
        work_description: contract.contractDescription,
        
        completion_date: contract.completionDate?.toISOString().split('T')[0],
        
        contracting_activity: contract.contractingActivity,
        service_branch: contract.serviceBranch,
        
        is_small_business: contract.isSmallBusiness,
        
        raw_paragraph: contract.rawParagraph,
        
        parsing_confidence: contract.parsingConfidence,
        data_quality_score: Math.round(contract.parsingConfidence * 100),
        
        // Contract Types & Structure
        contract_types: contract.contractTypes,
        is_idiq: contract.isIDIQ,
        is_multiple_award: contract.isMultipleAward,
        is_hybrid_contract: contract.isHybridContract,
        
        // Options & Value
        has_options: contract.hasOptions,
        base_contract_value: contract.baseContractValue,
        options_value: contract.optionsValue,
        cumulative_value_with_options: contract.cumulativeValueWithOptions,
        options_period_end_date: contract.optionsPeriodEndDate?.toISOString().split('T')[0],
        
        // Modifications
        is_modification: contract.isModification,
        modification_number: contract.modificationNumber,
        base_contract_number: contract.baseContractNumber,
        is_option_exercise: contract.isOptionExercise,
        modification_type: contract.modificationType,
        
        // Foreign Military Sales
        is_fms: contract.isFMS,
        fms_countries: contract.fmsCountries,
        fms_amount: contract.fmsAmount,
        fms_percentage: contract.fmsPercentage,
        
        // Competition
        is_competed: contract.isCompeted,
        competition_type: contract.competitionType,
        number_of_offers_received: contract.numberOfOffersReceived,
        non_compete_authority: contract.nonCompeteAuthority,
        non_compete_justification: contract.nonCompeteJustification,
        
        // SBIR/STTR
        is_sbir: contract.isSBIR,
        sbir_phase: contract.sbirPhase,
        is_sbir_sole_source: contract.isSBIRSoleSource,
        
        // Performance Locations (Enhanced)
        performance_locations: contract.performanceLocations,
        performance_location_breakdown: contract.performanceLocationBreakdown ? JSON.stringify(contract.performanceLocationBreakdown) : null,
        
        // Funding
        funding_sources: contract.fundingSources,
        total_obligated_amount: contract.totalObligatedAmount,
        funds_expire: contract.fundsExpire,
        
        // Set-Aside
        is_small_business_set_aside: contract.isSmallBusinessSetAside,
        set_aside_type: contract.setAsideType,
        
        // Teaming/Multiple Vendors
        is_teaming: contract.isTeaming,
        team_members: contract.teamMembers,
        prime_contractor: contract.primeContractor,
        subcontractors: contract.subcontractors,
        team_work_share: contract.teamWorkShare ? JSON.stringify(contract.teamWorkShare) : null,
        
        // Additional Fields
        naics_code: contract.naicsCode,
        solicitation_number: contract.solicitationNumber,
        industry_tags: contract.industryTags,
        technology_tags: contract.technologyTags,
        service_tags: contract.serviceTags,
        
        // Source tracking
        source_url: articleUrl,
        source_type: 'dod_news',
        scraped_from_url: articleUrl,
        
        scraped_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('[DoD] Error saving contract:', error);
      return false;
    }
    
    // Insert team members (ALWAYS when teaming exists, even without percentages)
    if (insertedContract && insertedContract[0] && contract.isTeaming) {
      const contractId = insertedContract[0].id;
      const teamMemberRows: any[] = [];
      
      // If we have work share percentages, use them
      if (contract.teamWorkShare && contract.teamWorkShare.length > 0) {
        contract.teamWorkShare.forEach(member => {
          teamMemberRows.push({
            contract_id: contractId,
            contract_number: contract.contractNumber,
            company_name: member.company,
            team_role: member.role,
            work_share_percentage: member.percentage,
            award_amount: contract.awardAmount,
            service_branch: contract.serviceBranch,
            published_date: publishedDate.toISOString().split('T')[0],
            article_id: articleId
          });
        });
      } else {
        // No percentages, but still track the relationship
        if (contract.primeContractor) {
          teamMemberRows.push({
            contract_id: contractId,
            contract_number: contract.contractNumber,
            company_name: contract.primeContractor,
            team_role: 'prime',
            work_share_percentage: null,
            award_amount: contract.awardAmount,
            service_branch: contract.serviceBranch,
            published_date: publishedDate.toISOString().split('T')[0],
            article_id: articleId
          });
        }
        
        if (contract.subcontractors && contract.subcontractors.length > 0) {
          contract.subcontractors.forEach(sub => {
            teamMemberRows.push({
              contract_id: contractId,
              contract_number: contract.contractNumber,
              company_name: sub,
              team_role: 'subcontractor',
              work_share_percentage: null,
              award_amount: contract.awardAmount,
              service_branch: contract.serviceBranch,
              published_date: publishedDate.toISOString().split('T')[0],
              article_id: articleId
            });
          });
        }
      }
      
      if (teamMemberRows.length > 0) {
        const { error: teamError } = await supabase
          .from('dod_contract_team_members')
          .insert(teamMemberRows);
        
        if (teamError) {
          console.error('[DoD] Error saving team members:', teamError);
        } else {
          const withPercent = teamMemberRows.filter(t => t.work_share_percentage !== null).length;
          const withoutPercent = teamMemberRows.length - withPercent;
          console.log(`[DoD]   💼 Saved ${teamMemberRows.length} team members (${withPercent} with %, ${withoutPercent} without %)`);
        }
      }
    }
    
    // Insert performance locations
    if (insertedContract && insertedContract[0] && contract.performanceLocationBreakdown && contract.performanceLocationBreakdown.length > 0) {
      const contractId = insertedContract[0].id;
      const locationRows = contract.performanceLocationBreakdown.map((loc: any) => ({
        contract_id: contractId,
        contract_number: contract.contractNumber,
        location_city: loc.city,
        location_state: loc.state,
        location_full: loc.location,
        work_percentage: loc.percentage,
        award_amount: contract.awardAmount,
        vendor_name: contract.vendorName,
        service_branch: contract.serviceBranch,
        published_date: publishedDate.toISOString().split('T')[0],
        article_id: articleId
      }));
      
      const { error: locationError } = await supabase
        .from('dod_contract_performance_locations')
        .insert(locationRows);
      
      if (locationError) {
        console.error('[DoD] Error saving performance locations:', locationError);
      } else {
        const withPercent = locationRows.filter(l => l.work_percentage !== null).length;
        console.log(`[DoD]   📍 Saved ${locationRows.length} performance locations (${withPercent} with %)`);
      }
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
    for (const paragraphData of parsed.contractParagraphs) {
      // Check if this is a multiple award contract and split if needed
      const individualParagraphs = splitMultipleAwardContract(paragraphData.text);
      totalContracts += individualParagraphs.length;
      
      for (const individualParagraph of individualParagraphs) {
        const contract = extractContractData(individualParagraph, paragraphData.serviceBranch);
        if (contract) {
          // If no contract number found, use fallback: ARTICLE_ID-SEQ-###
          if (!contract.contractNumber || contract.contractNumber.length < 10) {
            contract.contractNumber = `${parsed.articleId}-SEQ-${String(sequenceNum).padStart(3, '0')}`;
          }
          sequenceNum++;
          
          // DEBUG: Log contract object before save
          if (Math.random() < 0.05) {
            console.log('[DEBUG] Before save - vendorCity:', contract.vendorCity, '| vendorState:', contract.vendorState);
          }
          
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
    
    // Run outlier detection and quality scoring
    console.log('[DoD] 🔍 Running quality checks and outlier detection...');
    await runQualityChecks();
    
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
// Quality Checks & Outlier Detection
// ============================================

export async function runQualityChecks(): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('detect_dod_outliers');
    
    if (error) {
      console.error('[DoD] Error running quality checks:', error);
      return;
    }
    
    // Get summary stats
    const { count: needsReviewCount } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true })
      .eq('needs_review', true)
      .is('reviewed_at', null);
    
    const { count: outliersCount } = await supabase
      .from('dod_contract_news')
      .select('*', { count: 'exact', head: true })
      .eq('is_outlier', true);
    
    console.log(`[DoD] 📊 Quality Check Complete:`);
    console.log(`[DoD]   • Contracts needing review: ${needsReviewCount || 0}`);
    console.log(`[DoD]   • Outliers detected: ${outliersCount || 0}`);
    
  } catch (error) {
    console.error('[DoD] Exception running quality checks:', error);
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

