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
    
    // Get total count of opportunities
    const { count: totalCount, error: totalError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error getting total count:', totalError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get total count: ${totalError.message}` 
      }, { status: 500 });
    }
    
    // Get count of ACTIVE opportunities based on status (Open and Pre-Release only)
    // These are the actionable opportunities users can submit to or prepare for
    const { count: openCount, error: openError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Open');
    
    const { count: preReleaseCount, error: preReleaseError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pre-Release');
    
    if (openError || preReleaseError) {
      console.error('Error getting active counts:', { openError, preReleaseError });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get active opportunity counts' 
      }, { status: 500 });
    }
    
    const activeCount = (openCount || 0) + (preReleaseCount || 0);
    
    // Get sample active opportunities for display (Open and Pre-Release status only)
    const { data: sampleOpportunities, error: sampleError } = await supabase
      .from('dsip_opportunities')
      .select('topic_id, title, component, solicitation, status, open_date, close_date')
      .in('status', ['Open', 'Pre-Release'])
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
