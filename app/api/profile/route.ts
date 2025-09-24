import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      username,
      full_name,
      first_name,
      last_name,
      display_name,
      bio,
      avatar_url,
      cover_image_url,
      status,
      location,
      website,
      github_url,
      linkedin_url,
      twitter_url,
      portfolio_url,
      role,
      company,
      job_title,
      skills,
      programming_languages,
      frameworks,
      tools,
      experience_level,
      years_of_experience,
      education,
      certifications,
      projects,
      achievements,
      interests,
      timezone,
      availability,
      looking_for_work,
      remote_work,
      profile_visibility,
      theme_preference,
      notification_preferences,
      social_links,
      contact_info,
      professional_info
    } = await request.json()

    // Validate input
    if (username && (username.length < 3 || username.length > 20)) {
      return NextResponse.json({ 
        error: "Username must be between 3 and 20 characters" 
      }, { status: 400 })
    }

    if (full_name && full_name.length > 100) {
      return NextResponse.json({ 
        error: "Full name must be less than 100 characters" 
      }, { status: 400 })
    }

    if (bio && bio.length > 1000) {
      return NextResponse.json({ 
        error: "Bio must be less than 1000 characters" 
      }, { status: 400 })
    }

    if (status && !['active', 'busy', 'offline', 'inactive'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be one of: active, busy, offline, inactive" 
      }, { status: 400 })
    }

    if (experience_level && !['junior', 'mid', 'senior', 'lead', 'architect'].includes(experience_level)) {
      return NextResponse.json({ 
        error: "Experience level must be one of: junior, mid, senior, lead, architect" 
      }, { status: 400 })
    }

    if (availability && !['available', 'busy', 'unavailable'].includes(availability)) {
      return NextResponse.json({ 
        error: "Availability must be one of: available, busy, unavailable" 
      }, { status: 400 })
    }

    if (profile_visibility && !['public', 'friends', 'private'].includes(profile_visibility)) {
      return NextResponse.json({ 
        error: "Profile visibility must be one of: public, friends, private" 
      }, { status: 400 })
    }

    if (theme_preference && !['light', 'dark', 'auto'].includes(theme_preference)) {
      return NextResponse.json({ 
        error: "Theme preference must be one of: light, dark, auto" 
      }, { status: 400 })
    }

    // Check if username is already taken (if username is being updated)
    if (username) {
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows returned
        return NextResponse.json({ error: "Failed to check username availability" }, { status: 500 })
      }

      if (existingProfile) {
        return NextResponse.json({ 
          error: "Username is already taken" 
        }, { status: 400 })
      }
    }

    // Update profile
    const updateData: any = {}
    if (username !== undefined) updateData.username = username.trim()
    if (full_name !== undefined) updateData.full_name = full_name.trim()
    if (first_name !== undefined) updateData.first_name = first_name.trim()
    if (last_name !== undefined) updateData.last_name = last_name.trim()
    if (display_name !== undefined) updateData.display_name = display_name.trim()
    if (bio !== undefined) updateData.bio = bio.trim()
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url
    if (status !== undefined) updateData.status = status
    if (location !== undefined) updateData.location = location.trim()
    if (website !== undefined) updateData.website = website.trim()
    if (github_url !== undefined) updateData.github_url = github_url.trim()
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url.trim()
    if (twitter_url !== undefined) updateData.twitter_url = twitter_url.trim()
    if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url.trim()
    if (role !== undefined) updateData.role = role.trim()
    if (company !== undefined) updateData.company = company.trim()
    if (job_title !== undefined) updateData.job_title = job_title.trim()
    if (skills !== undefined) updateData.skills = skills
    if (programming_languages !== undefined) updateData.programming_languages = programming_languages
    if (frameworks !== undefined) updateData.frameworks = frameworks
    if (tools !== undefined) updateData.tools = tools
    if (experience_level !== undefined) updateData.experience_level = experience_level
    if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience
    if (education !== undefined) updateData.education = education.trim()
    if (certifications !== undefined) updateData.certifications = certifications
    if (projects !== undefined) updateData.projects = projects
    if (achievements !== undefined) updateData.achievements = achievements
    if (interests !== undefined) updateData.interests = interests
    if (timezone !== undefined) updateData.timezone = timezone
    if (availability !== undefined) updateData.availability = availability
    if (looking_for_work !== undefined) updateData.looking_for_work = looking_for_work
    if (remote_work !== undefined) updateData.remote_work = remote_work
    if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility
    if (theme_preference !== undefined) updateData.theme_preference = theme_preference
    if (notification_preferences !== undefined) updateData.notification_preferences = notification_preferences
    if (social_links !== undefined) updateData.social_links = social_links
    if (contact_info !== undefined) updateData.contact_info = contact_info
    if (professional_info !== undefined) updateData.professional_info = professional_info

    // Mark profile as completed if enough fields are filled
    const requiredFields = ['username', 'full_name', 'bio', 'role']
    const filledFields = requiredFields.filter(field => updateData[field] && updateData[field].trim().length > 0)
    if (filledFields.length >= 3) {
      updateData.profile_completed = true
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select("*")
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
