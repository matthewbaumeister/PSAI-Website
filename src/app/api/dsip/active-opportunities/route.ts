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
    
    // Get count of opportunities that might be active (have recent timestamps)
    // This is a simplified check - you might want to add more sophisticated logic
    const { count: activeCount, error: activeError } = await supabase
      .from('dsip_opportunities')
      .select('*', { count: 'exact', head: true })
      .gte('last_scraped_sys_current_timestamp_eastern', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
    
    if (activeError) {
      console.error('Error getting active count:', activeError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get active count: ${activeError.message}` 
      }, { status: 500 });
    }
    
    // Get some sample active opportunities for display
    const { data: sampleOpportunities, error: sampleError } = await supabase
      .from('dsip_opportunities')
      .select('topic_id, title, component, solicitation, last_activity_date')
      .gte('last_activity_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('last_activity_date', { ascending: false })
      .limit(5);
    
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
