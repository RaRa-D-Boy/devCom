-- Check and create profile-media storage bucket if it doesn't exist
-- This script ensures the storage bucket is properly set up

-- Check if the bucket exists
DO $$
BEGIN
    -- If bucket doesn't exist, create it
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-media') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'profile-media',
            'profile-media',
            true,
            5242880, -- 5MB limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        );
        
        RAISE NOTICE 'Created profile-media storage bucket';
    ELSE
        RAISE NOTICE 'profile-media storage bucket already exists';
    END IF;
END $$;

-- Check and create RLS policies for profile-media bucket
DO $$
BEGIN
    -- Drop existing policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Users can upload their own profile media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile media" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view profile media" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Users can upload their own profile media" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'profile-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    CREATE POLICY "Users can update their own profile media" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'profile-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    CREATE POLICY "Users can delete their own profile media" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'profile-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    CREATE POLICY "Public can view profile media" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'profile-media');
    
    RAISE NOTICE 'Created RLS policies for profile-media bucket';
END $$;

-- Verify the setup
SELECT 
    'profile-media' as bucket_id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile-media';

-- Show policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profile media%';
