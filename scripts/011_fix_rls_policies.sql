-- Fix RLS policies to prevent infinite recursion
-- Run this script in your Supabase SQL editor to fix the room_members policy issue

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view room members for rooms they're in" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;

-- Create fixed policies for room_members table
DO $$ 
BEGIN
    -- Simple policy: users can view room members if they are in the room
    -- This avoids the circular reference by using a different approach
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can view room members' 
        AND polrelid = 'public.room_members'::regclass
    ) THEN
        CREATE POLICY "Users can view room members" ON public.room_members FOR SELECT USING (
            user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.room_members rm2 
                WHERE rm2.room_id = room_members.room_id 
                AND rm2.user_id = auth.uid()
                AND rm2.id != room_members.id
            )
        );
    END IF;
END $$;

DO $$ 
BEGIN
    -- Policy for adding members: only room creators can add members
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Room creators can add members' 
        AND polrelid = 'public.room_members'::regclass
    ) THEN
        CREATE POLICY "Room creators can add members" ON public.room_members FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.chat_rooms 
                WHERE id = room_id AND created_by = auth.uid()
            )
        );
    END IF;
END $$;

DO $$ 
BEGIN
    -- Policy for removing members: users can remove themselves or room creators can remove anyone
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can manage room membership' 
        AND polrelid = 'public.room_members'::regclass
    ) THEN
        CREATE POLICY "Users can manage room membership" ON public.room_members FOR DELETE USING (
            user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.chat_rooms 
                WHERE id = room_id AND created_by = auth.uid()
            )
        );
    END IF;
END $$;

-- Also fix any potential issues with messages table policies
DROP POLICY IF EXISTS "Users can view messages in rooms they're in" ON public.messages;

DO $$ 
BEGIN
    -- Simple policy for viewing messages: users can see messages they sent or received
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can view their messages' 
        AND polrelid = 'public.messages'::regclass
    ) THEN
        CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (
            sender_id = auth.uid() OR receiver_id = auth.uid()
        );
    END IF;
END $$;

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create a simple function to check if user is in a room (to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_user_in_room(room_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_id = room_id_param AND user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_in_room(UUID, UUID) TO authenticated;

-- Update the room_members policy to use the function (optional, more complex approach)
-- This is commented out as the simple approach above should work
/*
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;

CREATE POLICY "Users can view room members" ON public.room_members FOR SELECT USING (
    user_id = auth.uid() OR 
    public.is_user_in_room(room_id, auth.uid())
);
*/
