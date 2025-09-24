"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  FileText,
  User as UserIcon,
  Users,
} from "lucide-react"

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

interface ProfileCardProps {
  profile: Profile
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="relative rounded-2xl shadow-2xl border border-none mb-4 hover:shadow-md transition-shadow overflow-hidden min-h-[300px]">
      {/* Background Media - covers entire card */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: profile.cover_image_url 
            ? `url(${profile.cover_image_url})` 
            : `url('/pattern6.jpg')`
        }}
      >
        {/* Gradient overlay - transparent at top, white fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-600 via-transparent to-white/80"></div>
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 h-full flex min-h-[300px] flex-col justify-between">
        {/* Top Section - User Info */}
        <div className="flex items-start p-6 space-x-4">
          <Avatar className="ring-2 ring-white/50">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-neutral-700 text-white">
              {(profile.full_name || profile.display_name || profile.username)?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-white truncate drop-shadow-lg">
                {profile.full_name || profile.display_name || profile.username}
              </h4>
              <span className="text-white/80 text-sm drop-shadow">@{profile.username}</span>
              <span className="text-white/60 text-sm">•</span>
              <span className="text-white/80 text-sm drop-shadow">
                {profile.status === 'active' ? 'Active' :
                 profile.status === 'busy' ? 'Busy' :
                 profile.status === 'inactive' ? 'Inactive' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section - Content and Actions with White Background */}
        <div className="bg-white rounded-2xl m-2 p-4 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 pt-3 border-t border-gray-200">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <UserIcon className="h-4 w-4 mr-2" />
                Friends
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <Users className="h-4 w-4 mr-2" />
                Groups
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
