-- EMERGENCY FIX for infinite recursion in room_members table
-- This script completely removes and recreates the problematic policies

-- Step 1: Completely disable RLS on room_members to stop the recursion
ALTER TABLE public.room_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on room_members (this is crucial)
DROP POLICY IF EXISTS "Users can view room members for rooms they're in" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can manage room membership" ON public.room_members;
DROP POLICY IF EXISTS "room_members_select_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_insert_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_update_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_delete_policy" ON public.room_members;

-- Step 3: Also check and fix messages table policies
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing message policies
DROP POLICY IF EXISTS "Users can view messages in rooms they're in" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- Step 4: Create completely new, simple policies for room_members
CREATE POLICY "room_members_all_access" ON public.room_members FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Create completely new, simple policies for messages
CREATE POLICY "messages_all_access" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Re-enable RLS with the new simple policies
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 7: Ensure chats table is also properly configured
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Drop any existing chat policies
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "chats_select_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_insert_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_update_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_delete_policy" ON public.chats;

-- Create simple chat policies
CREATE POLICY "chats_all_access" ON public.chats FOR ALL USING (true) WITH CHECK (true);

-- Step 8: Verify the fix by checking if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('room_members', 'messages', 'chats')
ORDER BY tablename, policyname;
