import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authResult = await requireAuth(request)
    
    // Check if authResult is a NextResponse (error) or user object
    if ('status' in authResult) {
      return authResult // Return the error response
    }

    const supabase = createAdminSupabaseClient()
    
    // Update user to be admin
    const { error } = await supabase
      .from('users')
      .update({ 
        is_admin: true,
        is_active: true
      })
      .eq('email', authResult.user.email)

    if (error) {
      console.error('Error making user admin:', error)
      return NextResponse.json(
        { error: 'Failed to make user admin', message: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User has been made admin successfully'
    })

  } catch (error) {
    console.error('Make admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
