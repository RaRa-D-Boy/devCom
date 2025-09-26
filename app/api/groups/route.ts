import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/groups - Get user's groups or public groups
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'user' // 'user', 'public', 'all'
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from('group_details')
      .select('*')

    if (type === 'user') {
      // Get user's groups with their role
      const { data: userGroups, error } = await supabase
        .from('user_groups')
        .select('*')
      
      if (error) {
        console.error('Error fetching user groups:', error)
        return NextResponse.json({ error: "Failed to fetch user groups" }, { status: 500 })
      }
      
      return NextResponse.json({ groups: userGroups })
    } else if (type === 'public') {
      // Get public groups
      query = query.eq('is_private', false)
    }
    // 'all' type gets all groups (for admin purposes)

    const { data: groups, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
    }

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error in GET /api/groups:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      avatar_url,
      cover_image_url,
      is_private = false,
      max_members = 100,
      allow_member_invites = true,
      require_approval = true,
      initial_members = [],
      initial_admins = []
    } = body

    console.log('Groups API - Received data:', body)
    console.log('Groups API - Cover image URL:', cover_image_url)

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Group name must be 100 characters or less" }, { status: 400 })
    }

    // Create group using the function
    const rpcParams = {
      p_name: name.trim(),
      p_description: description?.trim() || null,
      p_avatar_url: avatar_url || null,
      p_cover_image_url: cover_image_url || null,
      p_is_private: is_private,
      p_max_members: max_members,
      p_allow_member_invites: allow_member_invites,
      p_require_approval: require_approval,
      p_creator_id: user.id,
      p_initial_members: initial_members.length > 0 ? initial_members : null,
      p_initial_admins: initial_admins.length > 0 ? initial_admins : null
    }
    
    console.log('Groups API - RPC params:', rpcParams)
    console.log('Groups API - Cover image URL in RPC:', rpcParams.p_cover_image_url)
    
    const { data: groupId, error } = await supabase.rpc('create_group', rpcParams)

    if (error) {
      console.error('Error creating group:', error)
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
    }

    // Get the created group details
    const { data: group, error: fetchError } = await supabase
      .from('group_details')
      .select('*')
      .eq('id', groupId)
      .single()

    if (fetchError) {
      console.error('Error fetching created group:', fetchError)
      return NextResponse.json({ error: "Group created but failed to fetch details" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Group created successfully", 
      group 
    })
  } catch (error) {
    console.error('Error in POST /api/groups:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}