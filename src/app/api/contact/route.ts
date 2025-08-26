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
        from: {
          email: 'hello@prop-shop.ai',
          name: 'Prop Shop AI'
        },
        replyTo: 'sales@prop-shop.ai',
        subject: 'Thank you for contacting Prop Shop AI!',
        text: `Hi ${firstName},

Thank you for reaching out to Prop Shop AI! We've received your contact request and are excited to help you with your procurement needs.

Our team will review your submission and get back to you within 24 hours.

Your Submission Details:
- Name: ${firstName} ${lastName}
- Company: ${company}
- Interests: ${Array.isArray(interests) ? interests.join(', ') : interests}
${message ? `- Message: ${message}` : ''}

In the meantime, you can explore our platform at https://prop-shop.ai to learn more about how Prop Shop AI can level the playing field for your procurement success.

If you have any immediate questions, feel free to reach out to us at sales@prop-shop.ai

Best regards,
The Prop Shop AI Team

© 2025 Make Ready Consulting, dba. Prop Shop AI. All rights reserved.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank you for contacting Prop Shop AI!</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0B1220 0%, #2D5BFF 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Prop Shop AI</h1>
                <p style="color: #9AF23A; margin: 10px 0 0 0; font-size: 16px;">Procurement Intelligence Platform</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px;">
                <h2 style="color: #0B1220; margin-top: 0; font-size: 24px;">Thank you for reaching out!</h2>
                
                <p style="color: #333; line-height: 1.6; font-size: 16px;">
                  Hi ${firstName},
                </p>
                
                <p style="color: #333; line-height: 1.6; font-size: 16px;">
                  We've received your contact request and are excited to help you with your procurement needs. 
                  Our team will review your submission and get back to you within 24 hours.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2D5BFF;">
                  <h3 style="color: #0B1220; margin-top: 0; font-size: 18px;">Your Submission Details:</h3>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Company:</strong> ${company}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Interests:</strong> ${Array.isArray(interests) ? interests.join(', ') : interests}</p>
                  ${message ? `<p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Message:</strong> ${message}</p>` : ''}
                </div>
                
                <p style="color: #333; line-height: 1.6; font-size: 16px;">
                  In the meantime, you can explore our platform and learn more about how Prop Shop AI 
                  can level the playing field for your procurement success.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://prop-shop.ai" style="background: linear-gradient(135deg, #2D5BFF 0%, #9AF23A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Visit Our Website
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                  If you have any immediate questions, feel free to reach out to us at 
                  <a href="mailto:sales@prop-shop.ai" style="color: #2D5BFF; text-decoration: none;">sales@prop-shop.ai</a>
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  Best regards,<br>
                  <strong>The Prop Shop AI Team</strong>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #0B1220; padding: 20px; text-align: center;">
                <p style="color: #666; margin: 0; font-size: 12px;">
                  © 2025 Make Ready Consulting, dba. Prop Shop AI. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      }

      await sgMail.send(userEmail)
      console.log('Confirmation email sent to user:', email)

      // Send notification email to your team
      const teamEmail = {
        to: 'sales@prop-shop.ai',
        from: {
          email: 'hello@prop-shop.ai',
          name: 'Prop Shop AI Contact Form'
        },
        replyTo: email, // Allow team to reply directly to the contact
        subject: `New Contact Form Submission: ${firstName} ${lastName} from ${company}`,
        text: `New Contact Form Submission

Contact Details:
- Name: ${firstName} ${lastName}
- Email: ${email}
- Company: ${company}
- Phone: ${phone || 'Not provided'}
- Job Title: ${jobTitle || 'Not provided'}
- Company Size: ${companySize || 'Not provided'}
- Industry: ${industry || 'Not provided'}
- Interests: ${Array.isArray(interests) ? interests.join(', ') : interests}
- Newsletter: ${newsletter === 'yes' ? 'Yes' : 'No'}
${message ? `- Message: ${message}` : ''}

Submission ID: ${data[0]?.id}
Timestamp: ${new Date().toLocaleString()}

View in Supabase: https://supabase.com/dashboard/project/reprsoqodhmpdoiajhst/editor/contact_submissions

Reply directly to this email to respond to ${firstName}.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: #2D5BFF; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2D5BFF;">
                  <h3 style="color: #0B1220; margin-top: 0; font-size: 18px;">Contact Details:</h3>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2D5BFF;">${email}</a></p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Company:</strong> ${company}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Job Title:</strong> ${jobTitle || 'Not provided'}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Company Size:</strong> ${companySize || 'Not provided'}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Industry:</strong> ${industry || 'Not provided'}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Interests:</strong> ${Array.isArray(interests) ? interests.join(', ') : interests}</p>
                  <p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Newsletter:</strong> ${newsletter === 'yes' ? 'Yes' : 'No'}</p>
                  ${message ? `<p style="color: #333; margin: 8px 0; font-size: 14px;"><strong>Message:</strong> ${message}</p>` : ''}
                </div>
                
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2D5BFF;">
                  <p style="color: #0B1220; margin: 8px 0; font-size: 14px;"><strong>Submission ID:</strong> ${data[0]?.id}</p>
                  <p style="color: #0B1220; margin: 8px 0; font-size: 14px;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://supabase.com/dashboard/project/reprsoqodhmpdoiajhst/editor/contact_submissions" style="background: #2D5BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px;">
                    View in Supabase
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  <strong>Note:</strong> You can reply directly to this email to respond to ${firstName}.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #0B1220; padding: 20px; text-align: center;">
                <p style="color: #666; margin: 0; font-size: 12px;">
                  © 2025 Make Ready Consulting, dba. Prop Shop AI. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
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
