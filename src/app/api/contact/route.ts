import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      companySize,
      industry,
      interests,
      message,
      newsletter
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !company || !interests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For now, just log the submission and return success
    // TODO: Implement Supabase storage once table is created
    console.log('New contact submission:', {
      name: `${firstName} ${lastName}`,
      email,
      company,
      interests,
      message,
      newsletter
    })

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your submission! We\'ll be in touch soon.',
        note: 'Your submission has been received and logged. Database storage will be enabled soon.'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
