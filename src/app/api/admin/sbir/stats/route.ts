import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch SBIR database statistics
export async function GET(request: NextRequest) {
  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('sbir_final')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching total count:', countError);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Get component breakdown
    const { data: componentData, error: componentError } = await supabase
      .from('sbir_final')
      .select('component')
      .not('component', 'is', null);

    if (componentError) {
      console.error('Error fetching component data:', componentError);
      return NextResponse.json({ error: 'Failed to fetch component statistics' }, { status: 500 });
    }

    // Get status breakdown
    const { data: statusData, error: statusError } = await supabase
      .from('sbir_final')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('Error fetching status data:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status statistics' }, { status: 500 });
    }

    // Process component data
    const componentCounts: { [key: string]: number } = {};
    componentData?.forEach(row => {
      const component = row.component || 'Unknown';
      componentCounts[component] = (componentCounts[component] || 0) + 1;
    });

    // Process status data
    const statusCounts: { [key: string]: number } = {};
    statusData?.forEach(row => {
      const status = row.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentData, error: recentError } = await supabase
      .from('sbir_final')
      .select('created_date')
      .gte('created_date', sevenDaysAgo.toISOString());

    if (recentError) {
      console.error('Error fetching recent data:', recentError);
    }

    const stats = {
      totalRecords: totalCount || 0,
      recentRecords: recentData?.length || 0,
      components: Object.entries(componentCounts)
        .map(([component, count]) => ({ component, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 components
      statuses: Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching SBIR statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
