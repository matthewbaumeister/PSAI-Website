import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    
    // Check if authResult is a NextResponse (error) or user object
    if ('status' in authResult) {
      return authResult // Return the error response
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Missing invitation ID', message: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()
    
    // Delete the invitation
    const { error } = await supabase
      .from('admin_invitations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invitation:', error)
      return NextResponse.json(
        { error: 'Failed to delete invitation', message: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully'
    })

  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
