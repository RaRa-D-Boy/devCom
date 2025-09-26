-- =====================================================
-- Emergency Groups Table Fix - Ultra Permissive Policies
-- =====================================================
-- This script provides ultra-permissive RLS policies for the groups table
-- to resolve any persistent infinite recursion issues
-- =====================================================

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES ON GROUPS TABLE
-- =====================================================

-- Drop ALL existing policies on groups table
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they created" ON groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups" ON groups;
DROP POLICY IF EXISTS "Group creators can manage groups" ON groups;
DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Users can view all groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can update groups" ON groups;
DROP POLICY IF EXISTS "Users can delete groups" ON groups;

-- =====================================================
-- 2. CREATE ULTRA-PERMISSIVE POLICIES
-- =====================================================

-- Ultra-permissive policies that allow all operations for authenticated users
CREATE POLICY "Emergency: Users can view all groups" ON groups
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Emergency: Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Emergency: Users can update groups" ON groups
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Emergency: Users can delete groups" ON groups
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 3. VERIFY POLICIES ARE CREATED
-- =====================================================

-- Check if policies were created successfully
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'groups';
    
    RAISE NOTICE 'Groups table now has % emergency RLS policies', policy_count;
    
    IF policy_count = 0 THEN
        RAISE WARNING 'No policies found on groups table!';
    ELSE
        RAISE NOTICE 'Emergency groups RLS policies created successfully!';
    END IF;
END $$;

-- =====================================================
-- 4. COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'EMERGENCY GROUPS TABLE FIX APPLIED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Ultra-permissive policies created:';
    RAISE NOTICE '- Emergency: Users can view all groups';
    RAISE NOTICE '- Emergency: Users can create groups';
    RAISE NOTICE '- Emergency: Users can update groups';
    RAISE NOTICE '- Emergency: Users can delete groups';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: These policies are very permissive!';
    RAISE NOTICE 'They allow any authenticated user to perform';
    RAISE NOTICE 'any operation on the groups table.';
    RAISE NOTICE '';
    RAISE NOTICE 'Use this only as a temporary fix while';
    RAISE NOTICE 'developing more restrictive policies.';
    RAISE NOTICE '=====================================================';
END $$;
