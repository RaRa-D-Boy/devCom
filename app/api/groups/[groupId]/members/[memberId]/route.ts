import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    groupId: string
    memberId: string
  }
}

// PUT /api/groups/[groupId]/members/[memberId] - Update member permissions
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId, memberId } = params
    const body = await request.json()
    const {
      can_add_members,
      can_remove_members,
      can_edit_group_info,
      can_manage_permissions,
      can_delete_group,
      can_pin_messages,
      can_delete_messages
    } = body

    // Update member permissions using the function
    const { error } = await supabase.rpc('update_group_member_permissions', {
      p_group_id: groupId,
      p_member_id: memberId,
      p_permissions: {
        can_add_members,
        can_remove_members,
        can_edit_group_info,
        can_manage_permissions,
        can_delete_group,
        can_pin_messages,
        can_delete_messages
      },
      p_updated_by: user.id
    })

    if (error) {
      console.error('Error updating member permissions:', error)
      return NextResponse.json({ error: error.message || "Failed to update member permissions" }, { status: 500 })
    }

    return NextResponse.json({ message: "Member permissions updated successfully" })
  } catch (error) {
    console.error('Error in PUT /api/groups/[groupId]/members/[memberId]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/groups/[groupId]/members/[memberId] - Remove member from group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId, memberId } = params

    // Remove member using the function
    const { error } = await supabase.rpc('remove_group_member', {
      p_group_id: groupId,
      p_member_id: memberId,
      p_removed_by: user.id
    })

    if (error) {
      console.error('Error removing member:', error)
      return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 500 })
    }

    return NextResponse.json({ message: "Member removed from group successfully" })
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]/members/[memberId]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
