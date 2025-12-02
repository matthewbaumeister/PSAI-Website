/**
 * ============================================
 * PROPSHOP.AI - COMPREHENSIVE GOV CONTRACT SCRAPER
 * ============================================
 * 
 * The ULTIMATE government contract news scraper that leaves NO data behind.
 * Extracts EVERY possible detail from defense.gov contract announcements
 * and saves directly to the master opportunities table.
 * 
 * Features:
 * - Extracts ALL contract metadata (vehicles, mods, FMS, SBIR, etc.)
 * - Rich parsing of financial data, locations, timelines
 * - Automatic categorization and tagging
 * - Industry/technology classification
 * - Performance location breakdown
 * - Funding source analysis
 * - Vendor network mapping
 * - Data quality scoring
 * - Multi-source consolidation ready
 * 
 * Copyright (c) 2024 Billow LLC dba PropShop.ai
 * ============================================
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_INDEX_URL = `${BASE_URL}/News/Contracts/`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// TYPES
// ============================================

interface ContractArticle {
  id: string;
  url: string;
  title: string;
  publishedDate: Date;
  fiscalYear: number;
}

interface ExtractedContract {
  // Core Identifiers
  contractNumber?: string;
  solicitationNumber?: string;
  modificationNumber?: string;
  baseContractNumber?: string;
  cageCode?: string;
  duns?: string;
  uei?: string;
  
  // Vendor Information
  vendorName: string;
  vendorLocation?: string;
  vendorCity?: string;
  vendorState?: string;
  vendorCountry?: string;
  vendorZipCode?: string;
  
  // Financial Data
  awardAmount?: number;
  awardAmountText?: string;
  baseContractValue?: number;
  optionsValue?: number;
  cumulativeValue?: number;
  totalObligatedAmount?: number;
  incrementalFunding?: number;
  
  // Contract Structure
  contractTypes: string[];
  isIDIQ: boolean;
  isMultipleAward: boolean;
  isHybridContract: boolean;
  hasOptions: boolean;
  numberOfAwards?: number;
  
  // Modification Details
  isModification: boolean;
  isOptionExercise: boolean;
  modificationValue?: number;
  modificationType?: string;
  cumulativeModValue?: number;
  
  // Competition & Award Type
  isCompeted: boolean | null;
  competitionType?: string;
  numberOfOffersReceived?: number;
  nonCompeteAuthority?: string;
  nonCompeteJustification?: string;
  
  // Small Business & Set-Asides
  isSmallBusiness: boolean;
  isSmallBusinessSetAside: boolean;
  setAsideType?: string;
  socioeconomicPrograms: string[];
  
  // SBIR/STTR
  isSBIR: boolean;
  isSTTR: boolean;
  sbirPhase?: string;
  sbirTopicNumber?: string;
  
  // Foreign Military Sales
  isFMS: boolean;
  fmsCountries: string[];
  fmsAmount?: number;
  fmsPercentage?: number;
  
  // Agencies & Organizations
  serviceBranch?: string;
  contractingActivity?: string;
  contractingOffice?: string;
  majorCommand?: string;
  programOffice?: string;
  
  // Work Description & Scope
  workDescription: string;
  scopeOfWork?: string;
  deliverables: string[];
  keywords: string[];
  industryTags: string[];
  technologyTags: string[];
  serviceTags: string[];
  domainCategory?: string;
  
  // Performance Locations
  performanceLocations: string[];
  performanceLocationBreakdown: Array<{
    location: string;
    city?: string;
    state?: string;
    country?: string;
    percentage?: number;
    isCONUS: boolean;
    isOCONUS: boolean;
  }>;
  
  // Funding Details
  fundingSources: Array<{
    fiscalYear: number;
    type: string; // 'O&M', 'RDT&E', 'Procurement', etc.
    amount: number;
    percentage: number;
  }>;
  fundsExpire: boolean;
  fundsExpireDate?: Date;
  
  // Timeline
  awardDate: Date;
  completionDate?: Date;
  periodOfPerformanceStart?: Date;
  periodOfPerformanceEnd?: Date;
  optionsPeriodEnd?: Date;
  orderingPeriodEnd?: Date;
  
  // Classification
  naicsCodes: string[];
  primaryNAICS?: string;
  pscCodes: string[];
  primaryPSC?: string;
  
  // Teaming & Subcontracting
  isTeaming: boolean;
  teamMembers: string[];
  primeContractor?: string;
  subcontractors: string[];
  teamWorkShare: Array<{
    company: string;
    role: string;
    percentage?: number;
    location?: string;
  }>;
  smallBusinessSubcontractingPlan: boolean;
  subcontractingGoal?: number;
  
  // Weapon Systems & Platforms
  weaponSystems: string[];
  platforms: string[];
  programNames: string[];
  
  // Quality & Metadata
  rawParagraph: string;
  parsingConfidence: number;
  dataQualityScore: number;
  extractionMethod: string;
}

// ============================================
// BROWSER MANAGEMENT
// ============================================

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    console.log('🚀 Launching browser...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
  }
  return browserInstance;
}

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('👋 Browser closed');
  }
}

// ============================================
// ARTICLE DISCOVERY
// ============================================

function parseDateFromTitle(title: string): Date | null {
  const patterns = [
    // "Contracts For March 15, 2024"
    /Contracts\s+For\s+([A-Za-z]+)\.?\s+(\d+),?\s+(\d{4})/i,
    // "Contracts for March 15, 2024"
    /Contracts\s+for\s+([A-Za-z]+)\s+(\d+),?\s+(\d{4})/i,
    // "March 15, 2024 Contracts"
    /([A-Za-z]+)\s+(\d+),?\s+(\d{4})\s+Contracts/i
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const [, monthStr, day, year] = match;
      
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
      if (month !== undefined) {
        const date = new Date(parseInt(year), month, parseInt(day));
        // Calculate fiscal year (Oct 1 - Sep 30)
        const fiscalYear = date.getMonth() >= 9 ? date.getFullYear() + 1 : date.getFullYear();
        return date;
      }
    }
  }
  
  return null;
}

async function discoverContractArticles(daysBack: number = 30): Promise<ContractArticle[]> {
  console.log(`\n🔍 Discovering contract articles (last ${daysBack} days)...\n`);
  
  const articles: ContractArticle[] = [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`   Loading: ${CONTRACTS_INDEX_URL}`);
    await page.goto(CONTRACTS_INDEX_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    console.log(`   Page loaded (${html.length} bytes)`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    $('.item, .river-item, article').each((_, element) => {
      const $item = $(element);
      const $link = $item.find('a').first();
      const title = $link.text().trim();
      const relativeUrl = $link.attr('href');
      
      if (!title.toLowerCase().includes('contracts for') || !relativeUrl) {
        return;
      }
      
      const articleDate = parseDateFromTitle(title);
      if (!articleDate || articleDate < cutoffDate) {
        return;
      }
      
      const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : BASE_URL + relativeUrl;
      const articleId = fullUrl.match(/Article\/(\d+)/)?.[1] || `UNKNOWN-${Date.now()}`;
      const fiscalYear = articleDate.getMonth() >= 9 ? articleDate.getFullYear() + 1 : articleDate.getFullYear();
      
      articles.push({
        id: articleId,
        url: fullUrl,
        title,
        publishedDate: articleDate,
        fiscalYear
      });
    });
    
    console.log(`✅ Found ${articles.length} articles\n`);
    
  } catch (error: any) {
    console.error(`❌ Error discovering articles: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return articles;
}

// ============================================
// ARTICLE FETCHING & PARSING
// ============================================

async function fetchArticleHTML(url: string): Promise<string | null> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    
    if (response?.status() !== 200) {
      console.error(`   ❌ HTTP ${response?.status()}`);
      return null;
    }
    
    const html = await page.content();
    return html;
    
  } catch (error: any) {
    console.error(`   ❌ Fetch error: ${error.message}`);
    return null;
  } finally {
    await page.close();
  }
}

function parseContractParagraphs(html: string): Array<{ text: string; serviceBranch: string }> {
  const $ = cheerio.load(html);
  const paragraphs: Array<{ text: string; serviceBranch: string }> = [];
  
  const branchHeaders = [
    'Department of the Air Force',
    'Department of the Army',
    'Department of the Navy',
    'Defense Logistics Agency',
    'U.S. Special Operations Command',
    'Missile Defense Agency',
    'Defense Advanced Research Projects Agency',
    'Defense Threat Reduction Agency',
    'U.S. Space Force',
    'U.S. Transportation Command',
    'Air Force',
    'Army',
    'Navy',
    'Marine Corps',
    'Space Force',
    'Defense'
  ];
  
  let currentBranch = 'Department of Defense';
  
  // Find the main content area
  const $content = $('.body, .article-body, [itemprop="articleBody"], .content').first();
  
  $content.find('p, div.paragraph').each((_, el) => {
    const text = $(el).text().trim();
    
    // Skip empty or very short paragraphs
    if (text.length < 50) return;
    
    // Check if this is a branch header
    for (const header of branchHeaders) {
      if (text.includes(header)) {
        currentBranch = header.replace('Department of the ', '').replace('U.S. ', '');
        return; // Don't process header as contract
      }
    }
    
    // Check if this looks like a contract paragraph
    // Must have: company name, dollar amount, and reasonable length
    const hasCompanyName = /^[A-Z]/.test(text) && /[A-Z][a-z]+/.test(text);
    const hasDollarAmount = /\$[\d,]+/.test(text);
    const hasContractLanguage = /(contract|award|modification|option)/i.test(text);
    
    if (hasCompanyName && hasDollarAmount && hasContractLanguage && text.length > 100) {
      paragraphs.push({
        text,
        serviceBranch: currentBranch
      });
    }
  });
  
  return paragraphs;
}

// ============================================
// CONTRACT DATA EXTRACTION (COMPREHENSIVE)
// ============================================

function extractVendorInfo(text: string): {
  vendorName: string;
  vendorCity?: string;
  vendorState?: string;
  vendorCountry?: string;
  vendorLocation?: string;
} {
  // Extract vendor name (usually at start, before comma or asterisk)
  const nameMatch = text.match(/^([^,(*\n]+)/);
  const vendorName = nameMatch ? nameMatch[1].trim() : 'Unknown Vendor';
  
  // Extract location: "City, State" or "City, State, ZIP" or just state
  const locationPatterns = [
    // "San Diego, California"
    /\*?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    // "California" (state only)
    /\*?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:has been|was|is awarded)/
  ];
  
  let vendorCity, vendorState, vendorCountry, vendorLocation;
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        // Has both city and state
        vendorCity = match[1];
        vendorState = match[2];
        vendorLocation = `${vendorCity}, ${vendorState}`;
      } else {
        // State only
        vendorState = match[1];
        vendorLocation = vendorState;
      }
      vendorCountry = 'United States';
      break;
    }
  }
  
  return { vendorName, vendorCity, vendorState, vendorCountry, vendorLocation };
}

function extractFinancialData(text: string): {
  awardAmount?: number;
  awardAmountText?: string;
  baseContractValue?: number;
  optionsValue?: number;
  cumulativeValue?: number;
  totalObligatedAmount?: number;
  incrementalFunding?: number;
  hasOptions: boolean;
} {
  let awardAmount, awardAmountText, baseContractValue, optionsValue, cumulativeValue;
  let totalObligatedAmount, incrementalFunding;
  let hasOptions = false;
  
  // Primary award amount
  const amountPatterns = [
    // "$1.5 billion"
    /\$(\d+(?:\.\d+)?)\s*(billion)/i,
    // "$150 million"
    /\$(\d+(?:\.\d+)?)\s*(million)/i,
    // "$150,000,000"
    /\$(\d{1,3}(?:,\d{3})+)/,
    // "$150000"
    /\$(\d+)/
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
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
  
  // Check for options language
  if (/options?|if all options/i.test(text)) {
    hasOptions = true;
    
    // "if all options are exercised, the cumulative value... $500 million"
    const cumulativeMatch = text.match(/cumulative value.*?\$(\d+(?:\.\d+)?)\s*(billion|million)/i);
    if (cumulativeMatch) {
      const multiplier = cumulativeMatch[2] === 'billion' ? 1_000_000_000 : 1_000_000;
      cumulativeValue = parseFloat(cumulativeMatch[1]) * multiplier;
      
      if (awardAmount) {
        optionsValue = cumulativeValue - awardAmount;
      }
    }
  }
  
  // Obligated amount
  const obligatedMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:has been|is being|was)\s+obligated/i);
  if (obligatedMatch) {
    totalObligatedAmount = parseFloat(obligatedMatch[1].replace(/,/g, ''));
  }
  
  // Incremental funding
  const incrementalMatch = text.match(/incrementally funded.*?\$(\d+(?:,\d{3})*)/i);
  if (incrementalMatch) {
    incrementalFunding = parseFloat(incrementalMatch[1].replace(/,/g, ''));
  }
  
  return {
    awardAmount,
    awardAmountText,
    baseContractValue: hasOptions && awardAmount ? awardAmount : undefined,
    optionsValue,
    cumulativeValue,
    totalObligatedAmount,
    incrementalFunding,
    hasOptions
  };
}

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
    'firm-fixed-price': /\b(?:firm-fixed-price|FFP)\b/i,
    'cost-plus-fixed-fee': /\b(?:cost-plus-fixed-fee|CPFF)\b/i,
    'cost-plus-incentive-fee': /\b(?:cost-plus-incentive-fee|CPIF)\b/i,
    'cost-plus-award-fee': /\b(?:cost-plus-award-fee|CPAF)\b/i,
    'fixed-price-incentive-fee': /\b(?:fixed-price-incentive-fee|FPIF)\b/i,
    'cost-reimbursable': /\b(?:cost-reimbursable|CR)\b/i,
    'cost-no-fee': /\b(?:cost-no-fee|cost-only)\b/i,
    'time-and-materials': /\b(?:time-and-materials|T&M)\b/i,
    'labor-hour': /\b(?:labor-hour|LH)\b/i,
  };
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(text)) {
      types.push(type);
    }
  }
  
  if (/indefinite-delivery[\/\s]+indefinite-quantity|IDIQ/i.test(text)) {
    types.push('IDIQ');
    isIDIQ = true;
  }
  
  if (/multiple[-\s]award/i.test(text)) {
    isMultipleAward = true;
  }
  
  // Hybrid if multiple types OR explicitly stated
  if (types.length > 1 || /hybrid/i.test(text)) {
    isHybridContract = true;
  }
  
  return { types, isIDIQ, isMultipleAward, isHybridContract };
}

function extractModificationInfo(text: string): {
  isModification: boolean;
  isOptionExercise: boolean;
  modificationNumber?: string;
  baseContractNumber?: string;
  modificationType?: string;
  modificationValue?: number;
} {
  let isModification = false;
  let isOptionExercise = false;
  let modificationNumber, baseContractNumber, modificationType;
  let modificationValue;
  
  if (/modification|to previously awarded|contract.*?modified/i.test(text)) {
    isModification = true;
    
    // Extract mod number
    const modNumMatch = text.match(/modification\s*(?:number\s*)?([A-Z0-9-]+)|modification\s*\(([A-Z0-9-]+)\)/i);
    if (modNumMatch) {
      modificationNumber = modNumMatch[1] || modNumMatch[2];
    }
    
    // Extract base contract number
    const baseMatch = text.match(/(?:previously awarded |base )?contract\s*(?:number\s*)?([A-Z0-9-]{10,})/i);
    if (baseMatch) {
      baseContractNumber = baseMatch[1];
    }
    
    // Check if option exercise
    if (/to exercise options?|option.*?exercised/i.test(text)) {
      isOptionExercise = true;
      modificationType = 'option exercise';
    } else {
      modificationType = 'scope modification';
    }
    
    // Extract mod value
    const modValueMatch = text.match(/modification.*?\$(\d+(?:\.\d+)?)\s*(billion|million)/i);
    if (modValueMatch) {
      const multiplier = modValueMatch[2] === 'billion' ? 1_000_000_000 : 1_000_000;
      modificationValue = parseFloat(modValueMatch[1]) * multiplier;
    }
  }
  
  return {
    isModification,
    isOptionExercise,
    modificationNumber,
    baseContractNumber,
    modificationType,
    modificationValue
  };
}

function extractCompetitionInfo(text: string): {
  isCompeted: boolean | null;
  competitionType?: string;
  numberOfOffersReceived?: number;
  nonCompeteAuthority?: string;
  nonCompeteJustification?: string;
} {
  let isCompeted: boolean | null = null;
  let competitionType, nonCompeteAuthority, nonCompeteJustification;
  let numberOfOffersReceived;
  
  if (/(?:was )?not competed|non-competitive|sole[-\s]source/i.test(text)) {
    isCompeted = false;
    competitionType = 'sole source';
    
    // Extract authority
    const authorityMatch = text.match(/authority of\s+([^,.;]+)/i);
    if (authorityMatch) {
      nonCompeteAuthority = authorityMatch[1].trim();
    }
    
    // Extract justification
    const justMatch = text.match(/as implemented by\s+([^,.;]+)/i);
    if (justMatch) {
      nonCompeteJustification = justMatch[1].trim();
    }
  } else if (/full and open competition|competitively awarded/i.test(text)) {
    isCompeted = true;
    competitionType = 'full and open';
  } else if (/limited competition/i.test(text)) {
    isCompeted = true;
    competitionType = 'limited';
  }
  
  // Extract number of offers
  const offersMatch = text.match(/(\w+)\s+offers?\s+(?:were\s+)?received/i);
  if (offersMatch) {
    const word = offersMatch[1].toLowerCase();
    const numberWords: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    numberOfOffersReceived = numberWords[word] || parseInt(word) || undefined;
  }
  
  return {
    isCompeted,
    competitionType,
    numberOfOffersReceived,
    nonCompeteAuthority,
    nonCompeteJustification
  };
}

function extractSetAsideInfo(text: string): {
  isSmallBusiness: boolean;
  isSmallBusinessSetAside: boolean;
  setAsideType?: string;
  socioeconomicPrograms: string[];
} {
  const isSmallBusiness = /small business/i.test(text);
  let isSmallBusinessSetAside = false;
  let setAsideType;
  const socioeconomicPrograms: string[] = [];
  
  if (/set-aside|set aside/i.test(text)) {
    isSmallBusinessSetAside = true;
    
    const setAsidePatterns = [
      { regex: /8\(a\)(?:\s+(?:sole\s+source|set-?aside|business development|program))/i, type: '8(a)', program: '8(a) Business Development' },
      { regex: /HUBZone/i, type: 'HUBZone', program: 'HUBZone' },
      { regex: /service-disabled\s+veteran-owned|SDVOSB/i, type: 'SDVOSB', program: 'Service-Disabled Veteran-Owned Small Business' },
      { regex: /economically\s+disadvantaged\s+woman-owned|EDWOSB/i, type: 'EDWOSB', program: 'Economically Disadvantaged Woman-Owned' },
      { regex: /woman-owned\s+small\s+business|WOSB/i, type: 'WOSB', program: 'Woman-Owned Small Business' },
      { regex: /total\s+small\s+business/i, type: 'Total SB', program: 'Total Small Business' },
      { regex: /small\s+business\s+set-?aside/i, type: 'SB Set-Aside', program: 'Small Business Set-Aside' }
    ];
    
    for (const pattern of setAsidePatterns) {
      if (pattern.regex.test(text)) {
        setAsideType = pattern.type;
        socioeconomicPrograms.push(pattern.program);
        break;
      }
    }
  }
  
  return { isSmallBusiness, isSmallBusinessSetAside, setAsideType, socioeconomicPrograms };
}

function extractSBIRInfo(text: string): {
  isSBIR: boolean;
  isSTTR: boolean;
  sbirPhase?: string;
  sbirTopicNumber?: string;
} {
  const isSBIR = /\bSBIR\b/i.test(text);
  const isSTTR = /\bSTTR\b/i.test(text);
  let sbirPhase, sbirTopicNumber;
  
  if (isSBIR || isSTTR) {
    // Extract phase
    const phaseMatch = text.match(/Phase\s+(I{1,3}|[123])/i);
    if (phaseMatch) {
      sbirPhase = `Phase ${phaseMatch[1]}`;
    }
    
    // Extract topic number
    const topicMatch = text.match(/topic\s+(?:number\s+)?([A-Z]{1,4}\d{2}-\d{3})/i);
    if (topicMatch) {
      sbirTopicNumber = topicMatch[1];
    }
  }
  
  return { isSBIR, isSTTR, sbirPhase, sbirTopicNumber };
}

function extractFMSInfo(text: string): {
  isFMS: boolean;
  fmsCountries: string[];
  fmsAmount?: number;
  fmsPercentage?: number;
} {
  const isFMS = /Foreign Military Sales|FMS/i.test(text);
  const fmsCountries: string[] = [];
  let fmsAmount, fmsPercentage;
  
  if (isFMS) {
    // Extract countries
    const countriesMatch = text.match(/(?:on behalf of|for)\s+([A-Z][a-z]+(?:,?\s+and\s+[A-Z][a-z]+)*)/);
    if (countriesMatch) {
      const countryList = countriesMatch[1].split(/,\s*and\s*|,\s*|\s+and\s+/);
      fmsCountries.push(...countryList.map(c => c.trim()));
    }
    
    // Extract FMS percentage
    const pctMatch = text.match(/(\d+)%\s+Foreign Military Sales/i);
    if (pctMatch) {
      fmsPercentage = parseInt(pctMatch[1]);
    }
  }
  
  return { isFMS, fmsCountries, fmsAmount, fmsPercentage };
}

function extractPerformanceLocations(text: string): {
  locations: string[];
  breakdown: Array<{
    location: string;
    city?: string;
    state?: string;
    country?: string;
    percentage?: number;
    isCONUS: boolean;
    isOCONUS: boolean;
  }>;
} {
  const locations: string[] = [];
  const breakdown: Array<any> = [];
  
  // Find "Work will be performed in..." section
  const perfLocationMatch = text.match(/Work will be performed in ([^.]+)\./i);
  if (perfLocationMatch) {
    const locationText = perfLocationMatch[1];
    
    // Split by semicolons or commas
    const parts = locationText.split(/;\s*/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      // Extract percentage if present
      const pctMatch = trimmed.match(/\((\d+)%\)/);
      const percentage = pctMatch ? parseInt(pctMatch[1]) : undefined;
      
      // Extract location
      const locationMatch = trimmed.match(/([^(]+)/);
      const location = locationMatch ? locationMatch[1].trim() : trimmed;
      
      // Parse city/state
      const cityStateMatch = location.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      const city = cityStateMatch ? cityStateMatch[1] : undefined;
      const state = cityStateMatch ? cityStateMatch[2] : undefined;
      
      const isCONUS = !/(outside\s+the\s+continental|OCONUS|overseas)/i.test(location);
      const isOCONUS = !isCONUS;
      
      locations.push(location);
      breakdown.push({
        location,
        city,
        state,
        country: isCONUS ? 'United States' : undefined,
        percentage,
        isCONUS,
        isOCONUS
      });
    }
  }
  
  return { locations, breakdown };
}

function extractFundingDetails(text: string): {
  fundingSources: Array<{
    fiscalYear: number;
    type: string;
    amount: number;
    percentage: number;
  }>;
  fundsExpire: boolean;
  fundsExpireDate?: Date;
} {
  const fundingSources: Array<any> = [];
  let fundsExpire = false;
  let fundsExpireDate;
  
  // Extract fiscal year funding
  const fyMatches = text.matchAll(/fiscal\s+(?:year\s+)?(\d{4})\s+([A-Z&]+).*?\$(\d+(?:,\d{3})*)/gi);
  for (const match of fyMatches) {
    const fiscalYear = parseInt(match[1]);
    const type = match[2]; // O&M, RDT&E, etc.
    const amount = parseFloat(match[3].replace(/,/g, ''));
    
    fundingSources.push({
      fiscalYear,
      type,
      amount,
      percentage: 0 // Calculate later if total is known
    });
  }
  
  // Check if funds expire
  if (/funds will expire|funds expire/i.test(text)) {
    fundsExpire = true;
    
    const expireMatch = text.match(/expire.*?(?:on|by)\s+([A-Z][a-z]+\s+\d+,\s+\d{4})/i);
    if (expireMatch) {
      fundsExpireDate = new Date(expireMatch[1]);
    }
  }
  
  return { fundingSources, fundsExpire, fundsExpireDate };
}

function extractTimeline(text: string, awardDate: Date): {
  completionDate?: Date;
  periodOfPerformanceStart?: Date;
  periodOfPerformanceEnd?: Date;
  optionsPeriodEnd?: Date;
  orderingPeriodEnd?: Date;
} {
  let completionDate, periodOfPerformanceStart, periodOfPerformanceEnd;
  let optionsPeriodEnd, orderingPeriodEnd;
  
  // Completion date
  const completionMatches = [
    /(?:expected to be completed|completion date|work is expected)\s+(?:by\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(?:expected to be completed|completion date|work is expected)\s+(?:by\s+)?([A-Z][a-z]+\s+\d{4})/i
  ];
  
  for (const pattern of completionMatches) {
    const match = text.match(pattern);
    if (match) {
      completionDate = new Date(match[1]);
      break;
    }
  }
  
  // Period of performance
  const popMatch = text.match(/period of performance.*?through\s+([A-Z][a-z]+\s+\d{4})/i);
  if (popMatch) {
    periodOfPerformanceEnd = new Date(popMatch[1]);
    periodOfPerformanceStart = awardDate;
  }
  
  // Ordering period (for IDIQs)
  const orderingMatch = text.match(/ordering period.*?through\s+([A-Z][a-z]+\s+\d{4})/i);
  if (orderingMatch) {
    orderingPeriodEnd = new Date(orderingMatch[1]);
  }
  
  return {
    completionDate,
    periodOfPerformanceStart,
    periodOfPerformanceEnd,
    optionsPeriodEnd,
    orderingPeriodEnd
  };
}

function extractClassification(text: string): {
  naicsCodes: string[];
  primaryNAICS?: string;
  pscCodes: string[];
  primaryPSC?: string;
} {
  const naicsCodes: string[] = [];
  const pscCodes: string[] = [];
  
  // NAICS
  const naicsMatches = text.matchAll(/NAICS\s+(?:code\s+)?(\d{6})/gi);
  for (const match of naicsMatches) {
    naicsCodes.push(match[1]);
  }
  
  // PSC (Product/Service Code)
  const pscMatches = text.matchAll(/(?:PSC|product service code)\s+([A-Z]\d{3})/gi);
  for (const match of pscMatches) {
    pscCodes.push(match[1]);
  }
  
  return {
    naicsCodes,
    primaryNAICS: naicsCodes[0],
    pscCodes,
    primaryPSC: pscCodes[0]
  };
}

function extractTeamingInfo(text: string): {
  isTeaming: boolean;
  teamMembers: string[];
  primeContractor?: string;
  subcontractors: string[];
  teamWorkShare: Array<{
    company: string;
    role: string;
    percentage?: number;
  }>;
  smallBusinessSubcontractingPlan: boolean;
  subcontractingGoal?: number;
} {
  const isTeaming = /team|subcontract|prime contractor/i.test(text);
  const teamMembers: string[] = [];
  const subcontractors: string[] = [];
  const teamWorkShare: Array<any> = [];
  let primeContractor;
  let smallBusinessSubcontractingPlan = false;
  let subcontractingGoal;
  
  if (/prime contractor/i.test(text)) {
    const primeMatch = text.match(/prime contractor[:\s]+([A-Z][^,.\n]+)/i);
    if (primeMatch) {
      primeContractor = primeMatch[1].trim();
    }
  }
  
  if (/subcontractor/i.test(text)) {
    const subMatch = text.match(/subcontractor[s]?[:\s]+([A-Z][^.]+)/i);
    if (subMatch) {
      const subs = subMatch[1].split(/,\s*and\s*|,\s*|\s+and\s+/);
      subcontractors.push(...subs.map(s => s.trim()));
    }
  }
  
  if (/small business subcontracting plan/i.test(text)) {
    smallBusinessSubcontractingPlan = true;
    
    const goalMatch = text.match(/(\d+)%\s+small business/i);
    if (goalMatch) {
      subcontractingGoal = parseInt(goalMatch[1]);
    }
  }
  
  return {
    isTeaming,
    teamMembers,
    primeContractor,
    subcontractors,
    teamWorkShare,
    smallBusinessSubcontractingPlan,
    subcontractingGoal
  };
}

function extractWeaponSystemsAndPrograms(text: string): {
  weaponSystems: string[];
  platforms: string[];
  programNames: string[];
} {
  const weaponSystems: string[] = [];
  const platforms: string[] = [];
  const programNames: string[] = [];
  
  // Common weapon systems
  const weaponPatterns = [
    /F-\d{2}[A-Z]?/g, // F-35, F-22, etc.
    /B-\d{1,2}[A-Z]?/g, // B-2, B-21, etc.
    /C-\d{2,3}[A-Z]?/g, // C-130, C-17, etc.
    /KC-\d{2}[A-Z]?/g, // KC-46, etc.
    /MQ-\d{1,2}[A-Z]?/g, // MQ-9, etc.
    /RQ-\d{1,2}[A-Z]?/g, // RQ-4, etc.
    /CH-\d{2}[A-Z]?/g, // CH-47, etc.
    /UH-\d{2}[A-Z]?/g, // UH-60, etc.
    /AH-\d{2}[A-Z]?/g, // AH-64, etc.
    /M\d+[A-Z]\d*/g, // M1A2, M4, etc.
    /DDG-\d+/g, // DDG-51, etc.
    /CVN-\d+/g, // CVN-78, etc.
    /SSN-\d+/g, // SSN-774, etc.
  ];
  
  for (const pattern of weaponPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      weaponSystems.push(...matches);
    }
  }
  
  // Common platforms
  const platformPatterns = [
    /Joint Strike Fighter|JSF/gi,
    /Abrams/gi,
    /Bradley/gi,
    /Patriot/gi,
    /THAAD/gi,
    /Aegis/gi,
    /Tomahawk/gi,
    /JDAM/gi,
    /Predator|Reaper/gi,
    /Global Hawk/gi,
    /Chinook/gi,
    /Black Hawk/gi,
    /Apache/gi,
  ];
  
  for (const pattern of platformPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      platforms.push(...matches.map(m => m.trim()));
    }
  }
  
  return { weaponSystems, platforms, programNames };
}

function categorizeAndTag(text: string, vendorName: string): {
  keywords: string[];
  industryTags: string[];
  technologyTags: string[];
  serviceTags: string[];
  domainCategory?: string;
} {
  const keywords: string[] = [];
  const industryTags: string[] = [];
  const technologyTags: string[] = [];
  const serviceTags: string[] = [];
  let domainCategory;
  
  // Industry tags
  const industryPatterns: Record<string, RegExp[]> = {
    'Aerospace & Defense': [/aerospace|aircraft|aviation|missile|rocket/i],
    'Cybersecurity': [/cyber|information security|network security|penetration test/i],
    'IT Services': [/information technology|IT services|software development|cloud/i],
    'Professional Services': [/consulting|advisory|professional services|management/i],
    'Manufacturing': [/manufacturing|production|fabrication|assembly/i],
    'Logistics & Transportation': [/logistics|transportation|shipping|warehousing/i],
    'Medical & Healthcare': [/medical|healthcare|pharmaceutical|biomedical/i],
    'Research & Development': [/research|R&D|development|testing|evaluation/i],
    'Facilities & Construction': [/construction|facilities|infrastructure|building/i],
    'Training & Education': [/training|education|instruction|curriculum/i]
  };
  
  for (const [industry, patterns] of Object.entries(industryPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        industryTags.push(industry);
        if (!domainCategory) domainCategory = industry;
        break;
      }
    }
  }
  
  // Technology tags
  const technologyPatterns: Record<string, RegExp> = {
    'Artificial Intelligence': /artificial intelligence|AI|machine learning|ML|deep learning/i,
    'Cloud Computing': /cloud computing|AWS|Azure|SaaS|IaaS/i,
    'Cybersecurity': /cybersecurity|encryption|firewall|intrusion detection/i,
    'Data Analytics': /data analytics|big data|business intelligence|data science/i,
    'Autonomous Systems': /autonomous|unmanned|UAS|UAV|robotic/i,
    'Hypersonics': /hypersonic/i,
    'Quantum': /quantum/i,
    '5G/6G': /5G|6G|next.generation.network/i,
    'Blockchain': /blockchain|distributed ledger/i,
    'Internet of Things': /IoT|Internet of Things|connected devices/i,
    'Augmented Reality': /augmented reality|AR|virtual reality|VR|mixed reality/i
  };
  
  for (const [tech, pattern] of Object.entries(technologyPatterns)) {
    if (pattern.test(text)) {
      technologyTags.push(tech);
    }
  }
  
  // Service tags
  const servicePatterns: Record<string, RegExp> = {
    'Engineering Services': /engineering|design|analysis/i,
    'Maintenance & Repair': /maintenance|repair|overhaul|sustainment/i,
    'Training Services': /training|instruction|education/i,
    'Technical Support': /technical support|help desk|IT support/i,
    'Integration Services': /integration|implementation|deployment/i,
    'Consulting Services': /consulting|advisory services/i,
    'Program Management': /program management|project management|PMO/i,
    'Logistics Support': /logistics support|supply chain/i
  };
  
  for (const [service, pattern] of Object.entries(servicePatterns)) {
    if (pattern.test(text)) {
      serviceTags.push(service);
    }
  }
  
  // Extract key technical terms as keywords
  const technicalTerms = text.match(/\b[A-Z]{2,}(?:-\d+)?\b/g);
  if (technicalTerms) {
    keywords.push(...technicalTerms.slice(0, 10));
  }
  
  return {
    keywords,
    industryTags,
    technologyTags,
    serviceTags,
    domainCategory
  };
}

function calculateParsingConfidence(contract: Partial<ExtractedContract>): number {
  let confidence = 0.3; // Base confidence
  
  // Critical fields
  if (contract.vendorName && contract.vendorName !== 'Unknown Vendor') confidence += 0.15;
  if (contract.contractNumber) confidence += 0.10;
  if (contract.awardAmount) confidence += 0.15;
  if (contract.contractingActivity) confidence += 0.05;
  if (contract.serviceBranch) confidence += 0.05;
  
  // Enhanced fields
  if (contract.contractTypes && contract.contractTypes.length > 0) confidence += 0.05;
  if (contract.performanceLocations && contract.performanceLocations.length > 0) confidence += 0.03;
  if (contract.naicsCodes && contract.naicsCodes.length > 0) confidence += 0.03;
  if (contract.completionDate) confidence += 0.02;
  if (contract.vendorCity && contract.vendorState) confidence += 0.05;
  if (contract.industryTags && contract.industryTags.length > 0) confidence += 0.02;
  
  return Math.min(confidence, 1.0);
}

function calculateQualityScore(contract: ExtractedContract): number {
  let score = 40; // Base score
  
  // Core identifiers (20 points)
  if (contract.contractNumber) score += 10;
  if (contract.vendorName !== 'Unknown Vendor') score += 10;
  
  // Financial (15 points)
  if (contract.awardAmount) score += 10;
  if (contract.totalObligatedAmount) score += 5;
  
  // Location (10 points)
  if (contract.vendorCity && contract.vendorState) score += 5;
  if (contract.performanceLocations.length > 0) score += 5;
  
  // Contract details (15 points)
  if (contract.contractTypes.length > 0) score += 5;
  if (contract.contractingActivity) score += 5;
  if (contract.completionDate) score += 5;
  
  // Classification (10 points)
  if (contract.naicsCodes.length > 0) score += 5;
  if (contract.industryTags.length > 0) score += 5;
  
  // Advanced fields (10 points)
  if (contract.competitionType) score += 3;
  if (contract.setAsideType) score += 3;
  if (contract.fundingSources.length > 0) score += 4;
  
  return Math.min(score, 100);
}

function extractComprehensiveContractData(
  paragraph: string,
  serviceBranch: string,
  awardDate: Date
): ExtractedContract | null {
  try {
    // Extract ALL data fields
    const vendor = extractVendorInfo(paragraph);
    const financial = extractFinancialData(paragraph);
    const contractTypes = extractContractTypes(paragraph);
    const modification = extractModificationInfo(paragraph);
    const competition = extractCompetitionInfo(paragraph);
    const setAside = extractSetAsideInfo(paragraph);
    const sbir = extractSBIRInfo(paragraph);
    const fms = extractFMSInfo(paragraph);
    const performance = extractPerformanceLocations(paragraph);
    const funding = extractFundingDetails(paragraph);
    const timeline = extractTimeline(paragraph, awardDate);
    const classification = extractClassification(paragraph);
    const teaming = extractTeamingInfo(paragraph);
    const weapons = extractWeaponSystemsAndPrograms(paragraph);
    const tags = categorizeAndTag(paragraph, vendor.vendorName);
    
    // Extract contracting activity
    const contractingActivityMatch = paragraph.match(/(?:contracting activity is|awarded by)\s+([^.;]+)/i);
    const contractingActivity = contractingActivityMatch ? contractingActivityMatch[1].trim() : undefined;
    
    // Extract contract number
    const contractNumberPatterns = [
      /contract\s+(?:number\s+)?([A-Z]\d{5}[A-Z0-9-]{4,})\b/i,
      /\(([A-Z]\d{5}[A-Z0-9-]{4,})\)/,
      /\b([A-Z]\d{5}[A-Z0-9-]{4,})\b/
    ];
    
    let contractNumber;
    for (const pattern of contractNumberPatterns) {
      const match = paragraph.match(pattern);
      if (match && match[1].length >= 10) {
        contractNumber = match[1];
        break;
      }
    }
    
    // Extract deliverables
    const deliverables: string[] = [];
    if (/to provide/i.test(paragraph)) {
      const delivMatch = paragraph.match(/to provide\s+([^.;]+)/i);
      if (delivMatch) {
        deliverables.push(delivMatch[1].trim());
      }
    }
    
    // Build comprehensive contract object
    const contract: ExtractedContract = {
      // Core identifiers
      contractNumber,
      solicitationNumber: undefined,
      modificationNumber: modification.modificationNumber,
      baseContractNumber: modification.baseContractNumber,
      cageCode: undefined,
      duns: undefined,
      uei: undefined,
      
      // Vendor
      ...vendor,
      vendorCountry: vendor.vendorCountry || 'United States',
      vendorZipCode: undefined,
      
      // Financial
      ...financial,
      modificationValue: modification.modificationValue,
      
      // Contract structure
      contractTypes: contractTypes.types,
      isIDIQ: contractTypes.isIDIQ,
      isMultipleAward: contractTypes.isMultipleAward,
      isHybridContract: contractTypes.isHybridContract,
      hasOptions: financial.hasOptions,
      numberOfAwards: undefined,
      
      // Modification
      ...modification,
      cumulativeModValue: undefined,
      
      // Competition
      ...competition,
      
      // Small business
      ...setAside,
      
      // SBIR
      ...sbir,
      
      // FMS
      ...fms,
      
      // Agencies
      serviceBranch,
      contractingActivity,
      contractingOffice: undefined,
      majorCommand: undefined,
      programOffice: undefined,
      
      // Work description
      workDescription: paragraph,
      scopeOfWork: undefined,
      deliverables,
      ...tags,
      
      // Performance locations
      performanceLocations: performance.locations,
      performanceLocationBreakdown: performance.breakdown,
      
      // Funding
      ...funding,
      
      // Timeline
      awardDate,
      ...timeline,
      
      // Classification
      ...classification,
      
      // Teaming
      ...teaming,
      
      // Weapons & programs
      ...weapons,
      
      // Quality
      rawParagraph: paragraph,
      parsingConfidence: 0, // Will calculate below
      dataQualityScore: 0, // Will calculate below
      extractionMethod: 'comprehensive_regex_nlp'
    };
    
    // Calculate scores
    contract.parsingConfidence = calculateParsingConfidence(contract);
    contract.dataQualityScore = calculateQualityScore(contract);
    
    return contract;
    
  } catch (error: any) {
    console.error(`   ❌ Extraction error: ${error.message}`);
    return null;
  }
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
  const { contractNumber, agency, fiscalYear } = params;
  
  // Simple canonical key generator (fallback if DB function doesn't exist)
  const parts = [
    contractNumber || 'NO_CONTRACT',
    agency || 'UNKNOWN_AGENCY',
    fiscalYear || 'NO_FY'
  ];
  
  return `CONTRACT:${parts.join('_')}`.replace(/\s+/g, '_').toUpperCase();
}

async function saveToOpportunityMaster(
  contract: ExtractedContract,
  article: ContractArticle
): Promise<boolean> {
  try {
    const canonicalKey = await generateCanonicalKey({
      contractNumber: contract.contractNumber,
      noticeId: undefined,
      awardId: article.id,
      agency: contract.contractingActivity || contract.serviceBranch,
      fiscalYear: article.fiscalYear
    });
    
    const sourceAttributes = {
      defense_gov_contracts: {
        article_id: article.id,
        article_url: article.url,
        article_title: article.title,
        published_date: article.publishedDate.toISOString(),
        service_branch: contract.serviceBranch,
        extraction_confidence: contract.parsingConfidence,
        extraction_method: contract.extractionMethod,
        raw_paragraph_length: contract.rawParagraph.length
      }
    };
    
    const { data, error } = await supabase
      .from('opportunity_master')
      .upsert({
        canonical_opportunity_key: canonicalKey,
        
        // Identifiers
        primary_contract_number: contract.contractNumber,
        primary_award_id: article.id,
        parent_contract_number: contract.baseContractNumber,
        external_ids: {
          contract_number: contract.contractNumber,
          modification_number: contract.modificationNumber,
          base_contract_number: contract.baseContractNumber,
          cage_code: contract.cageCode,
          uei: contract.uei
        },
        
        // Descriptive
        title: article.title,
        short_description: contract.workDescription.substring(0, 500),
        full_description: contract.workDescription,
        opportunity_type: contract.isModification ? 'modification' : 'award',
        domain_category: contract.domainCategory,
        keywords: contract.keywords.length > 0 ? contract.keywords : null,
        
        // Customer
        customer_department: 'Department of Defense',
        customer_agency: contract.serviceBranch,
        customer_sub_agency: contract.majorCommand,
        customer_office: contract.contractingActivity,
        customer_location: contract.contractingActivity,
        customer_country: 'USA',
        
        // Classification
        naics_codes: contract.naicsCodes.length > 0 ? contract.naicsCodes : null,
        psc_codes: contract.pscCodes.length > 0 ? contract.pscCodes : null,
        
        // Financial
        vehicle_type: contract.isIDIQ ? 'IDIQ' : (contract.isMultipleAward ? 'Multiple Award' : null),
        ceiling_value: contract.cumulativeValue,
        estimated_value: contract.awardAmount,
        obligated_value: contract.totalObligatedAmount,
        funding_agency: contract.serviceBranch,
        contract_type: contract.contractTypes.join(', ') || null,
        set_aside_type: contract.setAsideType,
        competition_type: contract.competitionType,
        is_small_business_set_aside: contract.isSmallBusinessSetAside,
        is_sole_source: contract.competitionType === 'sole source',
        
        // Timeline
        status: contract.isModification ? 'modified' : 'awarded',
        publication_date: article.publishedDate.toISOString(),
        due_date: null,
        award_date: contract.awardDate.toISOString(),
        period_of_performance_start: contract.periodOfPerformanceStart?.toISOString(),
        period_of_performance_end: contract.periodOfPerformanceEnd?.toISOString() || contract.completionDate?.toISOString(),
        last_seen_at: new Date().toISOString(),
        
        // Suppliers
        prime_recipients: contract.vendorName !== 'Unknown Vendor' ? [contract.vendorName] : null,
        sub_recipients: contract.subcontractors.length > 0 ? contract.subcontractors : null,
        cage_codes: contract.cageCode ? [contract.cageCode] : null,
        uei_numbers: contract.uei ? [contract.uei] : null,
        
        // Source tracking
        source_attributes: sourceAttributes,
        source_count: 1,
        data_quality_score: contract.dataQualityScore,
        
        // LLM fields
        llm_summary: null,
        llm_notes: null
      }, {
        onConflict: 'canonical_opportunity_key'
      })
      .select();
    
    if (error) {
      console.error(`   ❌ DB Error: ${error.message}`);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error(`   ❌ No data returned from upsert`);
      return false;
    }
    
    const opportunityId = data[0].id;
    
    // Save to opportunity_sources
    await supabase
      .from('opportunity_sources')
      .upsert({
        opportunity_id: opportunityId,
        source_name: 'defense_gov_contracts',
        source_table: 'N/A',
        source_primary_key: `${article.id}-${contract.contractNumber || Date.now()}`,
        source_url: article.url,
        raw_record: {
          vendor: contract.vendorName,
          amount: contract.awardAmount,
          location: contract.vendorLocation,
          description: contract.workDescription,
          performance_locations: contract.performanceLocations,
          industry_tags: contract.industryTags,
          technology_tags: contract.technologyTags
        },
        ingested_at: new Date().toISOString(),
        match_confidence: contract.parsingConfidence * 100,
        match_method: 'direct_scrape'
      }, {
        onConflict: 'opportunity_id,source_name,source_primary_key'
      });
    
    return true;
    
  } catch (error: any) {
    console.error(`   ❌ Exception: ${error.message}`);
    return false;
  }
}

// ============================================
// MAIN SCRAPER EXECUTION
// ============================================

export async function runFullContractScraper(daysBack: number = 30) {
  console.log('\n' + '═'.repeat(70));
  console.log('  PROPSHOP.AI - COMPREHENSIVE GOV CONTRACT SCRAPER');
  console.log('═'.repeat(70) + '\n');
  console.log('  Extracting EVERY detail from defense.gov contract news');
  console.log('  Saving directly to master opportunities table');
  console.log('═'.repeat(70) + '\n');
  
  try {
    // Step 1: Discover articles
    const articles = await discoverContractArticles(daysBack);
    
    if (articles.length === 0) {
      console.log('❌ No articles found. Exiting.\n');
      return;
    }
    
    let totalContracts = 0;
    let totalSaved = 0;
    let totalFailed = 0;
    
    // Step 2: Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      console.log('─'.repeat(70));
      console.log(`📰 Article ${i + 1}/${articles.length}`);
      console.log(`   ${article.title}`);
      console.log(`   ${article.publishedDate.toISOString().split('T')[0]}`);
      console.log(`   ${article.url}`);
      console.log('─'.repeat(70) + '\n');
      
      try {
        // Fetch HTML
        const html = await fetchArticleHTML(article.url);
        if (!html) {
          console.log('   ❌ Failed to fetch HTML\n');
          continue;
        }
        
        // Parse paragraphs
        const paragraphs = parseContractParagraphs(html);
        console.log(`   📄 Found ${paragraphs.length} contract paragraphs\n`);
        
        let articleSaved = 0;
        
        // Extract and save each contract
        for (const para of paragraphs) {
          const contract = extractComprehensiveContractData(
            para.text,
            para.serviceBranch,
            article.publishedDate
          );
          
          if (contract) {
            totalContracts++;
            
            console.log(`   ┌─ Contract ${articleSaved + 1}`);
            console.log(`   │  Vendor: ${contract.vendorName}`);
            console.log(`   │  Value: ${contract.awardAmountText || 'TBD'}`);
            console.log(`   │  Type: ${contract.contractTypes.join(', ') || 'Standard'}`);
            console.log(`   │  Quality: ${contract.dataQualityScore}/100`);
            console.log(`   │  Confidence: ${(contract.parsingConfidence * 100).toFixed(1)}%`);
            
            const success = await saveToOpportunityMaster(contract, article);
            if (success) {
              totalSaved++;
              articleSaved++;
              console.log(`   └─ ✅ Saved\n`);
            } else {
              totalFailed++;
              console.log(`   └─ ❌ Failed to save\n`);
            }
          }
        }
        
        console.log(`   📊 Article summary: ${articleSaved}/${paragraphs.length} saved\n`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`   ❌ Article error: ${error.message}\n`);
      }
    }
    
    await closeBrowser();
    
    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('  SCRAPING COMPLETE');
    console.log('═'.repeat(70));
    console.log(`  Articles processed: ${articles.length}`);
    console.log(`  Contracts extracted: ${totalContracts}`);
    console.log(`  Contracts saved: ${totalSaved}`);
    console.log(`  Contracts failed: ${totalFailed}`);
    console.log(`  Success rate: ${totalContracts > 0 ? ((totalSaved / totalContracts) * 100).toFixed(1) : 0}%`);
    console.log('═'.repeat(70) + '\n');
    
    console.log('✅ All data has been saved to opportunity_master!\n');
    
  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await closeBrowser();
  }
}

// ============================================
// CLI EXECUTION
// ============================================

if (require.main === module) {
  const daysBack = parseInt(process.argv[2]) || 30;
  
  console.log(`\nStarting scraper (${daysBack} days back)...\n`);
  
  runFullContractScraper(daysBack)
    .then(() => {
      console.log('✅ Scraper finished successfully\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Scraper failed:', error);
      process.exit(1);
    });
}

