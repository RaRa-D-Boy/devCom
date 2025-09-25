-- Ultra-permissive storage policies for profile-media
-- Use this if the previous RLS fix doesn't work

-- Drop all existing policies for profile-media
DROP POLICY IF EXISTS "Authenticated users can upload profile media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated uploads to profile-media" ON storage.objects;

-- Create ultra-permissive policies
CREATE POLICY "Allow all authenticated uploads to profile-media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-media');

CREATE POLICY "Allow all authenticated updates to profile-media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-media');

CREATE POLICY "Allow all authenticated deletes to profile-media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-media');

CREATE POLICY "Allow public view of profile-media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-media');

-- Verify the policies
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
AND policyname LIKE '%profile-media%'
ORDER BY policyname;
