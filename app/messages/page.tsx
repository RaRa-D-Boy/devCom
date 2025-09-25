import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessagesInterface } from "@/components/messages/messages-interface"
import { AppProviders } from "@/components/providers/app-providers"

export default async function MessagesPage() {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      redirect("/auth/login")
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Error getting user:", userError)
      redirect("/auth/login")
    }

    if (!user) {
      redirect("/auth/login")
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error getting profile:", profileError)
      redirect("/auth/login")
    }

    if (!profile) {
      redirect("/auth/login")
    }

    return (
      <AppProviders user={user} profile={profile}>
        <MessagesInterface user={user} profile={profile} />
      </AppProviders>
    )
  } catch (error) {
    console.error("Error in MessagesPage:", error)
    redirect("/auth/login")
  }
}
