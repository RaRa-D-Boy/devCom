"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  FileText,
  User as UserIcon,
  Users,
  MapPin,
  Building,
  Github,
  Linkedin,
  Globe,
  X
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

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

interface Friend {
  friend_id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  status?: 'active' | 'busy' | 'offline' | 'inactive'
  role?: string
  company?: string
  location?: string
  bio?: string
  github_url?: string
  linkedin_url?: string
  portfolio_url?: string
  friendship_created_at: string
}

interface ProfileCardProps {
  profile: Profile
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { theme, glassEffect } = useTheme()
  const isDarkTheme = theme === 'dark'
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [friendsModalOpen, setFriendsModalOpen] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(false)

  // Load friends count when component mounts
  useEffect(() => {
    loadFriendsCount()
  }, [])

  const loadFriendsCount = async () => {
    try {
      const response = await fetch('/api/friends/list?type=count')
      const result = await response.json()
      
      if (response.ok) {
        setFriendsCount(result.friend_count || 0)
      }
    } catch (error) {
      console.error('Error loading friends count:', error)
    }
  }

  const loadFriendsList = async () => {
    setLoadingFriends(true)
    try {
      const response = await fetch('/api/friends/list?type=friends')
      const result = await response.json()
      
      if (response.ok) {
        setFriends(result.friends || [])
      }
    } catch (error) {
      console.error('Error loading friends list:', error)
    } finally {
      setLoadingFriends(false)
    }
  }

  const handleFriendsClick = () => {
    setFriendsModalOpen(true)
    if (friends.length === 0) {
      loadFriendsList()
    }
  }
  
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
        {/* Gradient overlay - transparent at top, theme-aware fade at bottom */}
        <div className={`absolute inset-0 bg-gradient-to-b from-slate-600 via-transparent ${isDarkTheme ? 'to-gray-900/80' : 'to-white/80'}`}></div>
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

        {/* Bottom Section - Content and Actions with Theme-Aware Background */}
        <div className={`rounded-2xl m-2 p-4 shadow-lg ${
          isDarkTheme 
            ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
              glassEffect === 'transparent' ? 'bg-transparent' :
              'bg-neutral-900 border border-gray-700'
            : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
              glassEffect === 'transparent' ? 'bg-transparent' :
              'bg-white border border-gray-200'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Online</span>
              </div>
            </div>
            
            <div className={`flex items-center space-x-6 pt-3 ${glassEffect !== 'transparent' ? `border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}` : ''}`}>
              <Button variant="ghost" size="sm" className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFriendsClick}
                className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Friends
                {friendsCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {friendsCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Users className="h-4 w-4 mr-2" />
                Groups
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Friends Modal */}
      <Dialog open={friendsModalOpen} onOpenChange={setFriendsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
              Friends ({friendsCount})
            </DialogTitle>
          </DialogHeader>

          {loadingFriends ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className={`mt-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading friends...
                </p>
              </div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                No friends yet. Start connecting with other developers!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {friends.map((friend) => (
                <div
                  key={friend.friend_id}
                  className={`p-4 rounded-lg border ${
                    isDarkTheme ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback className="bg-neutral-700 text-white">
                            {(friend.full_name || friend.display_name || friend.username)?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          friend.status === 'active' ? 'bg-green-500' :
                          friend.status === 'busy' ? 'bg-yellow-500' :
                          friend.status === 'inactive' ? 'bg-gray-400' :
                          'bg-gray-300'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                          {friend.full_name || friend.display_name || friend.username}
                        </h3>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          @{friend.username}
                        </p>
                        {friend.role && (
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                            {friend.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {friend.bio && (
                    <p className={`text-sm mt-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {friend.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3 text-xs">
                    {friend.location && (
                      <div className={`flex items-center space-x-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="h-3 w-3" />
                        <span>{friend.location}</span>
                      </div>
                    )}
                    {friend.company && (
                      <div className={`flex items-center space-x-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Building className="h-3 w-3" />
                        <span>{friend.company}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    {friend.github_url && (
                      <a
                        href={friend.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${
                          isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {friend.linkedin_url && (
                      <a
                        href={friend.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${
                          isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {friend.portfolio_url && (
                      <a
                        href={friend.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${
                          isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
