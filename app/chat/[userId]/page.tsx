import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatRoom } from "@/components/chat/chat-room"

interface ChatPageProps {
  params: {
    userId: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get current user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect("/auth/login")
  }

  // Get the other user's profile
  const { data: otherUser, error: otherUserError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single()

  if (otherUserError || !otherUser) {
    redirect("/messages")
  }

  return (
    <ChatRoom 
      user={user} 
      profile={profile} 
      otherUser={otherUser}
    />
  )
}
