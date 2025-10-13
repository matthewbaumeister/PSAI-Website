import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Daily automated SBIR database update
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you can add additional security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(' Starting automated SBIR database update...');

    // Trigger the scraper
    const scraperResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/sbir/scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ action: 'start_scraper' })
    });

    if (!scraperResponse.ok) {
      throw new Error('Failed to start scraper');
    }

    const result = await scraperResponse.json();

    console.log(` Automated SBIR update completed: ${result.processed} records processed`);

    return NextResponse.json({
      success: true,
      message: 'Daily SBIR update completed successfully',
      processed: result.processed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(' Error in automated SBIR update:', error);
    return NextResponse.json({ 
      error: 'Automated update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
