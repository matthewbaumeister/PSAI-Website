/**
 * Cron Job Email Notifications
 * 
 * Sends daily summary emails for automated scraping jobs
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface CronJobResult {
  jobName: string;
  success: boolean;
  date: string;
  stats?: {
    total?: number;
    inserted?: number;
    updated?: number;
    errors?: number;
    [key: string]: any;
  };
  error?: string;
  duration?: number;
}

/**
 * Send cron job success email
 */
export async function sendCronSuccessEmail(result: CronJobResult): Promise<void> {
  const toEmail = process.env.CRON_NOTIFICATION_EMAIL;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@propshop.ai';
  
  if (!toEmail) {
    console.log('No CRON_NOTIFICATION_EMAIL set, skipping email notification');
    return;
  }
  
  if (!process.env.SENDGRID_API_KEY) {
    console.log('No SENDGRID_API_KEY set, skipping email notification');
    return;
  }

  const { jobName, date, stats, duration } = result;
  
  // Generate stats summary
  let statsHtml = '';
  if (stats) {
    statsHtml = Object.entries(stats)
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<li><strong>${label}:</strong> ${value}</li>`;
      })
      .join('\n');
  }
  
  const durationText = duration ? `${Math.round(duration / 1000)}s` : 'N/A';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Cron Job Successful</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #667eea; margin-top: 0; font-size: 22px;">${jobName}</h2>
          <p style="font-size: 16px; color: #666; margin: 10px 0;">
            <strong>Date:</strong> ${date}<br>
            <strong>Duration:</strong> ${durationText}<br>
            <strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Success</span>
          </p>
        </div>
        
        ${statsHtml ? `
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <h3 style="color: #667eea; margin-top: 0; font-size: 18px;">Statistics</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${statsHtml}
          </ul>
        </div>
        ` : ''}
        
        <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
            <strong>Tip:</strong> Check your Supabase database to view the newly scraped data.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>PropShop AI - Automated Contract Data Scraping</p>
        <p>This is an automated notification from your Vercel cron jobs.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
${jobName} - Success

Date: ${date}
Duration: ${durationText}
Status: Success

${stats ? 'Statistics:\n' + Object.entries(stats).map(([k, v]) => `  ${k}: ${v}`).join('\n') : ''}

Check your Supabase database to view the newly scraped data.

---
PropShop AI - Automated Contract Data Scraping
This is an automated notification from your Vercel cron jobs.
  `.trim();

  try {
    await sgMail.send({
      to: toEmail,
      from: fromEmail,
      subject: `${jobName} Completed Successfully - ${date}`,
      text,
      html
    });
    
    console.log(`Success email sent to ${toEmail}`);
  } catch (error: any) {
    console.error('Failed to send success email:', error.message);
  }
}

/**
 * Send cron job failure email
 */
export async function sendCronFailureEmail(result: CronJobResult): Promise<void> {
  const toEmail = process.env.CRON_NOTIFICATION_EMAIL;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@propshop.ai';
  
  if (!toEmail) {
    console.log('No CRON_NOTIFICATION_EMAIL set, skipping email notification');
    return;
  }
  
  if (!process.env.SENDGRID_API_KEY) {
    console.log('No SENDGRID_API_KEY set, skipping email notification');
    return;
  }

  const { jobName, date, error, duration } = result;
  
  const durationText = duration ? `${Math.round(duration / 1000)}s` : 'N/A';
  const isRateLimit = error?.includes('429') || error?.includes('quota') || error?.includes('rate limit');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${isRateLimit ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Cron Job ${isRateLimit ? 'Rate Limited' : 'Failed'}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 22px;">${jobName}</h2>
          <p style="font-size: 16px; color: #666; margin: 10px 0;">
            <strong>Date:</strong> ${date}<br>
            <strong>Duration:</strong> ${durationText}<br>
            <strong>Status:</strong> <span style="color: ${isRateLimit ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${isRateLimit ? 'Rate Limited' : 'Failed'}</span>
          </p>
        </div>
        
        <div style="background: ${isRateLimit ? '#fef3c7' : '#fee2e2'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${isRateLimit ? '#f59e0b' : '#ef4444'};">
          <h3 style="color: ${isRateLimit ? '#92400e' : '#991b1b'}; margin-top: 0; font-size: 18px;">Error Details</h3>
          <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; color: #374151;">${error || 'Unknown error'}</pre>
        </div>
        
        ${isRateLimit ? `
        <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            <strong>Rate Limit Info:</strong><br>
            The SAM.gov API has a daily quota of ~1,000 requests. This quota resets at midnight UTC.<br>
            The cron job will automatically retry tomorrow. No action needed!
          </p>
        </div>
        ` : `
        <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            <strong>Action Required:</strong><br>
            This error requires investigation. Check your Vercel logs and Supabase database.
          </p>
        </div>
        `}
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>PropShop AI - Automated Contract Data Scraping</p>
        <p>This is an automated notification from your Vercel cron jobs.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
${jobName} - ${isRateLimit ? 'Rate Limited' : 'Failed'}

Date: ${date}
Duration: ${durationText}
Status: ${isRateLimit ? 'Rate Limited' : 'Failed'}

Error:
${error || 'Unknown error'}

${isRateLimit ? 
  'Rate Limit Info:\nThe SAM.gov API has a daily quota of ~1,000 requests. This quota resets at midnight UTC.\nThe cron job will automatically retry tomorrow. No action needed!' :
  'Action Required:\nThis error requires investigation. Check your Vercel logs and Supabase database.'
}

---
PropShop AI - Automated Contract Data Scraping
This is an automated notification from your Vercel cron jobs.
  `.trim();

  try {
    await sgMail.send({
      to: toEmail,
      from: fromEmail,
      subject: `${jobName} ${isRateLimit ? 'Rate Limited' : 'Failed'} - ${date}`,
      text,
      html
    });
    
    console.log(`Failure email sent to ${toEmail}`);
  } catch (error: any) {
    console.error('Failed to send failure email:', error.message);
  }
}

/**
 * Send daily digest email (summary of all 3 cron jobs)
 */
export async function sendDailyDigestEmail(results: CronJobResult[]): Promise<void> {
  const toEmail = process.env.CRON_NOTIFICATION_EMAIL;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@propshop.ai';
  
  if (!toEmail || !process.env.SENDGRID_API_KEY) {
    return;
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const totalJobs = results.length;
  
  const jobsHtml = results.map(result => {
    const color = result.success ? '#10b981' : '#ef4444';
    const statsText = result.stats ? 
      Object.entries(result.stats).map(([k, v]) => `${k}: ${v}`).join(', ') : 
      'N/A';
    
    return `
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${color};">
        <h3 style="margin: 0 0 10px 0; color: ${color}; font-size: 16px;">${result.jobName}</h3>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">
          <strong>Status:</strong> ${result.success ? 'Success' : 'Failed'}<br>
          ${result.stats ? `<strong>Stats:</strong> ${statsText}<br>` : ''}
          ${result.error ? `<strong>Error:</strong> ${result.error}` : ''}
        </p>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Daily Scraping Digest</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">${results[0]?.date || new Date().toISOString().split('T')[0]}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0 0 15px 0; color: #667eea;">Summary</h2>
          <div style="display: inline-block; text-align: left;">
            <p style="margin: 5px 0; font-size: 16px;">
              <strong>Total Jobs:</strong> ${totalJobs}<br>
              <strong style="color: #10b981;">Success:</strong> ${successCount}<br>
              <strong style="color: #ef4444;">Failed:</strong> ${failureCount}
            </p>
          </div>
        </div>
        
        <h3 style="color: #667eea; margin-bottom: 15px;">Job Details</h3>
        ${jobsHtml}
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>PropShop AI - Automated Contract Data Scraping</p>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      to: toEmail,
      from: fromEmail,
      subject: `Daily Scraping Digest - ${successCount}/${totalJobs} Successful`,
      html
    });
    
    console.log(`Daily digest email sent to ${toEmail}`);
  } catch (error: any) {
    console.error('Failed to send daily digest email:', error.message);
  }
}

