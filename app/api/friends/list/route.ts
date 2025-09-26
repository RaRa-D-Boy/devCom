import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/friends/list - Get user's friends list
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'friends' // 'friends', 'pending', 'sent', 'count'

    if (type === 'friends') {
      // Get user's friends using the SQL function
      const { data: friends, error } = await supabase.rpc('get_user_friends', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching friends:', error)
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
      }

      return NextResponse.json({ friends: friends || [] })

    } else if (type === 'pending') {
      // Get pending friend requests
      const { data: requests, error } = await supabase.rpc('get_pending_friend_requests', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching pending requests:', error)
        return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 })
      }

      return NextResponse.json({ requests: requests || [] })

    } else if (type === 'sent') {
      // Get sent friend requests
      const { data: requests, error } = await supabase.rpc('get_sent_friend_requests', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching sent requests:', error)
        return NextResponse.json({ error: 'Failed to fetch sent requests' }, { status: 500 })
      }

      return NextResponse.json({ requests: requests || [] })

    } else if (type === 'count') {
      // Get friend count and pending requests count
      const { data: friendCount, error: friendCountError } = await supabase.rpc('get_friend_count', {
        p_user_id: user.id
      })

      const { data: pendingCount, error: pendingCountError } = await supabase.rpc('get_pending_requests_count', {
        p_user_id: user.id
      })

      if (friendCountError || pendingCountError) {
        console.error('Error fetching counts:', { friendCountError, pendingCountError })
        return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 })
      }

      return NextResponse.json({
        friend_count: friendCount || 0,
        pending_requests_count: pendingCount || 0
      })

    } else if (type === 'for_groups') {
      // Get friends for group creation
      const { data: friends, error } = await supabase.rpc('get_friends_for_groups', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching friends for groups:', error)
        return NextResponse.json({ error: 'Failed to fetch friends for groups' }, { status: 500 })
      }

      return NextResponse.json({ friends: friends || [] })

    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in friends list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
