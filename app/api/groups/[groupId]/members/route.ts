import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    groupId: string
  }
}

// GET /api/groups/[groupId]/members - Get group members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all group members with their profile information
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:profiles!group_members_user_id_fkey(
          id, username, full_name, display_name, avatar_url, status, role, company, location
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching group members:', error)
      return NextResponse.json({ error: "Failed to fetch group members" }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]/members:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/groups/[groupId]/members - Add a friend to the group
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params
    const body = await request.json()
    const { friend_id } = body

    if (!friend_id) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 })
    }

    // Add friend to group using the function
    const { error } = await supabase.rpc('add_friend_to_group', {
      p_group_id: groupId,
      p_friend_id: friend_id,
      p_added_by: user.id
    })

    if (error) {
      console.error('Error adding friend to group:', error)
      return NextResponse.json({ error: error.message || "Failed to add friend to group" }, { status: 500 })
    }

    return NextResponse.json({ message: "Friend added to group successfully" })
  } catch (error) {
    console.error('Error in POST /api/groups/[groupId]/members:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
