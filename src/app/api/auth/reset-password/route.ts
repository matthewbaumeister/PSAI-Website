import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { hashPassword, validatePassword, getUserByEmail } from '@/lib/auth'
import crypto from 'crypto'

// Handle password reset request (generate reset token)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email', message: 'Email address is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    // Store reset token in database
    const { error: insertError } = await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Failed to create reset token:', insertError)
      return NextResponse.json(
        { error: 'Reset token creation failed', message: 'Failed to create password reset token' },
        { status: 500 }
      )
    }

    // Send password reset email
    try {
      const { sendPasswordResetEmail } = await import('@/lib/email')
      
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://prop-shop.ai'}/auth/reset-password?token=${resetToken}`
      
      const emailSent = await sendPasswordResetEmail({
        email: user.email,
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        resetToken,
        resetUrl
      })

      if (!emailSent) {
        console.error('Failed to send password reset email to', user.email)
        return NextResponse.json(
          { error: 'Email sending failed', message: 'Failed to send password reset email. Please try again later.' },
          { status: 500 }
        )
      }

      console.log('Password reset email sent successfully to', user.email)
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      return NextResponse.json(
        { error: 'Email sending failed', message: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email',
      nextSteps: [
        'Check your email for a password reset link',
        'The link will expire in 24 hours',
        'If you don\'t see the email, check your spam folder'
      ]
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// Handle password reset with token and new password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid password', 
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Find and validate reset token
    const { data: resetRecord, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('reset_token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single()

    if (resetError || !resetRecord) {
      return NextResponse.json(
        { error: 'Invalid reset token', message: 'Reset token is invalid, expired, or already used' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetRecord.user_id)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { error: 'Password update failed', message: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark reset token as used
    const { error: tokenUpdateError } = await supabase
      .from('password_resets')
      .update({
        used_at: new Date().toISOString()
      })
      .eq('id', resetRecord.id)

    if (tokenUpdateError) {
      console.error('Failed to update reset token:', tokenUpdateError)
      // Don't fail password reset if token update fails
    }

    // Invalidate all existing sessions for security
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', resetRecord.user_id)

    if (sessionError) {
      console.error('Failed to invalidate sessions:', sessionError)
      // Don't fail password reset if session invalidation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      nextSteps: [
        'Your password has been updated',
        'All existing sessions have been invalidated for security',
        'You can now log in with your new password'
      ]
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while resetting password' },
      { status: 500 }
    )
  }
}

// Handle password reset with token via GET (for reset links)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing reset token', message: 'Reset token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Find and validate reset token
    const { data: resetRecord, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('reset_token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single()

    if (resetError || !resetRecord) {
      return NextResponse.json(
        { error: 'Invalid reset token', message: 'Reset token is invalid, expired, or already used' },
        { status: 400 }
      )
    }

    // Get user details for response
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', resetRecord.user_id)
      .single()

    if (userError || !user) {
      console.error('Failed to get user details:', userError)
      return NextResponse.json(
        { error: 'User not found', message: 'User account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reset token is valid',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token: token,
      expiresAt: resetRecord.expires_at,
      nextSteps: [
        'This reset token is valid',
        'Use the PUT method with your new password to complete the reset'
      ]
    })

  } catch (error) {
    console.error('Password reset token validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while validating reset token' },
      { status: 500 }
    )
  }
}
