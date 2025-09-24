"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log("Testing Supabase connection...")
      console.log("Environment variables:")
      console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing")
      
      const supabase = createClient()
      console.log("Supabase client created:", supabase)
      
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      console.log("Session test:", { data, error })
      
      // Test database connection
      const { data: profiles, error: dbError } = await supabase
        .from("profiles")
        .select("count")
        .limit(1)
      
      console.log("Database test:", { profiles, dbError })
      
      setResult({
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"
        },
        auth: {
          connected: !error,
          error: error?.message,
          session: data?.session ? "Active" : "None"
        },
        database: {
          connected: !dbError,
          error: dbError?.message
        }
      })
    } catch (error) {
      console.error("Debug error:", error)
      setResult({
        error: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log("Testing signup...")
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email: "test@example.com",
        password: "testpassword123",
        options: {
          data: {
            username: "testuser",
            display_name: "Test User"
          }
        }
      })
      
      console.log("Signup test result:", { data, error })
      setResult({
        signup: {
          success: !error,
          error: error?.message,
          user: data?.user ? { id: data.user.id, email: data.user.email } : null
        }
      })
    } catch (error) {
      console.error("Signup test error:", error)
      setResult({
        signup: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Debug Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testSupabaseConnection} disabled={loading}>
                Test Connection
              </Button>
              <Button onClick={testSignup} disabled={loading} variant="outline">
                Test Signup
              </Button>
            </div>
            
            {loading && <p>Testing...</p>}
            
            {result && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
