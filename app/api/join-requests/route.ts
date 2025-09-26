import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/join-requests - Get user's join requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's join requests with group details
    const { data: requests, error } = await supabase
      .from('group_join_requests')
      .select(`
        *,
        group:groups(
          id, name, description, avatar_url, is_private, creator_id,
          creator:profiles!groups_creator_id_fkey(username, full_name, avatar_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user join requests:', error)
      return NextResponse.json({ error: "Failed to fetch join requests" }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in GET /api/join-requests:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
