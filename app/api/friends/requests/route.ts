import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pending friend requests received by the user
    const { data: requests, error: requestsError } = await supabase
      .from("friendships")
      .select(`
        *,
        requester:profiles!friendships_user_id_fkey(*)
      `)
      .eq("friend_id", user.id)
      .eq("status", "pending")

    if (requestsError) {
      return NextResponse.json({ error: "Failed to fetch friend requests" }, { status: 500 })
    }

    const friendRequests = (requests || []).map(request => ({
      id: request.requester.id,
      username: request.requester.username,
      full_name: request.requester.full_name,
      avatar_url: request.requester.avatar_url,
      friendship_id: request.id,
      created_at: request.created_at
    }))

    return NextResponse.json({ requests: friendRequests })
  } catch (error) {
    console.error("Error fetching friend requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
