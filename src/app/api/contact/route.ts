import { NextRequest, NextResponse } from 'next/server'

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
    // We'll implement Supabase integration once the connection is properly configured
    console.log('New contact submission received:', {
      name: `${firstName} ${lastName}`,
      email,
      company,
      interests,
      message: message || 'No message provided',
      newsletter: newsletter === 'yes' ? 'Yes' : 'No',
      timestamp: new Date().toISOString()
    })

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your submission! We\'ll be in touch soon.',
        note: 'Your submission has been received and logged. We\'ll contact you shortly.',
        submission_data: {
          name: `${firstName} ${lastName}`,
          email,
          company,
          interests: Array.isArray(interests) ? interests : [interests]
        }
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
