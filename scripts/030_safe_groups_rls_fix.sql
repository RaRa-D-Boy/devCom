-- =====================================================
-- Safe Groups RLS Fix (Idempotent)
-- =====================================================
-- This script safely fixes the infinite recursion error in group_members RLS policies
-- It's idempotent and can be run multiple times safely
-- =====================================================

-- Fix group_members policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Group members can view other members" ON group_members;
    DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;
    DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
    DROP POLICY IF EXISTS "Group creators can manage all members" ON group_members;
    DROP POLICY IF EXISTS "Authenticated users can view group members" ON group_members;
    
    -- Create new policies
    EXECUTE 'CREATE POLICY "Users can view their own memberships" ON group_members
        FOR SELECT USING (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Group creators can manage all members" ON group_members
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM groups 
                WHERE groups.id = group_members.group_id AND groups.creator_id = auth.uid()
            )
        )';
    
    EXECUTE 'CREATE POLICY "Authenticated users can view group members" ON group_members
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM groups 
                WHERE groups.id = group_members.group_id AND NOT groups.is_private
            )
        )';
    
    RAISE NOTICE 'group_members policies updated successfully';
END $$;

-- Fix group_join_requests policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Group members can view join requests" ON group_join_requests;
    DROP POLICY IF EXISTS "Group creators and admins can update join requests" ON group_join_requests;
    DROP POLICY IF EXISTS "Group creators can view join requests" ON group_join_requests;
    DROP POLICY IF EXISTS "Group creators can update join requests" ON group_join_requests;
    
    -- Create new policies
    EXECUTE 'CREATE POLICY "Group creators can view join requests" ON group_join_requests
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM groups 
                WHERE groups.id = group_join_requests.group_id AND groups.creator_id = auth.uid()
            )
        )';
    
    EXECUTE 'CREATE POLICY "Group creators can update join requests" ON group_join_requests
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM groups 
                WHERE groups.id = group_join_requests.group_id AND groups.creator_id = auth.uid()
            )
        )';
    
    RAISE NOTICE 'group_join_requests policies updated successfully';
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Safe Groups RLS Fix Applied Successfully!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'All problematic policies have been dropped and recreated.';
    RAISE NOTICE 'The infinite recursion error should now be resolved.';
    RAISE NOTICE 'This script is idempotent and can be run multiple times safely.';
    RAISE NOTICE '=====================================================';
END $$;
