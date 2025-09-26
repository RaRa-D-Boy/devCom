-- =====================================================
-- Fix Groups Table Infinite Recursion Error
-- =====================================================
-- This script fixes the infinite recursion error in the groups table RLS policies
-- by simplifying the policies and removing recursive references
-- =====================================================

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES ON GROUPS TABLE
-- =====================================================

-- Drop all existing policies on groups table to avoid conflicts
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they created" ON groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups" ON groups;
DROP POLICY IF EXISTS "Group creators can manage groups" ON groups;
DROP POLICY IF EXISTS "Group members can view groups" ON groups;

-- =====================================================
-- 2. CREATE SIMPLIFIED, NON-RECURSIVE POLICIES
-- =====================================================

-- Policy 1: Users can view public groups (non-private groups)
CREATE POLICY "Users can view public groups" ON groups
    FOR SELECT USING (
        NOT is_private
    );

-- Policy 2: Users can view groups they created
CREATE POLICY "Users can view groups they created" ON groups
    FOR SELECT USING (
        creator_id = auth.uid()
    );

-- Policy 3: Users can view groups they are members of (simplified)
CREATE POLICY "Users can view groups they are members of" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()
            AND group_members.status = 'active'
        )
    );

-- Policy 4: Group creators can update their groups
CREATE POLICY "Group creators can update their groups" ON groups
    FOR UPDATE USING (
        creator_id = auth.uid()
    );

-- Policy 5: Group creators can delete their groups
CREATE POLICY "Group creators can delete their groups" ON groups
    FOR DELETE USING (
        creator_id = auth.uid()
    );

-- Policy 6: Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups" ON groups
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- 3. ALTERNATIVE: ULTRA-PERMISSIVE POLICIES (EMERGENCY FIX)
-- =====================================================

-- If the above policies still cause issues, uncomment these ultra-permissive policies
-- and comment out the above policies

/*
-- Ultra-permissive policies for emergency fix
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they created" ON groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

CREATE POLICY "Users can view all groups" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update groups" ON groups
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete groups" ON groups
    FOR DELETE USING (true);
*/

-- =====================================================
-- 4. VERIFY POLICIES ARE CREATED
-- =====================================================

-- Check if policies were created successfully
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'groups';
    
    RAISE NOTICE 'Groups table now has % RLS policies', policy_count;
    
    IF policy_count = 0 THEN
        RAISE WARNING 'No policies found on groups table!';
    ELSE
        RAISE NOTICE 'Groups RLS policies created successfully!';
    END IF;
END $$;

-- =====================================================
-- 5. COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Groups Table Infinite Recursion Fix Applied!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '- Users can view public groups';
    RAISE NOTICE '- Users can view groups they created';
    RAISE NOTICE '- Users can view groups they are members of';
    RAISE NOTICE '- Group creators can update their groups';
    RAISE NOTICE '- Group creators can delete their groups';
    RAISE NOTICE '- Authenticated users can create groups';
    RAISE NOTICE '';
    RAISE NOTICE 'If you still get recursion errors, uncomment the';
    RAISE NOTICE 'ultra-permissive policies section for emergency fix.';
    RAISE NOTICE '=====================================================';
END $$;
