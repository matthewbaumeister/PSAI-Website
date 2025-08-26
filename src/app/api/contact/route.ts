import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { firstName, lastName, email, phone, company, jobTitle, companySize, industry, interests, message, newsletterSubscription } = body
    
    if (!firstName || !lastName || !email || !company || !interests || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          company,
          job_title: jobTitle || null,
          company_size: companySize || null,
          industry: industry || null,
          interests,
          message: message || null,
          newsletter_subscription: newsletterSubscription || false,
        }
      ])
      .select()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }
    
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    
    const userEmail = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@prop-shop.ai',
        name: process.env.SENDGRID_FROM_NAME || 'Prop Shop AI'
      },
      replyTo: 'sales@prop-shop.ai',
      subject: 'Thank you for contacting Prop Shop AI',
      text: `Hi ${firstName},\n\nThank you for reaching out to Prop Shop AI. We've received your message and will get back to you within 24 hours.\n\nYour submission details:\n- Company: ${company}\n- Interests: ${interests.join(', ')}\n\nIf you have any urgent questions, please contact us directly at sales@prop-shop.ai.\n\nBest regards,\nThe Prop Shop AI Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Thank You!</h1>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Thank you for reaching out to <strong>Prop Shop AI</strong>. We've received your message and will get back to you within 24 hours.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ff6b35; margin-top: 0;">Your Submission Details:</h3>
              <p style="margin: 5px 0;"><strong>Company:</strong> ${company}</p>
              <p style="margin: 5px 0;"><strong>Interests:</strong> ${interests.join(', ')}</p>
              ${message ? `<p style="margin: 5px 0;"><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">If you have any urgent questions, please contact us directly at <a href="mailto:sales@prop-shop.ai" style="color: #ff6b35;">sales@prop-shop.ai</a>.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://prop-shop.ai" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visit Our Website</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">Best regards,<br>The Prop Shop AI Team</p>
          </div>
        </div>
      `
    }
    
    try {
      await sgMail.send(userEmail)
    } catch (emailError) {
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }
    
    const teamEmail = {
      to: 'sales@prop-shop.ai',
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@prop-shop.ai',
        name: process.env.SENDGRID_FROM_NAME || 'Prop Shop AI'
      },
      replyTo: email,
      subject: `New Contact Submission: ${firstName} ${lastName} from ${company}`,
      text: `New contact submission received:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nCompany: ${company}\nJob Title: ${jobTitle || 'Not specified'}\nCompany Size: ${companySize || 'Not specified'}\nIndustry: ${industry || 'Not specified'}\nInterests: ${interests.join(', ')}\nMessage: ${message || 'No message'}\nNewsletter Subscription: ${newsletterSubscription ? 'Yes' : 'No'}\n\nPlease follow up within 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Submission</h1>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${firstName} ${lastName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}" style="color: #ff6b35;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Company:</td>
                <td style="padding: 8px 0; color: #333;">${company}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Job Title:</td>
                <td style="padding: 8px 0; color: #333;">${jobTitle || 'Not specified'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Company Size:</td>
                <td style="padding: 8px 0; color: #333;">${companySize || 'Not specified'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Industry:</td>
                <td style="padding: 8px 0; color: #333;">${industry || 'Not specified'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Interests:</td>
                <td style="padding: 8px 0; color: #333;">${interests.join(', ')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Message:</td>
                <td style="padding: 8px 0; color: #333;">${message || 'No message'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Newsletter Subscription:</td>
                <td style="padding: 8px 0; color: #333;">${newsletterSubscription ? 'Yes' : 'No'}</td>
              </tr>
            </table>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${email}" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reply to Contact</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">Please follow up within 24 hours.</p>
          </div>
        </div>
      `
    }
    
    try {
      await sgMail.send(teamEmail)
    } catch (emailError) {
      return NextResponse.json(
        { error: 'Failed to send team notification' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Contact submission received successfully' },
      { status: 200 }
    )
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
