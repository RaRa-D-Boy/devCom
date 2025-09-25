-- Fix the storage cleanup trigger issue
-- Remove the problematic trigger that causes cross-database reference errors

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS cleanup_profile_media_trigger ON public.profiles;
DROP FUNCTION IF EXISTS cleanup_old_profile_media();

-- Create a simpler function that doesn't try to delete from storage directly
-- This function will just log the old URLs for manual cleanup if needed
CREATE OR REPLACE FUNCTION log_old_profile_media()
RETURNS TRIGGER AS $$
BEGIN
  -- Log old avatar URL if it changed
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
    RAISE NOTICE 'Old avatar URL to cleanup: %', OLD.avatar_url;
  END IF;
  
  -- Log old cover image URL if it changed
  IF OLD.cover_image_url IS DISTINCT FROM NEW.cover_image_url AND OLD.cover_image_url IS NOT NULL THEN
    RAISE NOTICE 'Old cover image URL to cleanup: %', OLD.cover_image_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger that just logs instead of deleting
CREATE TRIGGER log_old_profile_media_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_old_profile_media();

-- Alternative: Create a client-side cleanup function that can be called from the app
CREATE OR REPLACE FUNCTION get_old_media_urls(user_uuid UUID)
RETURNS TABLE (
  old_avatar_url TEXT,
  old_cover_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.avatar_url as old_avatar_url,
    p.cover_image_url as old_cover_url
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to get old media URLs
GRANT EXECUTE ON FUNCTION get_old_media_urls(UUID) TO authenticated;

-- Verify the trigger was removed and new one created
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
AND trigger_name LIKE '%media%';
