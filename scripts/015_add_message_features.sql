-- Add message editing, replying, and deletion features
-- This script adds the necessary columns and functionality for advanced messaging

-- Add new columns to messages table for advanced features
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS original_content TEXT; -- Store original content for edited messages

-- Add new columns to one_on_one_messages table if it exists
DO $$
BEGIN
    -- Check if one_on_one_messages table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        ALTER TABLE public.one_on_one_messages 
        ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.one_on_one_messages(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS original_content TEXT;
    END IF;
END $$;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_is_edited ON public.messages(is_edited);

-- Create indexes for one_on_one_messages if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_reply_to_id ON public.one_on_one_messages(reply_to_id);
        CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_is_deleted ON public.one_on_one_messages(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_is_edited ON public.one_on_one_messages(is_edited);
    END IF;
END $$;

-- Create function to handle message editing
CREATE OR REPLACE FUNCTION edit_message(
    message_id UUID,
    new_content TEXT,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Get the message and verify ownership
    SELECT * INTO message_record 
    FROM public.messages 
    WHERE id = message_id AND (sender_id = user_id OR user_id = user_id);
    
    -- Check if message exists and user owns it
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if message is already deleted
    IF message_record.is_deleted THEN
        RETURN FALSE;
    END IF;
    
    -- Update the message
    UPDATE public.messages 
    SET 
        content = new_content,
        original_content = COALESCE(original_content, content), -- Store original if not already stored
        is_edited = TRUE,
        edited_at = NOW()
    WHERE id = message_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle message deletion (soft delete)
CREATE OR REPLACE FUNCTION delete_message(
    message_id UUID,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Get the message and verify ownership
    SELECT * INTO message_record 
    FROM public.messages 
    WHERE id = message_id AND (sender_id = user_id OR user_id = user_id);
    
    -- Check if message exists and user owns it
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if message is already deleted
    IF message_record.is_deleted THEN
        RETURN FALSE;
    END IF;
    
    -- Soft delete the message
    UPDATE public.messages 
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        content = '[Message deleted]' -- Replace content with placeholder
    WHERE id = message_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle message editing for one_on_one_messages
CREATE OR REPLACE FUNCTION edit_one_on_one_message(
    message_id UUID,
    new_content TEXT,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        RETURN FALSE;
    END IF;
    
    -- Get the message and verify ownership
    SELECT * INTO message_record 
    FROM public.one_on_one_messages 
    WHERE id = message_id AND author_id = user_id;
    
    -- Check if message exists and user owns it
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if message is already deleted
    IF message_record.is_deleted THEN
        RETURN FALSE;
    END IF;
    
    -- Update the message
    UPDATE public.one_on_one_messages 
    SET 
        content = new_content,
        original_content = COALESCE(original_content, content), -- Store original if not already stored
        is_edited = TRUE,
        edited_at = NOW()
    WHERE id = message_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle message deletion for one_on_one_messages
CREATE OR REPLACE FUNCTION delete_one_on_one_message(
    message_id UUID,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        RETURN FALSE;
    END IF;
    
    -- Get the message and verify ownership
    SELECT * INTO message_record 
    FROM public.one_on_one_messages 
    WHERE id = message_id AND author_id = user_id;
    
    -- Check if message exists and user owns it
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if message is already deleted
    IF message_record.is_deleted THEN
        RETURN FALSE;
    END IF;
    
    -- Soft delete the message
    UPDATE public.one_on_one_messages 
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        content = '[Message deleted]' -- Replace content with placeholder
    WHERE id = message_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to support message editing and deletion
DO $$
BEGIN
    -- Add update policy for messages if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can update their own messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN
        CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (
            auth.uid() = sender_id AND is_deleted = FALSE
        );
    END IF;
    
    -- Add delete policy for messages if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can delete their own messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN
        CREATE POLICY "Users can delete their own messages" ON public.messages FOR UPDATE USING (
            auth.uid() = sender_id AND is_deleted = FALSE
        );
    END IF;
END $$;

-- Add policies for one_on_one_messages if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        -- Add update policy for one_on_one_messages if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policy 
            WHERE polname = 'Users can update their own one_on_one_messages' 
            AND polrelid = 'public.one_on_one_messages'::regclass
        ) THEN
            CREATE POLICY "Users can update their own one_on_one_messages" ON public.one_on_one_messages FOR UPDATE USING (
                auth.uid() = author_id AND is_deleted = FALSE
            );
        END IF;
        
        -- Add delete policy for one_on_one_messages if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policy 
            WHERE polname = 'Users can delete their own one_on_one_messages' 
            AND polrelid = 'public.one_on_one_messages'::regclass
        ) THEN
            CREATE POLICY "Users can delete their own one_on_one_messages" ON public.one_on_one_messages FOR UPDATE USING (
                auth.uid() = author_id AND is_deleted = FALSE
            );
        END IF;
    END IF;
END $$;

-- Create view for messages with reply information
CREATE OR REPLACE VIEW messages_with_replies AS
SELECT 
    m.*,
    r.content as reply_to_content,
    r.sender_id as reply_to_sender_id,
    r.created_at as reply_to_created_at,
    p.username as reply_to_username,
    p.full_name as reply_to_full_name
FROM public.messages m
LEFT JOIN public.messages r ON m.reply_to_id = r.id
LEFT JOIN public.profiles p ON r.sender_id = p.id
WHERE m.is_deleted = FALSE;

-- Create view for one_on_one_messages with reply information if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        EXECUTE '
        CREATE OR REPLACE VIEW one_on_one_messages_with_replies AS
        SELECT 
            m.*,
            r.content as reply_to_content,
            r.author_id as reply_to_author_id,
            r.created_at as reply_to_created_at,
            p.username as reply_to_username,
            p.full_name as reply_to_full_name
        FROM public.one_on_one_messages m
        LEFT JOIN public.one_on_one_messages r ON m.reply_to_id = r.id
        LEFT JOIN public.profiles p ON r.author_id = p.id
        WHERE m.is_deleted = FALSE';
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION edit_message(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION edit_one_on_one_message(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_one_on_one_message(UUID, UUID) TO authenticated;
GRANT SELECT ON messages_with_replies TO authenticated;

-- Grant permissions for one_on_one_messages view if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'one_on_one_messages') THEN
        GRANT SELECT ON one_on_one_messages_with_replies TO authenticated;
    END IF;
END $$;
