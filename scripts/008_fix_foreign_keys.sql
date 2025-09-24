-- Fix foreign key relationships between posts and profiles
-- This script corrects the foreign key references to use profiles table instead of auth.users

-- First, drop the existing foreign key constraint on posts table
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- Add the correct foreign key constraint to reference profiles table
ALTER TABLE posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix post_likes table foreign key
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE post_likes 
ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix post_comments table foreign key
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_author_id_fkey;
ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix friendships table foreign keys
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_user_id_fkey;
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;
ALTER TABLE friendships 
ADD CONSTRAINT friendships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE friendships 
ADD CONSTRAINT friendships_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix forums table foreign key
ALTER TABLE forums DROP CONSTRAINT IF EXISTS forums_created_by_fkey;
ALTER TABLE forums 
ADD CONSTRAINT forums_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix forum_posts table foreign key
ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_author_id_fkey;
ALTER TABLE forum_posts 
ADD CONSTRAINT forum_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix forum_post_comments table foreign key
ALTER TABLE forum_post_comments DROP CONSTRAINT IF EXISTS forum_post_comments_author_id_fkey;
ALTER TABLE forum_post_comments 
ADD CONSTRAINT forum_post_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix group_chats table foreign key
ALTER TABLE group_chats DROP CONSTRAINT IF EXISTS group_chats_created_by_fkey;
ALTER TABLE group_chats 
ADD CONSTRAINT group_chats_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix group_chat_members table foreign key
ALTER TABLE group_chat_members DROP CONSTRAINT IF EXISTS group_chat_members_user_id_fkey;
ALTER TABLE group_chat_members 
ADD CONSTRAINT group_chat_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix group_chat_messages table foreign key
ALTER TABLE group_chat_messages DROP CONSTRAINT IF EXISTS group_chat_messages_author_id_fkey;
ALTER TABLE group_chat_messages 
ADD CONSTRAINT group_chat_messages_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix one_on_one_chats table foreign keys
ALTER TABLE one_on_one_chats DROP CONSTRAINT IF EXISTS one_on_one_chats_user1_id_fkey;
ALTER TABLE one_on_one_chats DROP CONSTRAINT IF EXISTS one_on_one_chats_user2_id_fkey;
ALTER TABLE one_on_one_chats 
ADD CONSTRAINT one_on_one_chats_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE one_on_one_chats 
ADD CONSTRAINT one_on_one_chats_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix one_on_one_messages table foreign key
ALTER TABLE one_on_one_messages DROP CONSTRAINT IF EXISTS one_on_one_messages_author_id_fkey;
ALTER TABLE one_on_one_messages 
ADD CONSTRAINT one_on_one_messages_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update RLS policies to use profiles table instead of auth.users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Recreate policies with correct references
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Update post_likes policies
DROP POLICY IF EXISTS "Users can view all post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can create post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own post likes" ON post_likes;

CREATE POLICY "Users can view all post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can create post likes" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own post likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Update post_comments policies
DROP POLICY IF EXISTS "Users can view all post comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create post comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own post comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own post comments" ON post_comments;

CREATE POLICY "Users can view all post comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create post comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own post comments" ON post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own post comments" ON post_comments FOR DELETE USING (auth.uid() = author_id);

-- Update friendships policies
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;

CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friendships" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friendships" ON friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Update forums policies
DROP POLICY IF EXISTS "Users can view all forums" ON forums;
DROP POLICY IF EXISTS "Users can create forums" ON forums;
DROP POLICY IF EXISTS "Users can update forums they created" ON forums;
DROP POLICY IF EXISTS "Users can delete forums they created" ON forums;

CREATE POLICY "Users can view all forums" ON forums FOR SELECT USING (true);
CREATE POLICY "Users can create forums" ON forums FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update forums they created" ON forums FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete forums they created" ON forums FOR DELETE USING (auth.uid() = created_by);

-- Update forum_posts policies
DROP POLICY IF EXISTS "Users can view all forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can create forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can update their own forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can delete their own forum posts" ON forum_posts;

CREATE POLICY "Users can view all forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can create forum posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own forum posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own forum posts" ON forum_posts FOR DELETE USING (auth.uid() = author_id);

-- Update forum_post_comments policies
DROP POLICY IF EXISTS "Users can view all forum post comments" ON forum_post_comments;
DROP POLICY IF EXISTS "Users can create forum post comments" ON forum_post_comments;
DROP POLICY IF EXISTS "Users can update their own forum post comments" ON forum_post_comments;
DROP POLICY IF EXISTS "Users can delete their own forum post comments" ON forum_post_comments;

CREATE POLICY "Users can view all forum post comments" ON forum_post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create forum post comments" ON forum_post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own forum post comments" ON forum_post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own forum post comments" ON forum_post_comments FOR DELETE USING (auth.uid() = author_id);

-- Update group_chats policies
DROP POLICY IF EXISTS "Users can view group chats they're members of" ON group_chats;
DROP POLICY IF EXISTS "Users can create group chats" ON group_chats;
DROP POLICY IF EXISTS "Group admins can update group chats" ON group_chats;
DROP POLICY IF EXISTS "Group admins can delete group chats" ON group_chats;

CREATE POLICY "Users can view group chats they're members of" ON group_chats FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_chat_members.group_chat_id = group_chats.id 
    AND group_chat_members.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create group chats" ON group_chats FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update group chats" ON group_chats FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_chat_members.group_chat_id = group_chats.id 
    AND group_chat_members.user_id = auth.uid()
    AND group_chat_members.role = 'admin'
  )
);
CREATE POLICY "Group admins can delete group chats" ON group_chats FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_chat_members.group_chat_id = group_chats.id 
    AND group_chat_members.user_id = auth.uid()
    AND group_chat_members.role = 'admin'
  )
);

-- Update group_chat_members policies
DROP POLICY IF EXISTS "Users can view group chat members" ON group_chat_members;
DROP POLICY IF EXISTS "Users can join group chats" ON group_chat_members;
DROP POLICY IF EXISTS "Users can leave group chats" ON group_chat_members;

CREATE POLICY "Users can view group chat members" ON group_chat_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_chat_members gcm2
    WHERE gcm2.group_chat_id = group_chat_members.group_chat_id 
    AND gcm2.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join group chats" ON group_chat_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave group chats" ON group_chat_members FOR DELETE USING (auth.uid() = user_id);

-- Update group_chat_messages policies
DROP POLICY IF EXISTS "Users can view messages in groups they're members of" ON group_chat_messages;
DROP POLICY IF EXISTS "Group members can create messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON group_chat_messages;

CREATE POLICY "Users can view messages in groups they're members of" ON group_chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_chat_members.group_chat_id = group_chat_messages.group_chat_id 
    AND group_chat_members.user_id = auth.uid()
  )
);
CREATE POLICY "Group members can create messages" ON group_chat_messages FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_chat_members.group_chat_id = group_chat_messages.group_chat_id 
    AND group_chat_members.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their own messages" ON group_chat_messages FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own messages" ON group_chat_messages FOR DELETE USING (auth.uid() = author_id);

-- Update one_on_one_chats policies
DROP POLICY IF EXISTS "Users can view their own chats" ON one_on_one_chats;
DROP POLICY IF EXISTS "Users can create chats" ON one_on_one_chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON one_on_one_chats;

CREATE POLICY "Users can view their own chats" ON one_on_one_chats FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create chats" ON one_on_one_chats FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can delete their own chats" ON one_on_one_chats FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Update one_on_one_messages policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON one_on_one_messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON one_on_one_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON one_on_one_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON one_on_one_messages;

CREATE POLICY "Users can view messages in their chats" ON one_on_one_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM one_on_one_chats 
    WHERE one_on_one_chats.id = one_on_one_messages.chat_id 
    AND (one_on_one_chats.user1_id = auth.uid() OR one_on_one_chats.user2_id = auth.uid())
  )
);
CREATE POLICY "Users can create messages in their chats" ON one_on_one_messages FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM one_on_one_chats 
    WHERE one_on_one_chats.id = one_on_one_messages.chat_id 
    AND (one_on_one_chats.user1_id = auth.uid() OR one_on_one_chats.user2_id = auth.uid())
  )
);
CREATE POLICY "Users can update their own messages" ON one_on_one_messages FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own messages" ON one_on_one_messages FOR DELETE USING (auth.uid() = author_id);

-- Add comments to document the changes
COMMENT ON CONSTRAINT posts_author_id_fkey ON posts IS 'Foreign key to profiles table for post author';
COMMENT ON CONSTRAINT post_likes_user_id_fkey ON post_likes IS 'Foreign key to profiles table for user who liked the post';
COMMENT ON CONSTRAINT post_comments_author_id_fkey ON post_comments IS 'Foreign key to profiles table for comment author';
