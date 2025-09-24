import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get online users (active or busy status, seen within last 5 minutes)
    const { data: onlineUsers, error: usersError } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        full_name,
        avatar_url,
        status,
        last_seen,
        role,
        company,
        job_title,
        location,
        experience_level,
        skills,
        programming_languages,
        frameworks
      `)
      .in("status", ["active", "busy"])
      .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .eq("profile_visibility", "public")
      .order("last_seen", { ascending: false })
      .limit(50)

    if (usersError) {
      return NextResponse.json({ error: "Failed to fetch online users" }, { status: 500 })
    }

    return NextResponse.json({ users: onlineUsers || [] })
  } catch (error) {
    console.error("Error fetching online users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
