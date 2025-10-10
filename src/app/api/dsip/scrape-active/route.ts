import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { DSIPRealScraper } from '@/lib/dsip-real-scraper';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Store active scraping jobs in memory
const activeJobs = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { action } = await request.json();

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
      const { jobId } = await request.json();
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

    // Generate CSV
    const csv = generateCSV(results);
    
    // Save CSV to public directory
    const publicDir = join(process.cwd(), 'public', 'exports');
    
    // Create directory if it doesn't exist
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }
    
    const fileName = `dsip_active_opportunities_${Date.now()}.csv`;
    const filePath = join(publicDir, fileName);
    
    await writeFile(filePath, csv, 'utf-8');

    // Update job as completed
    updateJob({
      status: 'completed',
      endTime: new Date().toISOString(),
      csvFile: `/exports/${fileName}`,
      totalRecords: results.length,
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

function generateCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available';
  }

  // Get all column headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeader = headers.map(h => `"${h}"`).join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes
      const escaped = String(value || '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  return [csvHeader, ...csvRows].join('\n');
}

