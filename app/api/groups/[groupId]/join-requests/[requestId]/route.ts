import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    groupId: string
    requestId: string
  }
}

// PUT /api/groups/[groupId]/join-requests/[requestId] - Approve or reject a join request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId, requestId } = params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 })
    }

    let result
    if (action === 'approve') {
      // Approve the request
      result = await supabase.rpc('approve_group_join_request', {
        p_request_id: requestId,
        p_approved_by: user.id
      })
    } else {
      // Reject the request
      result = await supabase.rpc('reject_group_join_request', {
        p_request_id: requestId,
        p_rejected_by: user.id
      })
    }

    if (result.error) {
      console.error(`Error ${action}ing join request:`, result.error)
      return NextResponse.json({ error: result.error.message || `Failed to ${action} join request` }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Join request ${action}d successfully` 
    })
  } catch (error) {
    console.error(`Error in PUT /api/groups/[groupId]/join-requests/[requestId]:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/groups/[groupId]/join-requests/[requestId] - Cancel a join request (by requester)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId, requestId } = params

    // Check if user is the requester
    const { data: request, error: fetchError } = await supabase
      .from('group_join_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .eq('group_id', groupId)
      .single()

    if (fetchError) {
      console.error('Error fetching join request:', fetchError)
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }

    if (request.user_id !== user.id) {
      return NextResponse.json({ error: "Only the requester can cancel their request" }, { status: 403 })
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: "Cannot cancel a request that has already been processed" }, { status: 400 })
    }

    // Cancel the request
    const { error } = await supabase
      .from('group_join_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)

    if (error) {
      console.error('Error cancelling join request:', error)
      return NextResponse.json({ error: "Failed to cancel join request" }, { status: 500 })
    }

    return NextResponse.json({ message: "Join request cancelled successfully" })
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]/join-requests/[requestId]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
