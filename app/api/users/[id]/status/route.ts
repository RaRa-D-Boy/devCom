import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Users can only update their own status
    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { status, availability } = await request.json()

    if (status && !['active', 'busy', 'offline', 'inactive'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be one of: active, busy, offline, inactive" 
      }, { status: 400 })
    }

    if (availability && !['available', 'busy', 'unavailable'].includes(availability)) {
      return NextResponse.json({ 
        error: "Availability must be one of: available, busy, unavailable" 
      }, { status: 400 })
    }

    const updateData: any = {
      last_seen: new Date().toISOString()
    }

    if (status !== undefined) updateData.status = status
    if (availability !== undefined) updateData.availability = availability

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id, username, status, availability, last_seen")
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
