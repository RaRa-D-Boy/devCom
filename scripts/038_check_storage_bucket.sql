-- =====================================================
-- Check Storage Bucket Configuration
-- =====================================================
-- This script helps check if the group-media storage bucket exists and is configured correctly
-- =====================================================

-- Check if the group-media bucket exists
SELECT 
    name as bucket_name,
    id,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'group-media';

-- Check storage policies for group-media bucket
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%group-media%';

-- Check if there are any files in the group-media bucket
SELECT 
    bucket_id,
    name as file_name,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'group-media'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Storage Bucket Check Complete!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Check the results above to see:';
    RAISE NOTICE '1. If group-media bucket exists and is public';
    RAISE NOTICE '2. Storage policies for the bucket';
    RAISE NOTICE '3. Files in the bucket (if any)';
    RAISE NOTICE '';
    RAISE NOTICE 'If the bucket does not exist, you need to create it.';
    RAISE NOTICE 'If there are no files, the upload might be failing.';
    RAISE NOTICE 'If files exist but URLs are not working, check policies.';
    RAISE NOTICE '=====================================================';
END $$;
