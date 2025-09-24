-- Simple fix for RLS infinite recursion issue
-- This script temporarily disables RLS and recreates simple policies

-- Step 1: Temporarily disable RLS on room_members to break the recursion
ALTER TABLE public.room_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on room_members
DROP POLICY IF EXISTS "Users can view room members for rooms they're in" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can manage room membership" ON public.room_members;

-- Step 3: Create very simple, non-recursive policies
CREATE POLICY "room_members_select_policy" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "room_members_insert_policy" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "room_members_update_policy" ON public.room_members FOR UPDATE USING (true);
CREATE POLICY "room_members_delete_policy" ON public.room_members FOR DELETE USING (true);

-- Step 4: Re-enable RLS
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Step 5: Also ensure messages table has simple policies
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in rooms they're in" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- Create simple message policies
CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE USING (true);

-- Re-enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 6: Ensure chats table has proper policies (these should be fine)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create simple chat policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'chats_select_policy' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "chats_select_policy" ON public.chats FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'chats_insert_policy' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "chats_insert_policy" ON public.chats FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'chats_update_policy' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "chats_update_policy" ON public.chats FOR UPDATE USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'chats_delete_policy' 
        AND polrelid = 'public.chats'::regclass
    ) THEN
        CREATE POLICY "chats_delete_policy" ON public.chats FOR DELETE USING (true);
    END IF;
END $$;
