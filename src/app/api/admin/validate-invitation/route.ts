import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token', message: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()
    
    // Get invitation details
    const { data: invitation, error } = await supabase
      .from('admin_invitations')
      .select(`
        id,
        email,
        invited_by,
        status,
        expires_at,
        created_at
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Invitation token is invalid or expired' },
        { status: 400 }
      )
    }

    // Check if invitation is expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Expired token', message: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invalid status', message: 'Invitation is no longer pending' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        invitedBy: invitation.invited_by,
        expiresAt: invitation.expires_at,
        status: invitation.status
      }
    })

  } catch (error) {
    console.error('Validate invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
