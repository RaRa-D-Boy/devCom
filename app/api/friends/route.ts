import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "accepted"

    // Get friends based on status
    let query = supabase
      .from("friendships")
      .select(`
        *,
        friend:profiles!friendships_friend_id_fkey(*)
      `)
      .eq("user_id", user.id)

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: friendships, error: friendshipsError } = await query

    if (friendshipsError) {
      return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
    }

    const friends = (friendships || []).map(friendship => ({
      id: friendship.friend.id,
      username: friendship.friend.username,
      full_name: friendship.friend.full_name,
      avatar_url: friendship.friend.avatar_url,
      status: friendship.status,
      created_at: friendship.created_at
    }))

    return NextResponse.json({ friends })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { friend_id } = await request.json()

    if (!friend_id) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 })
    }

    if (friend_id === user.id) {
      return NextResponse.json({ error: "Cannot add yourself as a friend" }, { status: 400 })
    }

    // Check if friend exists
    const { data: friend, error: friendError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", friend_id)
      .single()

    if (friendError || !friend) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from("friendships")
      .select("id, status")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)
      .single()

    if (existingFriendship) {
      return NextResponse.json({ 
        error: "Friendship already exists",
        status: existingFriendship.status
      }, { status: 400 })
    }

    // Create friendship request
    const { data: friendship, error: friendshipError } = await supabase
      .from("friendships")
      .insert({
        user_id: user.id,
        friend_id: friend_id,
        status: "pending"
      })
      .select(`
        *,
        friend:profiles!friendships_friend_id_fkey(*)
      `)
      .single()

    if (friendshipError) {
      return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
    }

    return NextResponse.json({
      id: friendship.friend.id,
      username: friendship.friend.username,
      full_name: friendship.friend.full_name,
      avatar_url: friendship.friend.avatar_url,
      status: friendship.status,
      created_at: friendship.created_at
    }, { status: 201 })
  } catch (error) {
    console.error("Error sending friend request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
