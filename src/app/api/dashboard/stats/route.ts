import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { DashboardStats, ChartData } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current date and month start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStartISO = monthStart.toISOString()

    // Get total counts
    const [
      { count: totalProposals },
      { count: totalOpportunities },
      { count: totalMeetings },
      { count: proposalsThisMonth },
      { count: opportunitiesThisMonth },
      { count: meetingsThisMonth }
    ] = await Promise.all([
      supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStartISO),
      supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStartISO),
      supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStartISO)
    ])

    // Get total value of proposals
    const { data: proposalValues } = await supabase
      .from('proposals')
      .select('value, currency')
      .eq('user_id', user.id)
      .not('value', 'is', null)

    // Calculate total value (convert to USD for simplicity)
    const totalValue = proposalValues?.reduce((sum, proposal) => {
      const value = proposal.value || 0
      // Simple currency conversion (in production, use real exchange rates)
      const multiplier = proposal.currency === 'EUR' ? 1.1 : proposal.currency === 'GBP' ? 1.3 : 1
      return sum + (value * multiplier)
    }, 0) || 0

    // Calculate conversion rate (proposals won / total proposals)
    const { count: wonProposals } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    const conversionRate = totalProposals > 0 ? (wonProposals / totalProposals) * 100 : 0

    // Get chart data for the last 6 months
    const chartData = await getChartData(supabase, user.id)

    const stats: DashboardStats = {
      totalProposals: totalProposals || 0,
      totalOpportunities: totalOpportunities || 0,
      totalMeetings: totalMeetings || 0,
      proposalsThisMonth: proposalsThisMonth || 0,
      opportunitiesThisMonth: opportunitiesThisMonth || 0,
      meetingsThisMonth: meetingsThisMonth || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        chartData
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getChartData(supabase: any, userId: string): Promise<ChartData> {
  const months = []
  const proposalData = []
  const opportunityData = []
  const meetingData = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthName = date.toLocaleString('default', { month: 'short' })
    months.push(monthName)

    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    const monthStartISO = monthStart.toISOString()
    const monthEndISO = monthEnd.toISOString()

    // Get counts for this month
    const [
      { count: proposalCount },
      { count: opportunityCount },
      { count: meetingCount }
    ] = await Promise.all([
      supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO)
    ])

    proposalData.push(proposalCount || 0)
    opportunityData.push(opportunityCount || 0)
    meetingData.push(meetingCount || 0)
  }

  return {
    labels: months,
    datasets: [
      {
        label: 'Proposals',
        data: proposalData,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
      },
      {
        label: 'Opportunities',
        data: opportunityData,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
      {
        label: 'Meetings',
        data: meetingData,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      },
    ],
  }
}
