import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all groups the user is a member of
    const { data: groups, error: groupsError } = await supabase
      .from("group_chat_members")
      .select(`
        group_chat:group_chats(
          *,
          creator:profiles(*),
          members_count:group_chat_members(count),
          last_message:group_chat_messages(
            content,
            created_at,
            author:profiles(*)
          )
        ),
        role
      `)
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })

    if (groupsError) {
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
    }

    const transformedGroups = (groups || []).map(membership => ({
      id: membership.group_chat.id,
      name: membership.group_chat.name,
      description: membership.group_chat.description,
      creator: membership.group_chat.creator,
      members_count: membership.group_chat.members_count?.[0]?.count || 0,
      last_message: membership.group_chat.last_message?.[0] || null,
      role: membership.role,
      updated_at: membership.group_chat.updated_at,
      created_at: membership.group_chat.created_at
    }))

    return NextResponse.json({ groups: transformedGroups })
  } catch (error) {
    console.error("Error fetching groups:", error)
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

    const { name, description, member_ids } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 })
    }

    // Create new group
    const { data: group, error: groupError } = await supabase
      .from("group_chats")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        created_by: user.id
      })
      .select(`
        *,
        creator:profiles(*)
      `)
      .single()

    if (groupError) {
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
    }

    // Add creator as admin member
    const { error: creatorMemberError } = await supabase
      .from("group_chat_members")
      .insert({
        group_chat_id: group.id,
        user_id: user.id,
        role: "admin"
      })

    if (creatorMemberError) {
      return NextResponse.json({ error: "Failed to add creator to group" }, { status: 500 })
    }

    // Add other members if provided
    if (member_ids && member_ids.length > 0) {
      const membersToAdd = member_ids.map((memberId: string) => ({
        group_chat_id: group.id,
        user_id: memberId,
        role: "member"
      }))

      const { error: membersError } = await supabase
        .from("group_chat_members")
        .insert(membersToAdd)

      if (membersError) {
        console.error("Error adding members to group:", membersError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      creator: group.creator,
      members_count: 1 + (member_ids?.length || 0),
      last_message: null,
      role: "admin",
      updated_at: group.updated_at,
      created_at: group.created_at
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
