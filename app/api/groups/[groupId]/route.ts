import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    groupId: string
  }
}

// GET /api/groups/[groupId] - Get group details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('group_details')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('Error fetching group:', groupError)
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is a member (for private groups)
    if (group.is_private) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role, can_add_members, can_remove_members, can_edit_group_info, can_manage_permissions, can_delete_group, can_pin_messages, can_delete_messages')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership) {
        return NextResponse.json({ error: "Access denied to private group" }, { status: 403 })
      }

      return NextResponse.json({ 
        group: {
          ...group,
          user_membership: membership
        }
      })
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/groups/[groupId] - Update group information
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params
    const body = await request.json()
    const {
      name,
      description,
      avatar_url,
      cover_image_url,
      is_private,
      max_members,
      allow_member_invites,
      require_approval
    } = body

    // Update group using the function
    const { error } = await supabase.rpc('update_group_info', {
      p_group_id: groupId,
      p_name: name,
      p_description: description,
      p_avatar_url: avatar_url,
      p_cover_image_url: cover_image_url,
      p_is_private: is_private,
      p_max_members: max_members,
      p_allow_member_invites: allow_member_invites,
      p_require_approval: require_approval,
      p_updated_by: user.id
    })

    if (error) {
      console.error('Error updating group:', error)
      return NextResponse.json({ error: error.message || "Failed to update group" }, { status: 500 })
    }

    // Get updated group details
    const { data: group, error: fetchError } = await supabase
      .from('group_details')
      .select('*')
      .eq('id', groupId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated group:', fetchError)
      return NextResponse.json({ error: "Group updated but failed to fetch details" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Group updated successfully", 
      group 
    })
  } catch (error) {
    console.error('Error in PUT /api/groups/[groupId]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/groups/[groupId] - Delete group (creator only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = params

    // Check if user is the creator
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('creator_id')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('Error fetching group:', groupError)
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    if (group.creator_id !== user.id) {
      return NextResponse.json({ error: "Only group creator can delete the group" }, { status: 403 })
    }

    // Delete group (cascade will handle members and requests)
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Error deleting group:', error)
      return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
    }

    return NextResponse.json({ message: "Group deleted successfully" })
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
