import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailVerificationData {
  email: string
  firstName: string
  lastName: string
  verificationToken: string
  verificationUrl: string
}

export interface PasswordResetData {
  email: string
  firstName: string
  lastName: string
  resetToken: string
  resetUrl: string
}

export interface WelcomeEmailData {
  email: string
  firstName: string
  lastName: string
  loginUrl: string
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid not configured')
      return false
    }

    const msg = {
      to: data.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Verify Your Prop Shop AI Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Prop Shop AI</h1>
              <p>Verify Your Email Address</p>
            </div>
            <div class="content">
              <h2>Hello ${data.firstName} ${data.lastName},</h2>
              <p>Thank you for creating your Prop Shop AI account! To get started, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${data.verificationUrl}</p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Prop Shop AI. All rights reserved.</p>
              <p>This email was sent to ${data.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Prop Shop AI Account
        
        Hello ${data.firstName} ${data.lastName},
        
        Thank you for creating your Prop Shop AI account! To get started, please verify your email address by visiting this link:
        
        ${data.verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, you can safely ignore this email.
        
        Best regards,
        The Prop Shop AI Team
      `
    }

    await sgMail.send(msg)
    console.log(`Verification email sent to ${data.email}`)
    return true

  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid not configured')
      return false
    }

    const msg = {
      to: data.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Reset Your Prop Shop AI Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Prop Shop AI</h1>
              <p>Reset Your Password</p>
            </div>
            <div class="content">
              <h2>Hello ${data.firstName} ${data.lastName},</h2>
              <p>We received a request to reset your Prop Shop AI account password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
              
              <p><strong>This link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Prop Shop AI. All rights reserved.</p>
              <p>This email was sent to ${data.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Prop Shop AI Password
        
        Hello ${data.firstName} ${data.lastName},
        
        We received a request to reset your Prop Shop AI account password. Visit this link to create a new password:
        
        ${data.resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        
        Best regards,
        The Prop Shop AI Team
      `
    }

    await sgMail.send(msg)
    console.log(`Password reset email sent to ${data.email}`)
    return true

  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid not configured')
      return false
    }

    const msg = {
      to: data.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Welcome to Prop Shop AI!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Prop Shop AI</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Prop Shop AI</h1>
              <p>Welcome to the Future of Procurement!</p>
            </div>
            <div class="content">
              <h2>Welcome ${data.firstName}!</h2>
              <p>Your Prop Shop AI account has been successfully verified and activated! 🎉</p>
              
              <p>You now have access to:</p>
              <ul>
                <li>Advanced procurement intelligence</li>
                <li>Market research tools</li>
                <li>Compliance monitoring</li>
                <li>And much more!</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Get Started</a>
              </div>
              
              <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Prop Shop AI. All rights reserved.</p>
              <p>This email was sent to ${data.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Prop Shop AI!
        
        Welcome ${data.firstName}!
        
        Your Prop Shop AI account has been successfully verified and activated! 🎉
        
        You now have access to:
        - Advanced procurement intelligence
        - Market research tools
        - Compliance monitoring
        - And much more!
        
        Get started: ${data.loginUrl}
        
        If you have any questions or need assistance, don't hesitate to reach out to our support team.
        
        Best regards,
        The Prop Shop AI Team
      `
    }

    await sgMail.send(msg)
    console.log(`Welcome email sent to ${data.email}`)
    return true

  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return false
  }
}
