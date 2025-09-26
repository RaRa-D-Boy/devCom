import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/friends/accept - Accept a friend request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requester_id } = body

    if (!requester_id) {
      return NextResponse.json({ error: 'Requester ID is required' }, { status: 400 })
    }

    // Use the SQL function to accept the friend request
    const { data: result, error } = await supabase.rpc('accept_friend_request', {
      p_requester_id: requester_id,
      p_accepter_id: user.id
    })

    if (error) {
      console.error('Error accepting friend request:', error)
      return NextResponse.json({ error: 'Failed to accept friend request' }, { status: 500 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      friendship: result.friendship
    })

  } catch (error) {
    console.error('Error in accept friend request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
