import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

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

    // Create Supabase client
    const supabase = createAdminSupabaseClient()
    console.log('Supabase client created')

    // Insert submission into database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        company: company,
        job_title: jobTitle || null,
        company_size: companySize || null,
        industry: industry || null,
        interests: Array.isArray(interests) ? interests : [interests],
        message: message || null,
        newsletter_subscription: newsletter === 'yes',
        status: 'new'
      })
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save submission', details: error.message },
        { status: 500 }
      )
    }

    console.log('Submission saved to database:', data)

    // Return success response
    const response = {
      success: true, 
      message: 'Thank you for your submission! We\'ll be in touch soon.',
      submission_id: data[0]?.id
    }
    
    console.log('Returning success response:', response)
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Contact API error:', error)
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    const errorName = error instanceof Error ? error.name : 'Unknown error type'
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    })
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
