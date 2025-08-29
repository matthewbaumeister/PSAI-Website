import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, generateAccessToken, getUserById } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    // Validate required fields
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token', message: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token', message: 'Refresh token is invalid or expired' },
        { status: 401 }
      )
    }

    // Verify user still exists and is active
    const user = await getUserById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', message: 'User account not found or inactive' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      sessionId: payload.sessionId
    })

    // Return new access token
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '30m'
    })

    // Set new access token cookie
    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60 // 30 minutes
    })

    return response

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while refreshing token' },
      { status: 500 }
    )
  }
}

// Also handle GET requests for refresh (useful for automatic token refresh)
export async function GET(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token', message: 'No refresh token found in cookies' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token', message: 'Refresh token is invalid or expired' },
        { status: 401 }
      )
    }

    // Verify user still exists and is active
    const user = await getUserById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', message: 'User account not found or inactive' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      sessionId: payload.sessionId
    })

    // Return new access token
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '30m'
    })

    // Set new access token cookie
    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60 // 30 minutes
    })

    return response

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while refreshing token' },
      { status: 500 }
    )
  }
}
