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

    // Get posts with author information and like/comment counts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles(*),
        likes_count:post_likes(count),
        comments_count:post_comments(count)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Check if current user liked each post
    const postsWithLikes = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: likeData } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single()

        return {
          ...post,
          is_liked: !!likeData,
          likes_count: post.likes_count?.[0]?.count || 0,
          comments_count: post.comments_count?.[0]?.count || 0
        }
      })
    )

    return NextResponse.json({
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        hasMore: postsWithLikes.length === limit
      }
    })
  } catch (error) {
    console.error("Error fetching feeds:", error)
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

    const { content, media_urls, post_type } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Create new post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        content: content.trim(),
        author_id: user.id,
        media_urls: media_urls || [],
        post_type: post_type || 'text'
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (postError) {
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      ...post,
      likes_count: 0,
      comments_count: 0,
      is_liked: false
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
