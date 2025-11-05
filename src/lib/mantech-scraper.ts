/**
 * ============================================
 * DOD ManTech Projects Scraper
 * ============================================
 * Scrapes manufacturing technology projects and news from dodmantech.mil
 * Covers all 5 components: Army, Navy, Air Force, DLA, OSD
 * Uses Puppeteer to bypass 403 blocks + Cheerio for HTML parsing
 * ============================================
 */

// Load environment variables first (for standalone scripts)
import * as dotenv from 'dotenv';
dotenv.config();

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// ManTech Components Configuration
// ============================================

export const MANTECH_COMPONENTS = {
  news: {
    name: 'News',
    url: 'https://www.dodmantech.mil/News/',
    description: 'Main ManTech news feed'
  },
  army: {
    name: 'Army',
    url: 'https://www.dodmantech.mil/JDMTP/Army-ManTech/',
    description: 'Army ManTech Program'
  },
  navy: {
    name: 'Navy',
    url: 'https://www.dodmantech.mil/JDMTP/Navy-ManTech/',
    description: 'Navy ManTech Program'
  },
  air_force: {
    name: 'Air Force',
    url: 'https://www.dodmantech.mil/JDMTP/Air-Force-ManTech/',
    description: 'Air Force ManTech Program'
  },
  dla: {
    name: 'DLA',
    url: 'https://www.dodmantech.mil/JDMTP/DLA-ManTech/',
    description: 'Defense Logistics Agency ManTech'
  },
  osd: {
    name: 'OSD',
    url: 'https://www.dodmantech.mil/JDMTP/OSD-ManTech/',
    description: 'Office of Secretary of Defense ManTech'
  }
};

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
      console.error(`[ManTech] Failed to fetch ${url}: ${response?.status()}`);
      return null;
    }

    // Get HTML content
    const html = await page.content();
    return html;
    
  } catch (error) {
    console.error(`[ManTech] Error fetching article:`, error);
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

export interface ParsedManTechArticle {
  articleId: number;
  articleUrl: string;
  articleTitle: string;
  publishedDate: Date | null;
  content: string;
  rawHTML: string;
  imageUrls: string[];
  documentUrls: string[];
}

export function parseArticleHTML(html: string, url: string): ParsedManTechArticle | null {
  try {
    const $ = cheerio.load(html);
    
    // Extract article ID from URL
    // Example: https://www.dodmantech.mil/News/News-Display/Article/3981590/
    const articleIdMatch = url.match(/Article\/(\d+)/);
    const articleId = articleIdMatch ? parseInt(articleIdMatch[1]) : 0;
    
    // Extract title
    const articleTitle = $('h1.maintitle, h1, .article-title, title').first().text().trim() || 'Unknown Title';
    
    // Extract published date - try multiple selectors and patterns
    let publishedDate: Date | null = null;
    
    // Try meta tags first
    const metaDate = $('meta[property="article:published_time"]').attr('content') ||
                     $('meta[name="date"]').attr('content') ||
                     $('meta[name="publish-date"]').attr('content');
    
    if (metaDate) {
      publishedDate = new Date(metaDate);
    } else {
      // Try text selectors
      const dateSelectors = [
        '.date', '.published', '.published-date', 
        '.article-date', 'time', '.publish-date',
        '.entry-date', '.post-date', '.timestamp'
      ];
      
      for (const selector of dateSelectors) {
        const dateText = $(selector).first().text().trim();
        if (dateText) {
          publishedDate = new Date(dateText);
          if (!isNaN(publishedDate.getTime())) {
            break;
          }
        }
      }
      
      // Try to find date in content text
      if (!publishedDate || isNaN(publishedDate.getTime())) {
        const fullText = $('body').text();
        // Look for patterns like "January 15, 2024", "Jan 15, 2024", "01/15/2024", etc.
        const datePatterns = [
          /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
          /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}/i,
          /\d{1,2}\/\d{1,2}\/\d{4}/,
          /\d{4}-\d{2}-\d{2}/
        ];
        
        for (const pattern of datePatterns) {
          const match = fullText.match(pattern);
          if (match) {
            const testDate = new Date(match[0]);
            if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 2000 && testDate.getFullYear() <= new Date().getFullYear()) {
              publishedDate = testDate;
              break;
            }
          }
        }
      }
    }
    
    // Validate date - check if it's reasonable (between 2000 and current year, not in future)
    const now = new Date();
    if (publishedDate) {
      if (isNaN(publishedDate.getTime()) || publishedDate.getFullYear() < 2000) {
        publishedDate = null;
      } else if (publishedDate > now) {
        // If date is in the future, try to fix it by subtracting 1 year
        const fixedDate = new Date(publishedDate);
        fixedDate.setFullYear(fixedDate.getFullYear() - 1);
        // If still in future, set to null, otherwise use fixed date
        if (fixedDate > now) {
          publishedDate = null;
        } else {
          publishedDate = fixedDate;
        }
      }
    }
    
    // Extract main content
    let content = '';
    const contentSelectors = [
      '.article-body',
      '.body-copy',
      '.article-content',
      '.content',
      'main .body',
      '.inside'
    ];
    
    for (const selector of contentSelectors) {
      const text = $(selector).text().trim();
      if (text && text.length > content.length) {
        content = text;
      }
    }
    
    // Clean up content - remove common metadata patterns
    if (content) {
      // Remove date prefix like "News | Aug. 28, 2025" at the start
      content = content.replace(/^(?:News|Article|Story)\s*\|\s*[A-Za-z]{3}\.?\s+\d{1,2},?\s+\d{4}\s*/i, '');
      
      // Remove title repetition at the start
      const titleClean = articleTitle.replace(/[>\|]/g, '').trim();
      if (titleClean && content.startsWith(titleClean)) {
        content = content.substring(titleClean.length);
      }
      
      // Remove author bylines like "By David Vergun DOD News"
      content = content.replace(/^[\s]*By\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:DOD|DoD|Defense)\s+News[\s]*/i, '');
      content = content.replace(/^[\s]*By\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+[\s]*/i, '');
      
      // Trim extra whitespace
      content = content.replace(/\s+/g, ' ').trim();
    }
    
    // Extract image URLs
    const imageUrls: string[] = [];
    $('.article-body img, .content img, main img').each((i, elem) => {
      let src = $(elem).attr('src');
      if (src) {
        // Make absolute URL
        if (!src.startsWith('http')) {
          src = `https://www.dodmantech.mil${src}`;
        }
        imageUrls.push(src);
      }
    });
    
    // Extract document URLs (PDFs, etc.)
    const documentUrls: string[] = [];
    $('a[href$=".pdf"], a[href*="download"], a[href*="document"]').each((i, elem) => {
      let href = $(elem).attr('href');
      if (href) {
        // Make absolute URL
        if (!href.startsWith('http')) {
          href = `https://www.dodmantech.mil${href}`;
        }
        documentUrls.push(href);
      }
    });
    
    return {
      articleId,
      articleUrl: url,
      articleTitle,
      publishedDate,
      content,
      rawHTML: html,
      imageUrls,
      documentUrls
    };
    
  } catch (error) {
    console.error('[ManTech] Error parsing article HTML:', error);
    return null;
  }
}

// ============================================
// Extract Project Data from Content
// ============================================

export interface ExtractedManTechProject {
  // Basic Info
  projectName: string | null;
  projectDescription: string;
  mantechComponent: string;
  
  // Technology
  technologyFocus: string[];
  manufacturingProcesses: string[];
  technologyReadinessLevel: number | null;
  manufacturingReadinessLevel: number | null;
  
  // Companies & Partners
  companiesInvolved: string[];
  primeContractor: string | null;
  industryPartners: string[];
  academicPartners: string[];
  manufacturingInnovationInstitutes: string[];
  
  // Transition
  transitionStage: string | null;
  transitionFrom: string | null;
  transitionTo: string | null;
  programOfRecord: string | null;
  
  // Funding
  fundingAmount: number | null;
  fundingAmountText: string | null;
  fiscalYear: number | null;
  costSavingsEstimated: number | null;
  costSavingsText: string | null;
  
  // Impact
  capabilityImprovement: string | null;
  readinessImpact: string | null;
  industrialBaseImpact: string | null;
  productionRateImprovement: string | null;
  
  // Geographic
  locations: string[];
  states: string[];
  
  // Systems & Platforms
  weaponSystems: string[];
  platforms: string[];
  
  // Keywords
  keywords: string[];
  technologyTags: string[];
  industryTags: string[];
  
  // Contact
  pocName: string | null;
  pocTitle: string | null;
  pocOrganization: string | null;
  pocEmail: string | null;
  pocPhone: string | null;
  
  // Cross-references
  sbirLinked: boolean;
  sbirCompanyName: string | null;
  sbirTopicNumber: string | null;
  
  // Quality
  parsingConfidence: number;
}

export function extractProjectData(
  content: string,
  articleTitle: string,
  component: string
): ExtractedManTechProject {
  
  // Initialize all fields
  const project: ExtractedManTechProject = {
    projectName: null,
    projectDescription: content,
    mantechComponent: component,
    technologyFocus: [],
    manufacturingProcesses: [],
    technologyReadinessLevel: null,
    manufacturingReadinessLevel: null,
    companiesInvolved: [],
    primeContractor: null,
    industryPartners: [],
    academicPartners: [],
    manufacturingInnovationInstitutes: [],
    transitionStage: null,
    transitionFrom: null,
    transitionTo: null,
    programOfRecord: null,
    fundingAmount: null,
    fundingAmountText: null,
    fiscalYear: null,
    costSavingsEstimated: null,
    costSavingsText: null,
    capabilityImprovement: null,
    readinessImpact: null,
    industrialBaseImpact: null,
    productionRateImprovement: null,
    locations: [],
    states: [],
    weaponSystems: [],
    platforms: [],
    keywords: [],
    technologyTags: [],
    industryTags: [],
    pocName: null,
    pocTitle: null,
    pocOrganization: null,
    pocEmail: null,
    pocPhone: null,
    sbirLinked: false,
    sbirCompanyName: null,
    sbirTopicNumber: null,
    parsingConfidence: 0.5
  };
  
  const text = content.toLowerCase();
  
  // Extract DOD component from content
  const componentPatterns = [
    { pattern: /\b(?:U\.?S\.?\s+)?Army\b/i, component: 'Army' },
    { pattern: /\b(?:U\.?S\.?\s+)?Navy\b/i, component: 'Navy' },
    { pattern: /\b(?:U\.?S\.?\s+)?Air\s+Force\b/i, component: 'Air Force' },
    { pattern: /\b(?:U\.?S\.?\s+)?Marine\s+Corps\b/i, component: 'Marine Corps' },
    { pattern: /\b(?:U\.?S\.?\s+)?Space\s+Force\b/i, component: 'Space Force' },
    { pattern: /\bDefense\s+Logistics\s+Agency\b/i, component: 'DLA' },
    { pattern: /\bMissile\s+Defense\s+Agency\b/i, component: 'MDA' }
  ];
  
  for (const cp of componentPatterns) {
    if (cp.pattern.test(content)) {
      project.mantechComponent = cp.component;
      project.parsingConfidence += 0.05;
      break;
    }
  }
  
  // Extract technology focus
  const techPatterns = [
    { pattern: /additive manufacturing|3d printing/i, tag: 'additive_manufacturing' },
    { pattern: /advanced composites|composite materials/i, tag: 'composites' },
    { pattern: /artificial intelligence|machine learning|AI\/ML/i, tag: 'ai_ml' },
    { pattern: /robotics|automation|autonomous/i, tag: 'robotics' },
    { pattern: /advanced materials|new materials/i, tag: 'materials' },
    { pattern: /digital manufacturing|industry 4\.0/i, tag: 'digital_manufacturing' },
    { pattern: /supply chain|logistics/i, tag: 'supply_chain' },
    { pattern: /cyber|cybersecurity/i, tag: 'cybersecurity' },
    { pattern: /hypersonic/i, tag: 'hypersonics' },
    { pattern: /microelectronics|semiconductor/i, tag: 'microelectronics' }
  ];
  
  for (const tech of techPatterns) {
    if (tech.pattern.test(content)) {
      project.technologyFocus.push(tech.tag);
      project.technologyTags.push(tech.tag);
    }
  }
  
  // Extract manufacturing processes
  const processPatterns = [
    'welding', 'casting', 'forging', 'machining', 'assembly',
    'coating', 'heat treatment', 'inspection', 'testing'
  ];
  
  for (const process of processPatterns) {
    if (text.includes(process)) {
      project.manufacturingProcesses.push(process);
    }
  }
  
  // Extract TRL/MRL levels
  const trlMatch = content.match(/TRL\s*[:\-]?\s*(\d)/i) || content.match(/technology readiness level\s*[:\-]?\s*(\d)/i);
  if (trlMatch) {
    project.technologyReadinessLevel = parseInt(trlMatch[1]);
    project.parsingConfidence += 0.05;
  }
  
  const mrlMatch = content.match(/MRL\s*[:\-]?\s*(\d)/i) || content.match(/manufacturing readiness level\s*[:\-]?\s*(\d)/i);
  if (mrlMatch) {
    project.manufacturingReadinessLevel = parseInt(mrlMatch[1]);
    project.parsingConfidence += 0.05;
  }
  
  // Extract companies - more conservative patterns for well-known company suffixes
  const companyPatterns = [
    // Legal suffixes - most reliable
    /\b([A-Z][A-Za-z0-9\s&-]+(?:Corp\.|Corporation|Inc\.|Incorporated|LLC|L\.L\.C\.|Ltd\.|Limited))\b/g,
    // Industry-specific suffixes (but must have at least 2 words before suffix)
    /\b([A-Z][A-Za-z0-9]+\s+[A-Za-z0-9\s&-]+(?:Systems|Dynamics|Aerospace|Industries))\b/g,
    // Well-known defense contractors (specific patterns)
    /\b(Lockheed Martin|Raytheon|Boeing|Northrop Grumman|General Dynamics|BAE Systems|L3Harris|Textron|Huntington Ingalls|Leidos|SAIC|CACI|ManTech|Booz Allen Hamilton|Peraton|Jacobs|AECOM)\b/g
  ];
  
  const uniqueCompanies = new Set<string>();
  
  // Stopwords and exclusions
  const companyStopwords = ['He ', 'She ', 'They ', 'The ', 'A ', 'An ', 'This ', 'That ', 'These ', 'Those ',
                            'Officials ', 'Department of ', 'Ministry of ', 'Agency of ', 'Technologies for ',
                            'Emerging Technologies', 'Industrial Technologies', 'Advanced Technologies',
                            'National Defense', 'SHARE PRINT'];
  
  for (const pattern of companyPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const company = match[1].trim();
      
      // Validate company name
      const isValidLength = company.length >= 5 && company.length <= 60;
      const startsWithStopword = companyStopwords.some(sw => company.includes(sw));
      const hasValidCapitalization = /^[A-Z]/.test(company);
      
      // Only add if it passes validation
      if (isValidLength && !startsWithStopword && hasValidCapitalization) {
        uniqueCompanies.add(company);
      }
    }
  }
  
  project.companiesInvolved = Array.from(uniqueCompanies);
  if (project.companiesInvolved.length > 0) {
    project.primeContractor = project.companiesInvolved[0]; // First mentioned is often prime
    project.parsingConfidence += 0.1;
  }
  
  // Extract universities/academic partners
  const universityPattern = /\b(University of [A-Z][a-z]+|[A-Z][a-z]+\s+University|[A-Z][a-z]+\s+Institute of Technology|MIT|Caltech|Georgia Tech)\b/g;
  const universityMatches = content.matchAll(universityPattern);
  const uniqueUniversities = new Set<string>();
  
  for (const match of universityMatches) {
    uniqueUniversities.add(match[1].trim());
  }
  
  project.academicPartners = Array.from(uniqueUniversities);
  
  // Extract Manufacturing Innovation Institutes
  const miiPatterns = [
    'America Makes', 'MxD', 'LIFT', 'NextFlex', 'BioFabUSA', 
    'AIM Photonics', 'PowerAmerica', 'NIIMBL', 'RAPID', 
    'ARM Institute', 'BioMADE', 'CESMII'
  ];
  
  for (const mii of miiPatterns) {
    if (content.includes(mii)) {
      project.manufacturingInnovationInstitutes.push(mii);
      project.parsingConfidence += 0.05;
    }
  }
  
  // Extract transition stage
  if (/fielded|deployed|operational/i.test(content)) {
    project.transitionStage = 'fielded';
  } else if (/production|manufacturing/i.test(content)) {
    project.transitionStage = 'production';
  } else if (/prototype|demonstration|demonstrator/i.test(content)) {
    project.transitionStage = 'prototype';
  } else if (/development|developing/i.test(content)) {
    project.transitionStage = 'development';
  } else if (/research/i.test(content)) {
    project.transitionStage = 'research';
  }
  
  if (project.transitionStage) {
    project.parsingConfidence += 0.05;
  }
  
  // Extract SBIR linkage
  const sbirMatch = content.match(/SBIR|Small Business Innovation Research/i);
  if (sbirMatch) {
    project.sbirLinked = true;
    project.parsingConfidence += 0.05;
    
    // Try to extract SBIR topic number
    const topicMatch = content.match(/(?:topic|phase)\s+([A-Z]\d{2,3}-\d{3})/i);
    if (topicMatch) {
      project.sbirTopicNumber = topicMatch[1];
    }
  }
  
  // Extract funding amounts
  const fundingPatterns = [
    /\$(\d+(?:\.\d+)?)\s*million/i,
    /\$(\d+(?:\.\d+)?)\s*billion/i,
    /\$(\d{1,3}(?:,\d{3})+)/
  ];
  
  for (const pattern of fundingPatterns) {
    const match = content.match(pattern);
    if (match) {
      project.fundingAmountText = match[0];
      if (match[0].includes('billion')) {
        project.fundingAmount = parseFloat(match[1]) * 1_000_000_000;
      } else if (match[0].includes('million')) {
        project.fundingAmount = parseFloat(match[1]) * 1_000_000;
      } else {
        project.fundingAmount = parseFloat(match[1].replace(/,/g, ''));
      }
      project.parsingConfidence += 0.1;
      break;
    }
  }
  
  // Extract cost savings
  const savingsMatch = content.match(/(?:saved|savings of|reduced costs by)\s*\$?(\d+(?:\.\d+)?)\s*(million|billion)?/i);
  if (savingsMatch) {
    project.costSavingsText = savingsMatch[0];
    let amount = parseFloat(savingsMatch[1]);
    if (savingsMatch[2]?.toLowerCase() === 'billion') {
      amount *= 1_000_000_000;
    } else if (savingsMatch[2]?.toLowerCase() === 'million') {
      amount *= 1_000_000;
    }
    project.costSavingsEstimated = amount;
    project.parsingConfidence += 0.05;
  }
  
  // Extract fiscal year
  const fyMatch = content.match(/(?:fiscal year|FY)\s*(\d{2,4})/i);
  if (fyMatch) {
    let year = parseInt(fyMatch[1]);
    if (year < 100) {
      year += 2000; // Convert 24 to 2024
    }
    project.fiscalYear = year;
  }
  
  // Extract weapon systems and platforms (with more patterns)
  const weaponSystemPatterns = [
    // Aircraft
    { pattern: /\bF-?35\b/i, name: 'F-35' },
    { pattern: /\bF-?16\b/i, name: 'F-16' },
    { pattern: /\bF-?18\b/i, name: 'F-18' },
    { pattern: /\bF-?22\b/i, name: 'F-22' },
    { pattern: /\bA-?10\b/i, name: 'A-10' },
    { pattern: /\bB-?21\b/i, name: 'B-21' },
    { pattern: /\bB-?52\b/i, name: 'B-52' },
    { pattern: /\bB-?2\b/i, name: 'B-2' },
    { pattern: /\bC-?130\b/i, name: 'C-130' },
    { pattern: /\bC-?17\b/i, name: 'C-17' },
    { pattern: /\bKC-?46\b/i, name: 'KC-46' },
    { pattern: /\bAH-?64\b|\bApache\b/i, name: 'AH-64 Apache' },
    { pattern: /\bUH-?60\b|\bBlack\s*Hawk\b/i, name: 'UH-60 Black Hawk' },
    { pattern: /\bCH-?47\b|\bChinook\b/i, name: 'CH-47 Chinook' },
    { pattern: /\bV-?22\b|\bOsprey\b/i, name: 'V-22 Osprey' },
    { pattern: /\bMQ-?9\b|\bReaper\b/i, name: 'MQ-9 Reaper' },
    { pattern: /\bRQ-?4\b|\bGlobal\s*Hawk\b/i, name: 'RQ-4 Global Hawk' },
    
    // Ships
    { pattern: /\bVirginia[- ]?Class\b/i, name: 'Virginia Class' },
    { pattern: /\bColumbia[- ]?Class\b/i, name: 'Columbia Class' },
    { pattern: /\bDDG-?51\b|\bArleigh\s*Burke\b/i, name: 'DDG-51 Arleigh Burke' },
    { pattern: /\bFFG(?:-62)?\b|\bConstellation[- ]?Class\b/i, name: 'FFG-62 Constellation' },
    { pattern: /\bCVN-?78\b|\bFord[- ]?Class\b/i, name: 'CVN-78 Ford Class' },
    { pattern: /\bLCS\b|\bLittoral\s*Combat\s*Ship\b/i, name: 'LCS' },
    { pattern: /\bZumwalt\b|\bDDG-?1000\b/i, name: 'DDG-1000 Zumwalt' },
    
    // Ground vehicles
    { pattern: /\bM1\s*Abrams\b/i, name: 'M1 Abrams' },
    { pattern: /\bBradley\b/i, name: 'Bradley Fighting Vehicle' },
    { pattern: /\bStryker\b/i, name: 'Stryker' },
    { pattern: /\bJLTV\b/i, name: 'JLTV' },
    { pattern: /\bHMMWV\b|\bHumvee\b/i, name: 'HMMWV' },
    { pattern: /\bAmphibious\s*Combat\s*Vehicle\b|\bACV\b/i, name: 'ACV' },
    
    // Missiles & Defense
    { pattern: /\bPatriot\b/i, name: 'Patriot' },
    { pattern: /\bTHAAD\b/i, name: 'THAAD' },
    { pattern: /\bAegis\b/i, name: 'Aegis' },
    { pattern: /\bHIMARS\b/i, name: 'HIMARS' },
    { pattern: /\bJASSM\b/i, name: 'JASSM' },
    { pattern: /\bTomahawk\b/i, name: 'Tomahawk' },
    { pattern: /\bSM-?6\b/i, name: 'SM-6' },
    { pattern: /\bSM-?3\b/i, name: 'SM-3' }
  ];
  
  for (const ws of weaponSystemPatterns) {
    if (ws.pattern.test(content)) {
      if (!project.weaponSystems.includes(ws.name)) {
        project.weaponSystems.push(ws.name);
        project.platforms.push(ws.name);
        project.parsingConfidence += 0.03;
      }
    }
  }
  
  // Extract locations and states - improved patterns
  const uniqueLocations = new Set<string>();
  const uniqueStates = new Set<string>();
  
  // Pattern 1: City, State abbreviation (e.g., "San Diego, CA")
  const locationPattern1 = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z]{2})\b/g;
  const locationMatches1 = content.matchAll(locationPattern1);
  for (const match of locationMatches1) {
    // Skip common false positives
    if (['US', 'UK', 'EU', 'UN'].includes(match[2])) continue;
    const location = `${match[1]}, ${match[2]}`;
    uniqueLocations.add(location);
    uniqueStates.add(match[2]);
  }
  
  // Pattern 2: State names (full names)
  const stateNames = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];
  
  const stateAbbrevMap: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
    'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
    'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
    'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN',
    'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
    'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  
  for (const state of stateNames) {
    const statePattern = new RegExp(`\\b${state}\\b`, 'i');
    if (statePattern.test(content)) {
      uniqueStates.add(stateAbbrevMap[state]);
    }
  }
  
  project.locations = Array.from(uniqueLocations);
  project.states = Array.from(uniqueStates);
  
  // Extract POC information
  const pocNameMatch = content.match(/contact[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (pocNameMatch) {
    project.pocName = pocNameMatch[1];
    project.parsingConfidence += 0.03;
  }
  
  const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    project.pocEmail = emailMatch[1];
    project.parsingConfidence += 0.03;
  }
  
  const phoneMatch = content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    project.pocPhone = phoneMatch[0];
    project.parsingConfidence += 0.02;
  }
  
  // Extract keywords from title and content
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'will', 'are', 'was'];
  const words = articleTitle.toLowerCase().split(/\s+/).filter(w => 
    w.length > 4 && !stopWords.includes(w)
  );
  project.keywords = words.slice(0, 10);
  
  // Industry tags
  if (text.includes('aerospace') || text.includes('aircraft')) {
    project.industryTags.push('aerospace');
  }
  if (text.includes('shipbuilding') || text.includes('naval')) {
    project.industryTags.push('shipbuilding');
  }
  if (text.includes('electronics') || text.includes('semiconductor')) {
    project.industryTags.push('electronics');
  }
  
  // Cap confidence at 1.0
  project.parsingConfidence = Math.min(project.parsingConfidence, 1.0);
  
  return project;
}

// ============================================
// Save to Database
// ============================================

export async function saveProjectToDatabase(
  project: ExtractedManTechProject,
  article: ParsedManTechArticle
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('mantech_projects')
      .upsert({
        // Article metadata
        article_id: article.articleId,
        article_url: article.articleUrl,
        article_title: article.articleTitle,
        published_date: article.publishedDate?.toISOString().split('T')[0] || null,
        
        // ManTech Component
        mantech_component: project.mantechComponent,
        
        // Project Information
        project_name: project.projectName,
        project_description: project.projectDescription,
        project_status: project.transitionStage,
        
        // Technology Areas
        technology_focus: project.technologyFocus.length > 0 ? project.technologyFocus : null,
        manufacturing_processes: project.manufacturingProcesses.length > 0 ? project.manufacturingProcesses : null,
        technology_readiness_level: project.technologyReadinessLevel,
        manufacturing_readiness_level: project.manufacturingReadinessLevel,
        
        // Companies & Partners
        companies_involved: project.companiesInvolved.length > 0 ? project.companiesInvolved : null,
        prime_contractor: project.primeContractor,
        industry_partners: project.industryPartners.length > 0 ? project.industryPartners : null,
        academic_partners: project.academicPartners.length > 0 ? project.academicPartners : null,
        manufacturing_innovation_institutes: project.manufacturingInnovationInstitutes.length > 0 ? project.manufacturingInnovationInstitutes : null,
        
        // Transition
        transition_stage: project.transitionStage,
        transition_from: project.transitionFrom,
        transition_to: project.transitionTo,
        program_of_record: project.programOfRecord,
        
        // Funding
        funding_amount: project.fundingAmount,
        funding_amount_text: project.fundingAmountText,
        fiscal_year: project.fiscalYear,
        cost_savings_estimated: project.costSavingsEstimated,
        cost_savings_text: project.costSavingsText,
        
        // Impact
        capability_improvement: project.capabilityImprovement,
        readiness_impact: project.readinessImpact,
        industrial_base_impact: project.industrialBaseImpact,
        production_rate_improvement: project.productionRateImprovement,
        
        // Geographic
        locations: project.locations.length > 0 ? project.locations : null,
        states: project.states.length > 0 ? project.states : null,
        
        // Systems & Platforms
        weapon_systems: project.weaponSystems.length > 0 ? project.weaponSystems : null,
        platforms: project.platforms.length > 0 ? project.platforms : null,
        
        // Keywords
        keywords: project.keywords.length > 0 ? project.keywords : null,
        technology_tags: project.technologyTags.length > 0 ? project.technologyTags : null,
        industry_tags: project.industryTags.length > 0 ? project.industryTags : null,
        
        // POC
        poc_name: project.pocName,
        poc_title: project.pocTitle,
        poc_organization: project.pocOrganization,
        poc_email: project.pocEmail,
        poc_phone: project.pocPhone,
        
        // Raw Data
        raw_content: article.content,
        raw_html: article.rawHTML,
        
        // Cross-references
        sbir_linked: project.sbirLinked,
        sbir_company_name: project.sbirCompanyName,
        sbir_topic_number: project.sbirTopicNumber,
        
        // Media
        image_urls: article.imageUrls.length > 0 ? article.imageUrls : null,
        document_urls: article.documentUrls.length > 0 ? article.documentUrls : null,
        
        // Source
        source_type: 'news_article',
        source_url: article.articleUrl,
        
        // Quality
        parsing_confidence: project.parsingConfidence,
        
        scraped_at: new Date().toISOString()
      }, {
        onConflict: 'article_url',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('[ManTech] Error saving project:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('[ManTech] Exception saving project:', error);
    return false;
  }
}

// ============================================
// Scrape Single Article
// ============================================

export async function scrapeSingleArticle(
  url: string,
  component: string = 'News'
): Promise<{
  success: boolean;
  projectSaved: boolean;
}> {
  console.log(`[ManTech] Scraping article: ${url}`);
  
  try {
    // Fetch HTML
    const html = await fetchArticleHTML(url);
    if (!html) {
      return { success: false, projectSaved: false };
    }
    
    // Parse HTML
    const parsed = parseArticleHTML(html, url);
    if (!parsed) {
      return { success: false, projectSaved: false };
    }
    
    console.log(`[ManTech] Parsed: ${parsed.articleTitle}`);
    
    // Extract project data
    const project = extractProjectData(parsed.content, parsed.articleTitle, component);
    
    // Save to database
    const saved = await saveProjectToDatabase(project, parsed);
    
    if (saved) {
      console.log(`[ManTech]   ✓ Saved project (confidence: ${(project.parsingConfidence * 100).toFixed(0)}%)`);
    }
    
    return {
      success: true,
      projectSaved: saved
    };
    
  } catch (error) {
    console.error('[ManTech] Error scraping article:', error);
    return { success: false, projectSaved: false };
  }
}

// ============================================
// Find News Articles
// ============================================

export async function findNewsArticles(limit: number = 20): Promise<string[]> {
  console.log(`[ManTech] Finding news articles (limit: ${limit})...`);
  
  const articles: string[] = [];
  const articlesSet = new Set<string>(); // Track unique articles
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate through pages until we have enough articles or no more pages
    let pageNum = 1;
    let hasMorePages = true;
    const maxPages = 200; // Safety limit (assuming ~20 articles per page = 4000 articles max)
    
    while (hasMorePages && articles.length < limit && pageNum <= maxPages) {
      try {
        // Construct URL with page number
        const newsUrl = pageNum === 1 
          ? MANTECH_COMPONENTS.news.url 
          : `${MANTECH_COMPONENTS.news.url}?page=${pageNum}`;
        
        console.log(`[ManTech] Loading page ${pageNum}: ${newsUrl}`);
        await page.goto(newsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        let foundOnThisPage = 0;
        
        // Find all article links on this page
        $('a').each((i, elem) => {
          const href = $(elem).attr('href');
          
          if (href && href.includes('/Article/')) {
            let fullUrl = href;
            
            // Make absolute URL
            if (!href.startsWith('http')) {
              fullUrl = `https://www.dodmantech.mil${href}`;
            }
            
            // Add if not duplicate
            if (!articlesSet.has(fullUrl)) {
              articlesSet.add(fullUrl);
              articles.push(fullUrl);
              foundOnThisPage++;
            }
          }
        });
        
        console.log(`[ManTech] Page ${pageNum}: Found ${foundOnThisPage} new articles (total: ${articles.length})`);
        
        // If we found no new articles on this page, assume no more pages
        if (foundOnThisPage === 0) {
          console.log(`[ManTech] No new articles on page ${pageNum}, stopping pagination`);
          hasMorePages = false;
        } else {
          pageNum++;
        }
        
      } catch (error) {
        console.error(`[ManTech] Error loading page ${pageNum}:`, error);
        hasMorePages = false;
      }
    }
    
    await page.close();
    
    console.log(`[ManTech] Found ${articles.length} total news articles across ${pageNum - 1} pages`);
    return articles.slice(0, limit);
    
  } catch (error) {
    console.error('[ManTech] Error finding articles:', error);
    return [];
  }
}

// ============================================
// Scrape All Recent News
// ============================================

export async function scrapeRecentNews(limit: number = 10): Promise<{
  success: boolean;
  articlesFound: number;
  projectsSaved: number;
  articlesSkipped: number;
}> {
  console.log(`[ManTech] Starting recent news scrape (limit: ${limit})...`);
  
  try {
    // Find articles
    const articles = await findNewsArticles(limit);
    
    if (articles.length === 0) {
      console.log('[ManTech] No articles found');
      return { success: true, articlesFound: 0, projectsSaved: 0, articlesSkipped: 0 };
    }
    
    // Check which articles are already in the database
    const { data: existingArticles } = await supabase
      .from('mantech_projects')
      .select('article_url')
      .in('article_url', articles);
    
    const existingUrls = new Set(existingArticles?.map(a => a.article_url) || []);
    const newArticles = articles.filter(url => !existingUrls.has(url));
    
    console.log(`[ManTech] Found ${articles.length} total articles`);
    console.log(`[ManTech] Already scraped: ${existingUrls.size}`);
    console.log(`[ManTech] New to scrape: ${newArticles.length}`);
    
    let projectsSaved = 0;
    
    // Scrape only new articles
    for (const url of newArticles) {
      const result = await scrapeSingleArticle(url, 'News');
      if (result.projectSaved) {
        projectsSaved++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      success: true,
      articlesFound: articles.length,
      projectsSaved,
      articlesSkipped: existingUrls.size
    };
    
  } catch (error) {
    console.error('[ManTech] Error scraping recent news:', error);
    return { success: false, articlesFound: 0, projectsSaved: 0, articlesSkipped: 0 };
  } finally {
    await closeBrowser();
  }
}

