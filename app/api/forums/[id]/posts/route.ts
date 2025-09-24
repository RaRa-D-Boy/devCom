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

    const forumId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from("forums")
      .select("id")
      .eq("id", forumId)
      .single()

    if (forumError || !forum) {
      return NextResponse.json({ error: "Forum not found" }, { status: 404 })
    }

    // Get forum posts with author information and comment counts
    const { data: posts, error: postsError } = await supabase
      .from("forum_posts")
      .select(`
        *,
        author:profiles(*),
        comments_count:forum_post_comments(count)
      `)
      .eq("forum_id", forumId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      return NextResponse.json({ error: "Failed to fetch forum posts" }, { status: 500 })
    }

    const postsWithCounts = (posts || []).map(post => ({
      ...post,
      comments_count: post.comments_count?.[0]?.count || 0
    }))

    return NextResponse.json({
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        hasMore: postsWithCounts.length === limit
      }
    })
  } catch (error) {
    console.error("Error fetching forum posts:", error)
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

    const forumId = params.id
    const { title, content } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from("forums")
      .select("id")
      .eq("id", forumId)
      .single()

    if (forumError || !forum) {
      return NextResponse.json({ error: "Forum not found" }, { status: 404 })
    }

    // Create forum post
    const { data: post, error: postError } = await supabase
      .from("forum_posts")
      .insert({
        forum_id: forumId,
        author_id: user.id,
        title: title.trim(),
        content: content.trim()
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (postError) {
      return NextResponse.json({ error: "Failed to create forum post" }, { status: 500 })
    }

    return NextResponse.json({
      ...post,
      comments_count: 0
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating forum post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
