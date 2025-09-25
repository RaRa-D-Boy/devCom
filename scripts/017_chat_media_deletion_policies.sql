-- Chat Media Deletion RLS Policies
-- This script ensures proper Row Level Security for deleting media files in chat messages

-- ==============================================
-- 1. ENABLE RLS ON MESSAGES TABLES
-- ==============================================

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on one_on_one_messages table
ALTER TABLE public.one_on_one_messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. MESSAGES TABLE POLICIES
-- ==============================================

-- Owner-only DELETE policy for messages (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can delete their own messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN 
        CREATE POLICY "Users can delete their own messages" 
        ON public.messages 
        FOR DELETE 
        TO authenticated 
        USING (sender_id = auth.uid());
    END IF; 
END $$;

-- Owner-only UPDATE policy for messages (for soft deletion)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can update their own messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN 
        CREATE POLICY "Users can update their own messages" 
        ON public.messages 
        FOR UPDATE 
        TO authenticated 
        USING (sender_id = auth.uid());
    END IF; 
END $$;

-- ==============================================
-- 3. ONE_ON_ONE_MESSAGES TABLE POLICIES
-- ==============================================

-- Owner-only DELETE policy for one_on_one_messages (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can delete their own one_on_one_messages' 
        AND polrelid = 'public.one_on_one_messages'::regclass
    ) THEN 
        CREATE POLICY "Users can delete their own one_on_one_messages" 
        ON public.one_on_one_messages 
        FOR DELETE 
        TO authenticated 
        USING (author_id = auth.uid());
    END IF; 
END $$;

-- Owner-only UPDATE policy for one_on_one_messages (for soft deletion)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can update their own one_on_one_messages' 
        AND polrelid = 'public.one_on_one_messages'::regclass
    ) THEN 
        CREATE POLICY "Users can update their own one_on_one_messages" 
        ON public.one_on_one_messages 
        FOR UPDATE 
        TO authenticated 
        USING (author_id = auth.uid());
    END IF; 
END $$;

-- ==============================================
-- 4. STORAGE POLICIES FOR CHAT MEDIA
-- ==============================================

-- Ensure chat-media bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to ensure clean recreation)
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;

-- Recreate storage policies with proper RLS
CREATE POLICY "Anyone can view chat media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own chat media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own chat media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================
-- 5. PERFORMANCE INDEXES
-- ==============================================

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(is_deleted) WHERE is_deleted = true;

-- Indexes for one_on_one_messages table
CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_author_id ON public.one_on_one_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_chat_id ON public.one_on_one_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_created_at ON public.one_on_one_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_is_deleted ON public.one_on_one_messages(is_deleted) WHERE is_deleted = true;

-- ==============================================
-- 6. HELPER FUNCTIONS FOR MEDIA DELETION
-- ==============================================

-- Function to safely delete message with media cleanup
CREATE OR REPLACE FUNCTION delete_message_with_media(
    message_id UUID,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    media_urls TEXT[];
    file_path TEXT;
    file_paths TEXT[];
BEGIN
    -- Get media URLs from the message
    SELECT m.media_urls INTO media_urls
    FROM one_on_one_messages m
    WHERE m.id = message_id AND m.author_id = user_id;
    
    -- If message has media, delete from storage
    IF media_urls IS NOT NULL AND array_length(media_urls, 1) > 0 THEN
        -- Extract file paths from URLs
        FOREACH file_path IN ARRAY media_urls
        LOOP
            -- Extract path from URL (format: .../storage/v1/object/public/chat-media/user_id/filename)
            file_path := split_part(file_path, '/chat-media/', 2);
            file_paths := array_append(file_paths, file_path);
        END LOOP;
        
        -- Delete files from storage
        PERFORM storage.objects_delete('chat-media', file_paths);
    END IF;
    
    -- Soft delete the message
    UPDATE one_on_one_messages 
    SET 
        is_deleted = true,
        deleted_at = NOW(),
        content = '[Message deleted]'
    WHERE id = message_id AND author_id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('messages', 'one_on_one_messages')
AND schemaname = 'public';

-- Verify policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('messages', 'one_on_one_messages')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify storage policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%chat%'
ORDER BY policyname;
