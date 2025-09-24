"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  MessageCircle,
  UserPlus,
  MapPin,
} from "lucide-react"
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

interface UserProfileModalProps {
  user: User
  selectedUser: Profile | null
  isOpen: boolean
  onClose: () => void
  isAddingFriend: boolean
  onAddFriend: (userProfile: Profile) => void
}

export function UserProfileModal({ user, selectedUser, isOpen, onClose, isAddingFriend, onAddFriend }: UserProfileModalProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isInitiationModalOpen, setIsInitiationModalOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleStartChat = (userProfile: Profile) => {
    // Show chat initiation modal first
    setIsInitiationModalOpen(true)
    onClose() // Close the profile modal
  }

  const handleInitiateChat = () => {
    // Close initiation modal and navigate to dedicated chat page
    setIsInitiationModalOpen(false)
    if (selectedUser) {
      router.push(`/chat/${selectedUser.id}`)
    }
  }

  const handleAddFriend = async (userProfile: Profile) => {
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
      onAddFriend(userProfile)
    } catch (error) {
      console.error("Error sending friend request:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">User Profile</DialogTitle>
        </DialogHeader>
        
        {selectedUser && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-gray-200">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="text-2xl bg-neutral-700 text-white">
                    {(selectedUser.full_name || selectedUser.display_name || selectedUser.username)?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 h-6 w-6 border-4 border-white rounded-full ${
                  selectedUser.status === 'active' ? 'bg-green-500' :
                  selectedUser.status === 'busy' ? 'bg-yellow-500' :
                  selectedUser.status === 'inactive' ? 'bg-gray-400' :
                  'bg-gray-300'
                }`}></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUser.full_name || selectedUser.display_name || selectedUser.username}
                </h2>
                <p className="text-gray-500">@{selectedUser.username}</p>
                {selectedUser.role && (
                  <p className="text-blue-600 font-semibold mt-1">{selectedUser.role}</p>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedUser.bio && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedUser.bio}</p>
                </div>
              )}
              
              {selectedUser.location && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedUser.location}</span>
                  </div>
                </div>
              )}
              
              {selectedUser.company && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Company</h3>
                  <p className="text-gray-700">{selectedUser.company}</p>
                </div>
              )}
              
              {selectedUser.job_title && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Job Title</h3>
                  <p className="text-gray-700">{selectedUser.job_title}</p>
                </div>
              )}
              
              {selectedUser.experience_level && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Experience Level</h3>
                  <Badge variant="secondary" className="capitalize">
                    {selectedUser.experience_level}
                  </Badge>
                </div>
              )}
              
              {selectedUser.years_of_experience && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Years of Experience</h3>
                  <p className="text-gray-700">{selectedUser.years_of_experience} years</p>
                </div>
              )}
            </div>

            {/* Skills */}
            {selectedUser.skills && selectedUser.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Programming Languages */}
            {selectedUser.programming_languages && selectedUser.programming_languages.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Programming Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.programming_languages.map((lang, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedUser.github_url && (
                  <a 
                    href={selectedUser.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">GH</span>
                    </div>
                    <span className="text-gray-700">GitHub</span>
                  </a>
                )}
                
                {selectedUser.linkedin_url && (
                  <a 
                    href={selectedUser.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">LI</span>
                    </div>
                    <span className="text-gray-700">LinkedIn</span>
                  </a>
                )}
                
                {selectedUser.portfolio_url && (
                  <a 
                    href={selectedUser.portfolio_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PF</span>
                    </div>
                    <span className="text-gray-700">Portfolio</span>
                  </a>
                )}
                
                {selectedUser.website && (
                  <a 
                    href={selectedUser.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">WW</span>
                    </div>
                    <span className="text-gray-700">Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button 
                onClick={() => handleStartChat(selectedUser)}
                className="flex-1 bg-black hover:bg-gray-800"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
              <Button 
                onClick={() => handleAddFriend(selectedUser)}
                disabled={isAddingFriend}
                variant="outline"
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isAddingFriend ? "Adding..." : "Add Friend"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Chat Initiation Modal */}
      {selectedUser && (
        <ChatInitiationModal
          user={user}
          otherUser={selectedUser}
          isOpen={isInitiationModalOpen}
          onClose={() => setIsInitiationModalOpen(false)}
          onStartChat={handleInitiateChat}
        />
      )}

      {/* Inline Chat Modal */}
      {selectedUser && (
        <InlineChat
          user={user}
          otherUser={selectedUser}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </Dialog>
  )
}
