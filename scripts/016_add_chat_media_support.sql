-- Add comprehensive media support for chat messages
-- This script adds media functionality to both messages and one_on_one_messages tables

-- Add media support columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_sizes BIGINT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_names TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' 
CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'gif', 'mixed'));

-- Add media support columns to one_on_one_messages table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        ALTER TABLE public.one_on_one_messages 
        ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS media_types TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS media_sizes BIGINT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS media_names TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' 
        CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'gif', 'mixed'));
    END IF;
END $$;

-- Create indexes for better performance on media columns
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_media_urls ON public.messages USING GIN(media_urls);
CREATE INDEX IF NOT EXISTS idx_messages_media_types ON public.messages USING GIN(media_types);

-- Create indexes for one_on_one_messages if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_message_type ON public.one_on_one_messages(message_type);
        CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_media_urls ON public.one_on_one_messages USING GIN(media_urls);
        CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_media_types ON public.one_on_one_messages USING GIN(media_types);
    END IF;
END $$;

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat media
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

-- Create function to determine message type based on media
CREATE OR REPLACE FUNCTION determine_message_type(media_types TEXT[])
RETURNS TEXT AS $$
BEGIN
    -- If no media, it's a text message
    IF media_types IS NULL OR array_length(media_types, 1) IS NULL THEN
        RETURN 'text';
    END IF;
    
    -- If multiple types, it's mixed
    IF array_length(media_types, 1) > 1 THEN
        RETURN 'mixed';
    END IF;
    
    -- Determine type based on first media type
    CASE media_types[1]
        WHEN 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml' THEN
            RETURN 'image';
        WHEN 'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime' THEN
            RETURN 'video';
        WHEN 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a' THEN
            RETURN 'audio';
        WHEN 'image/gif' THEN
            RETURN 'gif';
        WHEN 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
             'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
             'text/plain', 'application/zip', 'application/x-rar-compressed' THEN
            RETURN 'document';
        ELSE
            RETURN 'document';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate media file
CREATE OR REPLACE FUNCTION validate_media_file(
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    max_size BIGINT := 50 * 1024 * 1024; -- 50MB max file size
    allowed_types TEXT[] := ARRAY[
        -- Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        -- Videos
        'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime',
        -- Audio
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a',
        -- Documents
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
    ];
BEGIN
    -- Check file size
    IF file_size > max_size THEN
        RETURN FALSE;
    END IF;
    
    -- Check file type
    IF NOT (file_type = ANY(allowed_types)) THEN
        RETURN FALSE;
    END IF;
    
    -- Check file name (basic validation)
    IF file_name IS NULL OR length(file_name) = 0 OR length(file_name) > 255 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to send message with media
CREATE OR REPLACE FUNCTION send_message_with_media(
    message_content TEXT,
    sender_id UUID,
    chat_id UUID DEFAULT NULL,
    room_id UUID DEFAULT NULL,
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    media_sizes BIGINT[] DEFAULT '{}',
    media_names TEXT[] DEFAULT '{}',
    reply_to_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    message_type_val TEXT;
    i INTEGER;
BEGIN
    -- Validate media files if provided
    IF array_length(media_urls, 1) > 0 THEN
        FOR i IN 1..array_length(media_urls, 1) LOOP
            IF NOT validate_media_file(
                COALESCE(media_names[i], ''),
                COALESCE(media_types[i], ''),
                COALESCE(media_sizes[i], 0)
            ) THEN
                RAISE EXCEPTION 'Invalid media file at index %', i;
            END IF;
        END LOOP;
    END IF;
    
    -- Determine message type
    message_type_val := determine_message_type(media_types);
    
    -- Insert message
    INSERT INTO public.messages (
        content, user_id, room_id, chat_id, reply_to_id,
        media_urls, media_types, media_sizes, media_names, message_type
    ) VALUES (
        message_content, sender_id, room_id, chat_id, reply_to_id,
        media_urls, media_types, media_sizes, media_names, message_type_val
    ) RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send one_on_one message with media
CREATE OR REPLACE FUNCTION send_one_on_one_message_with_media(
    message_content TEXT,
    author_id UUID,
    chat_id UUID,
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    media_sizes BIGINT[] DEFAULT '{}',
    media_names TEXT[] DEFAULT '{}',
    reply_to_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    message_type_val TEXT;
    i INTEGER;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        RAISE EXCEPTION 'one_on_one_messages table does not exist';
    END IF;
    
    -- Validate media files if provided
    IF array_length(media_urls, 1) > 0 THEN
        FOR i IN 1..array_length(media_urls, 1) LOOP
            IF NOT validate_media_file(
                COALESCE(media_names[i], ''),
                COALESCE(media_types[i], ''),
                COALESCE(media_sizes[i], 0)
            ) THEN
                RAISE EXCEPTION 'Invalid media file at index %', i;
            END IF;
        END LOOP;
    END IF;
    
    -- Determine message type
    message_type_val := determine_message_type(media_types);
    
    -- Insert message
    INSERT INTO public.one_on_one_messages (
        content, author_id, chat_id, reply_to_id,
        media_urls, media_types, media_sizes, media_names, message_type
    ) VALUES (
        message_content, author_id, chat_id, reply_to_id,
        media_urls, media_types, media_sizes, media_names, message_type_val
    ) RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for messages with media information
CREATE OR REPLACE VIEW messages_with_media AS
SELECT 
    m.*,
    p.username as sender_username,
    p.full_name as sender_full_name,
    p.avatar_url as sender_avatar_url,
    -- Media information
    array_length(m.media_urls, 1) as media_count,
    m.media_urls[1] as first_media_url,
    m.media_types[1] as first_media_type,
    m.media_names[1] as first_media_name,
    m.media_sizes[1] as first_media_size
FROM public.messages m
LEFT JOIN public.profiles p ON m.user_id = p.id
WHERE m.is_deleted = FALSE OR m.is_deleted IS NULL;

-- Create view for one_on_one_messages with media information if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        EXECUTE '
        CREATE OR REPLACE VIEW one_on_one_messages_with_media AS
        SELECT 
            m.*,
            p.username as author_username,
            p.full_name as author_full_name,
            p.avatar_url as author_avatar_url,
            -- Media information
            array_length(m.media_urls, 1) as media_count,
            m.media_urls[1] as first_media_url,
            m.media_types[1] as first_media_type,
            m.media_names[1] as first_media_name,
            m.media_sizes[1] as first_media_size
        FROM public.one_on_one_messages m
        LEFT JOIN public.profiles p ON m.author_id = p.id
        WHERE m.is_deleted = FALSE OR m.is_deleted IS NULL';
    END IF;
END $$;

-- Create function to get media statistics for a chat
CREATE OR REPLACE FUNCTION get_chat_media_stats(chat_id_param UUID)
RETURNS TABLE (
    total_messages BIGINT,
    text_messages BIGINT,
    image_messages BIGINT,
    video_messages BIGINT,
    audio_messages BIGINT,
    document_messages BIGINT,
    gif_messages BIGINT,
    mixed_messages BIGINT,
    total_media_files BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE message_type = 'text') as text_messages,
        COUNT(*) FILTER (WHERE message_type = 'image') as image_messages,
        COUNT(*) FILTER (WHERE message_type = 'video') as video_messages,
        COUNT(*) FILTER (WHERE message_type = 'audio') as audio_messages,
        COUNT(*) FILTER (WHERE message_type = 'document') as document_messages,
        COUNT(*) FILTER (WHERE message_type = 'gif') as gif_messages,
        COUNT(*) FILTER (WHERE message_type = 'mixed') as mixed_messages,
        COALESCE(SUM(array_length(media_urls, 1)), 0) as total_media_files
    FROM public.messages 
    WHERE (chat_id = chat_id_param OR room_id = chat_id_param)
    AND (is_deleted = FALSE OR is_deleted IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_message_with_media(TEXT, UUID, UUID, UUID, TEXT[], TEXT[], BIGINT[], TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_one_on_one_message_with_media(TEXT, UUID, UUID, TEXT[], TEXT[], BIGINT[], TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_media_file(TEXT, TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION determine_message_type(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_media_stats(UUID) TO authenticated;
GRANT SELECT ON messages_with_media TO authenticated;

-- Grant permissions for one_on_one_messages view if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        GRANT SELECT ON one_on_one_messages_with_media TO authenticated;
    END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN public.messages.media_urls IS 'Array of media file URLs attached to the message';
COMMENT ON COLUMN public.messages.media_types IS 'Array of MIME types for the media files';
COMMENT ON COLUMN public.messages.media_sizes IS 'Array of file sizes in bytes for the media files';
COMMENT ON COLUMN public.messages.media_names IS 'Array of original file names for the media files';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, image, video, audio, document, gif, or mixed';

-- Add comments for one_on_one_messages if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        EXECUTE 'COMMENT ON COLUMN public.one_on_one_messages.media_urls IS ''Array of media file URLs attached to the message''';
        EXECUTE 'COMMENT ON COLUMN public.one_on_one_messages.media_types IS ''Array of MIME types for the media files''';
        EXECUTE 'COMMENT ON COLUMN public.one_on_one_messages.media_sizes IS ''Array of file sizes in bytes for the media files''';
        EXECUTE 'COMMENT ON COLUMN public.one_on_one_messages.media_names IS ''Array of original file names for the media files''';
        EXECUTE 'COMMENT ON COLUMN public.one_on_one_messages.message_type IS ''Type of message: text, image, video, audio, document, gif, or mixed''';
    END IF;
END $$;
