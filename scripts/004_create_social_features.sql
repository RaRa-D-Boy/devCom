-- Create posts table for social media feeds
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create forums table
CREATE TABLE IF NOT EXISTS forums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_post_comments table
CREATE TABLE IF NOT EXISTS forum_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_chat_members table
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_chat_id, user_id)
);

-- Create group_chat_messages table
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create one_on_one_chats table
CREATE TABLE IF NOT EXISTS one_on_one_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create one_on_one_messages table
CREATE TABLE IF NOT EXISTS one_on_one_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES one_on_one_chats(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_id ON group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_id ON group_chat_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_created_at ON group_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_one_on_one_chats_user1 ON one_on_one_chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_chats_user2 ON one_on_one_chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_chat_id ON one_on_one_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_messages_created_at ON one_on_one_messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for post_likes
CREATE POLICY "Users can view all post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can create post likes" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own post likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for post_comments
CREATE POLICY "Users can view all post comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create post comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own post comments" ON post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own post comments" ON post_comments FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for friendships
CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friendships" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friendships" ON friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create RLS policies for forums
CREATE POLICY "Users can view all forums" ON forums FOR SELECT USING (true);
CREATE POLICY "Users can create forums" ON forums FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update forums they created" ON forums FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete forums they created" ON forums FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for forum_posts
CREATE POLICY "Users can view all forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can create forum posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own forum posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own forum posts" ON forum_posts FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for forum_post_comments
CREATE POLICY "Users can view all forum post comments" ON forum_post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create forum post comments" ON forum_post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own forum post comments" ON forum_post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own forum post comments" ON forum_post_comments FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for group_chats
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

-- Create RLS policies for group_chat_members
CREATE POLICY "Users can view group chat members" ON group_chat_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_chat_members gcm2
    WHERE gcm2.group_chat_id = group_chat_members.group_chat_id 
    AND gcm2.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join group chats" ON group_chat_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave group chats" ON group_chat_members FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for group_chat_messages
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

-- Create RLS policies for one_on_one_chats
CREATE POLICY "Users can view their own chats" ON one_on_one_chats FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create chats" ON one_on_one_chats FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can delete their own chats" ON one_on_one_chats FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create RLS policies for one_on_one_messages
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
