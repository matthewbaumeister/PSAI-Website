import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { DSIPRealScraper } from '@/lib/dsip-real-scraper';

// Configure route for dynamic behavior
export const dynamic = 'force-dynamic';

// Store active scraping jobs in memory
const activeJobs = new Map<string, any>();

export async function POST(request: NextRequest) {
  console.log('=== Scrape-active POST called ===');
  
  try {
    console.log('Step 1: Checking admin auth...');
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      console.log('Auth failed, returning auth response');
      return authResult;
    }
    
    console.log('Step 2: Parsing request body...');
    const body = await request.json();
    const { action } = body;
    
    console.log('Step 3: Action received:', action);

    if (action === 'start') {
      // Create a new scraping job
      const jobId = `active_scrape_${Date.now()}`;
      
      // Initialize job
      activeJobs.set(jobId, {
        id: jobId,
        status: 'running',
        progress: {
          phase: 'starting',
          processedTopics: 0,
          activeTopicsFound: 0,
          logs: ['🚀 Starting active opportunities scraper...']
        },
        startTime: new Date().toISOString()
      });

      // Start scraping in background
      startRealScraping(jobId).catch(error => {
        console.error('Scraping error:', error);
        const job = activeJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
        }
      });

      return NextResponse.json({ 
        success: true, 
        jobId,
        message: 'Active opportunities scraper started'
      });
    }

    if (action === 'status') {
      const { jobId } = body;
      const job = activeJobs.get(jobId);
      
      if (!job) {
        return NextResponse.json({ 
          success: false, 
          error: 'Job not found' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        job 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Return all active jobs
    const jobs = Array.from(activeJobs.values());
    
    return NextResponse.json({ 
      success: true, 
      jobs 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function startRealScraping(jobId: string) {
  const scraper = new DSIPRealScraper();
  
  try {
    // Update job status
    const updateJob = (update: any) => {
      const job = activeJobs.get(jobId);
      if (job) {
        Object.assign(job, update);
      }
    };

    // Scrape with progress updates
    const results = await scraper.scrapeActiveOpportunities((progress) => {
      updateJob({ progress });
    });

    // Store the data in memory (will be displayed in admin portal)
    updateJob({
      status: 'completed',
      endTime: new Date().toISOString(),
      totalRecords: results.length,
      data: results, // Store the actual data
      progress: {
        ...scraper.getProgress(),
        phase: 'completed'
      }
    });

  } catch (error) {
    console.error(`Scraping failed for job ${jobId}:`, error);
    
    const job = activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date().toISOString();
    }
  }
}


