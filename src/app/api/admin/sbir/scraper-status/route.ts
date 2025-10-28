import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Fetch the latest successful scraper run
    const { data, error } = await supabase
      .from('dsip_scraper_runs')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching scraper status:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        success: true,
        lastUpdate: null,
        lastRunBy: null,
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0
      });
    }

    return NextResponse.json({
      success: true,
      lastUpdate: data.completed_at,
      lastRunBy: data.user_email || 'Automated Cron',
      runType: data.run_type,
      totalRecords: data.total_topics || 0,
      newRecords: data.new_records || 0,
      updatedRecords: data.updated_records || 0,
      preservedRecords: data.preserved_records || 0,
      durationSeconds: data.duration_seconds || 0
    });

  } catch (error) {
    console.error('Error in scraper-status API:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

