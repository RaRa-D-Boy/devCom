"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (!username.trim()) {
      setError("Username is required")
      setIsLoading(false)
      return
    }

    try {
      console.log("Starting signup process...")
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: {
            username: username.trim(),
            display_name: displayName.trim() || username.trim(),
            first_name: displayName.trim() || username.trim(),
            last_name: '',
          },
        },
      })

      console.log("Signup response:", { data, error })

      if (error) {
        console.error("Signup error:", error)
        throw error
      }

      if (data.user) {
        console.log("User created successfully:", data.user.id)
        
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if profile was created by the trigger
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile check error:", profileError)
          // If profile wasn't created by trigger, create it manually
          const { error: createProfileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              username: username.trim(),
              display_name: displayName.trim() || username.trim(),
              full_name: displayName.trim() || username.trim(),
              first_name: displayName.trim() || username.trim(),
              last_name: '',
              bio: '',
              status: 'offline',
              last_seen: new Date().toISOString(),
              profile_completed: false
            })

          if (createProfileError) {
            console.error("Manual profile creation error:", createProfileError)
            throw new Error("Failed to create user profile")
          }
        }
        
        console.log("Profile created successfully")
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        console.log("Email confirmation required")
        router.push("/auth/verify-email")
      } else {
        console.log("User signed up and confirmed, redirecting to home")
        router.push("/home")
      }
    } catch (error: unknown) {
      console.error("Signup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen dev-background relative overflow-hidden flex items-center justify-center p-6">
      
      <div className="w-full max-w-sm relative z-10">
        <div className="glass-card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Join SocialHub</h1>
            <p className="text-muted-foreground">Create your account to start connecting</p>
          </div>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass border-0 bg-white/50 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground font-medium">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your display name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="glass border-0 bg-white/50 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass border-0 bg-white/50 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass border-0 bg-white/50 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass border-0 bg-white/50 placeholder:text-muted-foreground"
              />
            </div>
            {error && <div className="text-sm text-destructive bg-red-50/80 p-3 rounded-lg border border-red-200/50">{error}</div>}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-12 text-lg font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
