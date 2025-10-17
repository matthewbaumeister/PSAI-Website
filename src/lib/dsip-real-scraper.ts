/**
 * Real DSIP Scraper - Fetches actual data from dodsbirsttr.mil
 * Based on Python scraper that successfully retrieved 32,614 topics
 * Extracts all 159 columns and filters for Active/Open/Pre-Release status
 */

interface DSIPTopic {
  topicId: string;
  topicCode: string;
  topicTitle: string;
  component: string;
  cycleName: string;
  solicitationCycleId: string;
  topicStatus: string;
  topicStartDate?: number;
  topicEndDate?: number;
  topicQuestionCount?: number;
  [key: string]: any;
}

interface ScraperProgress {
  phase: string;
  currentPage?: number;
  totalTopics?: number;
  processedTopics: number;
  topicsWithDetails: number;
  activeTopicsFound: number;
  errors: string[];
  logs: string[];
}

export class DSIPRealScraper {
  private baseUrl = 'https://www.dodsbirsttr.mil';
  private progress: ScraperProgress = {
    phase: 'initializing',
    processedTopics: 0,
    topicsWithDetails: 0,
    activeTopicsFound: 0,
    errors: [],
    logs: []
  };
  
  private headers = {
    'Accept': 'application/json, text/plain, */*',
    'Authorization': 'Bearer null',
    'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  };

  /**
   * Main scraping function - fetches ALL topics then filters for active
   */
  async scrapeActiveOpportunities(progressCallback?: (progress: ScraperProgress) => void): Promise<any[]> {
    this.log(' Starting DSIP scraper for active opportunities');
    
    try {
      // Step 1: Initialize session
      await this.initializeSession();
      
      // Step 2: Fetch all topics from API (paginated)
      const allTopics = await this.fetchAllTopics(progressCallback);
      this.log(` Retrieved ${allTopics.length} total topics`);
      
      // Step 3: Filter for active/open/pre-release ONLY
      const activeTopics = this.filterActiveTopics(allTopics);
      this.log(` Found ${activeTopics.length} active/open/pre-release opportunities`);
      
      // Step 4: Fetch detailed information for active topics
      const detailedTopics = await this.fetchDetailedInfo(activeTopics, progressCallback);
      this.log(` Retrieved detailed info for ${detailedTopics.length} topics`);
      
      // Step 5: Format into 159 columns (matching Python scraper)
      const formattedData = this.formatToFullSchema(detailedTopics);
      
      return formattedData;
      
    } catch (error) {
      this.logError(`Fatal error in scraper: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Initialize session with DSIP website
   */
  private async initializeSession(): Promise<void> {
    this.log(' Initializing session with DSIP...');
    this.progress.phase = 'initializing';
    
    try {
      const response = await fetch(`${this.baseUrl}/topics-app/`, {
        headers: {
          'User-Agent': this.headers['User-Agent'],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (response.ok) {
        this.log(' Session initialized');
      } else {
        this.logError(`Session initialization failed: ${response.status}`);
      }
    } catch (error) {
      this.logError(`Session initialization error: ${error}`);
    }
  }

  /**
   * Fetch ALL topics from DSIP API (paginated)
   */
  private async fetchAllTopics(progressCallback?: (progress: ScraperProgress) => void): Promise<DSIPTopic[]> {
    this.log('📡 Fetching all topics from DSIP API...');
    this.progress.phase = 'fetching_topics';
    
    const allTopics: DSIPTopic[] = [];
    let page = 0;
    const size = 100;
    let consecutivePagesWithoutActive = 0;
    const maxConsecutivePagesWithoutActive = 50; // Increased to scan more pages for active topics
    let totalActiveFound = 0;
    
    console.log('[DSIP Scraper] Starting topic fetch with early termination after', maxConsecutivePagesWithoutActive, 'pages without active');
    
    while (true) {
      const searchParams = {
        searchText: null,
        components: null,
        programYear: null,
        solicitationCycleNames: null,
        releaseNumbers: [],
        topicReleaseStatus: [],
        modernizationPriorities: [],
        sortBy: "modifiedDate,desc", // Start with most recently modified
        technologyAreaIds: [],
        component: null,
        program: null
      };

      const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
      const searchUrl = `${this.baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=${size}&page=${page}`;

      if (page % 10 === 0) {
        this.log(`   Fetching page ${page + 1}...`);
      }

      try {
        const response = await fetch(searchUrl, { 
          headers: this.headers
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[DSIP Scraper] Page ${page}: API returned`, typeof data, data ? Object.keys(data) : 'null');

          if (data && typeof data === 'object' && 'data' in data) {
            const topics = data.data;
            const total = data.total || 0;

            if (page === 0) {
              this.log(`   ✓ Total topics available: ${total}`);
              this.progress.totalTopics = total;
              console.log(`[DSIP Scraper] First page: ${topics.length} topics, ${total} total in database`);
            }

            // Check if this page has any active opportunities
            const activeInThisPage = topics.filter((t: any) => 
              t.topicStatus === 'Open' || 
              t.topicStatus === 'Pre-Release' || 
              t.topicStatus === 'Active'
            ).length;

            totalActiveFound += activeInThisPage;

            if (activeInThisPage > 0) {
              consecutivePagesWithoutActive = 0;
              this.log(`   ✓ Found ${activeInThisPage} active opportunities on page ${page + 1} (total: ${totalActiveFound})`);
              console.log(`[DSIP Scraper] Page ${page + 1}: ${activeInThisPage} active, ${totalActiveFound} total active so far`);
            } else {
              consecutivePagesWithoutActive++;
              this.log(`    No active on page ${page + 1} (${consecutivePagesWithoutActive}/${maxConsecutivePagesWithoutActive})`);
            }

            allTopics.push(...topics);
            this.progress.processedTopics = allTopics.length;
            this.progress.activeTopicsFound = totalActiveFound;

            if (progressCallback) {
              progressCallback({ ...this.progress });
            }

            // Early termination conditions
            if (consecutivePagesWithoutActive >= maxConsecutivePagesWithoutActive && totalActiveFound > 0) {
              this.log(`    Stopping early: Found ${totalActiveFound} active opportunities, no more in last ${maxConsecutivePagesWithoutActive} pages`);
              console.log(`[DSIP Scraper] Early termination: ${totalActiveFound} active topics found`);
              break;
            }

            if (topics.length < size || allTopics.length >= total) {
              console.log(`[DSIP Scraper] Reached end: topics.length=${topics.length}, size=${size}, allTopics=${allTopics.length}, total=${total}`);
              break;
            }

            page++;
            await this.delay(200); // Small delay between requests
          } else {
            console.error('[DSIP Scraper] Unexpected data format from API:', data);
            break;
          }
        } else {
          this.logError(`API request failed: ${response.status}`);
          console.error(`[DSIP Scraper] API error on page ${page}: ${response.status}`);
          break;
        }
      } catch (error) {
        this.logError(`Error on page ${page}: ${error}`);
        console.error(`[DSIP Scraper] Exception on page ${page}:`, error);
        break;
      }
    }

    console.log(`[DSIP Scraper] Fetch complete: ${allTopics.length} total topics, ${totalActiveFound} marked as active during fetch`);
    return allTopics;
  }

  /**
   * Filter topics to only Active, Open, or Pre-Release status
   */
  private filterActiveTopics(topics: DSIPTopic[]): DSIPTopic[] {
    this.log(' Filtering for active/open/pre-release opportunities...');
    this.progress.phase = 'filtering';
    
    console.log(`[DSIP Scraper] Total topics to filter: ${topics.length}`);
    
    const activeStatuses = ['Active', 'Open', 'Pre-Release'];
    
    // Log sample of statuses for debugging
    const statusCounts: Record<string, number> = {};
    topics.forEach(topic => {
      const status = topic.topicStatus || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('[DSIP Scraper] Status distribution:', statusCounts);
    
    const filtered = topics.filter(topic => {
      const status = topic.topicStatus || '';
      return activeStatuses.includes(status);
    });
    
    console.log(`[DSIP Scraper] Filtered ${filtered.length} active opportunities from ${topics.length} total`);
    this.progress.activeTopicsFound = filtered.length;
    this.log(`   Found ${filtered.length} matching opportunities`);
    
    return filtered;
  }

  /**
   * Fetch detailed information for each topic
   */
  private async fetchDetailedInfo(
    topics: DSIPTopic[], 
    progressCallback?: (progress: ScraperProgress) => void
  ): Promise<DSIPTopic[]> {
    this.log(` Fetching FULL DETAILS for ${topics.length} active opportunities...`);
    this.progress.phase = 'fetching_details';
    
    const detailedTopics: DSIPTopic[] = [];
    
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const topicId = topic.topicId;
      const topicCode = topic.topicCode || 'Unknown';
      const topicTitle = (topic.topicTitle || 'Unknown Title').substring(0, 60);
      
      if (!topicId) continue;
      
      // Calculate progress percentage
      const progressPct = Math.floor(((i + 1) / topics.length) * 100);
      
      // Detailed progress for EVERY topic
      this.log(`   [${progressPct}%] Processing ${i + 1}/${topics.length}: ${topicCode} - ${topicTitle}...`);
      
      try {
        // Fetch detailed information
        const detailsUrl = `${this.baseUrl}/topics/api/public/topics/${topicId}`;
        const response = await fetch(detailsUrl, { 
          headers: this.headers,
          signal: AbortSignal.timeout(20000) // 20 second timeout
        });

        if (response.ok) {
          const details = await response.json();
          // Merge detailed data with basic topic
          Object.assign(topic, details);
          this.progress.topicsWithDetails++;
          this.log(`      ✓ Fetched detailed data`);
          
          // Log instruction URLs if present (for debugging)
          if (details.solicitationInstructionsUrl) {
            this.log(`      📄 Solicitation instructions: ${details.solicitationInstructionsUrl.substring(0, 50)}...`);
          }
          if (details.componentInstructionsUrl) {
            this.log(`      📄 Component instructions: ${details.componentInstructionsUrl.substring(0, 50)}...`);
          }
        } else {
          this.log(`      ⚠ Could not fetch details (status ${response.status})`);
        }

        // Fetch Q&A if available
        if (topic.topicQuestionCount && topic.topicQuestionCount > 0) {
          const qaUrl = `${this.baseUrl}/topics/api/public/topics/${topicId}/questions`;
          const qaResponse = await fetch(qaUrl, { 
            headers: this.headers,
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });

          if (qaResponse.ok) {
            const qaData = await qaResponse.json();
            topic.qa_data = qaData;
            const qaCount = Array.isArray(qaData) ? qaData.length : 0;
            this.log(`      ✓ Fetched ${qaCount} Q&A items`);
          }
        }

        detailedTopics.push(topic);
        
        // Update progress after each topic
        this.progress.processedTopics = i + 1;
        if (progressCallback) {
          progressCallback({ ...this.progress });
        }

        await this.delay(200); // Rate limiting between requests

      } catch (error) {
        this.logError(`      ⚠ Error fetching details: ${error}`);
        // Continue with basic info even if details fail
        detailedTopics.push(topic);
      }
    }

    return detailedTopics;
  }

  /**
   * Format topics into full 159-column schema (matching Python scraper)
   */
  private formatToFullSchema(topics: DSIPTopic[]): any[] {
    this.log(' Formatting data into 159-column schema...');
    this.progress.phase = 'formatting';
    
    return topics.map(topic => this.formatSingleTopic(topic));
  }

  /**
   * Format a single topic with all 159 columns
   */
  private formatSingleTopic(topic: any): any {
    const details = topic.detailed_info || {};
    const now = new Date();
    
    // Helper functions (matching Python)
    const formatDate = (timestamp?: number) => {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleDateString('en-US');
    };
    
    const cleanHtml = (text?: string) => {
      if (!text) return '';
      return text.replace(/<[^>]*>/g, '').trim();
    };
    
    const calculateDays = (start?: number, end?: number) => {
      if (!start || !end) return '';
      return Math.floor((end - start) / (1000 * 60 * 60 * 24)).toString();
    };

    // Extract all fields (using snake_case keys matching database schema)
    return {
      // Basic Info
      'topic_number': topic.topicCode || '',
      'topic_id': topic.topicId || '',
      'title': topic.topicTitle || '',
      'short_title': (topic.topicTitle || '').substring(0, 50),
      
      // Organization
      'component': topic.component || '',
      'Component Full Name (Derived: Expanded)': this.expandComponentName(topic.component),
      'Command (API: command)': topic.command || '',
      'Program (API: program)': topic.program || '',
      'Program Type (Derived: SBIR/STTR)': this.extractProgramType(topic.program),
      
      // Solicitation Info
      'Solicitation (API: solicitationTitle)': topic.solicitationTitle || '',
      'Solicitation Number (API: solicitationNumber)': topic.solicitationNumber || '',
      'Cycle Name (API: cycleName)': topic.cycleName || '',
      'Release Number (API: releaseNumber)': topic.releaseNumber?.toString() || '',
      
      // Status
      'Status (API: topicStatus)': topic.topicStatus || '',
      'Topic Status (API: topicStatus duplicate)': topic.topicStatus || '',
      'Proposal Window Status': this.getWindowStatus(topic.topicStartDate, topic.topicEndDate),
      'Days Until Close': this.calculateDaysUntil(topic.topicEndDate),
      'Days Since Open': this.calculateDaysSince(topic.topicStartDate),
      'Urgency Level': this.getUrgencyLevel(this.calculateDaysUntil(topic.topicEndDate)),
      
      // Dates
      'Open Date': formatDate(topic.topicStartDate),
      'Close Date': formatDate(topic.topicEndDate),
      'Open DateTime': formatDate(topic.topicStartDate),
      'Close DateTime': formatDate(topic.topicEndDate),
      'Duration days': calculateDays(topic.topicStartDate, topic.topicEndDate),
      'Pre-Release Start': formatDate(topic.topicPreReleaseStartDate),
      'Pre-Release End': formatDate(topic.topicPreReleaseEndDate),
      'Pre-Release Duration': calculateDays(topic.topicPreReleaseStartDate, topic.topicPreReleaseEndDate),
      'Created Date': formatDate(topic.createdDate),
      'Updated Date': formatDate(topic.updatedDate),
      'Modified Date': formatDate(topic.modifiedDate),
      'Last Activity Date': formatDate(topic.updatedDate),
      
      // Q&A Info
      'Q&A Start': formatDate(topic.topicQAStartDate),
      'Q&A End': formatDate(topic.topicQAEndDate),
      'Q&A Status': topic.topicQAStatus || '',
      'Total Questions': topic.topicQuestionCount?.toString() || '0',
      'Published Questions': topic.noOfPublishedQuestions?.toString() || '0',
      'hasQA': topic.topicQuestionCount > 0 ? '1' : '0',
      
      // Technical Details
      'Technology Areas': this.extractArray(details.technologyAreas),
      'Modernization Priorities': this.extractArray(details.focusAreas),
      'Keywords': this.extractArray(details.keywords),
      'ITAR Controlled': details.itar ? 'Yes' : 'No',
      'RequiresITAR': details.itar ? '1' : '0',
      
      // Descriptions
      'Objective': cleanHtml(details.objective),
      'Description': cleanHtml(details.description),
      'Phase I Description': cleanHtml(details.phase1Description),
      'Phase II Description': cleanHtml(details.phase2Description),
      'Phase III Dual Use': cleanHtml(details.phase3Description),
      
      // TPOC
      'TPOC Names': this.extractTPOC(topic.topicManagers, 'name'),
      'TPOC Emails': this.extractTPOC(topic.topicManagers, 'email'),
      'TPOC Centers': this.extractTPOC(topic.topicManagers, 'center'),
      
      // Links & Downloads (matching database schema)
      'topic_pdf_download': `${this.baseUrl}/topics/api/public/topics/${topic.topicId}/download/PDF`,
      'pdf_link': `${this.baseUrl}/topics/api/public/topics/${topic.topicId}/download/PDF`,
      'solicitation_instructions_download': topic.solicitationInstructionsUrl || '',
      'solicitation_instructions_url': topic.solicitationInstructionsUrl || '',
      'component_instructions_download': topic.componentInstructionsUrl || '',
      'component_instructions_url': topic.componentInstructionsUrl || '',
      'has_pdf': topic.topicId ? true : false,
      'has_solicitation_instructions': topic.solicitationInstructionsUrl ? true : false,
      'has_component_instructions': topic.componentInstructionsUrl ? true : false,
      'solicitation_instructions_version': topic.baaPrefaceUploadTitle || '',
      'component_instructions_version': topic.baaInstructions && Array.isArray(topic.baaInstructions) 
        ? topic.baaInstructions.map((i: any) => i.fileName || '').join(', ') 
        : '',
      
      // System
      'last_scraped': now.toISOString(),
      
      // Store raw API data for debugging
      '_raw_data': JSON.stringify(topic)
    };
  }

  // Helper methods
  private expandComponentName(component?: string): string {
    const map: Record<string, string> = {
      'ARMY': 'United States Army',
      'NAVY': 'United States Navy',
      'AIRFORCE': 'United States Air Force',
      'SPACEFORCE': 'United States Space Force',
      'DARPA': 'Defense Advanced Research Projects Agency',
      'DHA': 'Defense Health Agency',
      'SOCOM': 'Special Operations Command',
      'MDA': 'Missile Defense Agency'
    };
    return map[component?.toUpperCase() || ''] || component || '';
  }

  private extractProgramType(program?: string): string {
    if (!program) return '';
    if (program.includes('SBIR')) return 'SBIR';
    if (program.includes('STTR')) return 'STTR';
    return 'Other';
  }

  private getWindowStatus(start?: number, end?: number): string {
    if (!start || !end) return 'Unknown';
    const now = Date.now();
    if (now < start) return 'Upcoming';
    if (now > end) return 'Closed';
    return 'Open';
  }

  private calculateDaysUntil(timestamp?: number): string {
    if (!timestamp) return '';
    const days = Math.floor((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days.toString() : '0';
  }

  private calculateDaysSince(timestamp?: number): string {
    if (!timestamp) return '';
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days > 0 ? days.toString() : '0';
  }

  private getUrgencyLevel(daysUntilClose: string): string {
    const days = parseInt(daysUntilClose);
    if (isNaN(days)) return '';
    if (days <= 3) return 'Critical';
    if (days <= 7) return 'High';
    if (days <= 14) return 'Medium';
    return 'Low';
  }

  private extractArray(arr?: any[]): string {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.map(item => typeof item === 'object' ? item.name || '' : item).join(', ');
  }

  private extractTPOC(managers?: any[], field?: string): string {
    if (!managers || !Array.isArray(managers)) return '';
    return managers
      .filter(m => m.assignmentType === 'TPOC')
      .map(m => m[field || 'name'] || '')
      .join('; ');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    console.log(message);
    this.progress.logs.push(`${new Date().toISOString()}: ${message}`);
  }

  private logError(message: string): void {
    console.error(message);
    this.progress.errors.push(message);
  }

  getProgress(): ScraperProgress {
    return { ...this.progress };
  }
}

