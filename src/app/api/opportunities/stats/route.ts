import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get unique agencies
    const { data: agencies } = await supabase
      .from('opportunity_master')
      .select('customer_agency')
      .not('customer_agency', 'is', null)
      .order('customer_agency')
    
    const uniqueAgencies = [...new Set(agencies?.map(a => a.customer_agency) || [])]
    
    // Get unique statuses
    const { data: statuses } = await supabase
      .from('opportunity_master')
      .select('status')
      .not('status', 'is', null)
      .order('status')
    
    const uniqueStatuses = [...new Set(statuses?.map(s => s.status) || [])]
    
    // Get unique vehicle types
    const { data: vehicles } = await supabase
      .from('opportunity_master')
      .select('vehicle_type')
      .not('vehicle_type', 'is', null)
      .order('vehicle_type')
    
    const uniqueVehicles = [...new Set(vehicles?.map(v => v.vehicle_type) || [])]
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('opportunity_master')
      .select('*', { count: 'exact', head: true })
    
    // Get value range
    const { data: valueRange } = await supabase
      .from('opportunity_master')
      .select('estimated_value')
      .not('estimated_value', 'is', null)
      .order('estimated_value', { ascending: true })
      .limit(1)
    
    const { data: maxValueRange } = await supabase
      .from('opportunity_master')
      .select('estimated_value')
      .not('estimated_value', 'is', null)
      .order('estimated_value', { ascending: false })
      .limit(1)
    
    return NextResponse.json({
      agencies: uniqueAgencies,
      statuses: uniqueStatuses,
      vehicles: uniqueVehicles,
      totalOpportunities: totalCount || 0,
      valueRange: {
        min: valueRange?.[0]?.estimated_value || 0,
        max: maxValueRange?.[0]?.estimated_value || 100000000
      }
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

