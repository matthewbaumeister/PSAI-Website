import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    
    // Check if authResult is a NextResponse (error) or user object
    if ('status' in authResult) {
      return authResult // Return the error response
    }

    const supabase = createAdminSupabaseClient()
    
    // First, check if the table exists
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('admin_invitations')
        .select('count(*)')
        .limit(1)
      
      if (tableError) {
        console.error('Table check error:', tableError)
        return NextResponse.json(
          { 
            error: 'Table not found', 
            message: `admin_invitations table error: ${tableError.message}`,
            details: tableError
          },
          { status: 500 }
        )
      }
    } catch (tableCheckError) {
      console.error('Table check exception:', tableCheckError)
      return NextResponse.json(
        { 
          error: 'Table check failed', 
          message: 'Could not verify admin_invitations table exists',
          details: tableCheckError
        },
        { status: 500 }
      )
    }
    
    // Get all admin invitations
    const { data: invitations, error } = await supabase
      .from('admin_invitations')
      .select(`
        id,
        email,
        invited_by,
        status,
        created_at,
        expires_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch invitations', 
          message: 'Database error occurred',
          details: error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || []
    })

  } catch (error) {
    console.error('Admin invitations fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
