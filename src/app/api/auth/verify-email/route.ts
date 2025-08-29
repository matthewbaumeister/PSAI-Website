import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Missing verification token', message: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Find and validate verification token
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('verification_token', token)
      .eq('expires_at', 'gt', new Date().toISOString())
      .is('verified_at', null)
      .single()

    if (verificationError || !verification) {
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
      .eq('id', verification.user_id)

    if (updateError) {
      console.error('Failed to verify email:', updateError)
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
      .eq('id', verification.id)

    if (tokenUpdateError) {
      console.error('Failed to update verification token:', tokenUpdateError)
      // Don't fail verification if token update fails
    }

    // Get user details for response
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', verification.user_id)
      .single()

    if (userError || !user) {
      console.error('Failed to get user details:', userError)
      // Return success even if we can't get user details
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        nextSteps: [
          'Your email has been verified',
          'You can now log in to your account'
        ]
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      nextSteps: [
        'Your email has been verified',
        'You can now log in to your account'
      ]
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred during email verification' },
      { status: 500 }
    )
  }
}

// Also handle GET requests for verification links
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
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('verification_token', token)
      .eq('expires_at', 'gt', new Date().toISOString())
      .is('verified_at', null)
      .single()

    if (verificationError || !verification) {
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
      .eq('id', verification.user_id)

    if (updateError) {
      console.error('Failed to verify email:', updateError)
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
      .eq('id', verification.id)

    if (tokenUpdateError) {
      console.error('Failed to update verification token:', tokenUpdateError)
      // Don't fail verification if token update fails
    }

    // Get user details for response
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', verification.user_id)
      .single()

    if (userError || !user) {
      console.error('Failed to get user details:', userError)
      // Return success even if we can't get user details
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        nextSteps: [
          'Your email has been verified',
          'You can now log in to your account'
        ]
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      nextSteps: [
        'Your email has been verified',
        'You can now log in to your account'
      ]
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred during email verification' },
      { status: 500 }
    )
  }
}
