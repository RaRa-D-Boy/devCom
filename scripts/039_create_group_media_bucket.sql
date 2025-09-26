-- =====================================================
-- Create Group Media Storage Bucket
-- =====================================================
-- This script creates the group-media storage bucket with proper permissions
-- =====================================================

-- Create the group-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'group-media',
    'group-media',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create policy to allow authenticated users to upload to group-media bucket
CREATE POLICY "Authenticated users can upload to group-media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'group-media' 
        AND auth.role() = 'authenticated'
    );

-- Create policy to allow authenticated users to update their own files in group-media bucket
CREATE POLICY "Users can update their own files in group-media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'group-media' 
        AND auth.uid() = owner
    );

-- Create policy to allow authenticated users to delete their own files in group-media bucket
CREATE POLICY "Users can delete their own files in group-media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'group-media' 
        AND auth.uid() = owner
    );

-- Create policy to allow public read access to group-media bucket
CREATE POLICY "Public can view group-media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'group-media');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Group Media Storage Bucket Created!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Bucket created: group-media';
    RAISE NOTICE 'Public access: enabled';
    RAISE NOTICE 'File size limit: 50MB';
    RAISE NOTICE 'Allowed types: images and videos';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '- Authenticated users can upload';
    RAISE NOTICE '- Users can update their own files';
    RAISE NOTICE '- Users can delete their own files';
    RAISE NOTICE '- Public can view files';
    RAISE NOTICE '=====================================================';
END $$;
