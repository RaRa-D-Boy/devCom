import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    groupId: string
  }
}

// GET /api/groups/[groupId]/join-requests - Get pending join requests for a group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params

    // Check if user has permission to view join requests
    const { data: membership } = await supabase
      .from('group_members')
      .select('role, can_add_members')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || (!['creator', 'admin'].includes(membership.role) && !membership.can_add_members)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get pending join requests
    const { data: requests, error } = await supabase
      .from('pending_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching join requests:', error)
      return NextResponse.json({ error: "Failed to fetch join requests" }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]/join-requests:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/groups/[groupId]/join-requests - Request to join a group
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params
    const body = await request.json()
    const { message } = body

    // Request to join group using the function
    const { data: requestId, error } = await supabase.rpc('request_to_join_group', {
      p_group_id: groupId,
      p_message: message || null,
      p_user_id: user.id
    })

    if (error) {
      console.error('Error requesting to join group:', error)
      return NextResponse.json({ error: error.message || "Failed to request to join group" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Join request submitted successfully", 
      request_id: requestId 
    })
  } catch (error) {
    console.error('Error in POST /api/groups/[groupId]/join-requests:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
