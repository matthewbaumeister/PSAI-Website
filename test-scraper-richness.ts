/**
 * Test scraper to examine data richness
 * Saves to JSON instead of database
 */

import * as dotenv from 'dotenv';
dotenv.config();

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_URL = 'https://www.defense.gov/News/Contracts/';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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

interface Article {
  id: number;
  url: string;
  title: string;
  publishedDate: Date;
}

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
  contractTypes?: string[];
  isIDIQ?: boolean;
  isMultipleAward?: boolean;
  isHybridContract?: boolean;
  hasOptions?: boolean;
  isModification?: boolean;
  modificationNumber?: string;
  baseContractNumber?: string;
  isOptionExercise?: boolean;
  modificationType?: string;
  isCompeted?: boolean | null;
  competitionType?: string;
  numberOfOffersReceived?: number;
  nonCompeteAuthority?: string;
  isSmallBusinessSetAside?: boolean;
  setAsideType?: string;
  naicsCode?: string;
}

function parseDateFromTitle(title: string): Date | null {
  const match = title.match(/Contracts\s+For\s+([A-Za-z]+)\.?\s+(\d+),?\s+(\d{4})/i);
  if (!match) return null;
  
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
  if (month === undefined) return null;
  
  return new Date(parseInt(year), month, parseInt(day));
}

async function findRecentArticles(limit: number = 2): Promise<Article[]> {
  console.log(`\n🔍 Finding ${limit} most recent articles...\n`);
  
  const articles: Article[] = [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto(CONTRACTS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    let articleIdCounter = 1000000;
    
    $('.item').each((_, element) => {
      if (articles.length >= limit) return false;
      
      const $item = $(element);
      const title = $item.find('a').text().trim();
      const relativeUrl = $item.find('a').attr('href');
      
      if (!title.toLowerCase().includes('contracts for') || !relativeUrl) return;
      
      const articleDate = parseDateFromTitle(title);
      if (!articleDate) return;
      
      const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : BASE_URL + relativeUrl;
      
      articles.push({
        id: articleIdCounter++,
        url: fullUrl,
        title: title,
        publishedDate: articleDate
      });
    });
    
    console.log(`✅ Found ${articles.length} articles\n`);
    
  } finally {
    await page.close();
  }
  
  return articles;
}

async function fetchArticleHTML(url: string): Promise<string | null> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    if (response?.status() !== 200) return null;

    const html = await page.content();
    return html;
    
  } catch (error) {
    console.error(`Error fetching: ${error}`);
    return null;
  } finally {
    if (page) await page.close();
  }
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
    'firm-fixed-price': /\bfirm-fixed-price\b/i,
    'cost-plus-fixed-fee': /\bcost-plus-fixed-fee\b/i,
    'cost-plus-incentive-fee': /\bcost-plus-incentive-fee\b/i,
    'fixed-price-incentive-fee': /\bfixed-price-incentive-fee\b/i,
    'cost-reimbursable': /\bcost-reimbursable\b/i,
    'time-and-materials': /\btime-and-materials\b/i,
  };
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(text)) types.push(type);
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

function extractCompetitionInfo(text: string) {
  let isCompeted: boolean | null = null;
  let competitionType: string | null = null;
  let numberOfOffers: number | null = null;
  let nonCompeteAuthority: string | null = null;
  
  if (/contract was not competed|not competitively procured|sole-source|sole source/i.test(text)) {
    isCompeted = false;
    competitionType = 'sole source';
    const authorityPattern = /authority of\s+([^,\.]+)/i;
    const authorityMatch = text.match(authorityPattern);
    if (authorityMatch) nonCompeteAuthority = authorityMatch[1].trim();
  } else if (/full and open/i.test(text)) {
    isCompeted = true;
    competitionType = 'full and open';
  }
  
  const offersPattern = /(\w+)\s+offers?\s+received/i;
  const offersMatch = text.match(offersPattern);
  if (offersMatch) {
    const numberWord = offersMatch[1].toLowerCase();
    const numberMap: Record<string, number> = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5 };
    numberOfOffers = numberMap[numberWord] || parseInt(numberWord) || null;
  }
  
  return { isCompeted, competitionType, numberOfOffers, nonCompeteAuthority };
}

function extractSetAsideInfo(text: string) {
  let isSmallBusinessSetAside = false;
  let setAsideType: string | null = null;
  
  if (/set-aside|set aside/i.test(text)) {
    isSmallBusinessSetAside = true;
    
    const setAsidePatterns = [
      { regex: /8\(a\)\s+(?:sole\s+source|set-?aside|business development)/i, type: '8(a) Business Development' },
      { regex: /HUBZone\s+set-?aside/i, type: 'HUBZone' },
      { regex: /service-disabled\s+veteran-owned\s+small\s+business|SDVOSB/i, type: 'SDVOSB' },
      { regex: /woman-owned\s+small\s+business|WOSB/i, type: 'WOSB' },
      { regex: /economically\s+disadvantaged\s+woman-owned|EDWOSB/i, type: 'EDWOSB' },
      { regex: /total\s+small\s+business\s+set-?aside/i, type: 'Total Small Business' },
      { regex: /small\s+business\s+set-?aside/i, type: 'Small Business' }
    ];
    
    for (const pattern of setAsidePatterns) {
      if (pattern.regex.test(text)) {
        setAsideType = pattern.type;
        break;
      }
    }
    
    if (!setAsideType) setAsideType = 'Small Business Set-Aside';
  }
  
  return { isSmallBusinessSetAside, setAsideType };
}

function extractNAICS(text: string): string | null {
  const naicsMatch = text.match(/NAICS\s+(?:code\s+)?(\d{6})/i);
  return naicsMatch ? naicsMatch[1] : null;
}

function extractModificationInfo(text: string) {
  let isModification = false;
  let modificationNumber: string | null = null;
  let baseContractNumber: string | null = null;
  let isOptionExercise = false;
  let modificationType: string | null = null;
  
  if (/modification.*?to previously awarded|contract modification/i.test(text)) {
    isModification = true;
    
    const modNumPattern = /modification\s*\(([A-Z0-9]+)\)/i;
    const modNumMatch = text.match(modNumPattern);
    if (modNumMatch) modificationNumber = modNumMatch[1];
    
    const basePattern = /previously awarded.*?contract\s*\(([A-Z0-9-]+)\)/i;
    const baseMatch = text.match(basePattern);
    if (baseMatch) baseContractNumber = baseMatch[1];
    
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
    const vendorNameMatch = paragraph.match(/^([^,(*]+)/);
    const vendorName = vendorNameMatch ? vendorNameMatch[1].trim() : 'Unknown Vendor';
    
    const vendorLocationMatch = paragraph.match(/,\s*\*?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    const vendorCity = vendorLocationMatch ? vendorLocationMatch[1].trim() : undefined;
    const vendorState = vendorLocationMatch ? vendorLocationMatch[2].trim() : undefined;
    const vendorLocation = (vendorCity && vendorState) ? `${vendorCity}, ${vendorState}` : undefined;
    
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
    
    const contractingActivityMatch = paragraph.match(/(?:contracting activity is|awarded by)\s+([^.]+)/i);
    const contractingActivity = contractingActivityMatch ? contractingActivityMatch[1].trim() : undefined;
    
    let serviceBranch: string | undefined = serviceBranchFromHeader;
    if (!serviceBranch) {
      if (paragraph.includes('Army')) serviceBranch = 'Army';
      else if (paragraph.includes('Navy')) serviceBranch = 'Navy';
      else if (paragraph.includes('Air Force')) serviceBranch = 'Air Force';
      else if (paragraph.includes('Marine Corps')) serviceBranch = 'Marine Corps';
      else if (paragraph.includes('Space Force')) serviceBranch = 'Space Force';
    }
    
    let completionDate: Date | undefined;
    const completionMatch = paragraph.match(/(?:expected to be completed|completion date|work is expected)\s+(?:by\s+)?([A-Z][a-z]+\s+\d{4})/i);
    if (completionMatch) {
      completionDate = new Date(completionMatch[1]);
    }
    
    const isSmallBusiness = /small business/i.test(paragraph);
    
    const contractTypesInfo = extractContractTypes(paragraph);
    const competitionInfo = extractCompetitionInfo(paragraph);
    const setAsideInfo = extractSetAsideInfo(paragraph);
    const modificationInfo = extractModificationInfo(paragraph);
    const naicsCode = extractNAICS(paragraph);
    
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
      
      contractTypes: contractTypesInfo.types.length > 0 ? contractTypesInfo.types : undefined,
      isIDIQ: contractTypesInfo.isIDIQ,
      isMultipleAward: contractTypesInfo.isMultipleAward,
      isHybridContract: contractTypesInfo.isHybridContract,
      
      isCompeted: competitionInfo.isCompeted,
      competitionType: competitionInfo.competitionType || undefined,
      numberOfOffersReceived: competitionInfo.numberOfOffers || undefined,
      nonCompeteAuthority: competitionInfo.nonCompeteAuthority || undefined,
      
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
    
    for (const branch of branchHeaders) {
      if (text.includes(branch)) {
        currentBranch = branch.toUpperCase().replace(' CONTRACTING COMMAND', '').replace(' DISTRICT OF WASHINGTON', '');
        break;
      }
    }
    
    if (text.includes('$') && text.length > 100 && /[A-Z][a-z]+/.test(text)) {
      contractParagraphs.push({
        text,
        serviceBranch: currentBranch
      });
    }
  });
  
  return contractParagraphs;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  DATA RICHNESS TEST - DOD CONTRACT SCRAPER');
  console.log('='.repeat(60) + '\n');
  
  try {
    const articles = await findRecentArticles(2);
    
    if (articles.length === 0) {
      console.log('❌ No articles found');
      return;
    }
    
    const allContracts: any[] = [];
    
    for (const article of articles) {
      console.log(`${'─'.repeat(60)}`);
      console.log(`📰 ${article.title}`);
      console.log(`${'─'.repeat(60)}\n`);
      
      const html = await fetchArticleHTML(article.url);
      if (!html) {
        console.log('❌ Failed to fetch\n');
        continue;
      }
      
      const contractParagraphs = parseArticleHTML(html);
      console.log(`   Found ${contractParagraphs.length} contracts\n`);
      
      for (const paragraphData of contractParagraphs) {
        const contract = extractContractData(paragraphData.text, paragraphData.serviceBranch);
        if (contract) {
          allContracts.push({
            article_title: article.title,
            article_date: article.publishedDate.toISOString().split('T')[0],
            article_url: article.url,
            ...contract
          });
          
          // Determine vehicle type
          let vehicleType = 'Standard';
          if (contract.isIDIQ) vehicleType = 'IDIQ';
          else if (contract.isMultipleAward) vehicleType = 'Multiple Award';
          else if (contract.competitionType?.includes('sole source')) vehicleType = 'Sole Source';
          
          console.log(`   ✓ ${contract.vendorName}`);
          console.log(`     💰 ${contract.awardAmountText || 'Unknown'}`);
          console.log(`     🚗 Vehicle: ${vehicleType}`);
          console.log(`     📊 Quality: ${Math.round(contract.parsingConfidence * 100)}/100`);
          if (contract.contractTypes && contract.contractTypes.length > 0) {
            console.log(`     📄 Types: ${contract.contractTypes.join(', ')}`);
          }
          if (contract.competitionType) {
            console.log(`     🏆 Competition: ${contract.competitionType}`);
          }
          if (contract.setAsideType) {
            console.log(`     🎯 Set-Aside: ${contract.setAsideType}`);
          }
          if (contract.naicsCode) {
            console.log(`     🏭 NAICS: ${contract.naicsCode}`);
          }
          if (contract.isModification) {
            console.log(`     🔄 Modification: ${contract.modificationType}`);
          }
          console.log('');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await closeBrowser();
    
    // Save to JSON
    const filename = `extracted-contracts-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(allContracts, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('  SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Articles processed: ${articles.length}`);
    console.log(`  Contracts extracted: ${allContracts.length}`);
    console.log(`  Saved to: ${filename}`);
    console.log('='.repeat(60) + '\n');
    
    // Stats
    const withVehicleType = allContracts.filter(c => c.isIDIQ || c.isMultipleAward || c.competitionType).length;
    const withContractTypes = allContracts.filter(c => c.contractTypes && c.contractTypes.length > 0).length;
    const withSetAside = allContracts.filter(c => c.setAsideType).length;
    const withNAICS = allContracts.filter(c => c.naicsCode).length;
    const withModifications = allContracts.filter(c => c.isModification).length;
    
    console.log('📊 DATA RICHNESS ANALYSIS:');
    console.log(`   Vehicle Type Info: ${withVehicleType}/${allContracts.length} (${Math.round(withVehicleType/allContracts.length*100)}%)`);
    console.log(`   Contract Types: ${withContractTypes}/${allContracts.length} (${Math.round(withContractTypes/allContracts.length*100)}%)`);
    console.log(`   Set-Aside Info: ${withSetAside}/${allContracts.length} (${Math.round(withSetAside/allContracts.length*100)}%)`);
    console.log(`   NAICS Codes: ${withNAICS}/${allContracts.length} (${Math.round(withNAICS/allContracts.length*100)}%)`);
    console.log(`   Modifications: ${withModifications}/${allContracts.length} (${Math.round(withModifications/allContracts.length*100)}%)`);
    console.log('\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await closeBrowser();
  }
}

main();

