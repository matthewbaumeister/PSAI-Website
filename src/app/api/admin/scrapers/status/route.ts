import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { createAdminSupabaseClient } from '@/lib/supabase'

interface ScraperStatus {
  name: string
  displayName: string
  lastRun: string | null
  status: 'success' | 'failed' | 'running' | 'never-run'
  recordsProcessed: number
  recordsInserted: number
  recordsUpdated: number
  errors: number
  duration: number | null
  errorMessage: string | null
  cronPath: string
  testPath: string | null
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Check if user is admin
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = createAdminSupabaseClient()

    // Query all scraper logs
    const scrapers: ScraperStatus[] = []

    // 1. Army Innovation (XTECH)
    const { data: xtechLog } = await supabase
      .from('army_innovation_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    scrapers.push({
      name: 'army-innovation',
      displayName: 'Army Innovation (XTECH)',
      lastRun: xtechLog?.started_at || null,
      status: !xtechLog ? 'never-run' : xtechLog.status === 'completed' ? 'success' : xtechLog.status === 'failed' ? 'failed' : 'running',
      recordsProcessed: xtechLog?.records_found || 0,
      recordsInserted: xtechLog?.records_inserted || 0,
      recordsUpdated: xtechLog?.records_updated || 0,
      errors: xtechLog?.records_errors || 0,
      duration: xtechLog?.duration_seconds || null,
      errorMessage: xtechLog?.error_message || null,
      cronPath: '/api/cron/army-innovation-scraper',
      testPath: '/api/army-innovation/test-cron'
    })

    // 2. SAM.gov
    const { data: samLog } = await supabase
      .from('sam_gov_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    scrapers.push({
      name: 'sam-gov',
      displayName: 'SAM.gov Opportunities',
      lastRun: samLog?.started_at || null,
      status: !samLog ? 'never-run' : samLog.status === 'completed' ? 'success' : samLog.status === 'failed' ? 'failed' : 'running',
      recordsProcessed: samLog?.records_found || 0,
      recordsInserted: samLog?.records_inserted || 0,
      recordsUpdated: samLog?.records_updated || 0,
      errors: samLog?.records_errors || 0,
      duration: samLog?.duration_seconds || null,
      errorMessage: samLog?.error_message || null,
      cronPath: '/api/cron/scrape-sam-gov',
      testPath: null
    })

    // 3. FPDS Contracts
    const { data: fpdsLog } = await supabase
      .from('fpds_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    scrapers.push({
      name: 'fpds',
      displayName: 'FPDS Contracts',
      lastRun: fpdsLog?.started_at || null,
      status: !fpdsLog ? 'never-run' : fpdsLog.status === 'completed' ? 'success' : fpdsLog.status === 'failed' ? 'failed' : 'running',
      recordsProcessed: fpdsLog?.records_found || 0,
      recordsInserted: fpdsLog?.records_inserted || 0,
      recordsUpdated: fpdsLog?.records_updated || 0,
      errors: fpdsLog?.records_errors || 0,
      duration: fpdsLog?.duration_seconds || null,
      errorMessage: fpdsLog?.error_message || null,
      cronPath: '/api/cron/scrape-fpds',
      testPath: null
    })

    // 4. Congress.gov Bills
    const { data: congressLog } = await supabase
      .from('congress_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    scrapers.push({
      name: 'congress',
      displayName: 'Congress.gov Bills',
      lastRun: congressLog?.started_at || null,
      status: !congressLog ? 'never-run' : congressLog.status === 'completed' ? 'success' : congressLog.status === 'failed' ? 'failed' : 'running',
      recordsProcessed: congressLog?.records_found || 0,
      recordsInserted: congressLog?.records_inserted || 0,
      recordsUpdated: congressLog?.records_updated || 0,
      errors: congressLog?.records_errors || 0,
      duration: congressLog?.duration_seconds || null,
      errorMessage: congressLog?.error_message || null,
      cronPath: '/api/cron/scrape-congress-gov',
      testPath: null
    })

    // 5. DoD News
    const { data: dodLog } = await supabase
      .from('dod_news_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    scrapers.push({
      name: 'dod-news',
      displayName: 'DoD Contract News',
      lastRun: dodLog?.started_at || null,
      status: !dodLog ? 'never-run' : dodLog.status === 'completed' ? 'success' : dodLog.status === 'failed' ? 'failed' : 'running',
      recordsProcessed: dodLog?.records_found || 0,
      recordsInserted: dodLog?.records_inserted || 0,
      recordsUpdated: dodLog?.records_updated || 0,
      errors: dodLog?.records_errors || 0,
      duration: dodLog?.duration_seconds || null,
      errorMessage: dodLog?.error_message || null,
      cronPath: '/api/cron/scrape-dod-news',
      testPath: null
    })

    // 6. SBIR Awards
    const { data: sbirLog } = await supabase
      .from('sbir_awards_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    scrapers.push({
      name: 'sbir',
      displayName: 'SBIR/STTR Awards',
      lastRun: sbirLog?.started_at || null,
      status: !sbirLog ? 'never-run' : sbirLog.status === 'completed' ? 'success' : sbirLog.status === 'failed' ? 'failed' : 'running',
      recordsProcessed: sbirLog?.records_found || 0,
      recordsInserted: sbirLog?.records_inserted || 0,
      recordsUpdated: sbirLog?.records_updated || 0,
      errors: sbirLog?.records_errors || 0,
      duration: sbirLog?.duration_seconds || null,
      errorMessage: sbirLog?.error_message || null,
      cronPath: '/api/cron/sbir-scraper',
      testPath: null
    })

    return NextResponse.json({ scrapers })
  } catch (error) {
    console.error('Error fetching scraper status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scraper status' },
      { status: 500 }
    )
  }
}

