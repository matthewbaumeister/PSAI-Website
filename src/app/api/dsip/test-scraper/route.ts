import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { dsipScraper } from '@/lib/dsip-scraper';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAdmin(request);
    
    // Test basic scraper functionality
    const currentJob = dsipScraper.getCurrentJob();
    const isRunning = dsipScraper.isScraperRunning();
    
    // Test database connection
    const { createAdminSupabaseClient } = await import('@/lib/supabase');
    const supabase = createAdminSupabaseClient();
    
    // Check if dsip_scraping_jobs table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('dsip_scraping_jobs')
      .select('count(*)')
      .limit(1);
    
    // Check if dsip_opportunities table exists
    const { data: opportunitiesCheck, error: opportunitiesError } = await supabase
      .from('dsip_opportunities')
      .select('count(*)')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      scraperStatus: {
        isRunning,
        currentJob: currentJob ? {
          id: currentJob.id,
          status: currentJob.status,
          type: currentJob.type,
          progress: currentJob.progress
        } : null
      },
      databaseStatus: {
        scrapingJobsTable: !tableError,
        opportunitiesTable: !opportunitiesError,
        tableCheckError: tableError?.message,
        opportunitiesCheckError: opportunitiesError?.message
      },
      systemInfo: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        adminUser: user.email
      }
    });

  } catch (error) {
    console.error('Scraper test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAdmin(request);
    const { action } = await request.json();
    
    switch (action) {
      case 'test-connection':
        // Test connection to DoD SBIR/STTR website
        try {
          const response = await fetch('https://www.dodsbirsttr.mil/topics-app/', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
            }
          });
          
          return NextResponse.json({
            success: true,
            connectionTest: {
              status: response.status,
              ok: response.ok,
              url: 'https://www.dodsbirsttr.mil/topics-app/'
            }
          });
        } catch (fetchError) {
          return NextResponse.json({
            success: false,
            connectionTest: {
              error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
            }
          });
        }
        
      case 'test-database':
        // Test database operations
        try {
          const { createAdminSupabaseClient } = await import('@/lib/supabase');
          const supabase = createAdminSupabaseClient();
          
          // Test insert
          const testJob = {
            id: `test_${Date.now()}`,
            status: 'pending',
            type: 'quick',
            progress: 0,
            total_topics: 100,
            processed_topics: 0,
            start_time: new Date().toISOString(),
            last_activity: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('dsip_scraping_jobs')
            .insert(testJob);
          
          if (insertError) {
            return NextResponse.json({
              success: false,
              databaseTest: {
                error: insertError.message,
                operation: 'insert'
              }
            });
          }
          
          // Test select
          const { data: selectData, error: selectError } = await supabase
            .from('dsip_scraping_jobs')
            .select('*')
            .eq('id', testJob.id)
            .single();
          
          if (selectError) {
            return NextResponse.json({
              success: false,
              databaseTest: {
                error: selectError.message,
                operation: 'select'
              }
            });
          }
          
          // Test delete
          const { error: deleteError } = await supabase
            .from('dsip_scraping_jobs')
            .delete()
            .eq('id', testJob.id);
          
          if (deleteError) {
            return NextResponse.json({
              success: false,
              databaseTest: {
                error: deleteError.message,
                operation: 'delete'
              }
            });
          }
          
          return NextResponse.json({
            success: true,
            databaseTest: {
              insert: 'success',
              select: 'success',
              delete: 'success',
              testJobId: testJob.id
            }
          });
          
        } catch (dbError) {
          return NextResponse.json({
            success: false,
            databaseTest: {
              error: dbError instanceof Error ? dbError.message : 'Unknown database error'
            }
          });
        }
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use "test-connection" or "test-database".' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Scraper test POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
