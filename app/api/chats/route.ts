import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all chats for the current user
    const { data: chats, error: chatsError } = await supabase
      .from("one_on_one_chats")
      .select(`
        *,
        user1:profiles!one_on_one_chats_user1_id_fkey(*),
        user2:profiles!one_on_one_chats_user2_id_fkey(*),
        last_message:one_on_one_messages(
          content,
          created_at,
          author:profiles(*)
        )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (chatsError) {
      return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
    }

    // Transform the data to include the other user's information
    const transformedChats = (chats || []).map(chat => {
      const otherUser = chat.user1_id === user.id ? chat.user2 : chat.user1
      return {
        id: chat.id,
        other_user: otherUser,
        last_message: chat.last_message?.[0] || null,
        updated_at: chat.updated_at,
        created_at: chat.created_at
      }
    })

    return NextResponse.json({ chats: transformedChats })
  } catch (error) {
    console.error("Error fetching chats:", error)
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

    const { other_user_id } = await request.json()

    if (!other_user_id) {
      return NextResponse.json({ error: "Other user ID is required" }, { status: 400 })
    }

    if (other_user_id === user.id) {
      return NextResponse.json({ error: "Cannot create chat with yourself" }, { status: 400 })
    }

    // Check if other user exists
    const { data: otherUser, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", other_user_id)
      .single()

    if (userError || !otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if chat already exists
    const { data: existingChat } = await supabase
      .from("one_on_one_chats")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${other_user_id}),and(user1_id.eq.${other_user_id},user2_id.eq.${user.id})`)
      .single()

    if (existingChat) {
      return NextResponse.json({ 
        chat: existingChat,
        message: "Chat already exists"
      })
    }

    // Create new chat
    const { data: chat, error: chatError } = await supabase
      .from("one_on_one_chats")
      .insert({
        user1_id: user.id,
        user2_id: other_user_id
      })
      .select(`
        *,
        user1:profiles!one_on_one_chats_user1_id_fkey(*),
        user2:profiles!one_on_one_chats_user2_id_fkey(*)
      `)
      .single()

    if (chatError) {
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
    }

    const otherUser = chat.user1_id === user.id ? chat.user2 : chat.user1

    return NextResponse.json({
      id: chat.id,
      other_user: otherUser,
      last_message: null,
      updated_at: chat.updated_at,
      created_at: chat.created_at
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
