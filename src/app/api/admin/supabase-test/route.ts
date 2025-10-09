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
    
    const results: any = {
      connection: { success: false, error: null },
      tables: {},
      totalRecords: 0,
      recentData: []
    };
    
    // Test 1: Basic connection test
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      results.connection = {
        success: !connectionError,
        error: connectionError?.message || null
      };
    } catch (error) {
      results.connection = {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
    
    // Test 2: Check all possible SBIR/DSIP tables
    const tableNames = [
      'sbir_database',
      'sbir_final', 
      'dsip_opportunities',
      'dsip_scraping_jobs',
      'users'
    ];
    
    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        results.tables[tableName] = {
          exists: !error,
          count: count || 0,
          error: error?.message || null
        };
        
        if (!error) {
          results.totalRecords += count || 0;
        }
      } catch (error) {
        results.tables[tableName] = {
          exists: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Test 3: Get sample data from the main SBIR table (whichever exists)
    const mainTable = results.tables.sbir_database?.exists ? 'sbir_database' : 
                     results.tables.sbir_final?.exists ? 'sbir_final' : null;
    
    if (mainTable) {
      try {
        const { data: sampleData, error } = await supabase
          .from(mainTable)
          .select('*')
          .limit(10)
          .order('created_at', { ascending: false });
        
        results.recentData = sampleData || [];
        results.mainTable = mainTable;
      } catch (error) {
        results.recentDataError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
      adminUser: user.email
    });
    
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const supabase = createAdminSupabaseClient();
    
    const { action, tableName, searchQuery, limit = 20 } = await request.json();
    
    if (action === 'search_data') {
      // Search functionality for the data table
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' });
      
      if (searchQuery) {
        // Try to search in common text fields
        query = query.or(`title.ilike.%${searchQuery}%,component.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`);
      }
      
      query = query.limit(limit).order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        });
      }
      
      return NextResponse.json({
        success: true,
        data: data || [],
        total: count || 0
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    });
    
  } catch (error) {
    console.error('Supabase POST test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
