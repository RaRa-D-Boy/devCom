-- Test script to verify storage access and permissions
-- Run this to check if the profile-media bucket is accessible

-- Test 1: Check if bucket exists and is accessible
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'profile-media';

-- Test 2: Check RLS policies on storage.objects
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%profile media%';

-- Test 3: Check if current user can access storage
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- Test 4: Check storage.objects table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
ORDER BY ordinal_position;

-- Test 5: Check if we can query storage.objects (this will show if RLS is working)
SELECT 
    bucket_id,
    name,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'profile-media'
LIMIT 5;
