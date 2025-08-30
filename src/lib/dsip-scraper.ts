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
          // Check if topic already exists by topic_id_topicid
          const { data: existing } = await supabase
            .from('dsip_opportunities')
            .select('id, last_scraped_sys_current_timestamp_eastern')
            .eq('topic_id_topicid', topic.topic_id_topicid)
            .single();

          if (existing) {
            // Update existing topic with new data
            const { error: updateError } = await supabase
              .from('dsip_opportunities')
              .update({
                ...topic,
                last_scraped_sys_current_timestamp_eastern: new Date().toISOString()
              })
              .eq('id', existing.id);
            
            if (updateError) {
              this.log(jobId, 'warning', `Warning updating topic ${topic.topic_id_topicid}: ${updateError.message}`);
            } else {
              updatedCount++;
            }
          } else {
            // Insert new topic
            const { error: insertError } = await supabase
              .from('dsip_opportunities')
              .insert(topic);
            
            if (insertError) {
              this.log(jobId, 'warning', `Warning inserting topic ${topic.topic_id_topicid}: ${insertError.message}`);
            } else {
              insertedCount++;
            }
          }
        } catch (error) {
          this.log(jobId, 'warning', `Warning processing topic ${topic.topic_id_topicid}: ${error}`);
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
          .eq('topic_id_topicid', topic.topicId)
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
    // This is a simplified version - you'll need to map all the fields
    return {
      topic_number_topiccode: topic.topicCode,
      topic_id_topicid: topic.topicId,
      title_topictitle: topic.topicTitle,
      component_component: topic.component,
      program_program: topic.program,
      status_topicstatus: topic.topicStatus,
      // Add all other fields as needed
      last_scraped_sys_current_timestamp_eastern: new Date().toISOString()
    };
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
