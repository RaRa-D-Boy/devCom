-- Create profile media storage bucket for avatars and cover images
-- This script sets up Supabase Storage for profile media

-- Create the profile-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for profile-media bucket

-- Allow authenticated users to upload their own profile media
CREATE POLICY "Users can upload their own profile media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile media
CREATE POLICY "Users can update their own profile media" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own profile media
CREATE POLICY "Users can delete their own profile media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view profile media
CREATE POLICY "Public can view profile media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-media');

-- Create a function to clean up old profile media when user updates
CREATE OR REPLACE FUNCTION cleanup_old_profile_media()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old avatar if new one is uploaded
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
    -- Extract file path from URL
    PERFORM storage.objects.delete(
      bucket_id := 'profile-media',
      name := regexp_replace(OLD.avatar_url, '^.*profile-media/', '')
    );
  END IF;
  
  -- Delete old cover image if new one is uploaded
  IF OLD.cover_image_url IS DISTINCT FROM NEW.cover_image_url AND OLD.cover_image_url IS NOT NULL THEN
    -- Extract file path from URL
    PERFORM storage.objects.delete(
      bucket_id := 'profile-media',
      name := regexp_replace(OLD.cover_image_url, '^.*profile-media/', '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clean up old media when profile is updated
DROP TRIGGER IF EXISTS cleanup_profile_media_trigger ON public.profiles;
CREATE TRIGGER cleanup_profile_media_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_profile_media();

-- Create a function to get user's profile media stats
CREATE OR REPLACE FUNCTION get_profile_media_stats(user_uuid UUID)
RETURNS TABLE (
  avatar_count BIGINT,
  cover_count BIGINT,
  total_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE name LIKE 'avatars/' || user_uuid::text || '/%') as avatar_count,
    COUNT(*) FILTER (WHERE name LIKE 'covers/' || user_uuid::text || '/%') as cover_count,
    COALESCE(SUM(metadata->>'size')::bigint, 0) as total_size
  FROM storage.objects
  WHERE bucket_id = 'profile-media'
  AND (name LIKE 'avatars/' || user_uuid::text || '/%' OR name LIKE 'covers/' || user_uuid::text || '/%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_profile_media_stats(UUID) TO authenticated;
