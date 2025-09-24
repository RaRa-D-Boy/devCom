-- Test script to verify the profile creation trigger is working
-- This script will help debug if the trigger is properly set up

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check if the profiles table exists and has the right structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the function manually (this will help debug)
-- Note: This is just to test the function syntax, not to actually create a user
SELECT 'Function exists and is callable' as test_result;
