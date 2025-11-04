/**
 * ============================================
 * Army Innovation Scraper API Route
 * ============================================
 * 
 * Endpoint to trigger XTECH and FUZE scrapers
 * 
 * POST /api/army-innovation/scrape
 * Body: { mode: "historical" | "active", program: "xtech" | "fuze" | "all" }
 * 
 * ============================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ArmyXTechScraper from '@/lib/army-xtech-scraper';

// Verify admin/cron authorization
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
  
  // Check for cron secret
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check for Vercel Cron header
  if (request.headers.get('x-vercel-cron') === cronSecret) {
    return true;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { mode = 'active', program = 'xtech' } = body;

    // Validate mode
    if (!['historical', 'active'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use "historical" or "active"' },
        { status: 400 }
      );
    }

    // Validate program
    if (!['xtech', 'fuze', 'all'].includes(program)) {
      return NextResponse.json(
        { error: 'Invalid program. Use "xtech", "fuze", or "all"' },
        { status: 400 }
      );
    }

    const results: any = {
      success: true,
      mode,
      program,
      scrapers: []
    };

    // Run XTECH scraper
    if (program === 'xtech' || program === 'all') {
      console.log(`Starting XTECH scraper in ${mode} mode...`);
      const xtechScraper = new ArmyXTechScraper();
      
      const xtechStats = mode === 'historical' 
        ? await xtechScraper.scrapeHistorical()
        : await xtechScraper.scrapeActive();
      
      results.scrapers.push({
        program: 'xtech',
        ...xtechStats
      });
    }

    // Run FUZE scraper (placeholder for now)
    if (program === 'fuze' || program === 'all') {
      console.log(`FUZE scraper not yet implemented...`);
      results.scrapers.push({
        program: 'fuze',
        status: 'not_implemented',
        message: 'FUZE scraper coming soon'
      });
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Army Innovation scraper error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check scraper status
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recent scraper logs
    const { data: recentLogs } = await supabase
      .from('army_innovation_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // Get competition stats
    const { data: stats } = await supabase
      .from('army_innovation_opportunities')
      .select('status, program_name')
      .then(result => {
        if (result.data) {
          const statsSummary = {
            total: result.data.length,
            byStatus: {} as Record<string, number>,
            byProgram: {} as Record<string, number>
          };

          result.data.forEach((opp: any) => {
            statsSummary.byStatus[opp.status] = (statsSummary.byStatus[opp.status] || 0) + 1;
            statsSummary.byProgram[opp.program_name] = (statsSummary.byProgram[opp.program_name] || 0) + 1;
          });

          return { data: statsSummary };
        }
        return result;
      });

    return NextResponse.json({
      success: true,
      recentLogs,
      stats
    });

  } catch (error) {
    console.error('Error fetching scraper status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

