-- =====================================================
-- Test Groups Query - Simulate the exact query used in the app
-- =====================================================
-- This script tests the exact query used in the GroupsInterface component
-- =====================================================

-- First, let's see what groups exist
SELECT 'All Groups' as query_type, id, name, cover_image_url, avatar_url FROM groups;

-- Test the exact query used in the app (simulate for a specific user)
-- Replace 'your-user-id' with an actual user ID from your auth.users table
SELECT 
    'Group Memberships' as query_type,
    gm.user_id,
    gm.group_id,
    gm.role,
    gm.status,
    g.id as group_id,
    g.name as group_name,
    g.description,
    g.avatar_url,
    g.cover_image_url,
    g.creator_id,
    g.created_at,
    g.updated_at,
    gm.joined_at
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
WHERE gm.status = 'active'
ORDER BY gm.joined_at DESC;

-- Check if the group-media storage bucket exists and has files
-- Note: This won't work in SQL, but you can check in Supabase Dashboard
-- Go to Storage > group-media bucket to see if files exist

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Groups Query Test Complete!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Check the results above to see:';
    RAISE NOTICE '1. All groups in the database';
    RAISE NOTICE '2. Group memberships with cover_image_url values';
    RAISE NOTICE '';
    RAISE NOTICE 'If cover_image_url is NULL, the group has no cover image.';
    RAISE NOTICE 'If cover_image_url has a value, check if the URL is accessible.';
    RAISE NOTICE '';
    RAISE NOTICE 'Also check in Supabase Dashboard:';
    RAISE NOTICE '- Storage > group-media bucket';
    RAISE NOTICE '- Make sure the bucket exists and has files';
    RAISE NOTICE '- Check if the URLs are publicly accessible';
    RAISE NOTICE '=====================================================';
END $$;
