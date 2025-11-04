/**
 * ============================================
 * Army XTECH Competitions Scraper
 * ============================================
 * 
 * Scrapes competition data from https://xtech.army.mil/competitions/
 * Two modes:
 *   - HISTORICAL: One-time deep scrape of all competitions (including closed)
 *   - ACTIVE: Daily scrape of only active competitions for updates
 * 
 * Handles lazy loading and captures:
 *   - Competition details
 *   - Winners and finalists
 *   - Prize amounts
 *   - Phase information
 *   - Dates and deadlines
 * 
 * ============================================
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// ============================================
// Configuration
// ============================================

const XTECH_BASE_URL = 'https://xtech.army.mil';
const XTECH_COMPETITIONS_URL = `${XTECH_BASE_URL}/competitions/`;
const REQUEST_DELAY_MS = 2000; // 2 seconds between requests to be polite

// Lazy initialization
let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    // Try to load from .env.local if not already loaded
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const dotenv = require('dotenv');
        const path = require('path');
        dotenv.config({ path: path.join(process.cwd(), '.env.local') });
      } catch (e) {
        // Ignore if already loaded
      }
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// ============================================
// Types
// ============================================

interface XTechCompetition {
  // Basic Info
  opportunity_number?: string;
  opportunity_title: string;
  competition_name: string;
  competition_year?: number;
  
  // Classification
  opportunity_type: string;
  status: string;
  
  // Dates
  announced_date?: string;
  open_date?: string;
  close_date?: string;
  winner_announcement_date?: string;
  
  // Description
  description?: string;
  problem_statement?: string;
  challenge_description?: string;
  
  // Technology Focus
  technology_areas?: string[];
  keywords?: string[];
  
  // Funding
  total_prize_pool?: number;
  prize_structure?: any;
  number_of_awards?: number;
  max_award_amount?: number;
  
  // Winners/Finalists
  winners?: Winner[];
  finalists?: Finalist[];
  
  // Links
  opportunity_url: string;
  source_url: string;
  
  // Metadata
  program_name: string;
  data_source: string;
  last_scraped: string;
}

interface Winner {
  company_name: string;
  award_amount?: number;
  phase?: string;
  placement?: string; // "First Place", "Second Place", "Winner"
  technology_area?: string;
  description?: string;
  location?: string;
}

interface Finalist {
  company_name: string;
  phase?: string;
  technology_area?: string;
  description?: string;
  location?: string;
}

interface ScraperStats {
  competitionsFound: number;
  competitionsProcessed: number;
  competitionsInserted: number;
  competitionsUpdated: number;
  winnersFound: number;
  finalistsFound: number;
  errors: number;
}

// ============================================
// Scraper Class
// ============================================

export class ArmyXTechScraper {
  private stats: ScraperStats = {
    competitionsFound: 0,
    competitionsProcessed: 0,
    competitionsInserted: 0,
    competitionsUpdated: 0,
    winnersFound: 0,
    finalistsFound: 0,
    errors: 0
  };

  private logId: number | null = null;

  /**
   * Delay between requests
   */
  private async delay(ms: number = REQUEST_DELAY_MS): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log scraper activity
   */
  private log(message: string, level: 'info' | 'error' | 'success' = 'info') {
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : '📊';
    console.log(`[XTECH Scraper] ${prefix} ${message}`);
  }

  /**
   * Create scraper log entry
   */
  private async createScraperLog(scrapeType: string): Promise<number | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('army_innovation_scraper_log')
        .insert({
          scrape_type: 'xtech',
          scrape_target: scrapeType,
          status: 'started',
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      this.log(`Failed to create scraper log: ${error}`, 'error');
      return null;
    }
  }

  /**
   * Update scraper log entry
   */
  private async updateScraperLog(status: 'completed' | 'failed', errorMessage?: string) {
    if (!this.logId) return;

    try {
      const supabase = getSupabase();
      const startTime = new Date();
      const completedAt = new Date();
      
      await supabase
        .from('army_innovation_scraper_log')
        .update({
          status,
          completed_at: completedAt.toISOString(),
          records_found: this.stats.competitionsFound,
          records_inserted: this.stats.competitionsInserted,
          records_updated: this.stats.competitionsUpdated,
          records_errors: this.stats.errors,
          error_message: errorMessage || null
        })
        .eq('id', this.logId);
    } catch (error) {
      this.log(`Failed to update scraper log: ${error}`, 'error');
    }
  }

  /**
   * Fetch HTML content from URL using Puppeteer (handles JavaScript-rendered content)
   */
  private async fetchHTML(url: string): Promise<string> {
    let browser = null;
    try {
      this.log(`Launching browser for: ${url}`);
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      this.log(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for competitions to load (look for common selectors)
      try {
        await page.waitForSelector('article, .entry-content, .competition, h2, h3', { timeout: 10000 });
      } catch {
        this.log('No specific selectors found, continuing with what loaded');
      }

      // For competitions page, click filter buttons and load all competitions
      if (url.includes('/competitions/')) {
        this.log('Loading all competitions with filters and Load More button...');
        
        // Click CLOSED button to load all closed competitions
        try {
          await page.click('a[href="#closed"]');
          this.log('Clicked CLOSED filter');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Click "Load More" button repeatedly until all competitions are loaded
          let clickCount = 0;
          const maxClicks = 50; // Safety limit
          while (clickCount < maxClicks) {
            try {
              // The Load More button is a div, not a button element
              const loadMoreButton = await page.$('.esg-loadmore');
              if (loadMoreButton) {
                // Check if button has remaining items
                const buttonText = await page.evaluate(el => el.textContent, loadMoreButton);
                this.log(`Found Load More button: ${buttonText}`);
                
                const isVisible = await page.evaluate(el => {
                  const style = window.getComputedStyle(el);
                  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                }, loadMoreButton);
                
                if (isVisible && buttonText && buttonText.includes('(')) {
                  // Click the button
                  await page.evaluate((el: Element) => (el as HTMLElement).click(), loadMoreButton);
                  clickCount++;
                  this.log(`Clicked Load More button (${clickCount} times)`);
                  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for new items to load
                } else {
                  this.log('Load More button not visible or no more items, all closed competitions loaded');
                  break;
                }
              } else {
                this.log('No Load More button found, all closed competitions loaded');
                break;
              }
            } catch (e) {
              this.log(`Finished clicking Load More button: ${e instanceof Error ? e.message : String(e)}`);
              break;
            }
          }
        } catch (e) {
          this.log('Could not process CLOSED filter, continuing...');
        }
        
        // Click ACTIVE button to load active competitions
        try {
          await page.click('a[href="#active"]');
          this.log('Clicked ACTIVE filter');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Click Load More for active competitions
          let clickCount = 0;
          while (clickCount < 20) {
            try {
              const loadMoreButton = await page.$('.esg-loadmore');
              if (loadMoreButton) {
                const buttonText = await page.evaluate(el => el.textContent, loadMoreButton);
                const isVisible = await page.evaluate(el => {
                  const style = window.getComputedStyle(el);
                  return style.display !== 'none' && style.visibility !== 'hidden';
                }, loadMoreButton);
                
                if (isVisible && buttonText && buttonText.includes('(')) {
                  await page.evaluate((el: Element) => (el as HTMLElement).click(), loadMoreButton);
                  clickCount++;
                  this.log(`Clicked Load More for active (${clickCount} times)`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                  break;
                }
              } else {
                break;
              }
            } catch (e) {
              break;
            }
          }
        } catch (e) {
          this.log('Could not process ACTIVE filter, continuing...');
        }
        
        // Click OPEN button to load open competitions
        try {
          await page.click('a[href="#open"]');
          this.log('Clicked OPEN filter');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          this.log('Could not click OPEN filter, continuing...');
        }
        
        this.log('Finished loading all competition sections');
      }

      // Scroll to load lazy-loaded content
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Wait a bit more for any final content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const html = await page.content();
      await browser.close();
      
      this.log(`Successfully fetched page (${html.length} chars)`);
      return html;
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      this.log(`Failed to fetch ${url}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Parse competition card from HTML (Essential Grid format)
   */
  private parseCompetitionCard($: cheerio.CheerioAPI, card: cheerio.Element): Partial<XTechCompetition> | null {
    try {
      const $card = $(card);
      
      // Extract link and title from .eg-invisiblebutton
      const $link = $card.find('a.eg-invisiblebutton').first();
      const link = $link.attr('href');
      const title = $link.text().trim();
      
      if (!title || title.length < 3 || !link) {
        return null;
      }

      const fullUrl = link.startsWith('http') ? link : `${XTECH_BASE_URL}${link}`;

      // Extract status from overlay class
      let status = 'Closed'; // Default
      const $overlay = $card.find('.esg-overlay');
      const overlayClass = $overlay.attr('class') || '';
      
      if (overlayClass.includes('active')) {
        status = 'Open';
      } else if (overlayClass.includes('closed')) {
        status = 'Closed';
      }
      
      // Also check for status text
      const statusText = $card.find('.esg-tc').text().toLowerCase();
      if (statusText.includes('open') || statusText.includes('active')) {
        status = 'Open';
      }

      // Extract dates
      const dateText = $card.text();
      const dates = this.extractDates(dateText);

      // Extract description
      const description = $card.find('.description, .competition-description, p').first().text().trim();

      // Extract winner/finalist indicators
      const hasWinners = $card.text().toLowerCase().includes('winner') || 
                        $card.text().toLowerCase().includes('award');
      const hasFinalists = $card.text().toLowerCase().includes('finalist');

      // Extract competition year from title
      const yearMatch = title.match(/20\d{2}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

      const competition: Partial<XTechCompetition> = {
        opportunity_title: title,
        competition_name: title,
        competition_year: year,
        opportunity_type: 'prize_competition',
        status,
        description: description || undefined,
        opportunity_url: fullUrl,
        source_url: fullUrl,
        program_name: 'XTECH',
        data_source: 'xtech.army.mil',
        last_scraped: new Date().toISOString(),
        ...dates
      };

      return competition;
    } catch (error) {
      this.log(`Error parsing competition card: ${error}`, 'error');
      return null;
    }
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): Partial<XTechCompetition> {
    const dates: any = {};

    // Common date patterns
    const datePattern = /(\w+\s+\d{1,2},?\s+20\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})/gi;
    const matches = text.match(datePattern);

    if (matches && matches.length > 0) {
      // Try to identify specific date types
      if (text.toLowerCase().includes('open')) {
        const openMatch = text.match(/open[s:]?\s*(\w+\s+\d{1,2},?\s+20\d{2})/i);
        if (openMatch) dates.open_date = this.parseDate(openMatch[1]);
      }
      
      if (text.toLowerCase().includes('close') || text.toLowerCase().includes('deadline')) {
        const closeMatch = text.match(/(?:close|deadline)[s:]?\s*(\w+\s+\d{1,2},?\s+20\d{2})/i);
        if (closeMatch) dates.close_date = this.parseDate(closeMatch[1]);
      }

      if (text.toLowerCase().includes('winner')) {
        const winnerMatch = text.match(/winner[s]?\s+(?:announced|selected)[:]?\s*(\w+\s+\d{1,2},?\s+20\d{2})/i);
        if (winnerMatch) dates.winner_announcement_date = this.parseDate(winnerMatch[1]);
      }
    }

    return dates;
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string | undefined {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return undefined;
  }

  /**
   * Fetch detailed competition information
   */
  private async fetchCompetitionDetails(url: string): Promise<Partial<XTechCompetition>> {
    try {
      this.log(`Fetching details from: ${url}`);
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      const details: Partial<XTechCompetition> = {};
      const pageText = $('body').text();

      // Extract full description - get all content after DESCRIPTION heading
      const descH2 = $('h2:contains("DESCRIPTION"), h3:contains("DESCRIPTION")');
      if (descH2.length > 0) {
        let descText = '';
        let current = descH2.first().next();
        let count = 0;
        // Get content until next h2/h3 or max 10 elements
        while (current.length > 0 && count < 10 && !current.is('h2, h3')) {
          descText += current.text().trim() + '\n\n';
          current = current.next();
          count++;
        }
        if (descText.trim().length > 100) {
          details.description = descText.trim();
          details.problem_statement = descText.substring(0, 500);
        }
      }
      
      // Fallback: get all paragraphs in main content if description still empty
      if (!details.description || details.description.length < 100) {
        const mainContent = $('.entry-content, .content, article').first();
        const paragraphs = mainContent.find('p').map((i, el) => $(el).text().trim()).get().filter(p => p.length > 20);
        if (paragraphs.length > 0) {
          details.description = paragraphs.join('\n\n');
          details.problem_statement = paragraphs[0]?.substring(0, 500);
        }
      }

      // Extract eligibility requirements - get all content after ELIGIBILITY heading
      const eligH2 = $('h2:contains("ELIGIBILITY"), h3:contains("ELIGIBILITY")');
      if (eligH2.length > 0) {
        let eligText = '';
        let current = eligH2.first().next();
        let count = 0;
        // Get content until next h2/h3 or max 10 elements
        while (current.length > 0 && count < 10 && !current.is('h2, h3')) {
          eligText += current.text().trim() + '\n';
          current = current.next();
          count++;
        }
        if (eligText.trim().length > 50) {
          details.eligibility_requirements = eligText.trim();
        }
      }

      // Extract schedule and phase information
      const scheduleSection = $('h2:contains("SCHEDULE"), h3:contains("SCHEDULE"), h2:contains("PRIZES"), h3:contains("PRIZES")').parent().text();
      if (scheduleSection) {
        details.challenge_description = scheduleSection.substring(0, 1000);
        
        // Extract phase information
        const phases: string[] = [];
        $('h3:contains("PHASE"), h4:contains("PHASE")').each((i, el) => {
          const phaseText = $(el).text().trim();
          if (phaseText) phases.push(phaseText);
        });
        if (phases.length > 0) {
          details.evaluation_stages = phases;
        }
      }

      // Extract prize information - look for dollar amounts
      const prizeText = $('body').text();
      const prizeMatches = prizeText.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/g);
      if (prizeMatches) {
        const amounts = prizeMatches.map(match => {
          const numMatch = match.match(/[\d,]+(?:\.\d{2})?/);
          return numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : 0;
        }).filter(amt => amt > 1000); // Only amounts over $1000 to filter noise

        if (amounts.length > 0) {
          details.total_prize_pool = amounts.reduce((sum, amt) => sum + amt, 0);
          details.max_award_amount = Math.max(...amounts);
          details.min_award_amount = Math.min(...amounts);
          details.number_of_awards = amounts.length;
          
          // Create prize structure
          details.prize_structure = {};
          amounts.forEach((amt, idx) => {
            if (idx === 0) details.prize_structure['first'] = amt;
            else if (idx === 1) details.prize_structure['second'] = amt;
            else if (idx === 2) details.prize_structure['third'] = amt;
            else details.prize_structure[`prize_${idx + 1}`] = amt;
          });
        }
      }

      // Extract dates and phases more intelligently
      const lines = pageText.split('\n');
      
      // Look for submission window dates
      const submissionDateMatch = pageText.match(/Submission\s+Dates?:\s*([A-Z][a-z]+\s+\d{1,2})\s*-\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i);
      if (submissionDateMatch) {
        const startDate = submissionDateMatch[1];
        const endDateFull = submissionDateMatch[2];
        // Extract year from end date
        const yearMatch = endDateFull.match(/\d{4}/);
        if (yearMatch) {
          details.open_date = this.parseDate(`${startDate}, ${yearMatch[0]}`);
          details.submission_deadline = this.parseDate(endDateFull);
          details.close_date = this.parseDate(endDateFull);
        }
      }
      
      // Look for Phase 1 dates (usually submission phase)
      const phase1Match = pageText.match(/PHASE\s+1[:\s]+.*?\n([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\s*-\s*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i);
      if (phase1Match && !details.open_date) {
        details.open_date = this.parseDate(phase1Match[1]);
        details.submission_deadline = this.parseDate(phase1Match[2]);
        details.close_date = this.parseDate(phase1Match[2]);
      }
      
      // Look for award/announcement dates
      const awardDatePatterns = [
        /(?:award|winner|announcement).*?([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i,
        /([A-Z][a-z]+\s+\d{1,2},\s+\d{4}).*?(?:award|winner)/i
      ];
      
      for (const pattern of awardDatePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          details.winner_announcement_date = this.parseDate(match[1]);
          details.award_date = this.parseDate(match[1]);
          break;
        }
      }
      
      // Look for the standalone date that often represents winner announcement
      // This is usually the last date mentioned after phases
      const allDates = pageText.match(/[A-Z][a-z]+\s+\d{1,2},\s+\d{4}/g);
      if (allDates && allDates.length > 0 && !details.winner_announcement_date) {
        // The last date is often the award date
        const lastDate = allDates[allDates.length - 1];
        details.winner_announcement_date = this.parseDate(lastDate);
        details.award_date = this.parseDate(lastDate);
      }
      
      // Extract phase information
      const phaseLines = lines.filter(line => /PHASE\s+\d/i.test(line));
      if (phaseLines.length > 0) {
        details.evaluation_stages = phaseLines.map(line => line.trim());
      }
      
      // Determine current competition phase based on status
      if (details.status === 'Closed') {
        details.competition_phase = 'Closed/Awarded';
      } else if (details.status === 'Open' || details.status === 'Active') {
        // Try to determine which phase they're in
        const currentDate = new Date();
        if (details.submission_deadline) {
          const deadlineDate = new Date(details.submission_deadline);
          if (currentDate < deadlineDate) {
            details.competition_phase = 'Phase 1: Submissions Open';
          } else {
            details.competition_phase = 'Phase 2: Evaluation';
          }
        } else {
          details.competition_phase = 'Active';
        }
      }

      // Extract submission requirements
      const submissionText = $('body').text();
      if (submissionText.toLowerCase().includes('white paper')) {
        details.submission_format = 'White Paper';
        const pageMatch = submissionText.match(/(\d+)\s*page/i);
        if (pageMatch) details.page_limit = parseInt(pageMatch[1]);
      } else if (submissionText.toLowerCase().includes('pitch')) {
        details.submission_format = 'Pitch Presentation';
      } else if (submissionText.toLowerCase().includes('video')) {
        details.submission_format = 'Video Submission';
      }

      // Extract participant numbers
      const participantMatch = submissionText.match(/(\d+)\s+(?:participants|companies|teams|submissions)/i);
      if (participantMatch) {
        details.actual_participants = parseInt(participantMatch[1]);
      }

      // Extract winners
      const winners = this.extractWinners($);
      if (winners.length > 0) {
        details.winners = winners;
        this.stats.winnersFound += winners.length;
      }

      // Extract finalists
      const finalists = this.extractFinalists($);
      if (finalists.length > 0) {
        details.finalists = finalists;
        this.stats.finalistsFound += finalists.length;
      }

      // Extract technology areas from keywords
      const keywords = this.extractKeywords($.text());
      if (keywords.length > 0) {
        details.keywords = keywords;
        details.technology_areas = keywords.slice(0, 5); // Top 5 as tech areas
      }

      return details;
    } catch (error) {
      this.log(`Error fetching competition details: ${error}`, 'error');
      return {};
    }
  }

  /**
   * Extract winners from page
   */
  private extractWinners($: cheerio.CheerioAPI): Winner[] {
    const winners: Winner[] = [];

    // Find the WINNERS heading
    const allHeadings = $('h2, h3, h4').toArray();
    const winnersHeadingIndex = allHeadings.findIndex(h => {
      const text = $(h).text().toLowerCase();
      return text.includes('winner') && !text.includes('finalist');
    });

    if (winnersHeadingIndex === -1) {
      return winners; // No winners section found
    }

    // Extract company names as headings after the WINNERS heading
    // Stop when we hit another major section
    const stopKeywords = ['finalist', 'eligibility', 'schedule', 'phase', 'description', 'prize structure', 'contact'];
    
    for (let i = winnersHeadingIndex + 1; i < allHeadings.length; i++) {
      const heading = allHeadings[i];
      const headingText = $(heading).text().trim();
      
      // Stop if we hit another major section
      const isStopSection = stopKeywords.some(keyword => 
        headingText.toLowerCase().includes(keyword)
      );
      if (isStopSection) break;
      
      // Skip if it's just a date, number, or announcement text
      // Match various date formats: "Sep 18, 2025", "Sep 18 2025", "Sep18 2025", "September 18, 2025"
      if (/^[A-Z][a-z]{2,9}\.?\s*\d{1,2},?\s+\d{4}$/.test(headingText)) continue;
      if (/^\d+$/.test(headingText)) continue;
      if (headingText.length < 3) continue;
      // Skip headings that are just announcement text
      if (headingText.toLowerCase().includes('announced')) continue;
      if (headingText.toLowerCase().includes('winner:')) continue;
      
      // This is a company name
      const winner: Winner = {
        company_name: headingText,
        location: this.extractLocation(headingText)
      };

      // Try to find description in the content after this heading
      const $heading = $(heading);
      const nextP = $heading.next('p');
      if (nextP.length > 0) {
        const desc = nextP.text().trim();
        if (desc.length > 20 && desc.length < 500) {
          winner.description = desc;
        }
      }

      winners.push(winner);
    }

    return winners;
  }

  /**
   * Extract finalists from page
   */
  private extractFinalists($: cheerio.CheerioAPI): Finalist[] {
    const finalists: Finalist[] = [];

    // Find the FINALISTS heading
    const allHeadings = $('h2, h3, h4').toArray();
    const finalistsHeadingIndex = allHeadings.findIndex(h => 
      $(h).text().toLowerCase().includes('finalist')
    );

    if (finalistsHeadingIndex === -1) {
      return finalists; // No finalists section found
    }

    // Extract company names as headings after the FINALISTS heading
    const stopKeywords = ['eligibility', 'schedule', 'phase', 'description', 'prize structure', 'contact'];
    
    for (let i = finalistsHeadingIndex + 1; i < allHeadings.length; i++) {
      const heading = allHeadings[i];
      const headingText = $(heading).text().trim();
      
      // Stop if we hit another major section
      const isStopSection = stopKeywords.some(keyword => 
        headingText.toLowerCase().includes(keyword)
      );
      if (isStopSection) break;
      
      // Skip if it's just a date, number, or announcement text
      // Match various date formats: "Sep 18, 2025", "Sep 18 2025", "Sep18 2025", "September 18, 2025"
      if (/^[A-Z][a-z]{2,9}\.?\s*\d{1,2},?\s+\d{4}$/.test(headingText)) continue;
      if (/^\d+$/.test(headingText)) continue;
      if (headingText.length < 3) continue;
      // Skip headings that are just announcement text
      if (headingText.toLowerCase().includes('announced')) continue;
      if (headingText.toLowerCase().includes('winner:')) continue;
      
      // This is a company name
      const finalist: Finalist = {
        company_name: headingText,
        location: this.extractLocation(headingText)
      };

      // Try to find description
      const $heading = $(heading);
      const nextP = $heading.next('p');
      if (nextP.length > 0) {
        const desc = nextP.text().trim();
        if (desc.length > 20 && desc.length < 500) {
          finalist.description = desc;
        }
      }

      finalists.push(finalist);
    }

    return finalists;
  }

  /**
   * Extract location from text
   */
  private extractLocation(text: string): string | undefined {
    // Look for city, state patterns
    const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);
    if (locationMatch) {
      return `${locationMatch[1]}, ${locationMatch[2]}`;
    }
    return undefined;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>();
    const lowerText = text.toLowerCase();

    // Technology keywords
    const techKeywords = [
      'artificial intelligence', 'ai', 'machine learning', 'ml',
      'autonomous', 'robotics', 'cyber', 'cybersecurity',
      'electronics', 'sensors', 'communications', 'networking',
      'energy', 'power', 'battery', 'materials',
      'manufacturing', '3d printing', 'additive manufacturing',
      'biotechnology', 'medical', 'wearables',
      'navigation', 'gps', 'positioning', 'timing',
      'quantum', 'edge computing', 'cloud',
      'data analytics', 'big data', 'iot', 'internet of things',
      '5g', 'wireless', 'radar', 'lidar',
      'unmanned', 'uav', 'ugv', 'drone'
    ];

    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // Capitalize properly
        keywords.add(keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    });

    return Array.from(keywords);
  }

  /**
   * Save competition to database
   */
  private async saveCompetition(competition: XTechCompetition): Promise<boolean> {
    try {
      const supabase = getSupabase();

      // First, ensure the XTECH program exists
      const { data: program } = await supabase
        .from('army_innovation_programs')
        .select('id')
        .eq('program_name', 'XTECH')
        .single();

      const programId = program?.id;

      // Prepare the competition data - include ALL fields
      const competitionData: any = {
        program_id: programId,
        program_name: competition.program_name,
        opportunity_number: competition.opportunity_number,
        opportunity_title: competition.opportunity_title,
        opportunity_subtitle: competition.opportunity_subtitle,
        competition_name: competition.competition_name,
        competition_year: competition.competition_year,
        opportunity_type: competition.opportunity_type,
        competition_phase: competition.competition_phase,
        track_name: competition.track_name,
        status: competition.status,
        submission_window_status: competition.submission_window_status,
        
        // Dates
        announced_date: competition.announced_date,
        open_date: competition.open_date,
        close_date: competition.close_date,
        submission_deadline: competition.submission_deadline,
        evaluation_start_date: competition.evaluation_start_date,
        evaluation_end_date: competition.evaluation_end_date,
        winner_announcement_date: competition.winner_announcement_date,
        award_date: competition.award_date,
        
        // Descriptions
        description: competition.description,
        problem_statement: competition.problem_statement,
        challenge_description: competition.challenge_description,
        desired_outcome: competition.desired_outcome,
        evaluation_criteria: competition.evaluation_criteria,
        
        // Technology and keywords
        technology_areas: competition.technology_areas,
        naics_codes: competition.naics_codes,
        keywords: competition.keywords,
        modernization_priorities: competition.modernization_priorities,
        capability_gaps: competition.capability_gaps,
        
        // Eligibility
        eligibility_requirements: competition.eligibility_requirements,
        eligible_entities: competition.eligible_entities,
        security_clearance_required: competition.security_clearance_required,
        itar_controlled: competition.itar_controlled,
        us_citizen_required: competition.us_citizen_required,
        team_size_limit: competition.team_size_limit,
        
        // Prizes and funding
        total_prize_pool: competition.total_prize_pool,
        prize_structure: competition.prize_structure,
        number_of_awards: competition.number_of_awards,
        min_award_amount: competition.min_award_amount,
        max_award_amount: competition.max_award_amount,
        matching_funds_available: competition.matching_funds_available,
        follow_on_funding_potential: competition.follow_on_funding_potential,
        
        // Submission requirements
        submission_format: competition.submission_format,
        page_limit: competition.page_limit,
        submission_instructions: competition.submission_instructions,
        required_documents: competition.required_documents,
        optional_documents: competition.optional_documents,
        
        // Evaluation
        evaluation_stages: competition.evaluation_stages,
        judging_criteria: competition.judging_criteria,
        review_process_description: competition.review_process_description,
        
        // Contact and events
        poc_name: competition.poc_name,
        poc_email: competition.poc_email,
        poc_phone: competition.poc_phone,
        technical_poc_name: competition.technical_poc_name,
        technical_poc_email: competition.technical_poc_email,
        questions_allowed: competition.questions_allowed,
        qa_deadline: competition.qa_deadline,
        pitch_event_date: competition.pitch_event_date,
        pitch_event_location: competition.pitch_event_location,
        pitch_event_virtual: competition.pitch_event_virtual,
        demo_day_date: competition.demo_day_date,
        demo_day_location: competition.demo_day_location,
        
        // URLs
        opportunity_url: competition.opportunity_url,
        registration_url: competition.registration_url,
        submission_portal_url: competition.submission_portal_url,
        rules_document_url: competition.rules_document_url,
        faq_url: competition.faq_url,
        information_session_url: competition.information_session_url,
        video_url: competition.video_url,
        
        // Partners and participants
        industry_partners: competition.industry_partners,
        government_partners: competition.government_partners,
        academic_partners: competition.academic_partners,
        transition_partners: competition.transition_partners,
        expected_participants: competition.expected_participants,
        actual_participants: competition.actual_participants,
        submissions_received: competition.submissions_received,
        finalists_selected: competition.finalists_selected,
        winners_selected: competition.winners_selected,
        
        // Metadata
        previous_competition_id: competition.previous_competition_id,
        competition_series: competition.competition_series,
        series_iteration: competition.series_iteration,
        data_source: competition.data_source,
        source_url: competition.source_url,
        last_scraped: competition.last_scraped,
        scrape_frequency: competition.scrape_frequency,
        related_sbir_topics: competition.related_sbir_topics,
        is_sbir_prize_gateway: competition.is_sbir_prize_gateway
      };

      // Upsert competition
      const { data: savedCompetition, error: compError } = await supabase
        .from('army_innovation_opportunities')
        .upsert(competitionData, {
          onConflict: 'opportunity_number,program_name',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (compError) {
        // If conflict, try update instead
        const { data: existingComp } = await supabase
          .from('army_innovation_opportunities')
          .select('id')
          .eq('opportunity_title', competition.opportunity_title)
          .eq('program_name', 'XTECH')
          .maybeSingle();

        if (existingComp) {
          await supabase
            .from('army_innovation_opportunities')
            .update(competitionData)
            .eq('id', existingComp.id);
          
          this.stats.competitionsUpdated++;
          
          // Save winners/finalists
          if (competition.winners && competition.winners.length > 0) {
            await this.saveWinners(existingComp.id, competition.winners);
          }
          if (competition.finalists && competition.finalists.length > 0) {
            await this.saveFinalists(existingComp.id, competition.finalists);
          }
          
          return true;
        } else {
          throw compError;
        }
      } else {
        this.stats.competitionsInserted++;
        
        // Save winners and finalists
        if (savedCompetition && savedCompetition.id) {
          if (competition.winners && competition.winners.length > 0) {
            await this.saveWinners(savedCompetition.id, competition.winners);
          }
          if (competition.finalists && competition.finalists.length > 0) {
            await this.saveFinalists(savedCompetition.id, competition.finalists);
          }
        }
      }

      return true;
    } catch (error) {
      this.log(`Error saving competition: ${error}`, 'error');
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Save winners to database
   */
  private async saveWinners(opportunityId: number, winners: Winner[]): Promise<void> {
    try {
      const supabase = getSupabase();

      const submissions = winners.map(winner => ({
        opportunity_id: opportunityId,
        company_name: winner.company_name,
        company_location: winner.location,
        submission_status: 'Winner',
        phase: winner.phase,
        award_amount: winner.award_amount,
        public_abstract: winner.description
      }));

      // Use insert instead of upsert since table has no unique constraint
      const { error: insertError } = await supabase
        .from('army_innovation_submissions')
        .insert(submissions);

      if (insertError) {
        this.log(`Error inserting winners: ${insertError.message}`, 'error');
      } else {
        this.log(`Saved ${winners.length} winners`);
      }
    } catch (error) {
      this.log(`Error saving winners: ${error}`, 'error');
    }
  }

  /**
   * Save finalists to database
   */
  private async saveFinalists(opportunityId: number, finalists: Finalist[]): Promise<void> {
    try {
      const supabase = getSupabase();

      const submissions = finalists.map(finalist => ({
        opportunity_id: opportunityId,
        company_name: finalist.company_name,
        company_location: finalist.location,
        submission_status: 'Finalist',
        phase: finalist.phase,
        public_abstract: finalist.description
      }));

      // Use insert instead of upsert since table has no unique constraint
      const { error: insertError } = await supabase
        .from('army_innovation_submissions')
        .insert(submissions);

      if (insertError) {
        this.log(`Error inserting finalists: ${insertError.message}`, 'error');
      } else {
        this.log(`Saved ${finalists.length} finalists`);
      }
    } catch (error) {
      this.log(`Error saving finalists: ${error}`, 'error');
    }
  }

  /**
   * HISTORICAL MODE: Scrape all competitions (including closed)
   */
  async scrapeHistorical(): Promise<ScraperStats> {
    this.log('Starting HISTORICAL scrape of all XTECH competitions...', 'info');
    this.logId = await this.createScraperLog('historical');

    try {
      // Fetch main competitions page
      const html = await this.fetchHTML(XTECH_COMPETITIONS_URL);
      const $ = cheerio.load(html);

      // The page uses Essential Grid plugin - competition cards are in .esg-entry-cover divs
      const cards = $('.esg-entry-cover').toArray();
      
      this.log(`Found ${cards.length} competition cards (Essential Grid)`);
      this.stats.competitionsFound = cards.length;

      // Process each competition
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        this.log(`Processing competition ${i + 1}/${cards.length}...`);

        const competition = this.parseCompetitionCard($, card);
        if (!competition || !competition.opportunity_title) {
          this.log(`Skipping invalid competition at index ${i}`, 'info');
          continue;
        }

        // Generate opportunity number if not present
        if (!competition.opportunity_number) {
          const slug = competition.opportunity_title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          competition.opportunity_number = `xtech-${slug}`;
        }

        // Fetch detailed information if URL is available
        if (competition.opportunity_url && competition.opportunity_url !== XTECH_COMPETITIONS_URL) {
          await this.delay(); // Be polite
          const details = await this.fetchCompetitionDetails(competition.opportunity_url);
          Object.assign(competition, details);
        }

        // Save to database
        await this.saveCompetition(competition as XTechCompetition);
        this.stats.competitionsProcessed++;

        this.log(`Saved: ${competition.opportunity_title} (${this.stats.competitionsProcessed}/${cards.length})`, 'success');
      }

      await this.updateScraperLog('completed');
      this.log('Historical scrape completed successfully!', 'success');
      this.printStats();
      
      return this.stats;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`Historical scrape failed: ${errorMsg}`, 'error');
      await this.updateScraperLog('failed', errorMsg);
      throw error;
    }
  }

  /**
   * ACTIVE MODE: Scrape only active/open competitions
   */
  async scrapeActive(): Promise<ScraperStats> {
    this.log('Starting ACTIVE scrape of open XTECH competitions...', 'info');
    this.logId = await this.createScraperLog('active');

    try {
      // Fetch main competitions page
      const html = await this.fetchHTML(XTECH_COMPETITIONS_URL);
      const $ = cheerio.load(html);

      // The page uses Essential Grid plugin
      const allCards = $('.esg-entry-cover').toArray();
      
      // Filter for active/open competitions only
      const activeCards = allCards.filter(card => {
        const $card = $(card);
        const overlayClass = $card.find('.esg-overlay').attr('class') || '';
        const statusText = $card.text().toLowerCase();
        
        // Check if it has the "active" class or doesn't have "closed"
        return overlayClass.includes('active') || 
               (statusText.includes('open') || statusText.includes('active')) ||
               (!overlayClass.includes('closed') && !statusText.includes('closed'));
      });

      this.log(`Found ${activeCards.length} active competitions (out of ${cards.length} total)`);
      this.stats.competitionsFound = activeCards.length;

      // Process each active competition
      for (let i = 0; i < activeCards.length; i++) {
        const card = activeCards[i];
        this.log(`Processing active competition ${i + 1}/${activeCards.length}...`);

        const competition = this.parseCompetitionCard($, card);
        if (!competition || !competition.opportunity_title) {
          continue;
        }

        // Generate opportunity number if not present
        if (!competition.opportunity_number) {
          const slug = competition.opportunity_title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          competition.opportunity_number = `xtech-${slug}`;
        }

        // Always fetch detailed information for active competitions
        if (competition.opportunity_url && competition.opportunity_url !== XTECH_COMPETITIONS_URL) {
          await this.delay();
          const details = await this.fetchCompetitionDetails(competition.opportunity_url);
          Object.assign(competition, details);
        }

        // Save to database
        await this.saveCompetition(competition as XTechCompetition);
        this.stats.competitionsProcessed++;

        this.log(`Updated: ${competition.opportunity_title} (${this.stats.competitionsProcessed}/${activeCards.length})`, 'success');
      }

      await this.updateScraperLog('completed');
      this.log('Active scrape completed successfully!', 'success');
      this.printStats();
      
      return this.stats;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`Active scrape failed: ${errorMsg}`, 'error');
      await this.updateScraperLog('failed', errorMsg);
      throw error;
    }
  }

  /**
   * Print scraper statistics
   */
  private printStats() {
    this.log('==========================================');
    this.log('XTECH Scraper Statistics');
    this.log('==========================================');
    this.log(`Competitions Found: ${this.stats.competitionsFound}`);
    this.log(`Competitions Processed: ${this.stats.competitionsProcessed}`);
    this.log(`Competitions Inserted: ${this.stats.competitionsInserted}`);
    this.log(`Competitions Updated: ${this.stats.competitionsUpdated}`);
    this.log(`Winners Found: ${this.stats.winnersFound}`);
    this.log(`Finalists Found: ${this.stats.finalistsFound}`);
    this.log(`Errors: ${this.stats.errors}`);
    this.log('==========================================');
  }
}

// ============================================
// CLI Interface
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'active'; // Default to active mode

  const scraper = new ArmyXTechScraper();

  if (mode === 'historical') {
    console.log('Running HISTORICAL scrape (all competitions including closed)...');
    await scraper.scrapeHistorical();
  } else if (mode === 'active') {
    console.log('Running ACTIVE scrape (open competitions only)...');
    await scraper.scrapeActive();
  } else {
    console.error('Invalid mode. Use "historical" or "active"');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Scraper failed:', error);
    process.exit(1);
  });
}

export default ArmyXTechScraper;

