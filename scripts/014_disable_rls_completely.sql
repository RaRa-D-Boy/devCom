-- COMPLETE RLS DISABLE for testing purposes
-- This script disables RLS on all chat-related tables to eliminate any policy issues

-- Disable RLS on all chat-related tables
ALTER TABLE public.room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies from these tables to ensure clean state
DROP POLICY IF EXISTS "Users can view room members for rooms they're in" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can manage room membership" ON public.room_members;
DROP POLICY IF EXISTS "room_members_select_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_insert_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_update_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_delete_policy" ON public.room_members;
DROP POLICY IF EXISTS "room_members_all_access" ON public.room_members;

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
DROP POLICY IF EXISTS "messages_all_access" ON public.messages;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "chats_select_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_insert_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_update_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_delete_policy" ON public.chats;
DROP POLICY IF EXISTS "chats_all_access" ON public.chats;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('room_members', 'messages', 'chats', 'chat_rooms')
AND schemaname = 'public';

-- Show that no policies exist
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('room_members', 'messages', 'chats', 'chat_rooms')
AND schemaname = 'public';
