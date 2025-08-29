import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Debug: Log all cookies received
    console.log('🔍 /api/auth/me - All cookies received:', request.cookies.getAll())
    console.log('🔍 /api/auth/me - access_token cookie:', request.cookies.get('access_token')?.value ? 'EXISTS' : 'MISSING')
    
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Get full user details from database
    const userDetails = await getUserById(user.id)
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found', message: 'User account not found or inactive' },
        { status: 404 }
      )
    }

    // Return user information (without sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: userDetails.id,
        email: userDetails.email,
        firstName: userDetails.first_name,
        lastName: userDetails.last_name,
        companyName: userDetails.company_name,
        companySize: userDetails.company_size,
        phone: userDetails.phone,
        isAdmin: userDetails.is_admin,
        emailVerified: !!userDetails.email_verified_at,
        isActive: userDetails.is_active,
        lastLoginAt: userDetails.last_login_at,
        createdAt: userDetails.created_at,
        updatedAt: userDetails.updated_at
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while fetching user information' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      companyName, 
      companySize, 
      phone 
    } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Update user profile
    const { createAdminSupabaseClient } = await import('@/lib/supabase')
    const supabase = createAdminSupabaseClient()
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName?.trim() || null,
        company_size: companySize?.trim() || null,
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, email, first_name, last_name, company_name, company_size, phone, is_admin, email_verified_at, is_active, last_login_at, created_at, updated_at')
      .single()

    if (updateError || !updatedUser) {
      console.error('Failed to update user:', updateError)
      return NextResponse.json(
        { error: 'Update failed', message: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    // Return updated user information
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        companyName: updatedUser.company_name,
        companySize: updatedUser.company_size,
        phone: updatedUser.phone,
        isAdmin: updatedUser.is_admin,
        emailVerified: !!updatedUser.email_verified_at,
        isActive: updatedUser.is_active,
        lastLoginAt: updatedUser.last_login_at,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      }
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while updating user profile' },
      { status: 500 }
    )
  }
}
