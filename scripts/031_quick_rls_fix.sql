-- =====================================================
-- Quick RLS Fix - One-liner Solution
-- =====================================================
-- Run this single command in Supabase SQL editor to fix the recursion error
-- =====================================================

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
CREATE POLICY "Users can view their own memberships" ON group_members
    FOR SELECT USING (user_id = auth.uid());
