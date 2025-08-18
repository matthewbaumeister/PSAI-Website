import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ProfileUpdateForm } from '@/lib/types'

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

    // Get user profile from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error) {
    console.error('Error in GET /api/profile:', error)
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

    // Parse the request body
    const body: ProfileUpdateForm = await request.json()
    
    // Update user profile in the database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          user_id: user.id,
          action: 'profile_updated',
          entity_type: 'profile',
          entity_id: user.id,
          details: { updated_fields: Object.keys(body) }
        }
      ])

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
