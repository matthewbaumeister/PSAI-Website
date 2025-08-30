import { createAdminSupabaseClient } from './supabase';

export interface ScrapingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  type: 'full' | 'quick';
  progress: number;
  totalTopics: number;
  processedTopics: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  logs: string[];
  lastActivity: Date;
  estimatedCompletion?: Date;
  currentPage?: number;
  currentTopicIndex?: number;
}

export interface ScrapingLog {
  id: string;
  jobId: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

class DSIPScraper {
  private baseUrl = 'https://www.dodsbirsttr.mil';
  private session: any;
  private isRunning = false;
  private currentJob: ScrapingJob | null = null;
  private shouldStop = false;
  private jobCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSession();
    this.startJobMonitoring();
  }

  private async initializeSession() {
    try {
      const response = await fetch(`${this.baseUrl}/topics-app/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (response.ok) {
        console.log('Session initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  private startJobMonitoring() {
    // Check for running jobs every 30 seconds
    this.jobCheckInterval = setInterval(async () => {
      await this.checkForResumeJobs();
    }, 30000);
  }

  private async checkForResumeJobs() {
    try {
      const supabase = createAdminSupabaseClient();
      const { data: runningJobs } = await supabase
        .from('dsip_scraping_jobs')
        .select('*')
        .eq('status', 'running')
        .eq('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes ago

      if (runningJobs && runningJobs.length > 0) {
        // Resume stalled jobs
        for (const job of runningJobs) {
          await this.resumeJob(job.id);
        }
      }
    } catch (error) {
      console.error('Error checking for resume jobs:', error);
    }
  }

  async startFullRefresh(): Promise<string> {
    if (this.isRunning) {
      throw new Error('Scraper is already running');
    }

    const jobId = `full_${Date.now()}`;
    this.currentJob = {
      id: jobId,
      status: 'pending',
      type: 'full',
      progress: 0,
      totalTopics: 0,
      processedTopics: 0,
      startTime: new Date(),
      logs: [],
      lastActivity: new Date(),
      currentPage: 0,
      currentTopicIndex: 0
    };

    // Save job to database
    await this.saveJobToDatabase(this.currentJob);

    this.isRunning = true;
    this.shouldStop = false;
    this.currentJob.status = 'running';

    // Start the scraping process in the background
    this.runFullScrape(jobId);

    return jobId;
  }

  async startQuickCheck(): Promise<string> {
    if (this.isRunning) {
      throw new Error('Scraper is already running');
    }

    const jobId = `quick_${Date.now()}`;
    this.currentJob = {
      id: jobId,
      status: 'pending',
      type: 'quick',
      progress: 0,
      totalTopics: 0,
      processedTopics: 0,
      startTime: new Date(),
      logs: [],
      lastActivity: new Date(),
      currentPage: 0,
      currentTopicIndex: 0
    };

    // Save job to database
    await this.saveJobToDatabase(this.currentJob);

    this.isRunning = true;
    this.shouldStop = false;
    this.currentJob.status = 'running';

    // Start the quick check process
    this.runQuickCheck(jobId);

    return jobId;
  }

  private async saveJobToDatabase(job: ScrapingJob) {
    try {
      const supabase = createAdminSupabaseClient();
      await supabase
        .from('dsip_scraping_jobs')
        .upsert({
          id: job.id,
          status: job.status,
          type: job.type,
          progress: job.progress,
          total_topics: job.totalTopics,
          processed_topics: job.processedTopics,
          start_time: job.startTime.toISOString(),
          end_time: job.endTime?.toISOString(),
          error: job.error,
          logs: job.logs,
          last_activity: job.lastActivity.toISOString(),
          estimated_completion: job.estimatedCompletion?.toISOString(),
          current_page: job.currentPage,
          current_topic_index: job.currentTopicIndex
        });
    } catch (error) {
      console.error('Error saving job to database:', error);
    }
  }

  private async updateJobProgress(job: ScrapingJob) {
    job.lastActivity = new Date();
    await this.saveJobToDatabase(job);
  }

  private async resumeJob(jobId: string) {
    try {
      const supabase = createAdminSupabaseClient();
      const { data: job } = await supabase
        .from('dsip_scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (job && job.status === 'running') {
        this.currentJob = {
          id: job.id,
          status: job.status as any,
          type: job.type as any,
          progress: job.progress,
          totalTopics: job.total_topics,
          processedTopics: job.processed_topics,
          startTime: new Date(job.start_time),
          endTime: job.end_time ? new Date(job.end_time) : undefined,
          error: job.error,
          logs: job.logs || [],
          lastActivity: new Date(job.last_activity),
          estimatedCompletion: job.estimated_completion ? new Date(job.estimated_completion) : undefined,
          currentPage: job.current_page,
          currentTopicIndex: job.current_topic_index
        };

        this.isRunning = true;
        this.shouldStop = false;

        // Resume from where it left off
        if (this.currentJob.type === 'full') {
          this.runFullScrape(jobId, true);
        } else {
          this.runQuickCheck(jobId, true);
        }
      }
    } catch (error) {
      console.error('Error resuming job:', error);
    }
  }

  private async runFullScrape(jobId: string, isResume = false) {
    try {
      this.log(jobId, 'info', '🚀 Starting full DSIP database refresh...');
      this.log(jobId, 'info', '⏰ Estimated runtime: 8-12 hours (with breaks)');
      this.log(jobId, 'info', '💡 This job can be paused and resumed');

      // Step 1: Fetch all topics (with resume capability)
      this.log(jobId, 'info', '📡 Fetching all topics...');
      const allTopics = await this.fetchAllTopics(jobId, isResume);
      
      this.currentJob!.totalTopics = allTopics.length;
      this.log(jobId, 'info', `✅ Retrieved ${allTopics.length} topics`);

      // Step 2: Process each topic with details (with resume capability)
      this.log(jobId, 'info', '🔄 Processing topics with detailed information...');
      await this.processTopicsWithDetails(allTopics, jobId, isResume);

      // Step 3: Save to database
      this.log(jobId, 'info', '💾 Saving to database...');
      await this.saveToDatabase(allTopics, jobId);

      this.currentJob!.status = 'completed';
      this.currentJob!.endTime = new Date();
      this.currentJob!.progress = 100;
      this.log(jobId, 'info', '🎉 Full refresh completed successfully!');
      await this.updateJobProgress(this.currentJob!);

    } catch (error) {
      this.currentJob!.status = 'failed';
      this.currentJob!.error = error instanceof Error ? error.message : 'Unknown error';
      this.log(jobId, 'error', `❌ Scraping failed: ${error}`);
      await this.updateJobProgress(this.currentJob!);
    } finally {
      this.isRunning = false;
    }
  }

  private async runQuickCheck(jobId: string, isResume = false) {
    try {
      this.log(jobId, 'info', '⚡ Starting quick check for new/updated opportunities...');
      
      // Fetch only recent topics
      const recentTopics = await this.fetchRecentTopics(jobId);
      
      this.currentJob!.totalTopics = recentTopics.length;
      this.log(jobId, 'info', `✅ Found ${recentTopics.length} recent topics`);

      // Process and update database
      await this.updateRecentTopics(recentTopics, jobId);

      this.currentJob!.status = 'completed';
      this.currentJob!.endTime = new Date();
      this.currentJob!.progress = 100;
      this.log(jobId, 'info', '🎉 Quick check completed!');
      await this.updateJobProgress(this.currentJob!);

    } catch (error) {
      this.currentJob!.status = 'failed';
      this.currentJob!.error = error instanceof Error ? error.message : 'Unknown error';
      this.log(jobId, 'error', `❌ Quick check failed: ${error}`);
      await this.updateJobProgress(this.currentJob!);
    } finally {
      this.isRunning = false;
    }
  }

  private async fetchAllTopics(jobId: string, isResume = false): Promise<any[]> {
    const allTopics: any[] = [];
    let page = isResume ? (this.currentJob?.currentPage || 0) : 0;
    const size = 100;

    while (true) {
      if (this.shouldStop) {
        this.log(jobId, 'info', '⏸️ Scraping paused by user');
        this.currentJob!.status = 'paused';
        await this.updateJobProgress(this.currentJob!);
        return allTopics;
      }

      const searchParams = {
        searchText: null,
        components: null,
        programYear: null,
        solicitationCycleNames: null,
        releaseNumbers: [],
        topicReleaseStatus: [],
        modernizationPriorities: [],
        sortBy: "finalTopicCode,asc",
        technologyAreaIds: [],
        component: null,
        program: null
      };

      const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
      const searchUrl = `${this.baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=${size}&page=${page}`;

      if (page % 10 === 0) {
        this.log(jobId, 'info', `📄 Fetching page ${page + 1}...`);
      }

      try {
        const response = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': 'Bearer null',
            'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.data) {
            const topics = data.data;
            const total = data.total || 0;

            if (page === 0) {
              this.log(jobId, 'info', `📊 Total topics available: ${total}`);
            }

            allTopics.push(...topics);

            if (topics.length < size || allTopics.length >= total) {
              break;
            }

            page++;
            this.currentJob!.currentPage = page;
            await this.updateJobProgress(this.currentJob!);
            
            // Take breaks every 50 pages to prevent overwhelming the server
            if (page % 50 === 0) {
              this.log(jobId, 'info', '💤 Taking a 2-minute break to be respectful to the server...');
              await this.delay(120000); // 2 minutes
            } else {
              await this.delay(200); // 0.2 second delay
            }
          } else {
            break;
          }
        } else {
          break;
        }
      } catch (error) {
        this.log(jobId, 'error', `Error on page ${page}: ${error}`);
        // Wait longer on errors
        await this.delay(5000);
        continue;
      }
    }

    return allTopics;
  }

  private async fetchRecentTopics(jobId: string): Promise<any[]> {
    // Fetch only topics from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const searchParams = {
      searchText: null,
      components: null,
      programYear: null,
      solicitationCycleNames: null,
      releaseNumbers: [],
      topicReleaseStatus: ['Open', 'Pre-Release'],
      modernizationPriorities: [],
      sortBy: "finalTopicCode,asc",
      technologyAreaIds: [],
      component: null,
      program: null
    };

    const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
    const searchUrl = `${this.baseUrl}/topics/api/public/topics/search?searchParam=${encodedParams}&size=1000&page=0`;

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': 'Bearer null',
          'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data?.data || [];
      }
    } catch (error) {
      this.log(jobId, 'error', `Error fetching recent topics: ${error}`);
    }

    return [];
  }

  private async processTopicsWithDetails(topics: any[], jobId: string, isResume = false) {
    let processed = isResume ? (this.currentJob?.currentTopicIndex || 0) : 0;
    const total = topics.length;

    for (let i = processed; i < topics.length; i++) {
      if (this.shouldStop) {
        this.log(jobId, 'info', '⏸️ Processing paused by user');
        this.currentJob!.status = 'paused';
        await this.updateJobProgress(this.currentJob!);
        return;
      }

      const topic = topics[i];
      
      try {
        // Fetch detailed information
        const detailsUrl = `${this.baseUrl}/topics/api/public/topics/${topic.topicId}/details`;
        const detailsResponse = await fetch(detailsUrl);
        
        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          topic.detailed_info = details;
        }

        // Fetch Q&A if available
        if (topic.topicQuestionCount && topic.topicQuestionCount > 0) {
          const qaUrl = `${this.baseUrl}/topics/api/public/topics/${topic.topicId}/questions`;
          const qaResponse = await fetch(qaUrl);
          
          if (qaResponse.ok) {
            const qaData = await qaResponse.json();
            if (qaData) {
              topic.qa_data = qaData;
            }
          }
        }

        processed++;
        this.currentJob!.processedTopics = processed;
        this.currentJob!.currentTopicIndex = i;
        this.currentJob!.progress = Math.round((processed / total) * 100);
        
        // Update estimated completion
        if (processed > 0) {
          const elapsed = Date.now() - this.currentJob!.startTime.getTime();
          const rate = processed / elapsed;
          const remaining = (total - processed) / rate;
          this.currentJob!.estimatedCompletion = new Date(Date.now() + remaining);
        }

        if (processed % 100 === 0) {
          this.log(jobId, 'info', `📊 Processed ${processed}/${total} topics (${this.currentJob!.progress}%)`);
          await this.updateJobProgress(this.currentJob!);
        }

        // Take breaks every 500 topics to prevent overwhelming the server
        if (processed % 500 === 0) {
          this.log(jobId, 'info', '💤 Taking a 1-minute break to be respectful to the server...');
          await this.delay(60000); // 1 minute
        } else {
          await this.delay(150); // 0.15 second delay
        }

      } catch (error) {
        this.log(jobId, 'warning', `Warning processing topic ${topic.topicId}: ${error}`);
        // Wait longer on errors
        await this.delay(5000);
        continue;
      }
    }
  }

  private async saveToDatabase(topics: any[], jobId: string) {
    this.log(jobId, 'info', '💾 Saving topics to database with duplicate handling...');
    
    const supabase = createAdminSupabaseClient();
    
    // Process topics in batches with intelligent duplicate handling
    const batchSize = 100;
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < topics.length; i += batchSize) {
      if (this.shouldStop) {
        this.log(jobId, 'info', '⏸️ Database save paused by user');
        return;
      }

      const batch = topics.slice(i, i + batchSize);
      const formattedBatch = batch.map(topic => this.formatTopicForDatabase(topic));
      
      // Process each topic individually to handle duplicates
      for (const topic of formattedBatch) {
        try {
          // Check if topic already exists by topic_id
          const { data: existing } = await supabase
            .from('dsip_opportunities')
            .select('id, last_activity_date')
            .eq('topic_id', topic.topicId)
            .single();

          if (existing) {
            // Update existing topic with new data
            const { error: updateError } = await supabase
              .from('dsip_opportunities')
              .update({
                ...topic,
                last_activity_date: new Date().toISOString()
              })
              .eq('id', existing.id);
            
            if (updateError) {
              this.log(jobId, 'warning', `Warning updating topic ${topic.topicId}: ${updateError.message}`);
            } else {
              updatedCount++;
            }
          } else {
            // Insert new topic
            const { error: insertError } = await supabase
              .from('dsip_opportunities')
              .insert(topic);
            
            if (insertError) {
              this.log(jobId, 'warning', `Warning inserting topic ${topic.topicId}: ${insertError.message}`);
            } else {
              insertedCount++;
            }
          }
        } catch (error) {
          this.log(jobId, 'warning', `Warning processing topic ${topic.topicId}: ${error}`);
          skippedCount++;
        }
      }

      // Log progress every batch
      if ((i + batchSize) % (batchSize * 5) === 0) {
        this.log(jobId, 'info', `📊 Database progress: ${i + batchSize}/${topics.length} topics processed`);
        this.log(jobId, 'info', `📈 Stats: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`);
      }

      // Small delay between batches
      await this.delay(100);
    }
    
    this.log(jobId, 'info', `🎉 Database save completed!`);
    this.log(jobId, 'info', `📊 Final stats: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`);
  }

  private async updateRecentTopics(topics: any[], jobId: string) {
    this.log(jobId, 'info', '🔄 Updating recent topics in database...');
    
    const supabase = createAdminSupabaseClient();
    
    for (const topic of topics) {
      try {
        // Check if topic exists
        const { data: existing } = await supabase
          .from('dsip_opportunities')
          .select('id')
          .eq('topic_id', topic.topicId)
          .single();

        const formattedTopic = this.formatTopicForDatabase(topic);

        if (existing) {
          // Update existing topic
          await supabase
            .from('dsip_opportunities')
            .update(formattedTopic)
            .eq('id', existing.id);
        } else {
          // Insert new topic
          await supabase
            .from('dsip_opportunities')
            .insert(formattedTopic);
        }
      } catch (error) {
        this.log(jobId, 'warning', `Warning updating topic ${topic.topicId}: ${error}`);
      }
    }
  }

  private formatTopicForDatabase(topic: any): any {
    // Format the topic data to match your database schema
    const details = topic.detailed_info || {};
    
    return {
      // Basic topic information
      topic_number: topic.topicCode,
      topic_id: topic.topicId,
      title: topic.topicTitle,
      short_title: topic.topicTitle ? topic.topicTitle.substring(0, 50) : '',
      
      // Component and program information
      component: topic.component,
      component_full_name: this.expandComponentName(topic.component),
      command_name: topic.command,
      program: topic.program,
      program_type: topic.program ? (topic.program.includes('SBIR') ? 'SBIR' : topic.program.includes('STTR') ? 'STTR' : 'Other') : '',
      
      // Solicitation information
      solicitation_title: topic.solicitationTitle,
      solicitation_number: topic.solicitationNumber,
      cycle_name: topic.cycleName,
      release_number: topic.releaseNumber ? String(topic.releaseNumber) : '',
      
      // Status and timing
      status: topic.topicStatus,
      topic_status: topic.topicStatus,
      proposal_window_status: this.getWindowStatus(topic.topicStartDate, topic.topicEndDate),
      days_until_close: this.calculateDaysUntil(topic.topicEndDate),
      days_since_open: this.calculateDaysSince(topic.topicStartDate),
      urgency_level: this.getUrgencyLevel(topic.topicEndDate),
      
      // Dates
      open_date: this.formatDate(topic.topicStartDate),
      close_date: this.formatDate(topic.topicEndDate),
      open_datetime: this.formatDate(topic.topicStartDate),
      close_datetime: this.formatDate(topic.topicEndDate),
      duration_days: this.calculateDays(topic.topicStartDate, topic.topicEndDate),
      pre_release_start: this.formatDate(topic.topicPreReleaseStartDate),
      pre_release_end: this.formatDate(topic.topicPreReleaseEndDate),
      pre_release_duration: this.calculateDays(topic.topicPreReleaseStartDate, topic.topicPreReleaseEndDate),
      created_date: this.formatDate(topic.createdDate),
      updated_date: this.formatDate(topic.updatedDate),
      modified_date: this.formatDate(topic.modifiedDate),
      
      // Q&A information
      qanda_start: this.formatDate(topic.topicQAStartDate),
      qanda_end: this.formatDate(topic.topicQAEndDate),
      qanda_tpoc_start: this.formatDate(topic.topicQATpocStartDate),
      qanda_tpoc_end: this.formatDate(topic.topicQATpocEndDate),
      qanda_status: topic.topicQAStatus,
      qanda_status_display: topic.topicQAStatusDisplay,
      qanda_open: topic.topicQAOpen || false,
      total_questions: topic.topicQuestionCount || 0,
      published_questions: topic.noOfPublishedQuestions || 0,
      unpublished_questions: (topic.topicQuestionCount || 0) - (topic.noOfPublishedQuestions || 0),
      has_qa: topic.topicQuestionCount && topic.topicQuestionCount > 0,
      qa_data: topic.topicQuestionCount || 0,
      qanda_content: topic.qa_data ? this.formatQAContent(topic.qa_data) : '',
      
      // Technology and modernization
      technology_areas: details.technologyAreas ? details.technologyAreas.map((area: any) => area.name || area) : [],
      technology_areas_count: details.technologyAreas ? details.technologyAreas.length : 0,
      primary_technology_area: details.technologyAreas && details.technologyAreas.length > 0 ? (details.technologyAreas[0].name || details.technologyAreas[0]) : '',
      tech_modernization_details: details.focusAreas ? details.focusAreas.map((area: any) => area.name || area).join(' | ') : '',
      modernization_priorities: details.focusAreas ? details.focusAreas.map((area: any) => area.name || area) : [],
      modernization_priority_count: details.focusAreas ? details.focusAreas.length : 0,
      
      // Keywords and descriptions
      keywords: details.keywords ? (Array.isArray(details.keywords) ? details.keywords : details.keywords.split(';')) : [],
      keywords_count: details.keywords ? (Array.isArray(details.keywords) ? details.keywords.length : details.keywords.split(';').length) : 0,
      primary_keyword: details.keywords ? (Array.isArray(details.keywords) ? details.keywords[0] : details.keywords.split(';')[0]) : '',
      
      // Security and ITAR
      itar_controlled: details.itar ? 'Yes' : 'No',
      requires_itar: details.itar || false,
      security_export: details.itar ? 'Yes' : 'No',
      
      // Content descriptions
      objective: details.objective ? this.cleanHtml(details.objective) : '',
      objective_word_count: details.objective ? details.objective.split(' ').length : 0,
      key_requirements: details.objective ? this.cleanHtml(details.objective) : '',
      description: details.description ? this.cleanHtml(details.description) : '',
      description_word_count: details.description ? details.description.split(' ').length : 0,
      description_length: details.description ? details.description.length : 0,
      has_technical_details: details.description && details.description.length > 500,
      is_xtech: details.description && (details.description.includes('xTech') || details.description.includes('XTech')),
      is_xtech_analysis: details.description && (details.description.includes('xTech') || details.description.includes('XTech')),
      prize_gating: details.description && (details.description.includes('xTech') || details.description.includes('XTech')) ? 'Yes' : 'No',
      
      // Phase descriptions
      phase_i_description: details.phase1Description ? this.cleanHtml(details.phase1Description) : '',
      phase_ii_description: details.phase2Description ? this.cleanHtml(details.phase2Description) : '',
      phase_iii_dual_use: details.phase3Description ? this.cleanHtml(details.phase3Description) : '',
      has_commercial_potential: details.phase3Description ? true : false,
      
      // References
      references_data: details.referenceDocuments ? details.referenceDocuments.map((ref: any) => this.cleanHtml(ref.referenceTitle || '')) : [],
      reference_docs: details.referenceDocuments ? details.referenceDocuments.map((ref: any) => this.cleanHtml(ref.referenceTitle || '')).join('; ') : '',
      reference_count: details.referenceDocuments ? details.referenceDocuments.length : 0,
      has_references: details.referenceDocuments && details.referenceDocuments.length > 0,
      
      // TPOC information
      tpoc_names: topic.topicManagers ? topic.topicManagers.filter((m: any) => m.assignmentType === 'TPOC').map((m: any) => m.name).join('; ') : '',
      tpoc_emails: topic.topicManagers ? topic.topicManagers.filter((m: any) => m.assignmentType === 'TPOC').map((m: any) => m.email).join('; ') : '',
      tpoc_centers: topic.topicManagers ? topic.topicManagers.filter((m: any) => m.assignmentType === 'TPOC').map((m: any) => m.center).join('; ') : '',
      tpoc_count: topic.topicManagers ? topic.topicManagers.filter((m: any) => m.assignmentType === 'TPOC').length : 0,
      has_tpoc_derived_1_if_tpoc_exists: topic.topicManagers && topic.topicManagers.some((m: any) => m.assignmentType === 'TPOC') ? '1' : '0',
      show_tpoc: topic.showTpoc || false,
      
      // Additional fields
      owner: topic.owner || '',
      internal_lead: topic.internalLead || '',
      sponsor_component: topic.sponsorComponent || topic.component || '',
      selection_criteria: topic.selectionCriteria || '',
      historical_awards: topic.historicalAwards || '',
      previous_awards_count: topic.previousAwardsCount || '',
      success_rate: topic.successRate || '',
      program_year: topic.programYear || '',
      baa_preface_upload_id: topic.baaPrefaceUploadId || '',
      baa_preface_title: topic.baaPrefaceUploadTitle || '',
      is_release_preface: topic.isReleasePreface || false,
      is_active: topic.isActive || false,
      is_archived: topic.isArchived || false,
      is_draft: topic.isDraft || false,
      is_published: topic.isPublished || false,
      allow_proposal_submission: topic.allowProposalSubmission || false,
      is_open_for_submission: topic.topicStatus === 'Open',
      
      // System fields
      last_activity_date: new Date().toISOString(),
      record_id: `${topic.topicCode}_${topic.topicId ? topic.topicId.toString().substring(0, 8) : ''}`,
      unique_id: `${topic.cycleName || ''}_${topic.topicCode || ''}`,
      tracking_number: topic.trackingNumber || '',
      version: topic.version || '1'
    };
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper functions for data formatting
  private expandComponentName(component: string): string {
    const componentMap: { [key: string]: string } = {
      'ARMY': 'United States Army',
      'NAVY': 'United States Navy',
      'AIRFORCE': 'United States Air Force',
      'SPACEFORCE': 'United States Space Force',
      'DARPA': 'Defense Advanced Research Projects Agency',
      'DHA': 'Defense Health Agency',
      'DISA': 'Defense Information Systems Agency',
      'DLA': 'Defense Logistics Agency',
      'DTRA': 'Defense Threat Reduction Agency',
      'MDA': 'Missile Defense Agency',
      'NGA': 'National Geospatial-Intelligence Agency',
      'OSD': 'Office of the Secretary of Defense',
      'SOCOM': 'Special Operations Command',
      'CYBERCOM': 'Cyber Command',
      'TRANSCOM': 'Transportation Command',
      'CBD': 'Chemical and Biological Defense',
      'JPEO-CBRND': 'Joint Program Executive Office for CBRN Defense'
    };
    return componentMap[component?.toUpperCase()] || component || '';
  }

  private getWindowStatus(startDate: number, endDate: number): string {
    if (!startDate || !endDate) return 'Unknown';
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'Upcoming';
    if (now > end) return 'Closed';
    return 'Open';
  }

  private calculateDaysUntil(timestamp: number): number {
    if (!timestamp) return 0;
    const now = new Date();
    const target = new Date(timestamp);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private calculateDaysSince(timestamp: number): number {
    if (!timestamp) return 0;
    const now = new Date();
    const target = new Date(timestamp);
    const diffTime = now.getTime() - target.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private getUrgencyLevel(daysUntilClose: number): string {
    if (daysUntilClose <= 3) return 'Critical';
    if (daysUntilClose <= 7) return 'High';
    if (daysUntilClose <= 14) return 'Medium';
    return 'Low';
  }

  private formatDate(timestamp: number): string {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return '';
    }
  }

  private calculateDays(startTimestamp: number, endTimestamp: number): number {
    if (!startTimestamp || !endTimestamp) return 0;
    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private cleanHtml(text: string): string {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '')
               .replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .trim();
  }

  private formatQAContent(qaData: any[]): string {
    if (!qaData || !Array.isArray(qaData)) return '';
    
    return qaData.map((qa, index) => {
      const question = qa.question || '';
      const answer = qa.answers?.[0]?.answer || '';
      return `Q${index + 1}: ${this.cleanHtml(question)}\nA: ${this.cleanHtml(answer)}`;
    }).join('\n\n');
  }

  private log(jobId: string, level: 'info' | 'warning' | 'error', message: string) {
    if (this.currentJob) {
      this.currentJob.logs.push(`${new Date().toISOString()} [${level.toUpperCase()}] ${message}`);
      
      // Keep only last 1000 logs
      if (this.currentJob.logs.length > 1000) {
        this.currentJob.logs = this.currentJob.logs.slice(-1000);
      }
    }
    
    console.log(`[DSIP Scraper] ${message}`);
  }

  getCurrentJob(): ScrapingJob | null {
    return this.currentJob;
  }

  isScraperRunning(): boolean {
    return this.isRunning;
  }

  async stopScraper() {
    if (this.isRunning && this.currentJob) {
      this.shouldStop = true;
      this.currentJob.status = 'paused';
      this.currentJob.endTime = new Date();
      this.isRunning = false;
      this.log(this.currentJob.id, 'info', '🛑 Scraper paused by user');
      await this.updateJobProgress(this.currentJob);
    }
  }

  async resumeScraper() {
    if (this.currentJob && this.currentJob.status === 'paused') {
      this.shouldStop = false;
      this.currentJob.status = 'running';
      this.isRunning = true;
      this.log(this.currentJob.id, 'info', '▶️ Scraper resumed by user');
      
      if (this.currentJob.type === 'full') {
        this.runFullScrape(this.currentJob.id, true);
      } else {
        this.runQuickCheck(this.currentJob.id, true);
      }
    }
  }

  async cleanup() {
    if (this.jobCheckInterval) {
      clearInterval(this.jobCheckInterval);
    }
  }
}

// Export singleton instance
export const dsipScraper = new DSIPScraper();
