import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminSupabaseClient()

    // Get basic statistics using the database function
    const { data: stats, error: statsError } = await supabase.rpc('get_dsip_search_stats')

    if (statsError) {
      console.error('Error getting DSIP stats:', statsError)
      return NextResponse.json({ message: 'Failed to get statistics' }, { status: 500 })
    }

    // Get additional statistics
    const { data: componentStats, error: componentError } = await supabase
      .from('dsip_opportunities')
      .select('component, status')
      .not('component', 'is', null)

    const { data: programStats, error: programError } = await supabase
      .from('dsip_opportunities')
      .select('program, status')
      .not('program', 'is', null)

    const { data: phaseStats, error: phaseError } = await supabase
      .from('dsip_opportunities')
      .select('phase, status')
      .not('phase', 'is', null)

    // Process component statistics
    const componentBreakdown: Record<string, { total: number; active: number; open: number }> = {}
    if (componentStats) {
      componentStats.forEach(item => {
        if (item.component) {
          if (!componentBreakdown[item.component]) {
            componentBreakdown[item.component] = { total: 0, active: 0, open: 0 }
          }
          componentBreakdown[item.component].total++
          if (item.status === 'Open') {
            componentBreakdown[item.component].open++
          }
          if (item.status === 'Active' || item.status === 'Open') {
            componentBreakdown[item.component].active++
          }
        }
      })
    }

    // Process program statistics
    const programBreakdown: Record<string, { total: number; active: number; open: number }> = {}
    if (programStats) {
      programStats.forEach(item => {
        if (item.program) {
          if (!programBreakdown[item.program]) {
            programBreakdown[item.program] = { total: 0, active: 0, open: 0 }
          }
          programBreakdown[item.program].total++
          if (item.status === 'Open') {
            programBreakdown[item.program].open++
          }
          if (item.status === 'Active' || item.status === 'Open') {
            programBreakdown[item.program].active++
          }
        }
      })
    }

    // Process phase statistics
    const phaseBreakdown: Record<string, { total: number; active: number; open: number }> = {}
    if (phaseStats) {
      phaseStats.forEach(item => {
        if (item.phase) {
          if (!phaseBreakdown[item.phase]) {
            phaseBreakdown[item.phase] = { total: 0, active: 0, open: 0 }
          }
          phaseBreakdown[item.phase].total++
          if (item.status === 'Open') {
            phaseBreakdown[item.phase].open++
          }
          if (item.status === 'Active' || item.status === 'Open') {
            phaseBreakdown[item.phase].active++
          }
        }
      })
    }

    // Get funding statistics
    const { data: fundingStats, error: fundingError } = await supabase
      .from('dsip_opportunities')
      .select('total_potential_award')
      .not('total_potential_award', 'is', null)

    let fundingBreakdown = {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      ranges: {
        'Under $100K': 0,
        '$100K - $500K': 0,
        '$500K - $1M': 0,
        '$1M - $5M': 0,
        'Over $5M': 0
      }
    }

    if (fundingStats && fundingStats.length > 0) {
      const amounts = fundingStats.map(item => item.total_potential_award).filter(amount => amount > 0)
      if (amounts.length > 0) {
        fundingBreakdown.total = amounts.reduce((sum, amount) => sum + amount, 0)
        fundingBreakdown.average = fundingBreakdown.total / amounts.length
        fundingBreakdown.min = Math.min(...amounts)
        fundingBreakdown.max = Math.max(...amounts)

        // Categorize funding amounts
        amounts.forEach(amount => {
          if (amount < 100000) fundingBreakdown.ranges['Under $100K']++
          else if (amount < 500000) fundingBreakdown.ranges['$100K - $500K']++
          else if (amount < 1000000) fundingBreakdown.ranges['$500K - $1M']++
          else if (amount < 5000000) fundingBreakdown.ranges['$1M - $5M']++
          else fundingBreakdown.ranges['Over $5M']++
        })
      }
    }

    // Get recent activity
    const { data: recentActivity, error: recentError } = await supabase
      .from('dsip_opportunities')
      .select('id, title, status, open_date, close_date, updated_date')
      .order('updated_date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      basic: stats?.[0] || {
        total_opportunities: 0,
        active_opportunities: 0,
        open_opportunities: 0,
        prerelease_opportunities: 0,
        total_components: 0,
        total_programs: 0
      },
      breakdowns: {
        components: componentBreakdown,
        programs: programBreakdown,
        phases: phaseBreakdown,
        funding: fundingBreakdown
      },
      recentActivity: recentActivity || [],
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in DSIP stats:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
