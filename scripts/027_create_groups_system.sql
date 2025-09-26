-- =====================================================
-- Groups Management System
-- =====================================================
-- This script creates a comprehensive group management system with:
-- - Groups with creator and settings
-- - Group members with different roles and permissions
-- - Group join requests
-- - Group permissions system
-- - RLS policies for security
-- =====================================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS group_join_requests CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- =====================================================
-- 1. GROUPS TABLE
-- =====================================================
CREATE TABLE groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 100,
    allow_member_invites BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. GROUP MEMBERS TABLE
-- =====================================================
CREATE TABLE group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'moderator', 'member')),
    
    -- Permissions (can be granted by creator/admin)
    can_add_members BOOLEAN DEFAULT false,
    can_remove_members BOOLEAN DEFAULT false,
    can_edit_group_info BOOLEAN DEFAULT false,
    can_manage_permissions BOOLEAN DEFAULT false,
    can_delete_group BOOLEAN DEFAULT false,
    can_pin_messages BOOLEAN DEFAULT false,
    can_delete_messages BOOLEAN DEFAULT false,
    
    -- Member status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'muted', 'banned', 'left')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate memberships
    UNIQUE(group_id, user_id)
);

-- =====================================================
-- 3. GROUP JOIN REQUESTS TABLE
-- =====================================================
CREATE TABLE group_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Who made the request
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    message TEXT, -- Optional message from requester
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who approved/rejected
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate requests
    UNIQUE(group_id, user_id)
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_groups_creator_id ON groups(creator_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_groups_is_private ON groups(is_private);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);
CREATE INDEX idx_group_members_status ON group_members(status);
CREATE INDEX idx_group_members_joined_at ON group_members(joined_at DESC);

CREATE INDEX idx_group_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX idx_group_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX idx_group_join_requests_status ON group_join_requests(status);
CREATE INDEX idx_group_join_requests_created_at ON group_join_requests(created_at DESC);

-- =====================================================
-- 5. FUNCTIONS FOR GROUP MANAGEMENT
-- =====================================================

-- Function to create a group and add creator as admin
CREATE OR REPLACE FUNCTION create_group(
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_cover_image_url TEXT DEFAULT NULL,
    p_is_private BOOLEAN DEFAULT false,
    p_max_members INTEGER DEFAULT 100,
    p_allow_member_invites BOOLEAN DEFAULT true,
    p_require_approval BOOLEAN DEFAULT true,
    p_creator_id UUID DEFAULT auth.uid(),
    p_initial_members UUID[] DEFAULT NULL,
    p_initial_admins UUID[] DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
    v_member_id UUID;
    v_admin_id UUID;
BEGIN
    -- Create the group
    INSERT INTO groups (
        name, description, avatar_url, cover_image_url, creator_id,
        is_private, max_members, allow_member_invites, require_approval
    ) VALUES (
        p_name, p_description, p_avatar_url, p_cover_image_url, p_creator_id,
        p_is_private, p_max_members, p_allow_member_invites, p_require_approval
    ) RETURNING id INTO v_group_id;
    
    -- Add creator as admin with all permissions
    INSERT INTO group_members (
        group_id, user_id, role,
        can_add_members, can_remove_members, can_edit_group_info,
        can_manage_permissions, can_delete_group, can_pin_messages, can_delete_messages
    ) VALUES (
        v_group_id, p_creator_id, 'creator',
        true, true, true, true, true, true, true
    );
    
    -- Add initial members (if provided)
    IF p_initial_members IS NOT NULL THEN
        FOREACH v_member_id IN ARRAY p_initial_members
        LOOP
            -- Skip if it's the creator (already added)
            IF v_member_id != p_creator_id THEN
                -- Check if user is a friend of the creator
                IF EXISTS (
                    SELECT 1 FROM friendships 
                    WHERE (user_id = p_creator_id AND friend_id = v_member_id) 
                    OR (user_id = v_member_id AND friend_id = p_creator_id)
                    AND status = 'accepted'
                ) THEN
                    -- Add as regular member
                    INSERT INTO group_members (
                        group_id, user_id, role, status
                    ) VALUES (
                        v_group_id, v_member_id, 'member', 'active'
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    -- Add initial admins (if provided)
    IF p_initial_admins IS NOT NULL THEN
        FOREACH v_admin_id IN ARRAY p_initial_admins
        LOOP
            -- Skip if it's the creator (already added)
            IF v_admin_id != p_creator_id THEN
                -- Check if user is a friend of the creator
                IF EXISTS (
                    SELECT 1 FROM friendships 
                    WHERE (user_id = p_creator_id AND friend_id = v_admin_id) 
                    OR (user_id = v_admin_id AND friend_id = p_creator_id)
                    AND status = 'accepted'
                ) THEN
                    -- Add as admin with permissions
                    INSERT INTO group_members (
                        group_id, user_id, role,
                        can_add_members, can_remove_members, can_edit_group_info,
                        can_manage_permissions, can_delete_group, can_pin_messages, can_delete_messages,
                        status
                    ) VALUES (
                        v_group_id, v_admin_id, 'admin',
                        true, true, true, true, false, true, true,
                        'active'
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request to join a group
CREATE OR REPLACE FUNCTION request_to_join_group(
    p_group_id UUID,
    p_message TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_group_require_approval BOOLEAN;
    v_group_creator_id UUID;
BEGIN
    -- Check if group exists and get settings
    SELECT require_approval, creator_id INTO v_group_require_approval, v_group_creator_id
    FROM groups WHERE id = p_group_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User is already a member of this group';
    END IF;
    
    -- Check if there's already a pending request
    IF EXISTS (SELECT 1 FROM group_join_requests WHERE group_id = p_group_id AND user_id = p_user_id AND status = 'pending') THEN
        RAISE EXCEPTION 'User already has a pending request for this group';
    END IF;
    
    -- Create join request
    INSERT INTO group_join_requests (group_id, user_id, requested_by, message)
    VALUES (p_group_id, p_user_id, p_user_id, p_message)
    RETURNING id INTO v_request_id;
    
    -- If group doesn't require approval, auto-approve
    IF NOT v_group_require_approval THEN
        PERFORM approve_group_join_request(v_request_id, v_group_creator_id);
    END IF;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a join request
CREATE OR REPLACE FUNCTION approve_group_join_request(
    p_request_id UUID,
    p_approved_by UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
    v_group_id UUID;
    v_user_id UUID;
    v_max_members INTEGER;
    v_current_members INTEGER;
BEGIN
    -- Get request details
    SELECT group_id, user_id INTO v_group_id, v_user_id
    FROM group_join_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Join request not found or already processed';
    END IF;
    
    -- Check if approver has permission
    IF NOT EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = v_group_id AND user_id = p_approved_by 
        AND (role IN ('creator', 'admin') OR can_add_members = true)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to approve join requests';
    END IF;
    
    -- Check group capacity
    SELECT max_members INTO v_max_members FROM groups WHERE id = v_group_id;
    SELECT COUNT(*) INTO v_current_members FROM group_members WHERE group_id = v_group_id AND status = 'active';
    
    IF v_current_members >= v_max_members THEN
        RAISE EXCEPTION 'Group has reached maximum capacity';
    END IF;
    
    -- Update request status
    UPDATE group_join_requests 
    SET status = 'approved', reviewed_by = p_approved_by, reviewed_at = NOW()
    WHERE id = p_request_id;
    
    -- Add user to group
    INSERT INTO group_members (group_id, user_id, role, status)
    VALUES (v_group_id, v_user_id, 'member', 'active');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a join request
CREATE OR REPLACE FUNCTION reject_group_join_request(
    p_request_id UUID,
    p_rejected_by UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has permission to reject
    IF NOT EXISTS (
        SELECT 1 FROM group_join_requests gjr
        JOIN group_members gm ON gjr.group_id = gm.group_id
        WHERE gjr.id = p_request_id AND gm.user_id = p_rejected_by
        AND (gm.role IN ('creator', 'admin') OR gm.can_add_members = true)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to reject join requests';
    END IF;
    
    -- Update request status
    UPDATE group_join_requests 
    SET status = 'rejected', reviewed_by = p_rejected_by, reviewed_at = NOW()
    WHERE id = p_request_id AND status = 'pending';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a friend to a group (by creator/admin)
CREATE OR REPLACE FUNCTION add_friend_to_group(
    p_group_id UUID,
    p_friend_id UUID,
    p_added_by UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
    v_max_members INTEGER;
    v_current_members INTEGER;
BEGIN
    -- Check if adder has permission
    IF NOT EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = p_group_id AND user_id = p_added_by 
        AND (role IN ('creator', 'admin') OR can_add_members = true)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to add members';
    END IF;
    
    -- Check if users are friends
    IF NOT EXISTS (
        SELECT 1 FROM friendships 
        WHERE (user_id = p_added_by AND friend_id = p_friend_id) 
        OR (user_id = p_friend_id AND friend_id = p_added_by)
        AND status = 'accepted'
    ) THEN
        RAISE EXCEPTION 'Users must be friends to add to group';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = p_friend_id) THEN
        RAISE EXCEPTION 'User is already a member of this group';
    END IF;
    
    -- Check group capacity
    SELECT max_members INTO v_max_members FROM groups WHERE id = p_group_id;
    SELECT COUNT(*) INTO v_current_members FROM group_members WHERE group_id = p_group_id AND status = 'active';
    
    IF v_current_members >= v_max_members THEN
        RAISE EXCEPTION 'Group has reached maximum capacity';
    END IF;
    
    -- Add user to group
    INSERT INTO group_members (group_id, user_id, role, status)
    VALUES (p_group_id, p_friend_id, 'member', 'active');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update group member permissions
CREATE OR REPLACE FUNCTION update_group_member_permissions(
    p_group_id UUID,
    p_member_id UUID,
    p_permissions JSONB,
    p_updated_by UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if updater has permission to manage permissions
    IF NOT EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = p_group_id AND user_id = p_updated_by 
        AND (role IN ('creator', 'admin') OR can_manage_permissions = true)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to manage member permissions';
    END IF;
    
    -- Prevent non-creators from modifying creator permissions
    IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = p_member_id AND role = 'creator') THEN
        RAISE EXCEPTION 'Cannot modify creator permissions';
    END IF;
    
    -- Update permissions
    UPDATE group_members SET
        can_add_members = COALESCE((p_permissions->>'can_add_members')::boolean, can_add_members),
        can_remove_members = COALESCE((p_permissions->>'can_remove_members')::boolean, can_remove_members),
        can_edit_group_info = COALESCE((p_permissions->>'can_edit_group_info')::boolean, can_edit_group_info),
        can_manage_permissions = COALESCE((p_permissions->>'can_manage_permissions')::boolean, can_manage_permissions),
        can_delete_group = COALESCE((p_permissions->>'can_delete_group')::boolean, can_delete_group),
        can_pin_messages = COALESCE((p_permissions->>'can_pin_messages')::boolean, can_pin_messages),
        can_delete_messages = COALESCE((p_permissions->>'can_delete_messages')::boolean, can_delete_messages)
    WHERE group_id = p_group_id AND user_id = p_member_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a member from group
CREATE OR REPLACE FUNCTION remove_group_member(
    p_group_id UUID,
    p_member_id UUID,
    p_removed_by UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if remover has permission
    IF NOT EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = p_group_id AND user_id = p_removed_by 
        AND (role IN ('creator', 'admin') OR can_remove_members = true)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to remove members';
    END IF;
    
    -- Prevent removing the creator
    IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = p_member_id AND role = 'creator') THEN
        RAISE EXCEPTION 'Cannot remove group creator';
    END IF;
    
    -- Remove member
    UPDATE group_members 
    SET status = 'left'
    WHERE group_id = p_group_id AND user_id = p_member_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update group information
CREATE OR REPLACE FUNCTION update_group_info(
    p_group_id UUID,
    p_name VARCHAR(100) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_cover_image_url TEXT DEFAULT NULL,
    p_is_private BOOLEAN DEFAULT NULL,
    p_max_members INTEGER DEFAULT NULL,
    p_allow_member_invites BOOLEAN DEFAULT NULL,
    p_require_approval BOOLEAN DEFAULT NULL,
    p_updated_by UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if updater has permission
    IF NOT EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = p_group_id AND user_id = p_updated_by 
        AND (role IN ('creator', 'admin') OR can_edit_group_info = true)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to edit group information';
    END IF;
    
    -- Update group info
    UPDATE groups SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        cover_image_url = COALESCE(p_cover_image_url, cover_image_url),
        is_private = COALESCE(p_is_private, is_private),
        max_members = COALESCE(p_max_members, max_members),
        allow_member_invites = COALESCE(p_allow_member_invites, allow_member_invites),
        require_approval = COALESCE(p_require_approval, require_approval),
        updated_at = NOW()
    WHERE id = p_group_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view public groups" ON groups
    FOR SELECT USING (NOT is_private);

CREATE POLICY "Group members can view their groups" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_id = groups.id AND user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group creators and admins can update groups" ON groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_id = groups.id AND user_id = auth.uid() 
            AND (role IN ('creator', 'admin') OR can_edit_group_info = true)
        )
    );

CREATE POLICY "Group creators can delete groups" ON groups
    FOR DELETE USING (creator_id = auth.uid());

-- Group members policies (simplified to avoid recursion)
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

-- Group join requests policies
CREATE POLICY "Users can view their own join requests" ON group_join_requests
    FOR SELECT USING (user_id = auth.uid() OR requested_by = auth.uid());

CREATE POLICY "Group creators can view join requests" ON group_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_join_requests.group_id AND groups.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can create join requests" ON group_join_requests
    FOR INSERT WITH CHECK (user_id = auth.uid() AND requested_by = auth.uid());

CREATE POLICY "Group creators can update join requests" ON group_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_join_requests.group_id AND groups.creator_id = auth.uid()
        )
    );

-- =====================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Create a sample group (uncomment to use)
/*
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    -- Create a sample group
    SELECT create_group(
        'Developers Hub',
        'A community for developers to share knowledge and collaborate',
        NULL,
        NULL,
        false, -- public group
        50,    -- max 50 members
        true,  -- allow member invites
        true   -- require approval
    ) INTO v_group_id;
    
    RAISE NOTICE 'Sample group created with ID: %', v_group_id;
END $$;
*/

-- =====================================================
-- 9. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for group details with member count
CREATE VIEW group_details AS
SELECT 
    g.*,
    COUNT(gm.id) as member_count,
    COUNT(CASE WHEN gm.role = 'creator' THEN 1 END) as creator_count,
    COUNT(CASE WHEN gm.role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN gm.role = 'moderator' THEN 1 END) as moderator_count,
    COUNT(CASE WHEN gm.role = 'member' THEN 1 END) as regular_member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
GROUP BY g.id;

-- View for user's groups with their role
CREATE VIEW user_groups AS
SELECT 
    g.*,
    gm.role as user_role,
    gm.can_add_members,
    gm.can_remove_members,
    gm.can_edit_group_info,
    gm.can_manage_permissions,
    gm.can_delete_group,
    gm.can_pin_messages,
    gm.can_delete_messages,
    gm.joined_at,
    gm.last_seen_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
WHERE gm.user_id = auth.uid() AND gm.status = 'active';

-- View for pending join requests with user details
CREATE VIEW pending_join_requests AS
SELECT 
    gjr.*,
    g.name as group_name,
    p.username as requester_username,
    p.full_name as requester_full_name,
    p.avatar_url as requester_avatar_url
FROM group_join_requests gjr
JOIN groups g ON gjr.group_id = g.id
JOIN profiles p ON gjr.user_id = p.id
WHERE gjr.status = 'pending';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Groups Management System Created Successfully!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- groups (with creator, settings, privacy)';
    RAISE NOTICE '- group_members (with roles and permissions)';
    RAISE NOTICE '- group_join_requests (for join requests)';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '- create_group() - Create new group';
    RAISE NOTICE '- request_to_join_group() - Request to join';
    RAISE NOTICE '- approve_group_join_request() - Approve requests';
    RAISE NOTICE '- reject_group_join_request() - Reject requests';
    RAISE NOTICE '- add_friend_to_group() - Add friends to group';
    RAISE NOTICE '- update_group_member_permissions() - Manage permissions';
    RAISE NOTICE '- remove_group_member() - Remove members';
    RAISE NOTICE '- update_group_info() - Edit group settings';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '- group_details - Group info with member counts';
    RAISE NOTICE '- user_groups - User''s groups with their role';
    RAISE NOTICE '- pending_join_requests - Pending requests with details';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS policies enabled for security';
    RAISE NOTICE '=====================================================';
END $$;
