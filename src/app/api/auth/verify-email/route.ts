import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

// Handle email verification with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Missing verification token', message: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Find and validate verification token
    const { data: verificationRecord, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('verification_token', token)
      .gt('expires_at', new Date().toISOString())
      .is('verified_at', null)
      .single()

    if (verificationError || !verificationRecord) {
      return NextResponse.json(
        { error: 'Invalid verification token', message: 'Verification token is invalid, expired, or already used' },
        { status: 400 }
      )
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationRecord.user_id)

    if (updateError) {
      console.error('Failed to update user verification status:', updateError)
      return NextResponse.json(
        { error: 'Verification failed', message: 'Failed to verify email address' },
        { status: 500 }
      )
    }

    // Mark verification token as used
    const { error: tokenUpdateError } = await supabase
      .from('email_verifications')
      .update({
        verified_at: new Date().toISOString()
      })
      .eq('id', verificationRecord.id)

    if (tokenUpdateError) {
      console.error('Failed to update verification token:', tokenUpdateError)
      // Don't fail verification if token update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      nextSteps: [
        'Your email address has been verified',
        'You can now log in to your account',
        'Some features may require email verification'
      ]
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while verifying your email' },
      { status: 500 }
    )
  }
}

// Handle email verification with token via GET (for verification links)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing verification token', message: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Find and validate verification token
    const { data: verificationRecord, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('verification_token', token)
      .gt('expires_at', new Date().toISOString())
      .is('verified_at', null)
      .single()

    if (verificationError || !verificationRecord) {
      return NextResponse.json(
        { error: 'Invalid verification token', message: 'Verification token is invalid, expired, or already used' },
        { status: 400 }
      )
    }

    // Get user details for response
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', verificationRecord.user_id)
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
      message: 'Verification token is valid',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token: token,
      expiresAt: verificationRecord.expires_at,
      nextSteps: [
        'This verification token is valid',
        'Use the POST method to complete the verification',
        'Or visit the verification link in your email'
      ]
    })

  } catch (error) {
    console.error('Email verification token validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while validating verification token' },
      { status: 500 }
    )
  }
}
