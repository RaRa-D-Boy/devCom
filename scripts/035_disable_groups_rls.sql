-- =====================================================
-- Disable RLS on Groups Table - Last Resort Fix
-- =====================================================
-- This script completely disables Row Level Security on the groups table
-- as a last resort to resolve infinite recursion issues
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
DROP POLICY IF EXISTS "Emergency: Users can view all groups" ON groups;
DROP POLICY IF EXISTS "Emergency: Users can create groups" ON groups;
DROP POLICY IF EXISTS "Emergency: Users can update groups" ON groups;
DROP POLICY IF EXISTS "Emergency: Users can delete groups" ON groups;

-- =====================================================
-- 2. DISABLE ROW LEVEL SECURITY ON GROUPS TABLE
-- =====================================================

-- Disable RLS on groups table
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. VERIFY RLS IS DISABLED
-- =====================================================

-- Check if RLS is disabled
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'groups';
    
    -- Check policy count
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'groups';
    
    RAISE NOTICE 'Groups table RLS status: %', 
        CASE WHEN rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END;
    RAISE NOTICE 'Groups table policy count: %', policy_count;
    
    IF NOT rls_enabled THEN
        RAISE NOTICE 'SUCCESS: RLS is disabled on groups table!';
    ELSE
        RAISE WARNING 'RLS is still enabled on groups table!';
    END IF;
    
    IF policy_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All policies removed from groups table!';
    ELSE
        RAISE WARNING 'Still have % policies on groups table!', policy_count;
    END IF;
END $$;

-- =====================================================
-- 4. COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'GROUPS TABLE RLS DISABLED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Row Level Security has been completely disabled';
    RAISE NOTICE 'on the groups table.';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: This means:';
    RAISE NOTICE '- No access control on groups table';
    RAISE NOTICE '- Any user can perform any operation';
    RAISE NOTICE '- Security is handled at application level only';
    RAISE NOTICE '';
    RAISE NOTICE 'This is a temporary fix for development.';
    RAISE NOTICE 'Re-enable RLS with proper policies in production.';
    RAISE NOTICE '=====================================================';
END $$;
