import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Get forums with creator information and post counts
    const { data: forums, error: forumsError } = await supabase
      .from("forums")
      .select(`
        *,
        creator:profiles(*),
        posts_count:forum_posts(count)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (forumsError) {
      return NextResponse.json({ error: "Failed to fetch forums" }, { status: 500 })
    }

    const forumsWithCounts = (forums || []).map(forum => ({
      ...forum,
      posts_count: forum.posts_count?.[0]?.count || 0
    }))

    return NextResponse.json({
      forums: forumsWithCounts,
      pagination: {
        page,
        limit,
        hasMore: forumsWithCounts.length === limit
      }
    })
  } catch (error) {
    console.error("Error fetching forums:", error)
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

    const { title, description } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Create new forum
    const { data: forum, error: forumError } = await supabase
      .from("forums")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        created_by: user.id
      })
      .select(`
        *,
        creator:profiles(*)
      `)
      .single()

    if (forumError) {
      return NextResponse.json({ error: "Failed to create forum" }, { status: 500 })
    }

    return NextResponse.json({
      ...forum,
      posts_count: 0
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating forum:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
