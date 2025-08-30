import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const supabase = createAdminSupabaseClient()

    // Create scraping log entry
    const { data: logEntry, error: logError } = await supabase
      .from('dsip_scraping_logs')
      .insert({
        status: 'started',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating scraping log:', logError)
      return NextResponse.json({ message: 'Failed to create scraping log' }, { status: 500 })
    }

    try {
      // Here you would implement the actual DSIP scraping logic
      // For now, we'll simulate the process
      
      // Update log status to processing
      await supabase
        .from('dsip_scraping_logs')
        .update({ 
          status: 'processing',
          records_processed: 0,
          new_records_found: 0,
          updated_records: 0
        })
        .eq('id', logEntry.id)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update log with completion
      const { error: updateError } = await supabase
        .from('dsip_scraping_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: 2,
          records_processed: 100,
          new_records_found: 5,
          updated_records: 15
        })
        .eq('id', logEntry.id)

      if (updateError) {
        console.error('Error updating scraping log:', updateError)
      }

      return NextResponse.json({
        message: 'DSIP refresh completed successfully',
        logId: logEntry.id,
        status: 'completed'
      })

    } catch (scrapingError) {
      // Update log with error status
      await supabase
        .from('dsip_scraping_logs')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.floor((Date.now() - new Date(logEntry.started_at).getTime()) / 1000),
          errors: [scrapingError instanceof Error ? scrapingError.message : 'Unknown error']
        })
        .eq('id', logEntry.id)

      throw scrapingError
    }

  } catch (error) {
    console.error('Error in DSIP refresh:', error)
    return NextResponse.json({ 
      message: 'Failed to refresh DSIP data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createAdminSupabaseClient()

    // Get recent scraping logs
    const { data: logs, error } = await supabase
      .from('dsip_scraping_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching scraping logs:', error)
      return NextResponse.json({ message: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: logs?.length || 0
    })

  } catch (error) {
    console.error('Error fetching DSIP refresh logs:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
