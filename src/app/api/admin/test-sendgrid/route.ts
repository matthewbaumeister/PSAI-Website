import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    // Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Test SendGrid configuration
    const configTest = {
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
      hasFromName: !!process.env.SENDGRID_FROM_NAME,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not configured',
      fromName: process.env.SENDGRID_FROM_NAME || 'Not configured',
      apiKeyLength: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0
    };
    
    return NextResponse.json({
      success: true,
      config: configTest,
      timestamp: new Date().toISOString(),
      adminUser: user.email
    });
    
  } catch (error) {
    console.error('SendGrid config test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { action, testEmail } = await request.json();
    
    if (action === 'send_test_email') {
      if (!testEmail) {
        return NextResponse.json({
          success: false,
          error: 'Test email address is required'
        });
      }
      
      // Check SendGrid configuration
      if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        return NextResponse.json({
          success: false,
          error: 'SendGrid not properly configured. Missing API key or from email.'
        });
      }
      
      // Send test email
      const msg = {
        to: testEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'Prop Shop AI'
        },
        subject: 'Prop Shop AI - SendGrid Test Email',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SendGrid Test Email</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Prop Shop AI</h1>
                <p>SendGrid Test Email</p>
              </div>
              <div class="content">
                <div class="success">
                  <h3>✅ SendGrid is Working!</h3>
                  <p>This is a test email to verify that SendGrid email delivery is functioning correctly.</p>
                </div>
                
                <h2>Test Details:</h2>
                <ul>
                  <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>From:</strong> ${process.env.SENDGRID_FROM_EMAIL}</li>
                  <li><strong>To:</strong> ${testEmail}</li>
                  <li><strong>Tested by:</strong> ${user.email}</li>
                </ul>
                
                <p>If you received this email, SendGrid is properly configured and working!</p>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Check that verification emails are being sent during user signup</li>
                  <li>Verify that password reset emails work</li>
                  <li>Test admin invitation emails</li>
                </ul>
              </div>
              <div class="footer">
                <p>&copy; 2025 Prop Shop AI. All rights reserved.</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">
                  This is a test email sent from the admin panel.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Prop Shop AI - SendGrid Test Email
          
          ✅ SendGrid is Working!
          
          This is a test email to verify that SendGrid email delivery is functioning correctly.
          
          Test Details:
          - Sent at: ${new Date().toLocaleString()}
          - From: ${process.env.SENDGRID_FROM_EMAIL}
          - To: ${testEmail}
          - Tested by: ${user.email}
          
          If you received this email, SendGrid is properly configured and working!
          
          Next Steps:
          - Check that verification emails are being sent during user signup
          - Verify that password reset emails work
          - Test admin invitation emails
          
          © 2025 Prop Shop AI. All rights reserved.
        `
      };
      
      try {
        const result = await sgMail.send(msg);
        console.log('SendGrid send result:', result);
        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
          timestamp: new Date().toISOString(),
          sendGridResponse: result
        });
      } catch (sendError: any) {
        console.error('SendGrid send error:', sendError);
        
        // Extract more detailed error information
        let errorMessage = 'Failed to send test email';
        let errorDetails = 'Unknown error';
        let sendGridError = null;
        
        if (sendError instanceof Error) {
          errorMessage = sendError.message;
          errorDetails = sendError.stack || 'No stack trace available';
        }
        
        // Try to extract SendGrid specific error details
        if (sendError.response) {
          sendGridError = {
            status: sendError.response.status,
            statusText: sendError.response.statusText,
            body: sendError.response.body
          };
          
          // Parse SendGrid error response
          if (sendError.response.body && typeof sendError.response.body === 'object') {
            if (sendError.response.body.errors && sendError.response.body.errors.length > 0) {
              const sgError = sendError.response.body.errors[0];
              errorMessage = `SendGrid Error: ${sgError.message}`;
              if (sgError.field) {
                errorMessage += ` (Field: ${sgError.field})`;
              }
              if (sgError.help) {
                errorMessage += ` - ${sgError.help}`;
              }
            }
          }
        }
        
        // Check for common SendGrid errors
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'SendGrid API key is invalid or expired';
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          errorMessage = 'SendGrid API key lacks permission to send emails';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'Invalid email address or SendGrid configuration';
        }
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          details: errorDetails,
          sendGridError: sendGridError,
          config: {
            hasApiKey: !!process.env.SENDGRID_API_KEY,
            fromEmail: process.env.SENDGRID_FROM_EMAIL,
            fromName: process.env.SENDGRID_FROM_NAME,
            apiKeyLength: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0,
            apiKeyPrefix: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...' : 'Not set'
          }
        });
      }
    }
    
    if (action === 'resend_verification') {
      const { userEmail } = await request.json();
      
      if (!userEmail) {
        return NextResponse.json({
          success: false,
          error: 'User email is required'
        });
      }
      
      // Import the email function and auth functions
      const { sendVerificationEmail } = await import('@/lib/email');
      const { getUserByEmail } = await import('@/lib/auth');
      const { createAdminSupabaseClient } = await import('@/lib/supabase');
      
      // Get user data
      const user = await getUserByEmail(userEmail);
      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Update verification record
      const supabase = createAdminSupabaseClient();
      const { error: verificationError } = await supabase
        .from('email_verifications')
        .upsert({
          user_id: user.id,
          email: user.email,
          verification_token: verificationToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });
      
      if (verificationError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create verification record',
          details: verificationError.message
        });
      }
      
      // Send verification email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://prop-shop.ai'}/auth/verify-email?token=${verificationToken}`;
      
      const emailSent = await sendVerificationEmail({
        email: user.email,
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        verificationToken,
        verificationUrl
      });
      
      if (emailSent) {
        return NextResponse.json({
          success: true,
          message: `Verification email resent successfully to ${userEmail}`,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to send verification email'
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    });
    
  } catch (error) {
    console.error('SendGrid test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
