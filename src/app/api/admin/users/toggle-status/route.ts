import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    
    // Check if authResult is a NextResponse (error) or user object
    if ('status' in authResult) {
      return authResult // Return the error response
    }

    const body = await request.json()
    const { userId, isActive } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID', message: 'User ID is required' },
        { status: 400 }
      )
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid active status', message: 'Active status must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found', message: 'User does not exist' },
        { status: 404 }
      )
    }

    // Prevent deactivating the last admin
    if (user.is_admin && !isActive) {
      const { count: adminCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true)
        .eq('is_active', true)

      if (countError) {
        console.error('Error counting active admins:', countError)
        return NextResponse.json(
          { error: 'Database error', message: 'Failed to verify active admin count' },
          { status: 500 }
        )
      }

      if (!adminCount || adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate last admin', message: 'At least one admin must remain active in the system' },
          { status: 400 }
        )
      }
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return NextResponse.json(
        { error: 'Status update failed', message: 'Failed to update user status' },
        { status: 500 }
      )
    }

    // If deactivating, also terminate any active sessions
    if (!isActive) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
    }

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: userId,
        isActive
      }
    })

  } catch (error) {
    console.error('Toggle user status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
