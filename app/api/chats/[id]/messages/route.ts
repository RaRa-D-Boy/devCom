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

    const chatId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Check if user has access to this chat
    const { data: chat, error: chatError } = await supabase
      .from("one_on_one_chats")
      .select("id")
      .eq("id", chatId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 })
    }

    // Get messages for the chat
    const { data: messages, error: messagesError } = await supabase
      .from("one_on_one_messages")
      .select(`
        *,
        author:profiles(*)
      `)
      .eq("chat_id", chatId)
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
    console.error("Error fetching messages:", error)
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

    const chatId = params.id
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Check if user has access to this chat
    const { data: chat, error: chatError } = await supabase
      .from("one_on_one_chats")
      .select("id")
      .eq("id", chatId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 })
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("one_on_one_messages")
      .insert({
        chat_id: chatId,
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

    // Update chat's updated_at timestamp
    await supabase
      .from("one_on_one_chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
