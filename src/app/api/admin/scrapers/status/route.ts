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

    // 2. SAM.gov - Check actual data table since no scraper_log exists
    const { data: samData, count: samCount } = await supabase
      .from('sam_gov_opportunities')
      .select('last_scraped', { count: 'exact' })
      .order('last_scraped', { ascending: false })
      .limit(1)
      .maybeSingle()

    scrapers.push({
      name: 'sam-gov',
      displayName: 'SAM.gov Opportunities',
      lastRun: samData?.last_scraped || null,
      status: samData ? 'success' : 'never-run',
      recordsProcessed: samCount || 0,
      recordsInserted: samCount || 0,
      recordsUpdated: 0,
      errors: 0,
      duration: null,
      errorMessage: null,
      cronPath: '/api/cron/scrape-sam-gov',
      testPath: null
    })

    // 3. FPDS Contracts - Check scraper log (it has one!)
    const { data: fpdsLog } = await supabase
      .from('fpds_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

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

    // 4. Congress.gov Bills - Check actual data table
    const { data: congressData, count: congressCount } = await supabase
      .from('congress_bills')
      .select('last_updated_at', { count: 'exact' })
      .order('last_updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    scrapers.push({
      name: 'congress',
      displayName: 'Congress.gov Bills',
      lastRun: congressData?.last_updated_at || null,
      status: congressData ? 'success' : 'never-run',
      recordsProcessed: congressCount || 0,
      recordsInserted: congressCount || 0,
      recordsUpdated: 0,
      errors: 0,
      duration: null,
      errorMessage: null,
      cronPath: '/api/cron/scrape-congress-gov',
      testPath: null
    })

    // 5. DoD News - Check actual data table
    const { data: dodData, count: dodCount } = await supabase
      .from('dod_contract_news')
      .select('published_at', { count: 'exact' })
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    scrapers.push({
      name: 'dod-news',
      displayName: 'DoD Contract News',
      lastRun: dodData?.published_at || null,
      status: dodData ? 'success' : 'never-run',
      recordsProcessed: dodCount || 0,
      recordsInserted: dodCount || 0,
      recordsUpdated: 0,
      errors: 0,
      duration: null,
      errorMessage: null,
      cronPath: '/api/cron/scrape-dod-news',
      testPath: null
    })

    // 6. SBIR Awards - Check actual data table
    const { data: sbirData, count: sbirCount } = await supabase
      .from('sbir_sttr_awards')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    scrapers.push({
      name: 'sbir',
      displayName: 'SBIR/STTR Awards',
      lastRun: sbirData?.created_at || null,
      status: sbirData ? 'success' : 'never-run',
      recordsProcessed: sbirCount || 0,
      recordsInserted: sbirCount || 0,
      recordsUpdated: 0,
      errors: 0,
      duration: null,
      errorMessage: null,
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

