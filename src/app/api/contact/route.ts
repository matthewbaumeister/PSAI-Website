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

    // Create Supabase client
    const supabase = createAdminSupabaseClient()

    // Insert contact submission into database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          company: company,
          job_title: jobTitle || null,
          company_size: companySize || null,
          industry: industry || null,
          interests: Array.isArray(interests) ? interests : [interests],
          message: message || null,
          newsletter_subscription: newsletter === 'yes',
          status: 'new',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save contact submission' },
        { status: 500 }
      )
    }

    // Log the successful submission
    console.log('New contact submission saved to database:', {
      id: data[0].id,
      name: `${firstName} ${lastName}`,
      email,
      company,
      interests
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your submission! We\'ll be in touch soon.',
        submission_id: data[0].id
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
