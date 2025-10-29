import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { requireAuth } from '@/lib/auth-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * POST /api/share/opportunity
 * Generate a temporary guest share link for an opportunity
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const body = await request.json();
    const { topic_id, topic_number } = body;

    if (!topic_id || !topic_number) {
      return NextResponse.json(
        { success: false, error: 'topic_id and topic_number are required' },
        { status: 400 }
      );
    }

    // Generate a secure random token (64 characters)
    const token = randomBytes(32).toString('hex');

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Insert the share token
    const { data: shareToken, error: insertError } = await supabase
      .from('opportunity_share_tokens')
      .insert({
        token,
        topic_id,
        topic_number,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        views_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating share token:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Generate the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prop-shop.ai';
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        token: shareToken.token,
        shareUrl,
        expiresAt: shareToken.expires_at,
        topicNumber: topic_number
      }
    });

  } catch (error) {
    console.error('Share opportunity error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share/opportunity?token=xxx
 * Validate and retrieve opportunity data using a share token
 * No authentication required (guest access)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Look up the share token
    const { data: shareToken, error: tokenError } = await supabase
      .from('opportunity_share_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !shareToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(shareToken.expires_at);
    
    if (expiresAt < now) {
      // Deactivate expired token
      await supabase
        .from('opportunity_share_tokens')
        .update({ is_active: false })
        .eq('token', token);

      return NextResponse.json(
        { success: false, error: 'Share link has expired' },
        { status: 410 }
      );
    }

    // Increment view count
    await supabase
      .from('opportunity_share_tokens')
      .update({
        views_count: (shareToken.views_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('token', token);

    // Fetch the opportunity data
    const { data: opportunity, error: oppError } = await supabase
      .from('sbir_final')
      .select('*')
      .eq('topic_id', shareToken.topic_id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        opportunity,
        shareInfo: {
          expiresAt: shareToken.expires_at,
          viewsCount: (shareToken.views_count || 0) + 1
        }
      }
    });

  } catch (error) {
    console.error('Get shared opportunity error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

