/**
 * ============================================
 * Congress.gov API Client & Scraper
 * ============================================
 * 
 * Fetches legislative data from Congress.gov API to provide
 * political and lobbying context for defense contracts.
 * 
 * API Documentation: https://api.congress.gov/
 * Rate Limit: 5,000 requests/hour
 * 
 * ============================================
 */

// Load environment variables FIRST
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import axios, { AxiosError } from 'axios';

// ============================================
// Configuration
// ============================================

const CONGRESS_GOV_API_BASE = 'https://api.congress.gov/v3';
const CONGRESS_GOV_API_KEY = process.env.CONGRESS_GOV_API_KEY;
const API_RATE_LIMIT = 5000; // requests per hour (official limit)
const SAFE_REQUEST_LIMIT = 4000; // pause after 4000 to be safe for overnight runs
const REQUEST_DELAY_MS = 750; // ~1.3 req/sec to stay under limit

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Rate Limiting
// ============================================

class RateLimiter {
  private requestCount = 0;
  private resetTime = Date.now() + 3600000; // 1 hour from now
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // Check if we need to reset
    if (Date.now() >= this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 3600000;
      console.log('[Congress.gov] Rate limit reset - starting new hour');
    }

    // Check if we're at safe limit (pause after 4000 requests for overnight stability)
    if (this.requestCount >= SAFE_REQUEST_LIMIT) {
      const waitTime = this.resetTime - Date.now();
      const waitMinutes = Math.round(waitTime / 60000);
      console.log(`[Congress.gov] ⏸️  PAUSING: Hit safe limit (${SAFE_REQUEST_LIMIT} requests)`);
      console.log(`[Congress.gov] ⏰  Waiting ${waitMinutes} minutes until next hour...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.resetTime = Date.now() + 3600000;
      console.log('[Congress.gov] ▶️  RESUMING: Starting new hour');
    }

    // Make request with delay
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    this.requestCount++;
    return await requestFn();
  }
}

const rateLimiter = new RateLimiter();

// ============================================
// API Client
// ============================================

export async function congressGovApiCall(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<any> {
  return rateLimiter.makeRequest(async () => {
    try {
      const url = `${CONGRESS_GOV_API_BASE}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          ...params,
          api_key: CONGRESS_GOV_API_KEY,
          format: 'json'
        },
        timeout: 30000,
        headers: {
          'User-Agent': 'PropShop-AI-Congress-Scraper/1.0'
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          // Rate limit hit
          console.error('[Congress.gov] Rate limit hit!');
          throw new Error('Rate limit exceeded');
        } else if (axiosError.response?.status === 404) {
          // Not found is OK, return null
          return null;
        } else if (axiosError.response?.status === 500) {
          // Server error, retry
          console.error('[Congress.gov] Server error, retrying...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          throw error; // Will trigger retry in caller
        }
      }
      throw error;
    }
  });
}

// ============================================
// Bills API
// ============================================

export interface BillSearchParams {
  congress?: number;
  fromDateTime?: string;
  toDateTime?: string;
  offset?: number;
  limit?: number;
  sort?: 'updateDate+desc' | 'updateDate+asc';
}

export async function searchBills(params: BillSearchParams): Promise<any> {
  const { congress, ...otherParams } = params;
  
  let endpoint = '/bill';
  if (congress) {
    endpoint = `/bill/${congress}`;
  }
  
  const result = await congressGovApiCall(endpoint, {
    limit: 250,
    offset: 0,
    sort: 'updateDate+desc',
    ...otherParams
  });
  
  return result;
}

export async function fetchBill(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any> {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}`;
  const result = await congressGovApiCall(endpoint);
  return result?.bill || null;
}

export async function fetchBillText(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any> {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}/text`;
  const result = await congressGovApiCall(endpoint);
  return result?.textVersions || [];
}

export async function fetchBillActions(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any> {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}/actions`;
  const result = await congressGovApiCall(endpoint, { limit: 250 });
  return result?.actions || [];
}

export async function fetchBillAmendments(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any> {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}/amendments`;
  const result = await congressGovApiCall(endpoint, { limit: 250 });
  return result?.amendments || [];
}

export async function fetchBillCosponsors(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any> {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}/cosponsors`;
  const result = await congressGovApiCall(endpoint, { limit: 250 });
  return result?.cosponsors || [];
}

export async function fetchBillSummaries(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any[]> {
  try {
    const endpoint = `/bill/${congress}/${billType}/${billNumber}/summaries`;
    const result = await congressGovApiCall(endpoint);
    return result?.summaries || [];
  } catch (error) {
    console.log(`[Congress.gov] No summaries available for ${billType.toUpperCase()} ${billNumber}`);
    return [];
  }
}

/**
 * Fetch related bills for a bill
 */
async function fetchBillRelatedBills(congress: number, billType: string, billNumber: number): Promise<any[]> {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}/relatedbills`;
  const result = await rateLimiter.execute(() => makeRequest(url, {}));
  return result?.relatedBills || [];
}

/**
 * COMPREHENSIVE: Fetch bill with ALL POSSIBLE data from ALL endpoints
 * This fetches EVERYTHING Congress.gov has about a bill
 */
export async function fetchBillWithDetails(
  congress: number,
  billType: string,
  billNumber: number
): Promise<any> {
  console.log(`[Congress.gov] 📥 Fetching COMPLETE data for ${billType.toUpperCase()} ${billNumber}`);
  
  const bill = await fetchBill(congress, billType, billNumber);
  if (!bill) return null;
  
  // Ensure bill has type, congress, and number (API sometimes omits these)
  bill.type = bill.type || billType;
  bill.congress = bill.congress || congress;
  bill.number = bill.number || billNumber;
  
  // Track what we're fetching for logging
  const fetchTasks = [];
  
  // 1. SUMMARIES - All versions with full text
  fetchTasks.push(
    fetchBillSummaries(congress, billType, billNumber).then(summaries => {
      if (summaries && summaries.length > 0) {
        const latestSummary = summaries[0];
        bill.summary = {
          text: latestSummary.text,
          actionDate: latestSummary.actionDate,
          updateDate: latestSummary.updateDate,
          versionCode: latestSummary.versionCode
        };
        bill.summaries = summaries;
        console.log(`  ✓ Summaries: ${summaries.length} versions`);
      }
    }).catch(() => console.log('  ⚠ No summaries'))
  );
  
  // 2. COSPONSORS - Full list with party, state, dates (ALWAYS fetch)
  fetchTasks.push(
    fetchBillCosponsors(congress, billType, billNumber).then(cosponsorsList => {
      if (cosponsorsList && cosponsorsList.length > 0) {
        bill.cosponsors = cosponsorsList.map((c: any) => ({
          bioguideId: c.bioguideId,
          fullName: c.fullName,
          firstName: c.firstName,
          lastName: c.lastName,
          party: c.party,
          state: c.state,
          district: c.district,
          sponsorshipDate: c.sponsorshipDate,
          isOriginalCosponsor: c.isOriginalCosponsor
        }));
        console.log(`  ✓ Cosponsors: ${cosponsorsList.length} members`);
      }
    }).catch(() => console.log('  ⚠ No cosponsors'))
  );
  
  // 3. ACTIONS - Complete timeline of every action (ALWAYS fetch, don't rely on initial response)
  fetchTasks.push(
    fetchBillActions(congress, billType, billNumber).then(actionsList => {
      if (actionsList && actionsList.length > 0) {
        bill.actions = actionsList;
        console.log(`  ✓ Actions: ${actionsList.length} total actions`);
      }
    }).catch(() => console.log('  ⚠ Actions failed'))
  );
  
  // 4. AMENDMENTS - All amendments with full details (ALWAYS fetch)
  fetchTasks.push(
    fetchBillAmendments(congress, billType, billNumber).then(amendmentsList => {
      if (amendmentsList && amendmentsList.length > 0) {
        bill.amendments = amendmentsList;
        console.log(`  ✓ Amendments: ${amendmentsList.length} amendments`);
      }
    }).catch(() => console.log('  ⚠ No amendments'))
  );
  
  // 5. TEXT VERSIONS - All published versions (PDF, XML, HTML links)
  fetchTasks.push(
    fetchBillText(congress, billType, billNumber).then(textVersions => {
      if (textVersions && textVersions.length > 0) {
        bill.textVersions = textVersions;
        console.log(`  ✓ Text Versions: ${textVersions.length} versions`);
      }
    }).catch(() => console.log('  ⚠ No text versions'))
  );
  
  // 6. RELATED BILLS - Companion bills, similar bills, etc.
  fetchTasks.push(
    fetchBillRelatedBills(congress, billType, billNumber).then(relatedBillsList => {
      if (relatedBillsList && relatedBillsList.length > 0) {
        bill.relatedBills = relatedBillsList;
        console.log(`  ✓ Related Bills: ${relatedBillsList.length} bills`);
      }
    }).catch(() => console.log('  ⚠ No related bills'))
  );
  
  // Wait for all fetches to complete
  await Promise.all(fetchTasks);
  
  console.log(`[Congress.gov] ✅ Complete data fetched for ${billType.toUpperCase()} ${billNumber}`);
  
  return bill;
}

// ============================================
// Amendments API
// ============================================

export async function fetchAmendment(
  congress: number,
  amendmentType: string,
  amendmentNumber: number
): Promise<any> {
  const endpoint = `/amendment/${congress}/${amendmentType}/${amendmentNumber}`;
  const result = await congressGovApiCall(endpoint);
  return result?.amendment || null;
}

// ============================================
// Committee Reports API
// ============================================

export async function searchCommitteeReports(
  congress?: number,
  params: Record<string, any> = {}
): Promise<any> {
  let endpoint = '/committee-report';
  if (congress) {
    endpoint = `/committee-report/${congress}`;
  }
  
  const result = await congressGovApiCall(endpoint, {
    limit: 250,
    ...params
  });
  
  return result?.reports || [];
}

export async function fetchCommitteeReport(
  congress: number,
  reportType: string,
  reportNumber: number
): Promise<any> {
  const endpoint = `/committee-report/${congress}/${reportType}/${reportNumber}`;
  const result = await congressGovApiCall(endpoint);
  return result?.committeeReport || null;
}

// ============================================
// Hearings API
// ============================================

export async function searchHearings(
  congress?: number,
  chamber?: 'house' | 'senate',
  params: Record<string, any> = {}
): Promise<any> {
  let endpoint = '/hearing';
  if (congress) {
    endpoint = `/hearing/${congress}`;
    if (chamber) {
      endpoint += `/${chamber}`;
    }
  }
  
  const result = await congressGovApiCall(endpoint, {
    limit: 250,
    ...params
  });
  
  return result?.hearings || [];
}

// ============================================
// Members API
// ============================================

export async function fetchMember(bioguideId: string): Promise<any> {
  const endpoint = `/member/${bioguideId}`;
  const result = await congressGovApiCall(endpoint);
  return result?.member || null;
}

export async function searchMembers(
  congress?: number,
  params: Record<string, any> = {}
): Promise<any> {
  let endpoint = '/member';
  if (congress) {
    endpoint = `/member/congress/${congress}`;
  }
  
  const result = await congressGovApiCall(endpoint, {
    limit: 250,
    ...params
  });
  
  return result?.members || [];
}

// ============================================
// Defense Relevance Detection
// ============================================

const DEFENSE_KEYWORDS = [
  // General Defense
  'defense', 'military', 'armed forces', 'dod', 'department of defense',
  'national security', 'pentagon', 'defense spending', 'defense policy',
  'warfighter', 'homeland security', 'coast guard',
  
  // Military Branches
  'army', 'navy', 'air force', 'marine corps', 'space force',
  'national guard', 'reserve', 'joint chiefs',
  
  // Contracting & Procurement (COMPREHENSIVE)
  'defense contractor', 'defense contracting', 'federal contractor',
  'government contractor', 'prime contractor', 'subcontractor',
  'procurement', 'acquisition', 'defense acquisition', 'procurement streamlining',
  'procurement process', 'bid protest', 'sole source', 'competitive bidding',
  'defense industrial base', 'defense industry', 'weapons system', 'combat system',
  'competition in defense', 'merger defense', 'contractor competition',
  'acquisition reform', 'procurement reform', 'far', 'dfars',
  'cost-plus', 'fixed-price', 'contract vehicle', 'idiq',
  'small business set-aside', '8(a)', 'hubzone', 'sdvosb', 'wosb',
  
  // Bill Types & Legislative Terms
  'ndaa', 'national defense authorization', 'defense appropriations',
  'military construction', 'milcon', 'rdt&e', 'research and development',
  'operation and maintenance', 'o&m', 'personnel costs',
  
  // Weapons & Programs
  'fighter', 'bomber', 'submarine', 'destroyer', 'aircraft carrier',
  'missile defense', 'hypersonic', 'unmanned', 'drone', 'uav',
  'f-35', 'f-15', 'f-16', 'f-18', 'b-21', 'b-52', 'f-22',
  'aegis', 'patriot', 'thaad', 'gbsd', 'columbia class',
  
  // Defense Companies (Major Primes)
  'lockheed martin', 'boeing', 'raytheon', 'northrop grumman',
  'general dynamics', 'l3harris', 'bae systems', 'huntington ingalls',
  'leidos', 'saic', 'booz allen', 'caci',
  
  // Technology & Cyber
  'cybersecurity', 'cyber defense', 'information warfare',
  'artificial intelligence', 'ai defense', 'autonomous systems',
  
  // Veterans & Personnel
  'veteran', 'va', 'veterans affairs', 'gi bill',
  'tricare', 'commissary', 'military housing', 'bah',
  'active duty', 'retired military',
  
  // Small Business
  'sbir', 'sttr', 'small business defense', 'defense innovation',
  
  // Technology
  'hypersonic', 'cyber', 'space', 'unmanned', 'autonomous',
  'artificial intelligence', 'quantum', 'directed energy'
];

const DEFENSE_COMMITTEES = [
  'HSAS', // House Armed Services
  'SSAS', // Senate Armed Services
  'HSAP', // House Appropriations - Defense
  'SSAP', // Senate Appropriations - Defense
];

export function isDefenseRelated(bill: any): boolean {
  const textToSearch = [
    bill.title || '',
    bill.summary?.text || '',
    bill.policyArea?.name || '',
    ...(bill.subjects?.legislativeSubjects?.map((s: any) => s.name) || [])
  ].join(' ').toLowerCase();

  // Check for defense keywords
  const hasDefenseKeyword = DEFENSE_KEYWORDS.some(keyword => 
    textToSearch.includes(keyword.toLowerCase())
  );

  // Check for defense committee (handle various API structures)
  let hasDefenseCommittee = false;
  if (Array.isArray(bill.committees)) {
    hasDefenseCommittee = bill.committees.some((c: any) => 
      DEFENSE_COMMITTEES.includes(c.systemCode)
    );
  }

  return hasDefenseKeyword || hasDefenseCommittee;
}

export function calculateDefenseRelevanceScore(bill: any): number {
  let score = 0;

  const textToSearch = [
    bill.title || '',
    bill.summary?.text || '',
    bill.policyArea?.name || ''
  ].join(' ').toLowerCase();

  // Keywords (up to 50 points)
  const keywordMatches = DEFENSE_KEYWORDS.filter(keyword => 
    textToSearch.includes(keyword.toLowerCase())
  ).length;
  score += Math.min(keywordMatches * 5, 50);

  // Defense committee (30 points)
  let hasDefenseCommittee = false;
  if (Array.isArray(bill.committees)) {
    hasDefenseCommittee = bill.committees.some((c: any) => 
      DEFENSE_COMMITTEES.includes(c.systemCode)
    );
  }
  if (hasDefenseCommittee) score += 30;

  // Title has defense-related terms (20 points)
  const titleRegex = /ndaa|national defense authorization|defense appropriations|defense contractor|procurement|military|armed forces|veteran|acquisition reform|defense industry|defense competition|federal contractor|defense spending/i;
  if (titleRegex.test(bill.title || '')) {
    score += 20;
  }

  return Math.min(score, 100);
}

// ============================================
// Extract Defense Programs
// ============================================

const DEFENSE_PROGRAMS = [
  // Aircraft
  'F-35', 'F-35A', 'F-35B', 'F-35C', 'Joint Strike Fighter',
  'F-15', 'F-15EX', 'F-16', 'F-18', 'F/A-18', 'Super Hornet',
  'B-21', 'B-21 Raider', 'B-52', 'B-1', 'B-2',
  'KC-46', 'KC-135', 'C-130', 'C-17', 'V-22', 'Osprey',
  
  // Naval
  'DDG', 'DDG-51', 'Arleigh Burke', 'destroyer',
  'Virginia-class', 'Columbia-class', 'submarine',
  'Ford-class', 'Nimitz-class', 'aircraft carrier',
  'Littoral Combat Ship', 'LCS', 'FFG', 'Constellation',
  
  // Ground
  'M1 Abrams', 'Bradley', 'Stryker', 'JLTV',
  'Armored Multi-Purpose Vehicle', 'AMPV',
  
  // Missiles & Munitions
  'Patriot', 'THAAD', 'Aegis', 'SM-3', 'SM-6',
  'Tomahawk', 'JASSM', 'LRASM', 'Javelin', 'HIMARS',
  'Hypersonic', 'ARRW', 'LRHW',
  
  // Space
  'GPS', 'WGS', 'Space Force', 'satellite',
  
  // Technology
  'Joint All-Domain Command and Control', 'JADC2',
  'Next Generation Air Dominance', 'NGAD',
  'Future Vertical Lift', 'FVL',
  'Integrated Air and Missile Defense', 'IAMD'
];

export function extractDefensePrograms(text: string): string[] {
  const programs: string[] = [];
  const textLower = text.toLowerCase();

  for (const program of DEFENSE_PROGRAMS) {
    if (textLower.includes(program.toLowerCase())) {
      programs.push(program);
    }
  }

  return [...new Set(programs)]; // Remove duplicates
}

// ============================================
// Extract Contractor Mentions
// ============================================

const MAJOR_CONTRACTORS = [
  'Lockheed Martin', 'Lockheed',
  'Boeing', 'Boeing Defense',
  'Raytheon', 'RTX', 'Raytheon Technologies',
  'Northrop Grumman', 'Northrop',
  'General Dynamics', 'GD',
  'L3Harris', 'L3 Harris', 'Harris',
  'BAE Systems', 'BAE',
  'Huntington Ingalls', 'HII',
  'Leidos', 'Dynetics',
  'SAIC', 'Science Applications International',
  'CACI', 'Booz Allen', 'Booz Allen Hamilton',
  'Textron', 'Bell', 'Bell Helicopter',
  'General Electric', 'GE Aviation',
  'Rolls-Royce', 'Pratt & Whitney',
  'United Technologies', 'UTC',
  'Oshkosh', 'Oshkosh Defense',
  'AeroVironment', 'Kratos', 'Anduril'
];

export function extractContractorMentions(text: string): string[] {
  const contractors: string[] = [];
  const textLower = text.toLowerCase();

  for (const contractor of MAJOR_CONTRACTORS) {
    if (textLower.includes(contractor.toLowerCase())) {
      // Add the full name (not abbreviation)
      if (contractor.length > 5 && !contractors.includes(contractor)) {
        contractors.push(contractor);
      }
    }
  }

  return [...new Set(contractors)];
}

// ============================================
// Normalize & Save to Database
// ============================================

export interface NormalizedBill {
  congress: number;
  bill_type: string;
  bill_number: number;
  title: string;
  short_title?: string;
  official_title?: string;
  introduced_date?: string;
  latest_action_date?: string;
  status?: string;
  is_law: boolean;
  summary?: string;
  policy_area?: string;
  legislative_subjects?: string[];
  is_defense_related: boolean;
  defense_relevance_score: number;
  defense_programs_mentioned?: string[];
  contractors_mentioned?: string[];
  military_branches?: string[];
  authorized_amount?: number;
  appropriated_amount?: number;
  fiscal_years?: number[];
  sponsor_name?: string;
  sponsor_party?: string;
  sponsor_state?: string;
  sponsor_bioguide_id?: string;
  cosponsor_count: number;
  cosponsors?: any;
  committees?: string[];
  primary_committee?: string;
  actions?: any;
  action_count: number;
  amendments?: any;
  text_versions?: any;
  related_bills?: any;
  companion_bill_id?: string;
  latest_action_text?: string;
  congress_gov_url: string;
  api_response: any;
}

/**
 * Generate correct Congress.gov URL for a bill
 */
function generateCongressGovUrl(congress: number, billType: string, billNumber: number): string {
  const typeMap: Record<string, string> = {
    'hr': 'house-bill',
    's': 'senate-bill',
    'hjres': 'house-joint-resolution',
    'sjres': 'senate-joint-resolution',
    'hconres': 'house-concurrent-resolution',
    'sconres': 'senate-concurrent-resolution',
    'hres': 'house-resolution',
    'sres': 'senate-resolution'
  };
  
  const urlType = typeMap[billType.toLowerCase()] || 'bill';
  return `https://www.congress.gov/bill/${congress}th-congress/${urlType}/${billNumber}`;
}

// ============================================
// Additional Text Extraction Functions
// ============================================

function extractMilitaryBranches(text: string): string[] {
  const branches = new Set<string>();
  const patterns: Record<string, RegExp> = {
    'Army': /\b(Army|U\.?S\.?\s*Army)\b/gi,
    'Navy': /\b(Navy|U\.?S\.?\s*Navy|Naval)\b/gi,
    'Air Force': /\b(Air\s*Force|USAF)\b/gi,
    'Marine Corps': /\b(Marine\s*Corps|Marines|USMC)\b/gi,
    'Space Force': /\b(Space\s*Force|USSF)\b/gi,
    'Coast Guard': /\b(Coast\s*Guard|USCG)\b/gi
  };

  for (const [branch, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) branches.add(branch);
  }
  return Array.from(branches);
}

function extractFiscalYears(text: string): number[] {
  const years = new Set<number>();
  const matches = text.matchAll(/(?:fiscal\s*year|FY)\s*'?(\d{2,4})/gi);
  
  for (const match of matches) {
    let year = parseInt(match[1]);
    if (year < 100) year = 2000 + year;
    if (year >= 2000 && year <= 2050) years.add(year);
  }
  return Array.from(years).sort();
}

function extractFundingAmounts(text: string): { authorized?: number; appropriated?: number } {
  const result: { authorized?: number; appropriated?: number } = {};
  
  const parseAmount = (amount: string, unit: string): number => {
    const num = parseFloat(amount.replace(/,/g, ''));
    const multipliers: Record<string, number> = { 'million': 1e6, 'billion': 1e9, 'trillion': 1e12 };
    return Math.round(num * (multipliers[unit.toLowerCase()] || 1));
  };
  
  const authMatch = text.match(/authorized?\s+\$?([\d,]+(?:\.\d+)?)\s*(million|billion)/i);
  if (authMatch) result.authorized = parseAmount(authMatch[1], authMatch[2]);
  
  const appropMatch = text.match(/appropriated?\s+\$?([\d,]+(?:\.\d+)?)\s*(million|billion)/i);
  if (appropMatch) result.appropriated = parseAmount(appropMatch[1], appropMatch[2]);
  
  return result;
}

export function normalizeBill(rawBill: any, billType?: string): NormalizedBill {
  const isDefense = isDefenseRelated(rawBill);
  const defenseScore = isDefense ? calculateDefenseRelevanceScore(rawBill) : 0;
  
  // Helper function to strip HTML tags from text
  const stripHtml = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&')  // Replace &amp; with &
      .replace(/&lt;/g, '<')   // Replace &lt; with <
      .replace(/&gt;/g, '>')   // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'")  // Replace &#39; with '
      .replace(/\s+/g, ' ')    // Collapse multiple spaces
      .trim();
  };
  
  const fullText = [
    rawBill.title || '',
    rawBill.summary?.text ? stripHtml(rawBill.summary.text) : ''
  ].join(' ');
  
  // Extract all relevant information from text
  const programs = isDefense ? extractDefensePrograms(fullText) : [];
  const contractors = isDefense ? extractContractorMentions(fullText) : [];
  const branches = isDefense ? extractMilitaryBranches(fullText) : [];
  const fiscalYears = extractFiscalYears(fullText);
  const fundingAmounts = extractFundingAmounts(fullText);
  
  // Extract companion bill from related bills
  let companionBillId: string | undefined;
  if (Array.isArray(rawBill.relatedBills)) {
    const companion = rawBill.relatedBills.find((rb: any) => 
      rb.relationshipDetails?.[0]?.type?.toLowerCase().includes('companion') ||
      rb.type?.toLowerCase().includes('companion')
    );
    if (companion) {
      companionBillId = `${companion.congress}-${companion.type}-${companion.number}`;
    }
  }

  return {
    congress: rawBill.congress,
    bill_type: rawBill.type || billType, // Use parameter as fallback if rawBill.type is missing
    bill_number: rawBill.number,
    title: rawBill.title || 'Untitled',
    short_title: Array.isArray(rawBill.titles) ? rawBill.titles.find((t: any) => t.titleType === 'Short Title(s) as Introduced')?.title : undefined,
    official_title: Array.isArray(rawBill.titles) ? rawBill.titles.find((t: any) => t.titleType === 'Official Title as Introduced')?.title : undefined,
    introduced_date: rawBill.introducedDate ? new Date(rawBill.introducedDate).toISOString().split('T')[0] : undefined,
    latest_action_date: rawBill.latestAction?.actionDate,
    status: rawBill.latestAction?.text,
    is_law: Array.isArray(rawBill.laws) && rawBill.laws.length > 0 || false,
    summary: rawBill.summary?.text ? stripHtml(rawBill.summary.text) : undefined,
    policy_area: rawBill.policyArea?.name,
    legislative_subjects: Array.isArray(rawBill.subjects?.legislativeSubjects) ? rawBill.subjects.legislativeSubjects.map((s: any) => s.name) : [],
    is_defense_related: isDefense,
    defense_relevance_score: defenseScore,
    defense_programs_mentioned: programs.length > 0 ? programs : undefined,
    contractors_mentioned: contractors.length > 0 ? contractors : undefined,
    military_branches: branches.length > 0 ? branches : undefined,
    authorized_amount: fundingAmounts.authorized,
    appropriated_amount: fundingAmounts.appropriated,
    fiscal_years: fiscalYears.length > 0 ? fiscalYears : undefined,
    sponsor_name: Array.isArray(rawBill.sponsors) && rawBill.sponsors[0] ? rawBill.sponsors[0].fullName : undefined,
    sponsor_party: Array.isArray(rawBill.sponsors) && rawBill.sponsors[0] ? rawBill.sponsors[0].party : undefined,
    sponsor_state: Array.isArray(rawBill.sponsors) && rawBill.sponsors[0] ? rawBill.sponsors[0].state : undefined,
    sponsor_bioguide_id: Array.isArray(rawBill.sponsors) && rawBill.sponsors[0] ? rawBill.sponsors[0].bioguideId : undefined,
    cosponsor_count: Array.isArray(rawBill.cosponsors) ? rawBill.cosponsors.length : (rawBill.cosponsors?.count || 0),
    cosponsors: Array.isArray(rawBill.cosponsors) ? rawBill.cosponsors : null, // Only store if we have actual data
    committees: Array.isArray(rawBill.committees) ? rawBill.committees.map((c: any) => c.name || c.systemCode || String(c)) : [], // TEXT[] needs empty array, not null
    primary_committee: Array.isArray(rawBill.committees) && rawBill.committees[0] ? rawBill.committees[0].name : undefined,
    // FIX: Use fetched arrays if available, otherwise store null (not reference objects)
    actions: Array.isArray(rawBill.actions) ? rawBill.actions : null,
    action_count: Array.isArray(rawBill.actions) ? rawBill.actions.length : (rawBill.actions?.count || 0),
    amendments: Array.isArray(rawBill.amendments) ? rawBill.amendments : null,
    text_versions: Array.isArray(rawBill.textVersions) ? rawBill.textVersions : null,
    related_bills: Array.isArray(rawBill.relatedBills) ? rawBill.relatedBills : null,
    companion_bill_id: companionBillId,
    latest_action_text: rawBill.latestAction?.text,
    congress_gov_url: generateCongressGovUrl(rawBill.congress, rawBill.type, rawBill.number),
    api_response: rawBill
  };
}

export async function saveBill(bill: NormalizedBill): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('congressional_bills')
      .upsert({
        congress: bill.congress,
        bill_type: bill.bill_type,
        bill_number: bill.bill_number,
        title: bill.title,
        short_title: bill.short_title,
        official_title: bill.official_title,
        introduced_date: bill.introduced_date,
        latest_action_date: bill.latest_action_date,
        status: bill.status,
        is_law: bill.is_law,
        summary: bill.summary,
        policy_area: bill.policy_area,
        legislative_subjects: bill.legislative_subjects,
        is_defense_related: bill.is_defense_related,
        defense_relevance_score: bill.defense_relevance_score,
        defense_programs_mentioned: bill.defense_programs_mentioned,
        contractors_mentioned: bill.contractors_mentioned,
        military_branches: bill.military_branches,
        authorized_amount: bill.authorized_amount,
        appropriated_amount: bill.appropriated_amount,
        fiscal_years: bill.fiscal_years,
        sponsor_name: bill.sponsor_name,
        sponsor_party: bill.sponsor_party,
        sponsor_state: bill.sponsor_state,
        sponsor_bioguide_id: bill.sponsor_bioguide_id,
        cosponsor_count: bill.cosponsor_count,
        cosponsors: bill.cosponsors,
        // committees: bill.committees, // TEMPORARILY SKIP - TEXT[] issue with Supabase client
        primary_committee: bill.primary_committee,
        actions: bill.actions,
        action_count: bill.action_count,
        amendments: bill.amendments,
        text_versions: bill.text_versions,
        related_bills: bill.related_bills,
        companion_bill_id: bill.companion_bill_id,
        latest_action_text: bill.latest_action_text,
        congress_gov_url: bill.congress_gov_url,
        api_response: bill.api_response,
        last_scraped: new Date().toISOString()
      }, {
        onConflict: 'congress,bill_type,bill_number',
        ignoreDuplicates: false // Update existing records
      });

    if (error) {
      console.error('[Congress.gov] Error saving bill:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Congress.gov] Exception saving bill:', error);
    return false;
  }
}

// ============================================
// Batch Processing
// ============================================

export async function batchSaveBills(bills: NormalizedBill[]): Promise<{
  saved: number;
  failed: number;
}> {
  let saved = 0;
  let failed = 0;

  for (const bill of bills) {
    const success = await saveBill(bill);
    if (success) {
      saved++;
    } else {
      failed++;
    }
  }

  return { saved, failed };
}

// ============================================
// Logging
// ============================================

export async function logScrapingRun(logData: {
  scrape_type: string;
  congress?: number;
  date_range_start?: string;
  date_range_end?: string;
  status: string;
  records_found: number;
  records_new: number;
  records_updated: number;
  records_failed: number;
  api_calls_made: number;
  errors?: any;
  duration_seconds?: number;
  summary?: string;
}): Promise<void> {
  try {
    await supabase.from('congressional_scraping_logs').insert({
      ...logData,
      completed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Congress.gov] Error logging scraping run:', error);
  }
}

// ============================================
// Utility Functions
// ============================================

export function getCurrentCongress(): number {
  // Congress 118 = 2023-2024
  // Congress 119 = 2025-2026
  const year = new Date().getFullYear();
  return Math.floor((year - 1789) / 2) + 1;
}

export function getCongressYears(congress: number): { start: number; end: number } {
  const start = 1789 + (congress - 1) * 2;
  return { start, end: start + 1 };
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

