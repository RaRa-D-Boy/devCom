import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groupId = params.id

    // Check if user is a member of this group
    const { data: membership, error: membershipError } = await supabase
      .from("group_chat_members")
      .select("role")
      .eq("group_chat_id", groupId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all members of the group
    const { data: members, error: membersError } = await supabase
      .from("group_chat_members")
      .select(`
        *,
        user:profiles(*)
      `)
      .eq("group_chat_id", groupId)
      .order("joined_at", { ascending: true })

    if (membersError) {
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    const transformedMembers = (members || []).map(member => ({
      id: member.user.id,
      username: member.user.username,
      full_name: member.user.full_name,
      avatar_url: member.user.avatar_url,
      role: member.role,
      joined_at: member.joined_at
    }))

    return NextResponse.json({ members: transformedMembers })
  } catch (error) {
    console.error("Error fetching group members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groupId = params.id
    const { user_ids } = await request.json()

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: "User IDs are required" }, { status: 400 })
    }

    // Check if user is an admin of this group
    const { data: membership, error: membershipError } = await supabase
      .from("group_chat_members")
      .select("role")
      .eq("group_chat_id", groupId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Check if users exist
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .in("id", user_ids)

    if (usersError) {
      return NextResponse.json({ error: "Failed to verify users" }, { status: 500 })
    }

    const validUserIds = (users || []).map(u => u.id)
    const invalidUserIds = user_ids.filter((id: string) => !validUserIds.includes(id))

    if (invalidUserIds.length > 0) {
      return NextResponse.json({ 
        error: "Some users not found",
        invalid_user_ids: invalidUserIds
      }, { status: 400 })
    }

    // Check if users are already members
    const { data: existingMembers, error: existingError } = await supabase
      .from("group_chat_members")
      .select("user_id")
      .eq("group_chat_id", groupId)
      .in("user_id", validUserIds)

    if (existingError) {
      return NextResponse.json({ error: "Failed to check existing members" }, { status: 500 })
    }

    const existingUserIds = (existingMembers || []).map(m => m.user_id)
    const newUserIds = validUserIds.filter(id => !existingUserIds.includes(id))

    if (newUserIds.length === 0) {
      return NextResponse.json({ 
        error: "All users are already members",
        already_members: existingUserIds
      }, { status: 400 })
    }

    // Add new members
    const membersToAdd = newUserIds.map(userId => ({
      group_chat_id: groupId,
      user_id: userId,
      role: "member"
    }))

    const { error: addError } = await supabase
      .from("group_chat_members")
      .insert(membersToAdd)

    if (addError) {
      return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      added_members: newUserIds,
      already_members: existingUserIds
    })
  } catch (error) {
    console.error("Error adding group members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
