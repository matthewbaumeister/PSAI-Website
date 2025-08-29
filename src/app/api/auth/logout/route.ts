import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { deleteUserSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Get session token from cookies
    const sessionToken = request.cookies.get('session_token')?.value

    // Delete session from database if session token exists
    if (sessionToken) {
      try {
        await deleteUserSession(sessionToken)
      } catch (error) {
        console.error('Failed to delete session:', error)
        // Don't fail logout if session deletion fails
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0 // Expire immediately
    }

    response.cookies.set('access_token', '', cookieOptions)
    response.cookies.set('refresh_token', '', cookieOptions)
    response.cookies.set('session_token', '', cookieOptions)

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred during logout' },
      { status: 500 }
    )
  }
}

// Also handle GET requests for logout (useful for logout links)
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session_token')?.value

    // Delete session from database if session token exists
    if (sessionToken) {
      try {
        await deleteUserSession(sessionToken)
      } catch (error) {
        console.error('Failed to delete session:', error)
        // Don't fail logout if session deletion fails
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0 // Expire immediately
    }

    response.cookies.set('access_token', '', cookieOptions)
    response.cookies.set('refresh_token', '', cookieOptions)
    response.cookies.set('session_token', '', cookieOptions)

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred during logout' },
      { status: 500 }
    )
  }
}
