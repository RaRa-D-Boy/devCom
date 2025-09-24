-- Add new fields to the profiles table for developer profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'busy', 'offline', 'inactive')) DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[], -- Array of skills
ADD COLUMN IF NOT EXISTS programming_languages TEXT[], -- Array of programming languages
ADD COLUMN IF NOT EXISTS frameworks TEXT[], -- Array of frameworks
ADD COLUMN IF NOT EXISTS tools TEXT[], -- Array of tools
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead', 'architect')) DEFAULT 'junior',
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS projects TEXT[], -- Array of project descriptions
ADD COLUMN IF NOT EXISTS achievements TEXT[],
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS availability TEXT CHECK (availability IN ('available', 'busy', 'unavailable')) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS looking_for_work BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS remote_work BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT CHECK (profile_visibility IN ('public', 'friends', 'private')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS theme_preference TEXT CHECK (theme_preference IN ('light', 'dark', 'auto')) DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "mentions": true, "messages": true}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS professional_info JSONB DEFAULT '{}';

-- Update the updated_at column when any field changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update the profile creation trigger to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    full_name,
    first_name,
    last_name,
    bio,
    status,
    last_seen
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bio', ''),
    'offline',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON public.profiles(availability);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for_work ON public.profiles(looking_for_work);
CREATE INDEX IF NOT EXISTS idx_profiles_remote_work ON public.profiles(remote_work);
CREATE INDEX IF NOT EXISTS idx_profiles_experience_level ON public.profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_programming_languages ON public.profiles USING GIN(programming_languages);
CREATE INDEX IF NOT EXISTS idx_profiles_frameworks ON public.profiles USING GIN(frameworks);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate policies with updated field access
CREATE POLICY "Users can view profiles based on visibility" ON public.profiles FOR SELECT USING (
  profile_visibility = 'public' OR 
  (profile_visibility = 'friends' AND EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE (user_id = auth.uid() AND friend_id = profiles.id AND status = 'accepted') OR
          (friend_id = auth.uid() AND user_id = profiles.id AND status = 'accepted')
  )) OR
  auth.uid() = profiles.id
);

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Add a function to update last_seen timestamp
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET last_seen = NOW() 
    WHERE id = auth.uid();
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create a function to get online users
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    status TEXT,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.full_name,
        p.avatar_url,
        p.status,
        p.last_seen
    FROM public.profiles p
    WHERE p.status IN ('active', 'busy') 
    AND p.last_seen > NOW() - INTERVAL '5 minutes'
    AND p.profile_visibility = 'public'
    ORDER BY p.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_online_users() TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_seen() TO authenticated;
