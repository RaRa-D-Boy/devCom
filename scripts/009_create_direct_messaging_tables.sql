-- Create direct messaging tables for one-on-one chats
-- This script adds the missing tables for the chat functionality

-- Create chats table for one-on-one conversations
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Update messages table to support both room messages and direct messages
-- Add new columns to existing messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_friend_id ON public.chats(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- Enable Row Level Security for chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Chats policies
CREATE POLICY "Users can view their own chats" ON public.chats FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

CREATE POLICY "Users can create chats" ON public.chats FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update their own chats" ON public.chats FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Update messages policies to support direct messages
DROP POLICY IF EXISTS "Users can view messages in rooms they're members of" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in rooms they're members of" ON public.messages;

-- New messages policies that support both room and direct messages
CREATE POLICY "Users can view messages in rooms they're members of" ON public.messages FOR SELECT USING (
  -- For room messages
  (room_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = messages.room_id AND user_id = auth.uid()
  ))
  OR
  -- For direct messages
  (chat_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chats 
    WHERE id = messages.chat_id AND (user_id = auth.uid() OR friend_id = auth.uid())
  ))
);

CREATE POLICY "Users can insert messages in rooms they're members of" ON public.messages FOR INSERT WITH CHECK (
  -- For room messages
  (room_id IS NOT NULL AND auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = messages.room_id AND user_id = auth.uid()
  ))
  OR
  -- For direct messages
  (chat_id IS NOT NULL AND auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.chats 
    WHERE id = messages.chat_id AND (user_id = auth.uid() OR friend_id = auth.uid())
  ))
);

-- Create function to automatically update last_message in chats table
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the chat's last message when a new message is inserted
  IF NEW.chat_id IS NOT NULL THEN
    UPDATE public.chats 
    SET 
      last_message = NEW.content,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update chat last message
DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON public.messages;
CREATE TRIGGER trigger_update_chat_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();

-- Create function to handle chat creation when first message is sent
CREATE OR REPLACE FUNCTION create_chat_if_not_exists()
RETURNS TRIGGER AS $$
DECLARE
  chat_record public.chats%ROWTYPE;
BEGIN
  -- Only process if this is a direct message (has sender_id and receiver_id)
  IF NEW.sender_id IS NOT NULL AND NEW.receiver_id IS NOT NULL AND NEW.chat_id IS NULL THEN
    -- Try to find existing chat
    SELECT * INTO chat_record 
    FROM public.chats 
    WHERE (user_id = NEW.sender_id AND friend_id = NEW.receiver_id) 
       OR (user_id = NEW.receiver_id AND friend_id = NEW.sender_id);
    
    -- If no chat exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.chats (user_id, friend_id)
      VALUES (NEW.sender_id, NEW.receiver_id)
      RETURNING * INTO chat_record;
    END IF;
    
    -- Update the message with the chat_id
    NEW.chat_id = chat_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create chats
DROP TRIGGER IF EXISTS trigger_create_chat_if_not_exists ON public.messages;
CREATE TRIGGER trigger_create_chat_if_not_exists
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_if_not_exists();
