import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    // Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { action, type } = await request.json();

    switch (action) {
      case 'start':
        if (type === 'full') {
          // Create a new scraping job
          const supabase = createAdminSupabaseClient();
          const jobId = `full_${Date.now()}`;
          
          const { error: jobError } = await supabase
            .from('dsip_scraping_jobs')
            .insert({
              id: jobId,
              status: 'running',
              type: 'full',
              progress: 0,
              total_topics: 0,
              processed_topics: 0,
              start_time: new Date().toISOString(),
              last_activity: new Date().toISOString(),
              logs: [' Full refresh started', ' This will take 5-6 hours to complete']
            });

          if (jobError) {
            return NextResponse.json({ 
              success: false, 
              error: `Failed to create job: ${jobError.message}` 
            }, { status: 500 });
          }

          // Start the actual scraping process
          startScrapingProcess(jobId, type).catch(console.error);

          return NextResponse.json({ 
            success: true, 
            jobId,
            message: 'Full refresh started. This will take 5-6 hours to complete.' 
          });
        } else if (type === 'quick') {
          // Create a new quick check job
          const supabase = createAdminSupabaseClient();
          const jobId = `quick_${Date.now()}`;
          
          const { error: jobError } = await supabase
            .from('dsip_scraping_jobs')
            .insert({
              id: jobId,
              status: 'running',
              type: 'quick',
              progress: 0,
              total_topics: 0,
              processed_topics: 0,
              start_time: new Date().toISOString(),
              last_activity: new Date().toISOString(),
              logs: [' Quick check started', ' Checking for new/updated opportunities']
            });

          if (jobError) {
            return NextResponse.json({ 
              success: false, 
              error: `Failed to create job: ${jobError.message}` 
            }, { status: 500 });
          }

          // Start the actual scraping process
          startScrapingProcess(jobId, type).catch(console.error);

          return NextResponse.json({ 
            success: true, 
            jobId,
            message: 'Quick check started. This will check for new/updated opportunities.' 
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid type. Use "full" or "quick".' 
          }, { status: 400 });
        }

      case 'stop':
        // Update job status to paused
        const { jobId: stopJobId } = await request.json();
        if (stopJobId) {
          const supabase = createAdminSupabaseClient();
          await supabase
            .from('dsip_scraping_jobs')
            .update({ 
              status: 'paused',
              last_activity: new Date().toISOString()
            })
            .eq('id', stopJobId);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Scraper paused successfully.' 
        });

      case 'resume':
        // Resume a paused job
        const { jobId: resumeJobId } = await request.json();
        if (resumeJobId) {
          const supabase = createAdminSupabaseClient();
          await supabase
            .from('dsip_scraping_jobs')
            .update({ 
              status: 'running',
              last_activity: new Date().toISOString()
            })
            .eq('id', resumeJobId);
          
          // Restart the scraping process
          startScrapingProcess(resumeJobId, 'full').catch(console.error);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Scraper resumed successfully.' 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use "start", "stop", or "resume".' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Scraper API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    // Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Get current job status from database
    const supabase = createAdminSupabaseClient();
    const { data: currentJob, error } = await supabase
      .from('dsip_scraping_jobs')
      .select('*')
      .in('status', ['running', 'paused'])
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching current job:', error);
    }

    const isRunning = currentJob?.status === 'running';

    return NextResponse.json({
      success: true,
      isRunning,
      currentJob,
      status: currentJob?.status || 'idle'
    });

  } catch (error) {
    console.error('Scraper status API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Background scraping process
async function startScrapingProcess(jobId: string, type: 'full' | 'quick') {
  try {
    console.log(` Starting ${type} scraping process for job ${jobId}`);
    
    // This would be where the actual scraping logic runs
    // For now, let's simulate the process and update the database
    
    if (type === 'quick') {
      // Quick check - simulate checking recent opportunities
      await simulateQuickCheck(jobId);
    } else {
      // Full refresh - simulate the full scraping process
      await simulateFullRefresh(jobId);
    }
    
  } catch (error) {
    console.error(` Scraping process failed for job ${jobId}:`, error);
    
    // Update job status to failed
    const supabase = createAdminSupabaseClient();
    await supabase
      .from('dsip_scraping_jobs')
      .update({ 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        end_time: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

// Simulate quick check process
async function simulateQuickCheck(jobId: string) {
  const supabase = createAdminSupabaseClient();
  
  // Simulate checking for new opportunities
  for (let i = 0; i < 10; i++) {
    // Update progress
    await supabase
      .from('dsip_scraping_jobs')
      .update({ 
        progress: (i + 1) * 10,
        processed_topics: i + 1,
        last_activity: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Simulate finding a new opportunity
    if (i === 5) {
      const newOpportunity = {
        topic_id: 999999,
        title: `Test Opportunity ${Date.now()}`,
        component: 'ARMY',
        solicitation: 'Test Solicitation',
        created_at: new Date().toISOString(),
        last_scraped_sys_current_timestamp_eastern: new Date().toISOString()
      };
      
      await supabase
        .from('dsip_opportunities')
        .insert(newOpportunity);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Mark job as completed
  await supabase
    .from('dsip_scraping_jobs')
    .update({ 
      status: 'completed',
      progress: 100,
      end_time: new Date().toISOString()
    })
    .eq('id', jobId);
    
  console.log(` Quick check completed for job ${jobId}`);
}

// Simulate full refresh process
async function simulateFullRefresh(jobId: string) {
  const supabase = createAdminSupabaseClient();
  
  // Simulate processing many topics
  for (let i = 0; i < 100; i++) {
    // Update progress
    await supabase
      .from('dsip_scraping_jobs')
      .update({ 
        progress: (i + 1),
        processed_topics: i + 1,
        total_topics: 100,
        last_activity: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Simulate finding opportunities
    if (i % 10 === 0) {
      const newOpportunity = {
        topic_id: 1000000 + i,
        title: `Full Refresh Opportunity ${i}`,
        component: 'ARMY',
        solicitation: 'Full Refresh Test',
        created_at: new Date().toISOString(),
        last_scraped_sys_current_timestamp_eastern: new Date().toISOString()
      };
      
      await supabase
        .from('dsip_opportunities')
        .insert(newOpportunity);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Mark job as completed
  await supabase
    .from('dsip_scraping_jobs')
    .update({ 
      status: 'completed',
      progress: 100,
      end_time: new Date().toISOString()
    })
    .eq('id', jobId);
    
  console.log(` Full refresh completed for job ${jobId}`);
}
