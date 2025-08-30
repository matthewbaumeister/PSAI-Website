import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    
    // Check if authResult is a NextResponse (error) or user object
    if ('status' in authResult) {
      return authResult // Return the error response
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID', message: 'User ID is required' },
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
    if (user.is_admin) {
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

      if (!adminCount || adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove last admin', message: 'At least one admin must remain in the system' },
          { status: 400 }
        )
      }
    }

    // Remove user from all related tables first
    // Remove from user_preferences
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)

    // Remove from dsip_saved_searches
    await supabase
      .from('dsip_saved_searches')
      .delete()
      .eq('user_id', userId)

    // Remove from dsip_user_favorites
    await supabase
      .from('dsip_user_favorites')
      .delete()
      .eq('user_id', userId)

    // Remove from dsip_search_analytics
    await supabase
      .from('dsip_search_analytics')
      .delete()
      .eq('user_id', userId)

    // Finally, remove the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'User deletion failed', message: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User "${user.email}" removed successfully`,
      user: {
        id: userId,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Remove user error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
