import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { verifyPassword, hashPassword, validatePassword } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password validation failed', 
          message: 'New password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Get current user with password hash
    const supabase = createAdminSupabaseClient()
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      console.error('Failed to get user:', userError)
      return NextResponse.json(
        { error: 'User not found', message: 'User account not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.password_hash || '')
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid current password', message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { error: 'Password update failed', message: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Invalidate all existing sessions (force re-login for security)
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)

    if (sessionError) {
      console.error('Failed to invalidate sessions:', sessionError)
      // Don't fail the password change if session invalidation fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      nextSteps: [
        'Your password has been updated',
        'All existing sessions have been invalidated for security',
        'You will need to log in again with your new password'
      ]
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while changing password' },
      { status: 500 }
    )
  }
}
