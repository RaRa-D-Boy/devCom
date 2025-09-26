import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { friend_id, action } = body

    if (!friend_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'send_request') {
      console.log('Sending friend request from:', user.id, 'to:', friend_id);
      
      // Check if friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)
        .single()

      console.log('Existing friendship check:', { existingFriendship, checkError });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing friendship:', checkError);
        return NextResponse.json({ error: 'Error checking existing friendship' }, { status: 500 })
      }

      if (existingFriendship) {
        console.log('Friendship already exists:', existingFriendship);
        return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 })
      }

      // Create friend request
      const { data: friendship, error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friend_id,
          status: 'pending'
        })
        .select()
        .single()

      console.log('Friend request insert result:', { friendship, insertError });

      if (insertError) {
        console.error('Error inserting friend request:', insertError);
        return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
      }

      console.log('Friend request sent successfully:', friendship);
      return NextResponse.json({ 
        success: true, 
        message: 'Friend request sent successfully',
        friendship 
      })

    } else if (action === 'accept_request') {
      // Accept friend request
      const { data: friendship, error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('user_id', friend_id)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: 'Failed to accept friend request' }, { status: 500 })
      }

      if (!friendship) {
        return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Friend request accepted successfully',
        friendship 
      })

    } else if (action === 'reject_request') {
      // Reject friend request (delete it)
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', friend_id)
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to reject friend request' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Friend request rejected successfully'
      })

    } else if (action === 'remove_friend') {
      // Remove friend (delete friendship)
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Friend removed successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in friends API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'friends') {
      // Get user's friends
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles!friendships_friend_id_fkey(*),
          user:profiles!friendships_user_id_fkey(*)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendsError) {
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
      }

      // Transform the data to get friend profiles
      const friends = friendships?.map(friendship => {
        if (friendship.user_id === user.id) {
          return friendship.friend
        } else {
          return friendship.user
        }
      }).filter(Boolean) || []

      return NextResponse.json({ friends })

    } else     if (type === 'requests') {
      // Get pending friend requests
      console.log('Fetching friend requests for user:', user.id);
      
      const { data: requests, error: requestsError } = await supabase
        .from('friendships')
        .select(`
          *,
          user:profiles!friendships_user_id_fkey(*)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      console.log('Friend requests query result:', { requests, requestsError });

      if (requestsError) {
        console.error('Error fetching friend requests:', requestsError);
        return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 })
      }

      return NextResponse.json({ requests: requests || [] })

    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in friends API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}