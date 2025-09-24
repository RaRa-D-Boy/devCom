-- Simple chat tables for direct messaging (IDEMPOTENT VERSION)
-- Run this script in your Supabase SQL editor to fix the chat functionality
-- This version is safe to run multiple times without errors

-- Create chats table for one-on-one conversations
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  friend_id UUID,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints with explicit names for chats table
DO $$ 
BEGIN
    -- Add user_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chats_user_id_fkey' 
        AND table_name = 'chats'
    ) THEN
        ALTER TABLE public.chats 
        ADD CONSTRAINT chats_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add friend_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chats_friend_id_fkey' 
        AND table_name = 'chats'
    ) THEN
        ALTER TABLE public.chats 
        ADD CONSTRAINT chats_friend_id_fkey 
        FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add new columns to messages table for direct messaging
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_id UUID,
ADD COLUMN IF NOT EXISTS receiver_id UUID,
ADD COLUMN IF NOT EXISTS chat_id UUID;

-- Add foreign key constraints with explicit names
DO $$ 
BEGIN
    -- Add sender_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add receiver_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_receiver_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_receiver_id_fkey 
        FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add chat_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_chat_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_friend_id ON public.chats(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.messages;

-- Create RLS policies for chats using DO blocks to handle existence checks
DO $$ 
BEGIN
    -- Create policy only if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can view their own chats' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "Users can view their own chats" ON public.chats FOR SELECT USING (
            auth.uid() = user_id OR auth.uid() = friend_id
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can create chats' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "Users can create chats" ON public.chats FOR INSERT WITH CHECK (
            auth.uid() = user_id
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can update their own chats' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "Users can update their own chats" ON public.chats FOR UPDATE USING (
            auth.uid() = user_id OR auth.uid() = friend_id
        );
    END IF;
END $$;

-- Create RLS policies for direct messages using DO blocks
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can view direct messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN
        CREATE POLICY "Users can view direct messages" ON public.messages FOR SELECT USING (
            auth.uid() = sender_id OR auth.uid() = receiver_id
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can send direct messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN
        CREATE POLICY "Users can send direct messages" ON public.messages FOR INSERT WITH CHECK (
            auth.uid() = sender_id
        );
    END IF;
END $$;
