-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'message', 'post_like', 'post_comment', 'group_invite')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data like sender_id, post_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Create function to send friend request notification
CREATE OR REPLACE FUNCTION send_friend_request_notification(
  sender_id UUID,
  receiver_id UUID
) RETURNS VOID AS $$
DECLARE
  sender_profile RECORD;
BEGIN
  -- Get sender profile information
  SELECT username, full_name, display_name, avatar_url
  INTO sender_profile
  FROM profiles
  WHERE id = sender_id;
  
  -- Insert notification for the receiver
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    receiver_id,
    'friend_request',
    'New Friend Request',
    COALESCE(sender_profile.full_name, sender_profile.display_name, sender_profile.username) || ' sent you a friend request',
    jsonb_build_object(
      'sender_id', sender_id,
      'sender_username', sender_profile.username,
      'sender_name', COALESCE(sender_profile.full_name, sender_profile.display_name, sender_profile.username),
      'sender_avatar', sender_profile.avatar_url
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send friend accepted notification
CREATE OR REPLACE FUNCTION send_friend_accepted_notification(
  accepter_id UUID,
  requester_id UUID
) RETURNS VOID AS $$
DECLARE
  accepter_profile RECORD;
BEGIN
  -- Get accepter profile information
  SELECT username, full_name, display_name, avatar_url
  INTO accepter_profile
  FROM profiles
  WHERE id = accepter_id;
  
  -- Insert notification for the requester
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    requester_id,
    'friend_accepted',
    'Friend Request Accepted',
    COALESCE(accepter_profile.full_name, accepter_profile.display_name, accepter_profile.username) || ' accepted your friend request',
    jsonb_build_object(
      'accepter_id', accepter_id,
      'accepter_username', accepter_profile.username,
      'accepter_name', COALESCE(accepter_profile.full_name, accepter_profile.display_name, accepter_profile.username),
      'accepter_avatar', accepter_profile.avatar_url
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send notification when friend request is created
CREATE OR REPLACE FUNCTION trigger_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notification for new friend requests (status = 'pending')
  IF NEW.status = 'pending' THEN
    PERFORM send_friend_request_notification(NEW.user_id, NEW.friend_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send notification when friend request is accepted
CREATE OR REPLACE FUNCTION trigger_friend_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when status changes from 'pending' to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    PERFORM send_friend_accepted_notification(NEW.friend_id, NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON friendships;
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_friend_request_notification();

DROP TRIGGER IF EXISTS friend_accepted_notification_trigger ON friendships;
CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_friend_accepted_notification();

-- Create function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.is_read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_uuid
  ORDER BY n.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  notification_id UUID,
  user_uuid UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_id AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  user_uuid UUID
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE user_id = user_uuid AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  user_uuid UUID
) RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE user_id = user_uuid AND is_read = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
