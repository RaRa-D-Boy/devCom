-- Add media support to posts table
-- This script adds columns to support media files in posts

-- Add media_urls column to store array of media file URLs
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- Add post_type column to categorize posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'text' 
CHECK (post_type IN ('text', 'image', 'video', 'document', 'mixed'));

-- Create index for post_type for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);

-- Create index for media_urls for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_media_urls ON posts USING GIN(media_urls);

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for post media
CREATE POLICY "Anyone can view post media" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own post media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add comments to document the new columns
COMMENT ON COLUMN posts.media_urls IS 'Array of media file URLs attached to the post';
COMMENT ON COLUMN posts.post_type IS 'Type of post: text, image, video, document, or mixed';
