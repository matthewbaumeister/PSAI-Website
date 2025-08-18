import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { UserSettings } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user settings from the database
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        // No settings found, create default ones
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            theme: 'light',
            language: 'en',
            timezone: 'UTC'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default settings:', createError)
          return NextResponse.json(
            { success: false, error: 'Failed to create default settings' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: newSettings
        })
      } else {
        console.error('Error fetching settings:', settingsError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch settings' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error in GET /api/settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the request body
    const body: Partial<UserSettings> = await request.json()
    
    // Update user settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_settings')
      .update(body)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating settings:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          user_id: user.id,
          action: 'settings_updated',
          entity_type: 'user_settings',
          entity_id: user.id,
          details: { updated_fields: Object.keys(body) }
        }
      ])

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
