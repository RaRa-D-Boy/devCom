-- Fix RLS policies for profile-media bucket
-- This script creates more permissive policies for avatar and cover image uploads

-- First, let's drop all existing policies for profile-media to start fresh
DROP POLICY IF EXISTS "Users can upload their own profile media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile media" ON storage.objects;

-- Create more permissive policies for profile-media bucket
-- Policy 1: Allow authenticated users to upload to profile-media bucket
CREATE POLICY "Authenticated users can upload profile media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'profile-media'
);

-- Policy 2: Allow authenticated users to update their own profile media
CREATE POLICY "Users can update their own profile media" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'profile-media' AND
    (
        auth.uid()::text = (storage.foldername(name))[1] OR
        auth.uid()::text = (storage.foldername(name))[2]
    )
);

-- Policy 3: Allow authenticated users to delete their own profile media
CREATE POLICY "Users can delete their own profile media" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'profile-media' AND
    (
        auth.uid()::text = (storage.foldername(name))[1] OR
        auth.uid()::text = (storage.foldername(name))[2]
    )
);

-- Policy 4: Allow public access to view profile media
CREATE POLICY "Public can view profile media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-media');

-- Alternative: If the above still doesn't work, create a very permissive policy
-- Uncomment the following if you still get RLS errors:

/*
-- Drop the restrictive upload policy and create a very permissive one
DROP POLICY IF EXISTS "Authenticated users can upload profile media" ON storage.objects;

CREATE POLICY "Allow all authenticated uploads to profile-media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-media');
*/

-- Verify the policies were created
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
AND policyname LIKE '%profile media%'
ORDER BY policyname;
