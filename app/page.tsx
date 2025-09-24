import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/home")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 chat-gradient">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-balance">
            Connect & Chat
            <span className="block text-primary">In Real Time</span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-lg mx-auto">
            Join conversations, share ideas, and connect with others in our modern chat platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-background/20 backdrop-blur-sm">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
