import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  fromName?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private static fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@propshopai.com'
  private static fromName = process.env.SENDGRID_FROM_NAME || 'Prop Shop AI'

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: emailData.from || this.fromEmail,
          name: emailData.fromName || this.fromName,
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html),
      }

      await sgMail.send(msg)
      console.log(`Email sent successfully to ${emailData.to}`)
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  static async sendBulkEmails(emails: EmailData[]): Promise<boolean[]> {
    try {
      const messages = emails.map(emailData => ({
        to: emailData.to,
        from: {
          email: emailData.from || this.fromEmail,
          name: emailData.fromName || this.fromName,
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html),
      }))

      await sgMail.sendMultiple(messages)
      console.log(`Bulk emails sent successfully to ${emails.length} recipients`)
      return emails.map(() => true)
    } catch (error) {
      console.error('Error sending bulk emails:', error)
      return emails.map(() => false)
    }
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }
}

// Email templates
export const EmailTemplates = {
  welcome: (userName: string): EmailTemplate => ({
    subject: 'Welcome to Prop Shop AI!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Prop Shop AI!</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for joining Prop Shop AI. We're excited to help you streamline your proposal process and win more business.</p>
        <p>Get started by exploring our features and creating your first proposal.</p>
        <p>Best regards,<br>The Prop Shop AI Team</p>
      </div>
    `,
  }),

  passwordReset: (resetLink: string): EmailTemplate => ({
    subject: 'Reset Your Password - Prop Shop AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Reset Your Password</h1>
        <p>You requested a password reset for your Prop Shop AI account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The Prop Shop AI Team</p>
      </div>
    `,
  }),

  demoRequest: (userName: string, companyName: string): EmailTemplate => ({
    subject: 'Demo Request Received - Prop Shop AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Demo Request Received</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for your interest in Prop Shop AI! We've received your demo request for ${companyName}.</p>
        <p>Our team will be in touch within 24 hours to schedule your personalized demo.</p>
        <p>In the meantime, feel free to explore our website and learn more about how we can help your business.</p>
        <p>Best regards,<br>The Prop Shop AI Team</p>
      </div>
    `,
  }),
}
