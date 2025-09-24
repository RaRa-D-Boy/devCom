import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { HomeInterface } from "@/components/home/home-interface"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.log("No user found, redirecting to login")
    redirect("/auth/login")
  }

  console.log("User found:", user.id)

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile error:", profileError)
  }

  if (!profile) {
    console.log("No profile found, creating one...")
    // Create a basic profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        full_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
        last_name: user.user_metadata?.last_name || '',
        bio: '',
        status: 'offline',
        last_seen: new Date().toISOString(),
        profile_completed: false
      })
      .select("*")
      .single()

    if (createError) {
      console.error("Error creating profile:", createError)
      redirect("/auth/login")
    }

    return <HomeInterface user={user} profile={newProfile} />
  }

  console.log("Profile found:", profile)
  return <HomeInterface user={user} profile={profile} />
}
