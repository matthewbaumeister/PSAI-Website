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
      .select('sponsor_component')
      .not('sponsor_component', 'is', null);

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
      const component = (row as any).sponsor_component || 'Unknown';
      componentCounts[component] = (componentCounts[component] || 0) + 1;
    });

    // Process status data
    const statusCounts: { [key: string]: number } = {};
    statusData?.forEach(row => {
      const status = row.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Get active opportunities count (Open, Pre-Release)
    const { count: activeCount, error: activeError } = await supabase
      .from('sbir_final')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Open', 'Pre-Release']);

    if (activeError) {
      console.error('Error fetching active count:', activeError);
    }

    // Get last updated timestamp from most recently scraped record
    const { data: lastScrapedData, error: lastScrapedError } = await supabase
      .from('sbir_final')
      .select('last_scraped')
      .not('last_scraped', 'is', null)
      .order('last_scraped', { ascending: false })
      .limit(1)
      .single();

    if (lastScrapedError) {
      console.error('Error fetching last scraped:', lastScrapedError);
    }

    const stats = {
      totalRecords: totalCount || 0,
      activeOpportunities: activeCount || 0,
      components: Object.entries(componentCounts)
        .map(([component, count]) => ({ component, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 components
      statuses: Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      lastUpdated: lastScrapedData?.last_scraped || null
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching SBIR statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
