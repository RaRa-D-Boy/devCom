import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Test database connection
    const { data: profiles, error: dbError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1)

    return NextResponse.json({
      success: true,
      auth: {
        connected: !authError,
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message
      },
      database: {
        connected: !dbError,
        error: dbError?.message
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
