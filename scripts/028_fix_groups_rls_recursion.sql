-- =====================================================
-- Fix Groups RLS Recursion Error
-- =====================================================
-- This script fixes the infinite recursion error in group_members RLS policies
-- by dropping the problematic policies and recreating them with simpler logic
-- =====================================================

-- Drop ALL existing policies on group_members and group_join_requests to avoid conflicts
DROP POLICY IF EXISTS "Group members can view other members" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage all members" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can view group members" ON group_members;
DROP POLICY IF EXISTS "Group members can view join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group creators and admins can update join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group creators can view join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group creators can update join requests" ON group_join_requests;

-- Create simplified, non-recursive policies for group_members
CREATE POLICY "Users can view their own memberships" ON group_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Group creators can manage all members" ON group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id AND groups.creator_id = auth.uid()
        )
    );

-- Allow authenticated users to view group members (for public groups)
CREATE POLICY "Authenticated users can view group members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id AND NOT groups.is_private
        )
    );

-- Create simplified policies for group_join_requests
CREATE POLICY "Group creators can view join requests" ON group_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_join_requests.group_id AND groups.creator_id = auth.uid()
        )
    );

CREATE POLICY "Group creators can update join requests" ON group_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_join_requests.group_id AND groups.creator_id = auth.uid()
        )
    );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Groups RLS Recursion Error Fixed!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Fixed policies:';
    RAISE NOTICE '- group_members: Removed recursive policies';
    RAISE NOTICE '- group_join_requests: Simplified to avoid recursion';
    RAISE NOTICE '';
    RAISE NOTICE 'New simplified policies:';
    RAISE NOTICE '- Users can view their own memberships';
    RAISE NOTICE '- Group creators can manage all members';
    RAISE NOTICE '- Authenticated users can view public group members';
    RAISE NOTICE '- Group creators can view/update join requests';
    RAISE NOTICE '';
    RAISE NOTICE 'The infinite recursion error should now be resolved.';
    RAISE NOTICE '=====================================================';
END $$;
