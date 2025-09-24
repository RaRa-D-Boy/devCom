"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/app-layout"
import { ActivityFeed } from "@/components/home/activity-feed"
import { ProfileCard } from "@/components/home/profile-card"
import { UsersList } from "@/components/home/users-list"
import { GroupsList } from "@/components/home/groups-list"
import { PostCreationModal } from "@/components/home/post-creation-modal"
import { PostViewModal } from "@/components/home/post-view-modal"
import { UserProfileModal } from "@/components/home/user-profile-modal"

interface Profile {
  id: string
  username: string
  full_name?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  cover_image_url?: string
  bio?: string
  status?: 'active' | 'busy' | 'offline' | 'inactive'
  location?: string
  website?: string
  github_url?: string
  linkedin_url?: string
  twitter_url?: string
  portfolio_url?: string
  role?: string
  company?: string
  job_title?: string
  skills?: string[]
  programming_languages?: string[]
  frameworks?: string[]
  tools?: string[]
  experience_level?: 'junior' | 'mid' | 'senior' | 'lead' | 'architect'
  years_of_experience?: number
  education?: string
  certifications?: string[]
  projects?: string[]
  achievements?: string[]
  interests?: string[]
  timezone?: string
  availability?: 'available' | 'busy' | 'unavailable'
  looking_for_work?: boolean
  remote_work?: boolean
  profile_visibility?: 'public' | 'friends' | 'private'
  last_seen?: string
  profile_completed?: boolean
  theme_preference?: 'light' | 'dark' | 'auto'
  notification_preferences?: any
  social_links?: any
  contact_info?: any
  professional_info?: any
  created_at: string
  updated_at?: string
}

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'document'
  url?: string
  preview?: string
}

interface Post {
  id: string
  content: string
  author_id: string
  author: Profile
  created_at: string
  likes_count: number
  comments_count: number
  is_liked: boolean
  media?: MediaFile[]
  media_urls?: string[]
  post_type?: 'text' | 'image' | 'video' | 'document' | 'mixed'
}

interface Friend {
  id: string
  username: string
  full_name?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  status: 'active' | 'busy' | 'offline' | 'inactive'
  role?: string
  company?: string
  job_title?: string
  location?: string
  last_seen?: string
}

interface HomeInterfaceProps {
  user: User
  profile: Profile
}

export function HomeInterface({ user, profile }: HomeInterfaceProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isAddingFriend, setIsAddingFriend] = useState(false)

  const handleViewPost = (post: Post) => {
    setSelectedPost(post)
    setIsViewModalOpen(true)
  }

  const handleViewUserProfile = (userProfile: Profile) => {
    setSelectedUser(userProfile)
    setIsUserProfileModalOpen(true)
  }

  const handleAddFriend = (userProfile: Profile) => {
    setIsAddingFriend(true)
    // The actual friend adding logic is handled in the UserProfileModal component
  }

  const handlePostCreated = () => {
    // Refresh the activity feed when a new post is created
    // This could trigger a re-render or data refresh
  }

  const handleLikePost = (postId: string, isLiked: boolean) => {
    // Handle like post logic
  }

  return (
    <AppLayout user={user} profile={profile} activePage="home">
      {/* Mobile Layout - Users at top */}
      <div className="lg:hidden pb-20">
        {/* Active Users at Top - Mobile Only */}
        <div className="mb-4">
          <UsersList user={user} onViewUserProfile={handleViewUserProfile} />
        </div>
        
        {/* Activity Feed */}
        <ActivityFeed user={user} onViewPost={handleViewPost} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-2 pb-4">
        {/* Main Content Area - Activity Feed */}
        <ActivityFeed user={user} onViewPost={handleViewPost} />

        {/* Right Sidebar */}
        <div className="space-y-2">
          {/* User Profile Card */}
          <ProfileCard profile={profile} />

          {/* All Users */}
          <UsersList user={user} onViewUserProfile={handleViewUserProfile} />

          {/* All Groups */}
          <GroupsList user={user} />
        </div>
      </div>

      {/* Floating Post Creation Button */}
      <PostCreationModal user={user} profile={profile} onPostCreated={handlePostCreated} />

      {/* Post View Modal */}
      <PostViewModal 
        user={user} 
        profile={profile} 
        selectedPost={selectedPost} 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        onLikePost={handleLikePost}
      />

      {/* User Profile Modal */}
      <UserProfileModal 
        user={user} 
        selectedUser={selectedUser} 
        isOpen={isUserProfileModalOpen} 
        onClose={() => setIsUserProfileModalOpen(false)}
        isAddingFriend={isAddingFriend}
        onAddFriend={handleAddFriend}
      />
    </AppLayout>
  )
}
