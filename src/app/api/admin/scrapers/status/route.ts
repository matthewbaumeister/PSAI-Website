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

async function getSafeScraperStatus(
  name: string,
  displayName: string,
  cronPath: string,
  testPath: string | null,
  queryFn: () => Promise<Partial<ScraperStatus>>
): Promise<ScraperStatus> {
  try {
    const result = await queryFn()
    return {
      name,
      displayName,
      cronPath,
      testPath,
      lastRun: result.lastRun || null,
      status: result.status || 'never-run',
      recordsProcessed: result.recordsProcessed || 0,
      recordsInserted: result.recordsInserted || 0,
      recordsUpdated: result.recordsUpdated || 0,
      errors: result.errors || 0,
      duration: result.duration || null,
      errorMessage: result.errorMessage || null
    }
  } catch (error: any) {
    console.error(`Error fetching ${displayName} status:`, error.message)
    return {
      name,
      displayName,
      cronPath,
      testPath,
      lastRun: null,
      status: 'never-run',
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: 0,
      duration: null,
      errorMessage: `Query error: ${error.message}`
    }
  }
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

    // Query all scrapers with individual error handling
    const scrapers = await Promise.all([
      // 1. Army Innovation (XTECH) - Has scraper_log
      getSafeScraperStatus(
        'army-innovation',
        'Army Innovation (XTECH)',
        '/api/cron/army-innovation-scraper',
        '/api/army-innovation/test-cron',
        async () => {
          const { data, error } = await supabase
            .from('army_innovation_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message
          }
        }
      ),

      // 2. SAM.gov - Has scraper_log
      getSafeScraperStatus(
        'sam-gov',
        'SAM.gov Opportunities',
        '/api/cron/scrape-sam-gov',
        null,
        async () => {
          const { data, error } = await supabase
            .from('sam_gov_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message
          }
        }
      ),

      // 3. FPDS Contracts - Has scraper_log
      getSafeScraperStatus(
        'fpds',
        'FPDS Contracts',
        '/api/cron/scrape-fpds',
        null,
        async () => {
          const { data, error } = await supabase
            .from('fpds_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message
          }
        }
      ),

      // 4. Congress.gov Bills - Has scraper_log
      getSafeScraperStatus(
        'congress',
        'Congress.gov Bills',
        '/api/cron/scrape-congress-gov',
        null,
        async () => {
          const { data, error } = await supabase
            .from('congress_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message
          }
        }
      ),

      // 5. DoD Contract News - Has scraper_log
      getSafeScraperStatus(
        'dod-news',
        'DoD Contract News',
        '/api/cron/scrape-dod-news',
        null,
        async () => {
          const { data, error } = await supabase
            .from('dod_news_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message
          }
        }
      ),

      // 6. DSIP Opportunities - Has scraper_log
      getSafeScraperStatus(
        'sbir',
        'DSIP Opportunities',
        '/api/cron/sbir-scraper',
        null,
        async () => {
          const { data, error } = await supabase
            .from('sbir_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message
          }
        }
      )
    ])

    return NextResponse.json({ scrapers })
  } catch (error: any) {
    console.error('Error fetching scraper status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch scraper status',
        details: error?.message || String(error),
        scrapers: []
      },
      { status: 500 }
    )
  }
}
