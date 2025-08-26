import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

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

    // Send email confirmation to the user
    try {
      const userEmail = {
        to: email,
        from: 'hello@prop-shop.ai',
        subject: 'Thank you for contacting Prop Shop AI!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0B1220 0%, #2D5BFF 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Prop Shop AI</h1>
              <p style="color: #9AF23A; margin: 10px 0 0 0; font-size: 16px;">Procurement Intelligence Platform</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <h2 style="color: #0B1220; margin-top: 0;">Thank you for reaching out!</h2>
              
              <p style="color: #333; line-height: 1.6;">
                Hi ${firstName},
              </p>
              
              <p style="color: #333; line-height: 1.6;">
                We've received your contact request and are excited to help you with your procurement needs. 
                Our team will review your submission and get back to you within 24 hours.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0B1220; margin-top: 0;">Your Submission Details:</h3>
                <p style="color: #333; margin: 5px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p style="color: #333; margin: 5px 0;"><strong>Company:</strong> ${company}</p>
                <p style="color: #333; margin: 5px 0;"><strong>Interests:</strong> ${Array.isArray(interests) ? interests.join(', ') : interests}</p>
                ${message ? `<p style="color: #333; margin: 5px 0;"><strong>Message:</strong> ${message}</p>` : ''}
              </div>
              
              <p style="color: #333; line-height: 1.6;">
                In the meantime, you can explore our platform and learn more about how Prop Shop AI 
                can level the playing field for your procurement success.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://prop-shop.ai" style="background: linear-gradient(135deg, #2D5BFF 0%, #9AF23A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Visit Our Website
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any immediate questions, feel free to reach out to us at 
                <a href="mailto:sales@prop-shop.ai" style="color: #2D5BFF;">sales@prop-shop.ai</a>
              </p>
            </div>
            
            <div style="background: #0B1220; padding: 20px; text-align: center;">
              <p style="color: #666; margin: 0; font-size: 12px;">
                © 2025 Make Ready Consulting, dba. Prop Shop AI. All rights reserved.
              </p>
            </div>
          </div>
        `
      }

      await sgMail.send(userEmail)
      console.log('Confirmation email sent to user:', email)

      // Send notification email to your team
      const teamEmail = {
        to: 'sales@prop-shop.ai',
        from: 'hello@prop-shop.ai',
        subject: `New Contact Form Submission: ${firstName} ${lastName} from ${company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0B1220;">New Contact Form Submission</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0B1220; margin-top: 0;">Contact Details:</h3>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Job Title:</strong> ${jobTitle || 'Not provided'}</p>
              <p><strong>Company Size:</strong> ${companySize || 'Not provided'}</p>
              <p><strong>Industry:</strong> ${industry || 'Not provided'}</p>
              <p><strong>Interests:</strong> ${Array.isArray(interests) ? interests.join(', ') : interests}</p>
              <p><strong>Newsletter:</strong> ${newsletter === 'yes' ? 'Yes' : 'No'}</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            
            <p><strong>Submission ID:</strong> ${data[0]?.id}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://supabase.com/dashboard/project/reprsoqodhmpdoiajhst/editor/contact_submissions" style="background: #2D5BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View in Supabase
              </a>
            </div>
          </div>
        `
      }

      await sgMail.send(teamEmail)
      console.log('Notification email sent to team')

    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the whole request if email fails
      // The form submission was successful, just the email failed
    }

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
