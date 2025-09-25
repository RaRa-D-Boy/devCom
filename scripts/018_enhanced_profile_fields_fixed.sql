-- Enhanced profile fields for software engineering roles and skills
-- This script adds comprehensive fields for developer profiles
-- Fixed version with proper column name escaping

-- Add new fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS "position" TEXT CHECK ("position" IN ('junior', 'mid', 'senior', 'principal', 'manager', 'cto', 'cfo', 'lead', 'architect', 'director', 'vp', 'founder', 'consultant', 'freelancer', 'intern', 'student')) DEFAULT 'junior',
ADD COLUMN IF NOT EXISTS gitlab_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS programming_languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS frameworks TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tools TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'busy', 'inactive', 'away', 'offline')) DEFAULT 'offline';

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
    "position",
    role,
    company,
    location,
    website,
    github_url,
    gitlab_url,
    portfolio_url,
    linkedin_url,
    last_seen,
    profile_completed
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
    'junior',
    COALESCE(NEW.raw_user_meta_data ->> 'role', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'location', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'website', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'github_url', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'gitlab_url', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'portfolio_url', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'linkedin_url', ''),
    NOW(),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_profiles_position ON public.profiles("position");
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_programming_languages ON public.profiles USING GIN(programming_languages);
CREATE INDEX IF NOT EXISTS idx_profiles_frameworks ON public.profiles USING GIN(frameworks);
CREATE INDEX IF NOT EXISTS idx_profiles_tools ON public.profiles USING GIN(tools);

-- Create a function to get popular skills for autocomplete
CREATE OR REPLACE FUNCTION get_popular_skills()
RETURNS TABLE (skill TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(skills) as skill,
        COUNT(*) as count
    FROM public.profiles 
    WHERE skills IS NOT NULL AND array_length(skills, 1) > 0
    GROUP BY unnest(skills)
    ORDER BY count DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get popular programming languages
CREATE OR REPLACE FUNCTION get_popular_languages()
RETURNS TABLE (language TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(programming_languages) as language,
        COUNT(*) as count
    FROM public.profiles 
    WHERE programming_languages IS NOT NULL AND array_length(programming_languages, 1) > 0
    GROUP BY unnest(programming_languages)
    ORDER BY count DESC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get popular frameworks
CREATE OR REPLACE FUNCTION get_popular_frameworks()
RETURNS TABLE (framework TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(frameworks) as framework,
        COUNT(*) as count
    FROM public.profiles 
    WHERE frameworks IS NOT NULL AND array_length(frameworks, 1) > 0
    GROUP BY unnest(frameworks)
    ORDER BY count DESC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get popular tools
CREATE OR REPLACE FUNCTION get_popular_tools()
RETURNS TABLE (tool TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(tools) as tool,
        COUNT(*) as count
    FROM public.profiles 
    WHERE tools IS NOT NULL AND array_length(tools, 1) > 0
    GROUP BY unnest(tools)
    ORDER BY count DESC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_popular_skills() TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_languages() TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_frameworks() TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_tools() TO authenticated;

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can view profiles based on visibility" ON public.profiles;
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

-- Create a function to update user status
CREATE OR REPLACE FUNCTION update_user_status(new_status TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        status = new_status,
        last_seen = NOW(),
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to update status
GRANT EXECUTE ON FUNCTION update_user_status(TEXT) TO authenticated;

-- Create a function to get user profile with skills
CREATE OR REPLACE FUNCTION get_user_profile_with_skills(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    status TEXT,
    "position" TEXT,
    role TEXT,
    company TEXT,
    location TEXT,
    website TEXT,
    github_url TEXT,
    gitlab_url TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    skills TEXT[],
    programming_languages TEXT[],
    frameworks TEXT[],
    tools TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.full_name,
        p.bio,
        p.avatar_url,
        p.cover_image_url,
        p.status,
        p."position",
        p.role,
        p.company,
        p.location,
        p.website,
        p.github_url,
        p.gitlab_url,
        p.portfolio_url,
        p.linkedin_url,
        p.skills,
        p.programming_languages,
        p.frameworks,
        p.tools,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to get profile with skills
GRANT EXECUTE ON FUNCTION get_user_profile_with_skills(UUID) TO authenticated;
