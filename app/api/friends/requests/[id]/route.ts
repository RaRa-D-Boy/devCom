import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const friendshipId = params.id
    const { action } = await request.json()

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action must be 'accept' or 'reject'" }, { status: 400 })
    }

    // Check if the friendship request exists and belongs to the user
    const { data: friendship, error: friendshipError } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", friendshipId)
      .eq("friend_id", user.id)
      .eq("status", "pending")
      .single()

    if (friendshipError || !friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    if (action === "accept") {
      // Accept the friend request
      const { error: acceptError } = await supabase
        .from("friendships")
        .update({ 
          status: "accepted",
          updated_at: new Date().toISOString()
        })
        .eq("id", friendshipId)

      if (acceptError) {
        return NextResponse.json({ error: "Failed to accept friend request" }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: "accepted" })
    } else {
      // Reject the friend request (delete it)
      const { error: rejectError } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId)

      if (rejectError) {
        return NextResponse.json({ error: "Failed to reject friend request" }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: "rejected" })
    }
  } catch (error) {
    console.error("Error handling friend request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
