import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';

/**
 * Trigger GitHub Actions workflows from admin UI
 * 
 * POST /api/admin/scrapers/trigger
 * Body: { scraper: 'fpds' | 'congress' | 'sam-gov' | ... }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check if user is admin
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { scraper } = body;

    if (!scraper) {
      return NextResponse.json({ error: 'Missing scraper name' }, { status: 400 });
    }

    // Map scraper names to GitHub Actions workflow dispatch types
    const workflowMap: Record<string, string> = {
      'fpds': 'fpds-daily',
      'congress': 'congress-daily',
      'sam-gov': 'sam-gov-daily',
      'dod-news': 'dod-news-daily',
      'sbir': 'sbir-daily',
      'army-innovation': 'army-innovation-daily',
      'mantech': 'mantech-daily',
      'congress-trades': 'congressional-trades-monthly', // Does BOTH House + Senate
      'gsa-schedules': 'gsa-schedules-monthly',
      'company-enrichment': 'company-enrichment-monthly',
      'gsa-pricing': 'gsa-pricing-monthly'
    };

    const eventType = workflowMap[scraper];
    if (!eventType) {
      return NextResponse.json({ error: 'Invalid scraper name' }, { status: 400 });
    }

    // Trigger GitHub Actions workflow via repository_dispatch
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'matthewbaumeister';
    const repoName = process.env.GITHUB_REPO_NAME || 'PropShop_AI_Website';

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Cannot trigger workflow.' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          client_payload: {
            triggered_by: 'admin_ui',
            user_email: user.email,
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return NextResponse.json(
        { error: `Failed to trigger workflow: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully triggered ${scraper} scraper`,
      workflow: eventType
    });

  } catch (error: any) {
    console.error('Error triggering scraper:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger scraper' },
      { status: 500 }
    );
  }
}

