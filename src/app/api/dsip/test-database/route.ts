import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    // Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    const supabase = createAdminSupabaseClient();
    
    // Test 1: Check if dsip_opportunities table exists
    let opportunitiesTableExists = false;
    let opportunitiesCount = 0;
    try {
      const { count, error } = await supabase
        .from('dsip_opportunities')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        opportunitiesTableExists = true;
        opportunitiesCount = count || 0;
      }
    } catch (e) {
      opportunitiesTableExists = false;
    }
    
    // Test 2: Check if dsip_scraping_jobs table exists
    let scrapingJobsTableExists = false;
    let scrapingJobsCount = 0;
    try {
      const { count, error } = await supabase
        .from('dsip_scraping_jobs')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        scrapingJobsTableExists = true;
        scrapingJobsCount = count || 0;
      }
    } catch (e) {
      scrapingJobsTableExists = false;
    }
    
    // Test 3: Check if users table exists and has data
    let usersTableExists = false;
    let usersCount = 0;
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        usersTableExists = true;
        usersCount = count || 0;
      }
    } catch (e) {
      usersTableExists = false;
    }
    
          // Test 4: Try to insert a test record into dsip_opportunities
      let canInsert = false;
      let insertError = null;
      let availableColumns: string[] = [];
      
      try {
        // First, let's check what columns actually exist in the table
        const { data: columns, error: columnsError } = await supabase
          .from('dsip_opportunities')
          .select('*')
          .limit(1);
        
        if (columnsError) {
          insertError = `Schema error: ${columnsError.message}`;
        } else {
          // Get the actual column names from the first record
          availableColumns = columns && columns.length > 0 ? Object.keys(columns[0]) : [];
          
          // Create a minimal test record using only columns that actually exist
          const testRecord: any = {};
          
          // Try to use basic columns that should exist
          if (availableColumns.includes('topic_id')) {
            testRecord.topic_id = 999999;
          }
          if (availableColumns.includes('id')) {
            // Skip id as it's auto-generated
          }
          if (availableColumns.includes('created_at')) {
            testRecord.created_at = new Date().toISOString();
          } else if (availableColumns.includes('created_date')) {
            testRecord.created_date = new Date().toISOString().split('T')[0];
          }
          
          // Only try to insert if we have at least one valid column
          if (Object.keys(testRecord).length > 0) {
            const { error } = await supabase
              .from('dsip_opportunities')
              .insert(testRecord);
            
            if (!error) {
              canInsert = true;
              // Clean up the test record
              if (testRecord.topic_id) {
                await supabase
                  .from('dsip_opportunities')
                  .delete()
                  .eq('topic_id', testRecord.topic_id);
              }
            } else {
              insertError = `Insert failed: ${error.message}`;
            }
          } else {
            insertError = `No valid columns found for test insert. Available columns: ${availableColumns.join(', ')}`;
          }
        }
      } catch (e) {
        insertError = e instanceof Error ? e.message : 'Unknown error';
      }
    
    return NextResponse.json({
      success: true,
      databaseStatus: {
        opportunitiesTable: {
          exists: opportunitiesTableExists,
          count: opportunitiesCount,
          columns: availableColumns
        },
        scrapingJobsTable: {
          exists: scrapingJobsTableExists,
          count: scrapingJobsCount
        },
        usersTable: {
          exists: usersTableExists,
          count: usersCount
        },
        canInsert: canInsert,
        insertError: insertError
      },
      timestamp: new Date().toISOString(),
      adminUser: user.email
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
