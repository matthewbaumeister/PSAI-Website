/**
 * ============================================
 * MAKE READY TECH - DOD CONTRACT NEWS SCRAPER
 * ============================================
 * 
 * Scrapes DOD contract news articles from defense.gov and saves
 * directly to the unified opportunity_master table.
 * 
 * Features:
 * - Extracts all contract details including vehicle types (IDIQ, sole source, etc.)
 * - Handles modifications, multiple awards, FMS, SBIR
 * - Saves directly to opportunity_master + opportunity_sources
 * - Generates canonical keys for cross-source linking
 * - Calculates data quality scores
 * 
 * Copyright (c) 2024 Make Ready Tech
 * ============================================
 */

import * as dotenv from 'dotenv';
dotenv.config();

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_URL = 'https://www.defense.gov/News/Contracts/';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// BROWSER MANAGEMENT
// ============================================

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
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

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ============================================
// ARTICLE DISCOVERY
// ============================================

interface Article {
  id: number;
  url: string;
  title: string;
  publishedDate: Date;
}

function parseDateFromTitle(title: string): Date | null {
  const match = title.match(/Contracts\s+For\s+([A-Za-z]+)\.?\s+(\d+),?\s+(\d{4})/i);
  if (!match) return null;
  
  const [, monthStr, day, year] = match;
  
  // Support both full and abbreviated month names
  const monthMap: Record<string, number> = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };
  
  const month = monthMap[monthStr.toLowerCase()];
  
  if (month === undefined) return null;
  
  return new Date(parseInt(year), month, parseInt(day));
}

async function findRecentArticles(limit: number = 10): Promise<Article[]> {
  console.log(`\n🔍 Finding ${limit} most recent contract news articles...\n`);
  
  const articles: Article[] = [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    console.log(`   Fetching: ${CONTRACTS_URL}`);
    await page.goto(CONTRACTS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    console.log(`   Page loaded, parsing...`);
    console.log(`   HTML length: ${html.length} bytes`);
    
    // Debug: Try different selectors
    console.log(`   Testing selectors:`);
    console.log(`   - .river-list .item: ${$('.river-list .item').length}`);
    console.log(`   - .river-item: ${$('.river-item').length}`);
    console.log(`   - .item: ${$('.item').length}`);
    console.log(`   - article: ${$('article').length}`);
    console.log(`   - a[href*="Article"]: ${$('a[href*="Article"]').length}`);
    
    let articleIdCounter = 1000000;
    let totalItems = 0;
    let matchedItems = 0;
    
    $('.item').each((_, element) => {
      totalItems++;
      if (articles.length >= limit) return false;
      
      const $item = $(element);
      const title = $item.find('a').text().trim();
      const relativeUrl = $item.find('a').attr('href');
      
      console.log(`   Item ${totalItems}: "${title.substring(0, 50)}..."`);
      
      if (!title.toLowerCase().includes('contracts for') || !relativeUrl) {
        console.log(`      ❌ Skipped (not a contract article)`);
        return;
      }
      
      matchedItems++;
      
      const articleDate = parseDateFromTitle(title);
      if (!articleDate) {
        console.log(`      ❌ Skipped (couldn't parse date)`);
        return;
      }
      
      console.log(`      ✅ Added!`);
      
      // Handle both relative and absolute URLs
      const fullUrl = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : BASE_URL + relativeUrl;
      
      articles.push({
        id: articleIdCounter++,
        url: fullUrl,
        title: title,
        publishedDate: articleDate
      });
    });
    
    console.log(`\n   Total items found: ${totalItems}`);
    console.log(`   Contract articles: ${matchedItems}`);
    console.log(`✅ Found ${articles.length} articles\n`);
    
  } finally {
    await page.close();
  }
  
  return articles;
}

// ============================================
// ARTICLE FETCHING
// ============================================

async function fetchArticleHTML(url: string): Promise<string | null> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    if (response?.status() !== 200) {
      console.error(`[MRT] Failed to fetch ${url}: ${response?.status()}`);
      return null;
    }

    const html = await page.content();
    return html;
    
  } catch (error) {
    console.error(`[MRT] Error fetching article:`, error);
    return null;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// ============================================
// CONTRACT DATA EXTRACTION
// ============================================

interface ExtractedContract {
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
  
  // Enhanced fields
  contractTypes?: string[];
  isIDIQ?: boolean;
  isMultipleAward?: boolean;
  isHybridContract?: boolean;
  hasOptions?: boolean;
  baseContractValue?: number;
  optionsValue?: number;
  cumulativeValueWithOptions?: number;
  optionsPeriodEndDate?: Date;
  isModification?: boolean;
  modificationNumber?: string;
  baseContractNumber?: string;
  isOptionExercise?: boolean;
  modificationType?: string;
  isFMS?: boolean;
  fmsCountries?: string[];
  fmsAmount?: number;
  fmsPercentage?: number;
  isCompeted?: boolean | null;
  competitionType?: string;
  numberOfOffersReceived?: number;
  nonCompeteAuthority?: string;
  nonCompeteJustification?: string;
  isSBIR?: boolean;
  sbirPhase?: string;
  isSBIRSoleSource?: boolean;
  performanceLocationBreakdown?: Array<{
    location: string;
    city: string;
    state: string;
    percentage: number;
  }>;
  fundingSources?: Array<{
    fiscal_year: number;
    type: string;
    amount: number;
    percentage: number;
  }>;
  totalObligatedAmount?: number;
  fundsExpire?: boolean;
  fundsExpireDate?: Date;
  isSmallBusinessSetAside?: boolean;
  setAsideType?: string;
  isTeaming?: boolean;
  teamMembers?: string[];
  primeContractor?: string;
  subcontractors?: string[];
  teamWorkShare?: Array<{
    company: string;
    role: string;
    percentage: number;
  }>;
  naicsCode?: string;
  solicitationNumber?: string;
  industryTags?: string[];
  technologyTags?: string[];
  serviceTags?: string[];
}

// Import all extraction helper functions from original scraper
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
  
  const typePatterns: Record<string, RegExp> = {
    'firm-fixed-price': /\bfirm-fixed-price\b/i,
    'cost-plus-fixed-fee': /\bcost-plus-fixed-fee\b/i,
    'cost-plus-incentive-fee': /\bcost-plus-incentive-fee\b/i,
    'fixed-price-incentive-fee': /\bfixed-price-incentive-fee\b/i,
    'cost-reimbursable': /\bcost-reimbursable\b/i,
    'cost-only': /\bcost-only\b/i,
    'time-and-materials': /\btime-and-materials\b/i,
  };
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(text)) {
      types.push(type);
    }
  }
  
  if (/indefinite-delivery\/indefinite-quantity|IDIQ/i.test(text)) {
    types.push('IDIQ');
    isIDIQ = true;
  }
  
  if (/multiple award/i.test(text)) {
    isMultipleAward = true;
  }
  
  if (/hybrid/i.test(text) || types.length > 2) {
    isHybridContract = true;
  }
  
  return { types, isIDIQ, isMultipleAward, isHybridContract };
}

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

function extractSetAsideInfo(text: string): {
  isSmallBusinessSetAside: boolean;
  setAsideType: string | null;
} {
  let isSmallBusinessSetAside = false;
  let setAsideType: string | null = null;
  
  if (/set-aside|set aside/i.test(text)) {
    isSmallBusinessSetAside = true;
    
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
    
    if (!setAsideType) {
      setAsideType = 'Small Business Set-Aside';
    }
  }
  
  return { isSmallBusinessSetAside, setAsideType };
}

function extractNAICS(text: string): string | null {
  const naicsMatch = text.match(/NAICS\s+(?:code\s+)?(\d{6})/i);
  if (naicsMatch) {
    return naicsMatch[1];
  }
  return null;
}

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

function extractContractData(paragraph: string, serviceBranchFromHeader?: string): ExtractedContract | null {
  try {
    // Extract vendor name
    const vendorNameMatch = paragraph.match(/^([^,(*]+)/);
    const vendorName = vendorNameMatch ? vendorNameMatch[1].trim() : 'Unknown Vendor';
    
    // Extract vendor location (City, State)
    const vendorLocationMatch = paragraph.match(/,\s*\*?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    const vendorCity = vendorLocationMatch ? vendorLocationMatch[1].trim() : undefined;
    const vendorState = vendorLocationMatch ? vendorLocationMatch[2].trim() : undefined;
    const vendorLocation = (vendorCity && vendorState) ? `${vendorCity}, ${vendorState}` : undefined;
    
    // Extract award amount
    let awardAmount: number | undefined;
    let awardAmountText: string | undefined;
    
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
    
    // Extract contract number
    const contractNumberPatterns = [
      /\(([A-Z]\d{5}[A-Z0-9-]{4,})\)/,
      /contract\s+(?:number\s+)?([A-Z]\d{5}[A-Z0-9-]{4,})\b/i,
      /\b([A-Z]\d{5}[A-Z0-9-]{4,})\b/
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
    
    // Enhanced extraction
    const contractTypesInfo = extractContractTypes(paragraph);
    const competitionInfo = extractCompetitionInfo(paragraph);
    const setAsideInfo = extractSetAsideInfo(paragraph);
    const modificationInfo = extractModificationInfo(paragraph);
    const naicsCode = extractNAICS(paragraph);
    
    // Calculate parsing confidence
    let confidence = 0.5;
    if (vendorName !== 'Unknown Vendor') confidence += 0.1;
    if (vendorLocation) confidence += 0.1;
    if (awardAmount) confidence += 0.15;
    if (contractNumber) confidence += 0.1;
    if (contractingActivity) confidence += 0.05;
    if (contractTypesInfo.types.length > 0) confidence += 0.05;
    
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
      parsingConfidence: Math.min(confidence, 1.0),
      
      // Enhanced fields
      contractTypes: contractTypesInfo.types.length > 0 ? contractTypesInfo.types : undefined,
      isIDIQ: contractTypesInfo.isIDIQ,
      isMultipleAward: contractTypesInfo.isMultipleAward,
      isHybridContract: contractTypesInfo.isHybridContract,
      
      isCompeted: competitionInfo.isCompeted,
      competitionType: competitionInfo.competitionType || undefined,
      numberOfOffersReceived: competitionInfo.numberOfOffers || undefined,
      
      isSmallBusinessSetAside: setAsideInfo.isSmallBusinessSetAside,
      setAsideType: setAsideInfo.setAsideType || undefined,
      
      isModification: modificationInfo.isModification,
      modificationNumber: modificationInfo.modificationNumber || undefined,
      baseContractNumber: modificationInfo.baseContractNumber || undefined,
      isOptionExercise: modificationInfo.isOptionExercise,
      modificationType: modificationInfo.modificationType || undefined,
      
      naicsCode: naicsCode || undefined
    };
    
  } catch (error) {
    console.error('[MRT] Error extracting contract data:', error);
    return null;
  }
}

function parseArticleHTML(html: string): Array<{ text: string; serviceBranch: string }> {
  const $ = cheerio.load(html);
  const contractParagraphs: Array<{ text: string; serviceBranch: string }> = [];
  
  const branchHeaders = ['Army Contracting Command', 'Air Force District of Washington', 'Naval Sea Systems Command', 
    'Defense Logistics Agency', 'Navy', 'Air Force', 'Army', 'Defense', 'Marine Corps', 'Space Force'];
  
  let currentBranch = 'UNKNOWN';
  
  $('p, .paragraph').each((_, el) => {
    const text = $(el).text().trim();
    
    // Check if this is a branch header
    for (const branch of branchHeaders) {
      if (text.includes(branch)) {
        currentBranch = branch.toUpperCase().replace(' CONTRACTING COMMAND', '').replace(' DISTRICT OF WASHINGTON', '');
        break;
      }
    }
    
    // Check if this paragraph contains a contract
    if (text.includes('$') && text.length > 100 && /[A-Z][a-z]+/.test(text)) {
      contractParagraphs.push({
        text,
        serviceBranch: currentBranch
      });
    }
  });
  
  return contractParagraphs;
}

// ============================================
// SAVE TO OPPORTUNITY_MASTER
// ============================================

async function generateCanonicalKey(params: {
  contractNumber?: string;
  noticeId?: string;
  awardId?: string;
  agency?: string;
  fiscalYear?: number;
}): Promise<string> {
  const { contractNumber, noticeId, awardId, agency, fiscalYear } = params;
  
  const { data, error } = await supabase.rpc('make_canonical_opportunity_key', {
    p_contract_number: contractNumber || null,
    p_notice_id: noticeId || null,
    p_award_id: awardId || null,
    p_agency: agency || null,
    p_fiscal_year: fiscalYear || null
  });
  
  if (error) {
    console.error('[MRT] Error generating canonical key:', error);
    const combined = `${contractNumber || ''}_${agency || ''}_${fiscalYear || ''}`;
    return `HASH:${Buffer.from(combined).toString('base64').substring(0, 32)}`;
  }
  
  return data || `FALLBACK:${Date.now()}`;
}

function determineVehicleType(contract: ExtractedContract): string | null {
  if (contract.isIDIQ) return 'IDIQ';
  if (contract.isMultipleAward) return 'Multiple Award';
  if (contract.competitionType?.toLowerCase().includes('sole source')) return 'Sole Source';
  
  if (contract.contractTypes && contract.contractTypes.length > 0) {
    if (contract.contractTypes.includes('IDIQ')) return 'IDIQ';
    return contract.contractTypes[0];
  }
  
  return null;
}

function calculateQualityScore(contract: ExtractedContract): number {
  let score = 50;
  
  if (contract.vendorName && contract.vendorName !== 'Unknown Vendor') score += 10;
  if (contract.contractNumber) score += 10;
  if (contract.awardAmount) score += 10;
  if (contract.contractingActivity) score += 5;
  if (contract.serviceBranch) score += 5;
  if (contract.contractTypes && contract.contractTypes.length > 0) score += 5;
  if (contract.vendorCity && contract.vendorState) score += 5;
  if (contract.naicsCode) score += 2;
  if (contract.completionDate) score += 2;
  
  return Math.min(score, 100);
}

async function saveToOpportunityMaster(
  contract: ExtractedContract,
  article: Article
): Promise<boolean> {
  try {
    const fiscalYear = article.publishedDate.getMonth() >= 9 
      ? article.publishedDate.getFullYear() + 1 
      : article.publishedDate.getFullYear();
    
    const canonicalKey = await generateCanonicalKey({
      contractNumber: contract.contractNumber,
      noticeId: undefined,
      awardId: `DOD-${article.id}`,
      agency: contract.contractingActivity || contract.serviceBranch,
      fiscalYear: fiscalYear
    });
    
    const vehicleType = determineVehicleType(contract);
    const qualityScore = calculateQualityScore(contract);
    
    const sourceAttributes = {
      dod_contract_news: {
        source_primary_key: `${article.id}-${contract.contractNumber || 'UNKNOWN'}`,
        source_table: 'dod_contract_news',
        ingested_at: new Date().toISOString(),
        source_url: article.url,
        confidence_score: contract.parsingConfidence * 100,
        article_id: article.id,
        article_title: article.title,
        parsing_confidence: contract.parsingConfidence,
        extraction_method: 'regex_parser'
      }
    };
    
    const externalIds = {
      article_id: article.id,
      contract_number: contract.contractNumber,
      modification_number: contract.modificationNumber,
      base_contract_number: contract.baseContractNumber
    };
    
    const { data: masterData, error: masterError } = await supabase
      .from('opportunity_master')
      .upsert({
        canonical_opportunity_key: canonicalKey,
        primary_contract_number: contract.contractNumber,
        primary_award_id: `DOD-${article.id}`,
        parent_contract_number: contract.baseContractNumber,
        external_ids: externalIds,
        
        title: article.title,
        short_description: contract.contractDescription?.substring(0, 500),
        full_description: contract.contractDescription,
        opportunity_type: contract.isModification ? 'modification' : 'award',
        domain_category: null,
        keywords: null,
        
        customer_department: contract.serviceBranch || 'DoD',
        customer_agency: contract.contractingActivity,
        customer_office: contract.contractingActivity,
        customer_location: contract.contractingActivity,
        customer_country: 'USA',
        
        naics_codes: contract.naicsCode ? [contract.naicsCode] : null,
        psc_codes: null,
        
        vehicle_type: vehicleType,
        ceiling_value: null,
        estimated_value: contract.awardAmount,
        obligated_value: null,
        funding_agency: null,
        contract_type: contract.contractTypes ? contract.contractTypes.join(', ') : null,
        set_aside_type: contract.setAsideType,
        competition_type: contract.competitionType,
        is_small_business_set_aside: contract.isSmallBusinessSetAside || false,
        is_sole_source: contract.competitionType?.toLowerCase().includes('sole source') || false,
        
        status: contract.isModification ? 'modified' : 'awarded',
        publication_date: article.publishedDate.toISOString(),
        due_date: null,
        award_date: article.publishedDate.toISOString(),
        period_of_performance_start: null,
        period_of_performance_end: contract.completionDate?.toISOString(),
        last_seen_at: new Date().toISOString(),
        
        prime_recipients: contract.vendorName && contract.vendorName !== 'Unknown Vendor' 
          ? [contract.vendorName] 
          : null,
        sub_recipients: null,
        cage_codes: null,
        uei_numbers: null,
        
        source_attributes: sourceAttributes,
        source_count: 1,
        data_quality_score: qualityScore,
        
        llm_summary: null,
        llm_notes: null
      }, {
        onConflict: 'canonical_opportunity_key'
      })
      .select();
    
    if (masterError) {
      console.error('[MRT] Error saving to opportunity_master:', masterError);
      return false;
    }
    
    if (!masterData || masterData.length === 0) {
      console.error('[MRT] No data returned after upsert');
      return false;
    }
    
    const opportunityId = masterData[0].id;
    
    // Save to opportunity_sources
    const rawRecord = {
      article_id: article.id,
      article_url: article.url,
      article_title: article.title,
      published_date: article.publishedDate.toISOString(),
      vendor_name: contract.vendorName,
      vendor_location: contract.vendorLocation,
      vendor_city: contract.vendorCity,
      vendor_state: contract.vendorState,
      contract_number: contract.contractNumber,
      award_amount: contract.awardAmount,
      contract_description: contract.contractDescription,
      service_branch: contract.serviceBranch,
      contracting_activity: contract.contractingActivity,
      completion_date: contract.completionDate?.toISOString(),
      is_small_business: contract.isSmallBusiness,
      contract_types: contract.contractTypes,
      is_idiq: contract.isIDIQ,
      is_multiple_award: contract.isMultipleAward,
      competition_type: contract.competitionType,
      set_aside_type: contract.setAsideType,
      naics_code: contract.naicsCode,
      parsing_confidence: contract.parsingConfidence,
      raw_paragraph: contract.rawParagraph
    };
    
    await supabase
      .from('opportunity_sources')
      .upsert({
        opportunity_id: opportunityId,
        source_name: 'dod_contract_news',
        source_table: 'dod_contract_news',
        source_primary_key: `${article.id}-${contract.contractNumber || Date.now()}`,
        source_url: article.url,
        raw_record: rawRecord,
        ingested_at: new Date().toISOString(),
        match_confidence: contract.parsingConfidence * 100,
        match_method: 'direct_scrape'
      }, {
        onConflict: 'opportunity_id,source_name,source_primary_key'
      });
    
    console.log(`[MRT]   ✅ ${contract.vendorName}`);
    console.log(`[MRT]   💰 ${contract.awardAmountText || 'Unknown'}`);
    console.log(`[MRT]   🚗 ${vehicleType || 'Unknown'}`);
    console.log(`[MRT]   📊 Quality: ${qualityScore}/100\n`);
    
    return true;
    
  } catch (error) {
    console.error('[MRT] Exception saving:', error);
    return false;
  }
}

// ============================================
// MAIN SCRAPER
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  MAKE READY TECH - DOD CONTRACT NEWS SCRAPER');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Find recent articles
    const articles = await findRecentArticles(10);
    
    if (articles.length === 0) {
      console.log('❌ No articles found. Exiting.');
      return;
    }
    
    let totalContracts = 0;
    let totalSaved = 0;
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      console.log(`${'─'.repeat(60)}`);
      console.log(`📰 Article ${i + 1}/${articles.length}`);
      console.log(`   ${article.title}`);
      console.log(`   ${article.publishedDate.toISOString().split('T')[0]}`);
      console.log(`${'─'.repeat(60)}\n`);
      
      try {
        // Fetch HTML
        const html = await fetchArticleHTML(article.url);
        if (!html) {
          console.log('❌ Failed to fetch HTML\n');
          continue;
        }
        
        // Parse HTML
        const contractParagraphs = parseArticleHTML(html);
        console.log(`   📄 Found ${contractParagraphs.length} contracts\n`);
        
        let sequenceNum = 1;
        
        // Extract and save each contract
        for (const paragraphData of contractParagraphs) {
          const contract = extractContractData(paragraphData.text, paragraphData.serviceBranch);
          if (contract) {
            totalContracts++;
            
            if (!contract.contractNumber || contract.contractNumber.length < 10) {
              contract.contractNumber = `${article.id}-SEQ-${String(sequenceNum).padStart(3, '0')}`;
            }
            sequenceNum++;
            
            const success = await saveToOpportunityMaster(contract, article);
            if (success) totalSaved++;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`❌ Error processing article: ${error.message}\n`);
      }
    }
    
    await closeBrowser();
    
    console.log('='.repeat(60));
    console.log('  SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Articles: ${articles.length}`);
    console.log(`  Contracts found: ${totalContracts}`);
    console.log(`  Contracts saved: ${totalSaved}`);
    console.log(`  Success rate: ${totalContracts > 0 ? Math.round(totalSaved / totalContracts * 100) : 0}%`);
    console.log('='.repeat(60) + '\n');
    
    console.log('✅ Scraping complete!\n');
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await closeBrowser();
  }
}

// Run the scraper
main();

