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
    const { userId, isAdmin } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID', message: 'User ID is required' },
        { status: 400 }
      )
    }

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid admin status', message: 'Admin status must be a boolean' },
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

    // Prevent removing the last admin
    if (user.is_admin && !isAdmin) {
      const { count: adminCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true)

      if (countError) {
        console.error('Error counting admins:', countError)
        return NextResponse.json(
          { error: 'Database error', message: 'Failed to verify admin count' },
          { status: 500 }
        )
      }

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove last admin', message: 'At least one admin must remain in the system' },
          { status: 400 }
        )
      }
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json(
        { error: 'Role update failed', message: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${isAdmin ? 'promoted to' : 'removed from'} admin successfully`,
      user: {
        id: userId,
        isAdmin
      }
    })

  } catch (error) {
    console.error('Toggle user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
