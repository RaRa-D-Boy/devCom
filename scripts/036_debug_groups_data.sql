-- =====================================================
-- Debug Groups Data - Check Cover Image URLs
-- =====================================================
-- This script helps debug the groups data to see if cover images are properly stored
-- =====================================================

-- Check all groups and their cover image URLs
SELECT 
    id,
    name,
    description,
    avatar_url,
    cover_image_url,
    creator_id,
    created_at,
    updated_at
FROM groups
ORDER BY created_at DESC;

-- Check if any groups have cover images
SELECT 
    COUNT(*) as total_groups,
    COUNT(cover_image_url) as groups_with_cover_images,
    COUNT(avatar_url) as groups_with_avatars
FROM groups;

-- Check group members to see if user is a member of any groups
SELECT 
    gm.user_id,
    gm.group_id,
    gm.role,
    gm.status,
    g.name as group_name,
    g.cover_image_url,
    gm.joined_at
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
WHERE gm.status = 'active'
ORDER BY gm.joined_at DESC;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Groups Data Debug Complete!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Check the results above to see:';
    RAISE NOTICE '1. All groups and their cover_image_url values';
    RAISE NOTICE '2. Count of groups with/without cover images';
    RAISE NOTICE '3. Group memberships and their cover images';
    RAISE NOTICE '';
    RAISE NOTICE 'If cover_image_url is NULL, that means no cover image was set.';
    RAISE NOTICE 'If cover_image_url has a value, check if the URL is accessible.';
    RAISE NOTICE '=====================================================';
END $$;
