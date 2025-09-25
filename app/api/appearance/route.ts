import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user appearance settings
    const { data, error } = await supabase
      .from('appearance_settings')
      .select('theme, color_palette, glass_effect, language')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching appearance settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings = {
      theme: 'light',
      color_palette: 'blue',
      glass_effect: 'translucent',
      language: 'en'
    }

    return NextResponse.json(data || defaultSettings)
  } catch (error) {
    console.error('Error in GET /api/appearance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { theme, color_palette, glass_effect, language } = body

    // Validate input
    const validThemes = ['light', 'dark', 'auto']
    const validColorPalettes = ['blue', 'purple', 'green', 'orange', 'pink', 'indigo', 'teal', 'red']
    const validGlassEffects = ['translucent', 'transparent', 'opaque']
    const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi']

    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }
    if (color_palette && !validColorPalettes.includes(color_palette)) {
      return NextResponse.json({ error: 'Invalid color palette' }, { status: 400 })
    }
    if (glass_effect && !validGlassEffects.includes(glass_effect)) {
      return NextResponse.json({ error: 'Invalid glass effect' }, { status: 400 })
    }
    if (language && !validLanguages.includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    // Use the upsert function to save settings
    const { data, error } = await supabase.rpc('upsert_user_appearance_settings', {
      user_uuid: user.id,
      new_theme: theme,
      new_color_palette: color_palette,
      new_glass_effect: glass_effect,
      new_language: language
    })

    if (error) {
      console.error('Error saving appearance settings:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      settings: data[0] 
    })
  } catch (error) {
    console.error('Error in POST /api/appearance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
