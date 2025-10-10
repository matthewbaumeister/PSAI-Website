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
    // Try both 'status' and 'topic_status' columns as the schema has both
    const { count: openCount, error: openError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.Open,topic_status.eq.Open');
    
    const { count: preReleaseCount, error: preReleaseError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.Pre-Release,topic_status.eq.Pre-Release');
    
    if (openError || preReleaseError) {
      console.error('Error getting active counts:', { openError, preReleaseError });
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get active opportunity counts. Open error: ${openError?.message || 'none'}, PreRelease error: ${preReleaseError?.message || 'none'}`,
        details: { openError, preReleaseError }
      }, { status: 500 });
    }
    
    const activeCount = (openCount || 0) + (preReleaseCount || 0);
    
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
    const { data: sampleOpportunities, error: sampleError } = await supabase
      .from('dsip_opportunities')
      .select('topic_id, title, component, solicitation_title, status, topic_status, open_date, close_date')
      .or('status.in.(Open,Pre-Release),topic_status.in.(Open,Pre-Release)')
      .order('open_date', { ascending: false })
      .limit(10);
    
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
