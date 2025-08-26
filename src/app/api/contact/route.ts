import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('Contact API route called - starting processing')
  
  try {
    console.log('Attempting to parse request body')
    const body = await request.json()
    console.log('Request body parsed successfully:', body)
    
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

    console.log('Extracted form data:', { firstName, lastName, email, company, interests })

    // Validate required fields
    if (!firstName || !lastName || !email || !company || !interests) {
      console.log('Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Validation passed - processing submission')

    // For now, just log the submission and return success
    // We'll implement Supabase integration once the connection is properly configured
    const submissionData = {
      name: `${firstName} ${lastName}`,
      email,
      company,
      interests,
      message: message || 'No message provided',
      newsletter: newsletter === 'yes' ? 'Yes' : 'No',
      timestamp: new Date().toISOString()
    }
    
    console.log('New contact submission received:', submissionData)

    // Return success response
    const response = {
      success: true, 
      message: 'Thank you for your submission! We\'ll be in touch soon.',
      note: 'Your submission has been received and logged. We\'ll contact you shortly.',
      submission_data: {
        name: `${firstName} ${lastName}`,
        email,
        company,
        interests: Array.isArray(interests) ? interests : [interests]
      }
    }
    
    console.log('Returning success response:', response)
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Contact API error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
