import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { EmailService, EmailTemplates } from '@/lib/sendgrid'
import { DemoRequestForm } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body: DemoRequestForm = await request.json()
    
    const { name, email, company_name, phone, message } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create demo request in database
    const { data: demoRequest, error: dbError } = await supabase
      .from('demo_requests')
      .insert([
        {
          name,
          email,
          company_name,
          phone,
          message,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Failed to save demo request' },
        { status: 500 }
      )
    }

    // Send confirmation email to user
    const userEmailTemplate = EmailTemplates.demoRequest(name, company_name || 'your company')
    const userEmailSent = await EmailService.sendEmail({
      to: email,
      subject: userEmailTemplate.subject,
      html: userEmailTemplate.html,
    })

    if (!userEmailSent) {
      console.warn('Failed to send confirmation email to user:', email)
    }

    // Send notification email to admin team
    const adminEmailTemplate = {
      subject: 'New Demo Request - Prop Shop AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">New Demo Request</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${company_name ? `<p><strong>Company:</strong> ${company_name}</p>` : ''}
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p><strong>Request ID:</strong> ${demoRequest.id}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <br>
          <p>Please follow up with this prospect within 24 hours.</p>
        </div>
      `
    }

    const adminEmailSent = await EmailService.sendEmail({
      to: process.env.SENDGRID_FROM_EMAIL || 'noreply@propshopai.com',
      subject: adminEmailTemplate.subject,
      html: adminEmailTemplate.html,
    })

    if (!adminEmailSent) {
      console.warn('Failed to send admin notification email')
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          action: 'demo_request_submitted',
          entity_type: 'demo_request',
          entity_id: demoRequest.id,
          details: { name, email, company_name }
        }
      ])

    return NextResponse.json(
      { 
        success: true, 
        data: demoRequest, 
        message: 'Demo request submitted successfully. We\'ll be in touch within 24 hours!' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Demo request error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
