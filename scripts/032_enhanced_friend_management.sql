-- =====================================================
-- Enhanced Friend Management System
-- =====================================================
-- This script provides additional SQL functions and views for comprehensive
-- friend request management, including accept/decline functions and friend listing
-- =====================================================

-- =====================================================
-- 1. FRIEND REQUEST MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to accept a friend request
CREATE OR REPLACE FUNCTION accept_friend_request(
    p_requester_id UUID,
    p_accepter_id UUID DEFAULT auth.uid()
) RETURNS JSONB AS $$
DECLARE
    v_friendship RECORD;
    v_result JSONB;
BEGIN
    -- Check if the friend request exists and is pending
    SELECT * INTO v_friendship
    FROM friendships
    WHERE user_id = p_requester_id 
    AND friend_id = p_accepter_id 
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Friend request not found or already processed'
        );
    END IF;
    
    -- Update the friendship status to accepted
    UPDATE friendships
    SET status = 'accepted', updated_at = NOW()
    WHERE user_id = p_requester_id 
    AND friend_id = p_accepter_id 
    AND status = 'pending';
    
    -- Get the updated friendship record
    SELECT * INTO v_friendship
    FROM friendships
    WHERE user_id = p_requester_id 
    AND friend_id = p_accepter_id 
    AND status = 'accepted';
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Friend request accepted successfully',
        'friendship', to_jsonb(v_friendship)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline/reject a friend request
CREATE OR REPLACE FUNCTION decline_friend_request(
    p_requester_id UUID,
    p_decliner_id UUID DEFAULT auth.uid()
) RETURNS JSONB AS $$
DECLARE
    v_friendship RECORD;
BEGIN
    -- Check if the friend request exists and is pending
    SELECT * INTO v_friendship
    FROM friendships
    WHERE user_id = p_requester_id 
    AND friend_id = p_decliner_id 
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Friend request not found or already processed'
        );
    END IF;
    
    -- Delete the friend request (decline)
    DELETE FROM friendships
    WHERE user_id = p_requester_id 
    AND friend_id = p_decliner_id 
    AND status = 'pending';
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Friend request declined successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a friend (unfriend)
CREATE OR REPLACE FUNCTION remove_friend(
    p_friend_id UUID,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS JSONB AS $$
DECLARE
    v_friendship RECORD;
BEGIN
    -- Check if friendship exists
    SELECT * INTO v_friendship
    FROM friendships
    WHERE ((user_id = p_user_id AND friend_id = p_friend_id) 
           OR (user_id = p_friend_id AND friend_id = p_user_id))
    AND status = 'accepted';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Friendship not found'
        );
    END IF;
    
    -- Delete the friendship
    DELETE FROM friendships
    WHERE ((user_id = p_user_id AND friend_id = p_friend_id) 
           OR (user_id = p_friend_id AND friend_id = p_user_id))
    AND status = 'accepted';
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Friend removed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends with profile information
CREATE OR REPLACE FUNCTION get_user_friends(
    p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT,
    role TEXT,
    company TEXT,
    location TEXT,
    friendship_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END as friend_id,
        p.username,
        p.full_name,
        p.display_name,
        p.avatar_url,
        p.status,
        p.role,
        p.company,
        p.location,
        f.created_at as friendship_created_at
    FROM friendships f
    JOIN profiles p ON (
        CASE 
            WHEN f.user_id = p_user_id THEN p.id = f.friend_id
            ELSE p.id = f.user_id
        END
    )
    WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
    AND f.status = 'accepted'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests for a user
CREATE OR REPLACE FUNCTION get_pending_friend_requests(
    p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
    request_id UUID,
    requester_id UUID,
    username TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT,
    role TEXT,
    company TEXT,
    location TEXT,
    request_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as request_id,
        f.user_id as requester_id,
        p.username,
        p.full_name,
        p.display_name,
        p.avatar_url,
        p.status,
        p.role,
        p.company,
        p.location,
        f.created_at as request_created_at
    FROM friendships f
    JOIN profiles p ON p.id = f.user_id
    WHERE f.friend_id = p_user_id
    AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sent friend requests by a user
CREATE OR REPLACE FUNCTION get_sent_friend_requests(
    p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
    request_id UUID,
    recipient_id UUID,
    username TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT,
    role TEXT,
    company TEXT,
    location TEXT,
    request_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as request_id,
        f.friend_id as recipient_id,
        p.username,
        p.full_name,
        p.display_name,
        p.avatar_url,
        p.status,
        p.role,
        p.company,
        p.location,
        f.created_at as request_created_at
    FROM friendships f
    JOIN profiles p ON p.id = f.friend_id
    WHERE f.user_id = p_user_id
    AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. VIEWS FOR EASY FRIEND DATA ACCESS
-- =====================================================

-- View for user's friends with complete profile information
CREATE OR REPLACE VIEW user_friends AS
SELECT 
    f.id as friendship_id,
    CASE 
        WHEN f.user_id = auth.uid() THEN f.friend_id
        ELSE f.user_id
    END as friend_id,
    p.username,
    p.full_name,
    p.display_name,
    p.avatar_url,
    p.status as user_status,
    p.role,
    p.company,
    p.location,
    p.bio,
    p.github_url,
    p.linkedin_url,
    p.portfolio_url,
    f.created_at as friendship_created_at,
    f.updated_at as friendship_updated_at
FROM friendships f
JOIN profiles p ON (
    CASE 
        WHEN f.user_id = auth.uid() THEN p.id = f.friend_id
        ELSE p.id = f.user_id
    END
)
WHERE (f.user_id = auth.uid() OR f.friend_id = auth.uid())
AND f.status = 'accepted';

-- View for pending friend requests received by the user
CREATE OR REPLACE VIEW pending_friend_requests AS
SELECT 
    f.id as request_id,
    f.user_id as requester_id,
    p.username,
    p.full_name,
    p.display_name,
    p.avatar_url,
    p.status as user_status,
    p.role,
    p.company,
    p.location,
    p.bio,
    f.created_at as request_created_at
FROM friendships f
JOIN profiles p ON p.id = f.user_id
WHERE f.friend_id = auth.uid()
AND f.status = 'pending';

-- View for sent friend requests by the user
CREATE OR REPLACE VIEW sent_friend_requests AS
SELECT 
    f.id as request_id,
    f.friend_id as recipient_id,
    p.username,
    p.full_name,
    p.display_name,
    p.avatar_url,
    p.status as user_status,
    p.role,
    p.company,
    p.location,
    p.bio,
    f.created_at as request_created_at
FROM friendships f
JOIN profiles p ON p.id = f.friend_id
WHERE f.user_id = auth.uid()
AND f.status = 'pending';

-- =====================================================
-- 3. HELPER FUNCTIONS FOR GROUP CREATION
-- =====================================================

-- Function to get friends for group creation (simplified version)
CREATE OR REPLACE FUNCTION get_friends_for_groups(
    p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT,
    role TEXT,
    company TEXT,
    location TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.display_name,
        p.avatar_url,
        p.status,
        p.role,
        p.company,
        p.location
    FROM friendships f
    JOIN profiles p ON (
        CASE 
            WHEN f.user_id = p_user_id THEN p.id = f.friend_id
            ELSE p.id = f.user_id
        END
    )
    WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
    AND f.status = 'accepted'
    ORDER BY p.full_name, p.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FRIEND STATISTICS FUNCTIONS
-- =====================================================

-- Function to get friend count for a user
CREATE OR REPLACE FUNCTION get_friend_count(
    p_user_id UUID DEFAULT auth.uid()
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM friendships
    WHERE (user_id = p_user_id OR friend_id = p_user_id)
    AND status = 'accepted';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending requests count
CREATE OR REPLACE FUNCTION get_pending_requests_count(
    p_user_id UUID DEFAULT auth.uid()
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM friendships
    WHERE friend_id = p_user_id
    AND status = 'pending';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Enhanced Friend Management System Created!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '- accept_friend_request() - Accept friend requests';
    RAISE NOTICE '- decline_friend_request() - Decline friend requests';
    RAISE NOTICE '- remove_friend() - Remove/unfriend users';
    RAISE NOTICE '- get_user_friends() - Get user''s friends with profiles';
    RAISE NOTICE '- get_pending_friend_requests() - Get pending requests';
    RAISE NOTICE '- get_sent_friend_requests() - Get sent requests';
    RAISE NOTICE '- get_friends_for_groups() - Get friends for group creation';
    RAISE NOTICE '- get_friend_count() - Get friend count';
    RAISE NOTICE '- get_pending_requests_count() - Get pending count';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '- user_friends - User''s friends with complete profiles';
    RAISE NOTICE '- pending_friend_requests - Pending requests received';
    RAISE NOTICE '- sent_friend_requests - Requests sent by user';
    RAISE NOTICE '';
    RAISE NOTICE 'All functions are ready for use in API routes and components!';
    RAISE NOTICE '=====================================================';
END $$;
