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
  totalRowsInDb: number
  totalDataPoints: number
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
      errorMessage: result.errorMessage || null,
      totalRowsInDb: result.totalRowsInDb || 0,
      totalDataPoints: result.totalDataPoints || 0
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
      errorMessage: `Query error: ${error.message}`,
      totalRowsInDb: 0,
      totalDataPoints: 0
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
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('army_innovation_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('army_innovation_opportunities')
            .select('*', { count: 'exact', head: true })
          
          // Get total submissions (winners/finalists)
          const { count: totalSubmissions } = await supabase
            .from('army_innovation_submissions')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~80 fields per opportunity + ~10 per submission
          const totalDataPoints = ((totalRows || 0) * 80) + ((totalSubmissions || 0) * 10)

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: (totalRows || 0) + (totalSubmissions || 0),
            totalDataPoints
          }
        }
      ),

      // 2. SAM.gov - Has scraper_log
      getSafeScraperStatus(
        'sam-gov',
        'SAM.gov Opportunities',
        '/api/cron/scrape-sam-gov',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('sam_gov_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('sam_gov_opportunities')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~60 fields per opportunity (description, attachments, contacts, etc.)
          const totalDataPoints = (totalRows || 0) * 60

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 3. FPDS Contracts - Has scraper_log
      getSafeScraperStatus(
        'fpds',
        'FPDS Contracts',
        '/api/cron/scrape-fpds',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('fpds_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('fpds_contracts')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~100 fields per contract (very detailed contract data)
          const totalDataPoints = (totalRows || 0) * 100

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 4. Congress.gov Bills - Has scraper_log
      getSafeScraperStatus(
        'congress',
        'Congress.gov Bills',
        '/api/cron/scrape-congress-gov',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('congress_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('congressional_bills')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~50 fields per bill (title, summary, actions, cosponsors, etc.)
          const totalDataPoints = (totalRows || 0) * 50

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 5. DoD Contract News - Has scraper_log
      getSafeScraperStatus(
        'dod-news',
        'DoD Contract News',
        '/api/cron/scrape-dod-news',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('dod_news_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('dod_contract_news')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~30 fields per contract (vendor, amount, description, locations, etc.)
          const totalDataPoints = (totalRows || 0) * 30

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 6. DSIP Opportunities - Has scraper_log
      getSafeScraperStatus(
        'sbir',
        'DSIP Opportunities',
        '/api/cron/sbir-scraper',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('sbir_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('sbir_final')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~120 fields per topic (very detailed SBIR data with Q&A)
          const totalDataPoints = (totalRows || 0) * 120

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.records_found || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: data?.records_updated || 0,
            errors: data?.records_errors || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 7. ManTech Projects - Has scraper_log
      getSafeScraperStatus(
        'mantech',
        'ManTech Projects',
        '/api/cron/scrape-mantech',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('mantech_scraper_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('mantech_projects')
            .select('*', { count: 'exact', head: true })

          const { count: companyCount } = await supabase
            .from('mantech_company_mentions')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~40 fields per project + company mentions
          const totalDataPoints = ((totalRows || 0) * 40) + (companyCount || 0)

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.articles_found || 0,
            recordsInserted: data?.projects_created || 0,
            recordsUpdated: data?.projects_updated || 0,
            errors: data?.articles_failed || 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 8. Congressional Stock Trades (House + Senate) - Has scraper_log
      getSafeScraperStatus(
        'congress-trades',
        'Congressional Trades (House + Senate)',
        '/api/cron/congressional-trades-monthly',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('congressional_trades_scraper_log')
            .select('*')
            .eq('scrape_type', 'monthly')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database (BOTH chambers)
          const { count: totalRows } = await supabase
            .from('congressional_stock_trades')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~20 fields per trade
          const totalDataPoints = (totalRows || 0) * 20

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.total_trades_found || 0,
            recordsInserted: data?.new_trades_inserted || 0,
            recordsUpdated: data?.trades_updated || 0,
            errors: 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 9. GSA Schedule Contracts - Has scraper_log
      getSafeScraperStatus(
        'gsa-schedules',
        'GSA Schedule Contracts (Full)',
        '/api/cron/gsa-schedules-monthly',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('gsa_scraper_log')
            .select('*')
            .eq('scrape_type', 'monthly_full')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total rows in database
          const { count: totalRows } = await supabase
            .from('gsa_schedule_contracts')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~30 fields per contract
          const totalDataPoints = (totalRows || 0) * 30

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.contractors_parsed || 0,
            recordsInserted: data?.records_inserted || 0,
            recordsUpdated: 0,
            errors: 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalRows || 0,
            totalDataPoints
          }
        }
      ),

      // 10. Company Intelligence Enrichment - Has enrichment_log
      getSafeScraperStatus(
        'company-enrichment',
        'Company Intelligence (SAM.gov + SEC)',
        '/api/cron/company-enrichment-monthly',
        '/api/admin/scrapers/trigger',
        async () => {
          const { data, error } = await supabase
            .from('company_enrichment_log')
            .select('*')
            .eq('enrichment_type', 'monthly_full')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (error) throw error

          // Get total enriched companies
          const { count: totalEnriched } = await supabase
            .from('company_intelligence')
            .select('*', { count: 'exact', head: true })

          // Get total public companies found
          const { count: publicCompanies } = await supabase
            .from('company_intelligence')
            .select('*', { count: 'exact', head: true })
            .eq('is_public_company', true)

          // Estimate data points: ~40 fields per company
          const totalDataPoints = (totalEnriched || 0) * 40

          return {
            lastRun: data?.started_at,
            status: !data ? 'never-run' : data.status === 'completed' ? 'success' : data.status === 'failed' ? 'failed' : 'running',
            recordsProcessed: data?.companies_processed || 0,
            recordsInserted: data?.companies_enriched || 0,
            recordsUpdated: data?.public_companies_found || 0,
            errors: 0,
            duration: data?.duration_seconds,
            errorMessage: data?.error_message,
            totalRowsInDb: totalEnriched || 0,
            totalDataPoints
          }
        }
      ),

      // 11. GSA Pricing Data Collection - Monthly
      getSafeScraperStatus(
        'gsa-pricing',
        'GSA Pricing (Labor Rates)',
        '/api/cron/gsa-pricing-monthly',
        '/api/admin/scrapers/trigger',
        async () => {
          // Note: No dedicated log table yet, will show as never-run until first execution
          // Get total rows in database
          const { count: priceLists } = await supabase
            .from('gsa_price_lists')
            .select('*', { count: 'exact', head: true })

          const { count: laborCategories } = await supabase
            .from('gsa_labor_categories')
            .select('*', { count: 'exact', head: true })

          // Estimate data points: ~20 fields per labor category
          const totalDataPoints = (laborCategories || 0) * 20

          return {
            lastRun: null,
            status: 'never-run',
            recordsProcessed: 0,
            recordsInserted: 0,
            recordsUpdated: 0,
            errors: 0,
            duration: null,
            errorMessage: null,
            totalRowsInDb: laborCategories || 0,
            totalDataPoints
          }
        }
      ),

      // 12. Company Intelligence Daily Update
      getSafeScraperStatus(
        'company-daily',
        'Company Intelligence (Daily)',
        '/api/cron/company-daily',
        '/api/admin/scrapers/trigger',
        async () => {
          // Note: No dedicated log table, tracks via company_intelligence table
          const { count: totalCompanies } = await supabase
            .from('fpds_company_stats')
            .select('*', { count: 'exact', head: true })

          const { count: enrichedCompanies } = await supabase
            .from('company_intelligence')
            .select('*', { count: 'exact', head: true })

          const { count: publicCompanies } = await supabase
            .from('company_intelligence')
            .select('*', { count: 'exact', head: true })
            .eq('is_public_company', true)

          // Estimate data points: ~40 fields per company
          const totalDataPoints = (enrichedCompanies || 0) * 40

          return {
            lastRun: null,
            status: 'never-run',
            recordsProcessed: 0,
            recordsInserted: 0,
            recordsUpdated: 0,
            errors: 0,
            duration: null,
            errorMessage: null,
            totalRowsInDb: enrichedCompanies || 0,
            totalDataPoints
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
