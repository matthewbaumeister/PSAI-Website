import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({
        success: false,
        message: 'jobId parameter is required'
      }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({
        success: false,
        message: 'Job not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        total_topics: job.total_topics || 0,
        processed_topics: job.processed_topics || 0,
        progress_percentage: job.progress_percentage || 0,
        current_step: job.current_step,
        current_topic_code: job.current_topic_code,
        current_topic_title: job.current_topic_title,
        new_records: job.new_records || 0,
        updated_records: job.updated_records || 0,
        preserved_records: job.preserved_records || 0,
        error_message: job.error_message,
        date_range: job.date_range,
        started_at: job.started_at,
        completed_at: job.completed_at,
        last_updated: job.last_updated,
        logs: job.logs || []
      }
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET all recent jobs (optional, for UI showing job history)
export async function POST(request: NextRequest) {
  try {
    const { limit = 10 } = await request.json();

    const { data: jobs, error } = await supabase
      .from('scraping_jobs')
      .select('id, type, status, total_topics, processed_topics, progress_percentage, date_range, started_at, completed_at, new_records, updated_records, preserved_records')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

