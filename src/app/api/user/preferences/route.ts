import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult as NextResponse
    }

    const { user } = authResult

    const supabase = createAdminSupabaseClient()
    
    // Get user preferences from database
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ message: 'Failed to fetch preferences' }, { status: 500 })
    }

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        marketingEmails: true,
        newsletter: false,
        productUpdates: true,
        securityAlerts: true
      })
    }

    return NextResponse.json(preferences.preferences)
  } catch (error) {
    console.error('Error in preferences GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult as NextResponse
    }

    const { user } = authResult
    const preferences = await request.json()

    // Validate preferences
    const validPreferences = {
      marketingEmails: Boolean(preferences.marketingEmails),
      newsletter: Boolean(preferences.newsletter),
      productUpdates: Boolean(preferences.productUpdates),
      securityAlerts: Boolean(preferences.securityAlerts)
    }

    const supabase = createAdminSupabaseClient()
    
    // Upsert preferences (insert or update)
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences: validPreferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving preferences:', error)
      return NextResponse.json({ message: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Preferences saved successfully' })
  } catch (error) {
    console.error('Error in preferences POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
