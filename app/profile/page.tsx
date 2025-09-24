import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileSettings } from "@/components/profile/profile-settings"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

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
    redirect("/auth/login")
  }

  return <ProfileSettings user={user} profile={profile} />
}
