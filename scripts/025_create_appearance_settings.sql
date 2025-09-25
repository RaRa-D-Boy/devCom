-- Create appearance settings table to store user preferences
-- This table will be linked to the profiles table to store theme, color palette, glass effect, and language preferences

-- Create the appearance_settings table
CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    color_palette TEXT NOT NULL DEFAULT 'blue' CHECK (color_palette IN ('blue', 'purple', 'green', 'orange', 'pink', 'indigo', 'teal', 'red')),
    glass_effect TEXT NOT NULL DEFAULT 'translucent' CHECK (glass_effect IN ('translucent', 'transparent', 'opaque')),
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one appearance setting per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appearance_settings_user_id ON public.appearance_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_appearance_settings_theme ON public.appearance_settings(theme);
CREATE INDEX IF NOT EXISTS idx_appearance_settings_color_palette ON public.appearance_settings(color_palette);

-- Enable Row Level Security
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Policy: Users can view their own appearance settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can view their own appearance settings' 
        AND polrelid = 'public.appearance_settings'::regclass
    ) THEN
        CREATE POLICY "Users can view their own appearance settings" 
        ON public.appearance_settings 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can insert their own appearance settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can insert their own appearance settings' 
        AND polrelid = 'public.appearance_settings'::regclass
    ) THEN
        CREATE POLICY "Users can insert their own appearance settings" 
        ON public.appearance_settings 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy: Users can update their own appearance settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can update their own appearance settings' 
        AND polrelid = 'public.appearance_settings'::regclass
    ) THEN
        CREATE POLICY "Users can update their own appearance settings" 
        ON public.appearance_settings 
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy: Users can delete their own appearance settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can delete their own appearance settings' 
        AND polrelid = 'public.appearance_settings'::regclass
    ) THEN
        CREATE POLICY "Users can delete their own appearance settings" 
        ON public.appearance_settings 
        FOR DELETE 
        TO authenticated 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create function to automatically create appearance settings for new users
CREATE OR REPLACE FUNCTION public.create_default_appearance_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.appearance_settings (user_id, theme, color_palette, glass_effect, language)
    VALUES (NEW.id, 'light', 'blue', 'translucent', 'en');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create appearance settings when a new user is created
DROP TRIGGER IF EXISTS create_appearance_settings_trigger ON auth.users;
CREATE TRIGGER create_appearance_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_appearance_settings();

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_appearance_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_appearance_settings_updated_at_trigger ON public.appearance_settings;
CREATE TRIGGER update_appearance_settings_updated_at_trigger
    BEFORE UPDATE ON public.appearance_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_appearance_settings_updated_at();

-- Create function to get user appearance settings
CREATE OR REPLACE FUNCTION public.get_user_appearance_settings(user_uuid UUID)
RETURNS TABLE (
    theme TEXT,
    color_palette TEXT,
    glass_effect TEXT,
    language TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aps.theme,
        aps.color_palette,
        aps.glass_effect,
        aps.language
    FROM public.appearance_settings aps
    WHERE aps.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to upsert user appearance settings
CREATE OR REPLACE FUNCTION public.upsert_user_appearance_settings(
    user_uuid UUID,
    new_theme TEXT DEFAULT NULL,
    new_color_palette TEXT DEFAULT NULL,
    new_glass_effect TEXT DEFAULT NULL,
    new_language TEXT DEFAULT NULL
)
RETURNS TABLE (
    theme TEXT,
    color_palette TEXT,
    glass_effect TEXT,
    language TEXT
) AS $$
DECLARE
    current_theme TEXT;
    current_color_palette TEXT;
    current_glass_effect TEXT;
    current_language TEXT;
BEGIN
    -- Get current settings
    SELECT 
        COALESCE(new_theme, aps.theme),
        COALESCE(new_color_palette, aps.color_palette),
        COALESCE(new_glass_effect, aps.glass_effect),
        COALESCE(new_language, aps.language)
    INTO current_theme, current_color_palette, current_glass_effect, current_language
    FROM public.appearance_settings aps
    WHERE aps.user_id = user_uuid;

    -- If no settings exist, use defaults
    IF current_theme IS NULL THEN
        current_theme := COALESCE(new_theme, 'light');
        current_color_palette := COALESCE(new_color_palette, 'blue');
        current_glass_effect := COALESCE(new_glass_effect, 'translucent');
        current_language := COALESCE(new_language, 'en');
    END IF;

    -- Upsert the settings
    INSERT INTO public.appearance_settings (user_id, theme, color_palette, glass_effect, language)
    VALUES (user_uuid, current_theme, current_color_palette, current_glass_effect, current_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        theme = EXCLUDED.theme,
        color_palette = EXCLUDED.color_palette,
        glass_effect = EXCLUDED.glass_effect,
        language = EXCLUDED.language,
        updated_at = NOW();

    -- Return the updated settings
    RETURN QUERY
    SELECT current_theme, current_color_palette, current_glass_effect, current_language;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.appearance_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_appearance_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_appearance_settings(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Insert default appearance settings for existing users (if any)
INSERT INTO public.appearance_settings (user_id, theme, color_palette, glass_effect, language)
SELECT 
    id,
    'light',
    'blue', 
    'translucent',
    'en'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.appearance_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.appearance_settings IS 'Stores user appearance preferences including theme, color palette, glass effect, and language settings';
COMMENT ON COLUMN public.appearance_settings.theme IS 'User preferred theme: light, dark, or auto';
COMMENT ON COLUMN public.appearance_settings.color_palette IS 'User preferred color palette: blue, purple, green, orange, pink, indigo, teal, or red';
COMMENT ON COLUMN public.appearance_settings.glass_effect IS 'User preferred glass effect: translucent, transparent, or opaque';
COMMENT ON COLUMN public.appearance_settings.language IS 'User preferred language code (ISO 639-1)';
