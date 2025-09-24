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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

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

    // Get messages for the group
    const { data: messages, error: messagesError } = await supabase
      .from("group_chat_messages")
      .select(`
        *,
        author:profiles(*)
      `)
      .eq("group_chat_id", groupId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({
      messages: (messages || []).reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        hasMore: (messages || []).length === limit
      }
    })
  } catch (error) {
    console.error("Error fetching group messages:", error)
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
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

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

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("group_chat_messages")
      .insert({
        group_chat_id: groupId,
        author_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (messageError) {
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
    }

    // Update group's updated_at timestamp
    await supabase
      .from("group_chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", groupId)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating group message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
