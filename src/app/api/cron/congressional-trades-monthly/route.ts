import { NextRequest, NextResponse } from 'next/server';

/**
 * Congressional Trades Monthly Cron Job
 * Runs on 15th of every month at 2 PM
 * 
 * This is a lightweight trigger - actual scraping happens via GitHub Actions
 * because the process takes 10-20 minutes (too long for Vercel)
 */
export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    console.log(`[Congressional Trades] Monthly cron triggered on ${new Date().toISOString()}`);
    console.log(`[Congressional Trades] Years to scrape: ${prevYear} - ${currentYear}`);

    // Option 1: Trigger GitHub Action via repository_dispatch
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      const githubResponse = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'congressional-trades-monthly',
            client_payload: {
              start_year: prevYear,
              end_year: currentYear,
              triggered_at: new Date().toISOString()
            }
          })
        }
      );

      if (githubResponse.ok) {
        console.log('[Congressional Trades] GitHub Action triggered successfully');
        
        return NextResponse.json({
          success: true,
          message: 'Congressional trades scraper triggered via GitHub Actions',
          years: `${prevYear}-${currentYear}`,
          triggered_at: new Date().toISOString()
        });
      } else {
        console.error('[Congressional Trades] GitHub Action trigger failed:', await githubResponse.text());
      }
    }

    // Option 2: Log for manual review (fallback)
    console.log('[Congressional Trades] No GitHub integration configured - manual run required');
    console.log(`[Congressional Trades] Run: npm run scrape:congress-trades:monthly`);

    // Send notification email (if configured)
    if (process.env.NOTIFICATION_EMAIL) {
      // TODO: Add email notification via your email service
      // Example: SendGrid, AWS SES, etc.
      console.log(`[Congressional Trades] Email notification would be sent to: ${process.env.NOTIFICATION_EMAIL}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Congressional trades monthly check completed',
      action_required: 'Manual scraper run or GitHub Action setup needed',
      command: 'npm run scrape:congress-trades:monthly',
      years: `${prevYear}-${currentYear}`,
      triggered_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Congressional Trades] Cron error:', error);
    
    return NextResponse.json(
      { 
        error: 'Cron job failed', 
        message: error.message,
        triggered_at: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

