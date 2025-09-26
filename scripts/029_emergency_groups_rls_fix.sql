-- =====================================================
-- Emergency Groups RLS Fix
-- =====================================================
-- This script provides an emergency fix for RLS recursion issues
-- by temporarily using more permissive policies
-- =====================================================

-- Drop ALL existing policies on group_members and group_join_requests
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage all members" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group creators can view join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group creators can update join requests" ON group_join_requests;

-- Create very simple, permissive policies to avoid recursion
CREATE POLICY "Authenticated users can view group members" ON group_members
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage group members" ON group_members
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view join requests" ON group_join_requests
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage join requests" ON group_join_requests
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Emergency Groups RLS Fix Applied!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'All group_members and group_join_requests policies';
    RAISE NOTICE 'have been replaced with simple authenticated user policies.';
    RAISE NOTICE '';
    RAISE NOTICE 'This is a temporary fix to resolve recursion issues.';
    RAISE NOTICE 'Consider implementing more specific policies later.';
    RAISE NOTICE '=====================================================';
END $$;
