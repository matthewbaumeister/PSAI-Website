import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Log all cookies received
    const allCookies = request.cookies.getAll()
    console.log('🔍 Debug Cookies - All cookies received:', allCookies)
    
    // Check specific auth cookies
    const accessToken = request.cookies.get('access_token')
    const authStatus = request.cookies.get('auth_status')
    const sessionToken = request.cookies.get('session_token')
    
    console.log('🔍 Debug Cookies - access_token:', accessToken ? 'EXISTS' : 'MISSING')
    console.log('🔍 Debug Cookies - auth_status:', authStatus ? 'EXISTS' : 'MISSING')
    console.log('🔍 Debug Cookies - session_token:', sessionToken ? 'EXISTS' : 'MISSING')
    
    // Return cookie info to frontend
    return NextResponse.json({
      success: true,
      cookies: {
        total: allCookies.length,
        access_token: !!accessToken,
        auth_status: !!authStatus,
        session_token: !!sessionToken,
        all_cookies: allCookies.map(c => ({ name: c.name, value: c.value ? 'EXISTS' : 'MISSING' }))
      }
    })
    
  } catch (error) {
    console.error('Debug cookies error:', error)
    return NextResponse.json(
      { error: 'Debug failed', message: 'Could not read cookies' },
      { status: 500 }
    )
  }
}
