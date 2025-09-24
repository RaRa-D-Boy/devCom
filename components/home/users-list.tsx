"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageCircle,
  UserPlus,
  User as UserIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import { InlineChat } from "@/components/chat/inline-chat"
import { ChatInitiationModal } from "@/components/chat/chat-initiation-modal"
import { useRouter } from "next/navigation"

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

interface UsersListProps {
  user: User
  onViewUserProfile: (userProfile: Profile) => void
}

export function UsersList({ user, onViewUserProfile }: UsersListProps) {
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedUserForChat, setSelectedUserForChat] = useState<Profile | null>(null)
  const [isInitiationModalOpen, setIsInitiationModalOpen] = useState(false)
  const [selectedUserForInitiation, setSelectedUserForInitiation] = useState<Profile | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadAllUsers()
  }, [])

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id) // Exclude current user
        .order("created_at", { ascending: false })
        .limit(20) // Limit to 20 users for performance

      if (error) throw error

      const usersList = (data || []).map(userProfile => ({
        ...userProfile,
        status: (Math.random() > 0.5 ? 'active' : 'offline') as 'active' | 'busy' | 'offline' | 'inactive'
      }))

      setAllUsers(usersList)
    } catch (error) {
      console.error("Error loading all users:", error)
    }
  }

  const handleStartChat = (userProfile: Profile) => {
    // Show chat initiation modal first
    setSelectedUserForInitiation(userProfile)
    setIsInitiationModalOpen(true)
  }

  const handleInitiateChat = () => {
    // Close initiation modal and navigate to dedicated chat page
    setIsInitiationModalOpen(false)
    if (selectedUserForInitiation) {
      router.push(`/chat/${selectedUserForInitiation.id}`)
    }
    setSelectedUserForInitiation(null)
  }

  const handleAddFriend = async (userProfile: Profile) => {
    setIsAddingFriend(true)
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: user.id,
          friend_id: userProfile.id,
          status: "pending"
        })

      if (error) throw error

      // Show success message or update UI
      console.log(`Friend request sent to ${userProfile.username}`)
    } catch (error) {
      console.error("Error sending friend request:", error)
    } finally {
      setIsAddingFriend(false)
    }
  }

  return (
    <div className="bg-transparent  lg:bg-white rounded-2xl lg:rounded-2xl p-0 lg:p-4">
      <div className="hidden lg:flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg text-black">All Users</h3>
        <span className="text-sm text-white/60">{allUsers.length}</span>
      </div>
      
      {/* Desktop Layout - Full cards */}
      <div className="hidden lg:block space-y-2 max-h-[500px] overflow-y-auto">
        {allUsers.map((userProfile) => (
          <div key={userProfile.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 shadow-sm hover:shadow-md transition-all">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-gray-200 cursor-pointer" onClick={() => onViewUserProfile(userProfile)}>
                <AvatarImage src={userProfile.avatar_url} />
                <AvatarFallback className="bg-neutral-700 text-white text-sm">
                  {(userProfile.full_name || userProfile.display_name || userProfile.username)?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white rounded-full ${
                userProfile.status === 'active' ? 'bg-green-500' :
                userProfile.status === 'busy' ? 'bg-yellow-500' :
                userProfile.status === 'inactive' ? 'bg-gray-400' :
                'bg-gray-300'
              }`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-black cursor-pointer hover:text-blue-600" onClick={() => onViewUserProfile(userProfile)}>
                {userProfile.full_name || userProfile.display_name || userProfile.username}
              </p>
              <div className="flex items-center space-x-1">
                <p className="text-xs text-gray-500 truncate">@{userProfile.username}</p>
                {userProfile.role && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-500 truncate">{userProfile.role}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-white hover:bg-black"
                      onClick={() => handleStartChat(userProfile)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start Chat</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-white hover:bg-black"
                      onClick={() => handleAddFriend(userProfile)}
                      disabled={isAddingFriend}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Friend</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-white hover:bg-black"
                      onClick={() => onViewUserProfile(userProfile)}
                    >
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Profile</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
        {allUsers.length === 0 && (
          <div className="text-center py-4">
            <p className="text-black text-sm">No other users found</p>
          </div>
        )}
      </div>

      {/* Mobile Layout - Horizontal stories-like layout */}
      <div className="lg:hidden ">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide ">
          {allUsers.map((userProfile) => (
            <div key={userProfile.id} className="flex-shrink-0 text-center">
              <div className="relative mb-2">
                <div 
                  className="h-16 w-16 rounded-full p-0.5 cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    background: userProfile.status === 'active' 
                      ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
                      : 'linear-gradient(45deg, #e5e7eb 0%, #d1d5db 100%)'
                  }}
                  onClick={() => onViewUserProfile(userProfile)}
                >
                  <div className="h-full w-full rounded-full bg-white p-0.5">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={userProfile.avatar_url} />
                      <AvatarFallback className="bg-neutral-700 text-white text-sm">
                        {(userProfile.full_name || userProfile.display_name || userProfile.username)?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 border-2 border-white rounded-full ${
                  userProfile.status === 'active' ? 'bg-green-500' :
                  userProfile.status === 'busy' ? 'bg-yellow-500' :
                  userProfile.status === 'inactive' ? 'bg-gray-400' :
                  'bg-gray-300'
                }`}></div>
              </div>
              <p className="text-xs text-gray-900 truncate w-16">
                {userProfile.full_name || userProfile.display_name || userProfile.username}
              </p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-gray-600 hover:text-white hover:bg-black"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartChat(userProfile)
                  }}
                >
                  <MessageCircle className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-gray-600 hover:text-white hover:bg-black"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddFriend(userProfile)
                  }}
                  disabled={isAddingFriend}
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {allUsers.length === 0 && (
          <div className="text-center py-4">
            <p className="text-black text-sm">No other users found</p>
          </div>
        )}
      </div>

      {/* Chat Initiation Modal */}
      {selectedUserForInitiation && (
        <ChatInitiationModal
          user={user}
          otherUser={selectedUserForInitiation}
          isOpen={isInitiationModalOpen}
          onClose={() => {
            setIsInitiationModalOpen(false)
            setSelectedUserForInitiation(null)
          }}
          onStartChat={handleInitiateChat}
        />
      )}

      {/* Inline Chat Modal */}
      {selectedUserForChat && (
        <InlineChat
          user={user}
          otherUser={selectedUserForChat}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false)
            setSelectedUserForChat(null)
          }}
        />
      )}
    </div>
  )
}
