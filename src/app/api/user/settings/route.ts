import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Get user settings
    const supabase = createAdminSupabaseClient()
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('setting_key, setting_value')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching user settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Convert settings array to object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value === 'true'
      return acc
    }, {} as Record<string, boolean>)

    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('Error in GET /api/user/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    const body = await request.json()
    const { newsletter_subscription, research_alerts } = body

    // Prepare settings to upsert
    const settingsToUpsert = [
      {
        user_id: user.id,
        setting_key: 'newsletter_subscription',
        setting_value: newsletter_subscription ? 'true' : 'false'
      },
      {
        user_id: user.id,
        setting_key: 'research_alerts',
        setting_value: research_alerts ? 'true' : 'false'
      }
    ]

    // Upsert settings (insert or update)
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
      .from('user_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'user_id,setting_key'
      })

    if (error) {
      console.error('Error saving user settings:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/user/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
