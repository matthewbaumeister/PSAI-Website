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
    
    // Query the database for active opportunities
    const supabase = createAdminSupabaseClient();
    
    // First, check if table exists by trying a simple query
    const { data: testData, error: testError } = await supabase
      .from('dsip_opportunities')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Table check error:', testError);
      return NextResponse.json({ 
        success: false, 
        error: `Table 'dsip_opportunities' may not exist or is not accessible: ${testError.message}`,
        hint: 'Please ensure the dsip_opportunities table is created in Supabase'
      }, { status: 500 });
    }
    
    // Get total count of opportunities
    const { count: totalCount, error: totalError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error getting total count:', totalError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get total count: ${totalError.message}`,
        details: totalError
      }, { status: 500 });
    }
    
    // Get count of ACTIVE opportunities based on status (Open and Pre-Release only)
    // These are the actionable opportunities users can submit to or prepare for
    let openCount = 0;
    let preReleaseCount = 0;
    
    // Try querying with status column first
    try {
      const { count, error } = await supabase
        .from('dsip_opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open');
      
      if (!error) {
        openCount = count || 0;
      } else {
        console.log('Status column query failed, might not exist:', error);
      }
    } catch (err) {
      console.log('Error querying status column:', err);
    }
    
    // Try querying with topic_status column as fallback
    if (openCount === 0) {
      try {
        const { count, error } = await supabase
          .from('dsip_opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('topic_status', 'Open');
        
        if (!error) {
          openCount = count || 0;
        }
      } catch (err) {
        console.log('Error querying topic_status column:', err);
      }
    }
    
    // Repeat for Pre-Release
    try {
      const { count, error } = await supabase
        .from('dsip_opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pre-Release');
      
      if (!error) {
        preReleaseCount = count || 0;
      }
    } catch (err) {
      console.log('Error querying status column for Pre-Release:', err);
    }
    
    if (preReleaseCount === 0) {
      try {
        const { count, error } = await supabase
          .from('dsip_opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('topic_status', 'Pre-Release');
        
        if (!error) {
          preReleaseCount = count || 0;
        }
      } catch (err) {
        console.log('Error querying topic_status column for Pre-Release:', err);
      }
    }
    
    const activeCount = openCount + preReleaseCount;
    
    // If no active opportunities found, still return success with 0 count
    if (activeCount === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        totalCount: totalCount || 0,
        breakdown: {
          open: 0,
          preRelease: 0
        },
        sampleOpportunities: [],
        timestamp: new Date().toISOString(),
        adminUser: user.email,
        message: 'No active opportunities found in the database'
      });
    }
    
    // Get sample active opportunities for display (Open and Pre-Release status only)
    let sampleOpportunities: any[] = [];
    
    try {
      // Try with status column first
      const { data, error } = await supabase
        .from('dsip_opportunities')
        .select('topic_id, title, component, solicitation_title, status, topic_status, open_date, close_date')
        .in('status', ['Open', 'Pre-Release'])
        .order('open_date', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        sampleOpportunities = data;
      } else if (error) {
        console.log('Status column sample query failed:', error);
        // Try with topic_status as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('dsip_opportunities')
          .select('topic_id, title, component, solicitation_title, status, topic_status, open_date, close_date')
          .in('topic_status', ['Open', 'Pre-Release'])
          .order('open_date', { ascending: false })
          .limit(10);
        
        if (!fallbackError && fallbackData) {
          sampleOpportunities = fallbackData;
        }
      }
    } catch (err) {
      console.log('Error getting sample opportunities:', err);
    }
    
    const sampleError = null; // Set to null since we handled errors above
    
    if (sampleError) {
      console.error('Error getting sample opportunities:', sampleError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get sample opportunities: ${sampleError.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      count: activeCount || 0,
      totalCount: totalCount || 0,
      breakdown: {
        open: openCount || 0,
        preRelease: preReleaseCount || 0
      },
      sampleOpportunities: sampleOpportunities || [],
      timestamp: new Date().toISOString(),
      adminUser: user.email
    });

  } catch (error) {
    console.error('Active opportunities API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
