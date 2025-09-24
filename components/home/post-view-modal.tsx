"use client"

import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Heart,
  MessageCircle,
  Share2,
  File,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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

interface Post {
  id: string
  content: string
  author_id: string
  author: Profile
  created_at: string
  likes_count: number
  comments_count: number
  is_liked: boolean
  media_urls?: string[]
  post_type?: 'text' | 'image' | 'video' | 'document' | 'mixed'
}

interface PostViewModalProps {
  user: User
  profile: Profile
  selectedPost: Post | null
  isOpen: boolean
  onClose: () => void
  onLikePost: (postId: string, isLiked: boolean) => void
}

export function PostViewModal({ user, profile, selectedPost, isOpen, onClose, onLikePost }: PostViewModalProps) {
  const supabase = createClient()

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
      } else {
        await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id
          })
      }

      onLikePost(postId, isLiked)
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Post Details</DialogTitle>
        </DialogHeader>
        
        {selectedPost && (
          <div className="space-y-6">
            {/* Post Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="ring-2 ring-gray-200">
                <AvatarImage src={selectedPost.author.avatar_url} />
                <AvatarFallback className="bg-neutral-700 text-white">
                  {(selectedPost.author.full_name || selectedPost.author.display_name || selectedPost.author.username)?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">
                    {selectedPost.author.full_name || selectedPost.author.display_name || selectedPost.author.username}
                  </h3>
                  <span className="text-gray-500 text-sm">@{selectedPost.author.username}</span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(selectedPost.created_at).toLocaleDateString()}
                  </span>
                  {selectedPost.post_type && selectedPost.post_type !== 'text' && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedPost.post_type}
                    </Badge>
                  )}
                </div>
                {selectedPost.author.role && (
                  <p className="text-sm text-blue-600 font-medium">{selectedPost.author.role}</p>
                )}
              </div>
            </div>

            {/* Post Content */}
            {selectedPost.content && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-900 leading-relaxed">{selectedPost.content}</p>
              </div>
            )}

            {/* Media Display */}
            {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
              <div className="space-y-4">
                {selectedPost.media_urls.map((url, index) => (
                  <div key={index} className="relative">
                    {selectedPost.post_type === 'image' ? (
                      <img 
                        src={url} 
                        alt={`Post media ${index + 1}`}
                        className="w-full max-h-96 object-cover rounded-xl"
                      />
                    ) : selectedPost.post_type === 'video' ? (
                      <video 
                        src={url} 
                        controls
                        className="w-full max-h-96 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="bg-gray-100 rounded-xl p-8 text-center">
                        <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Document attachment</p>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                        >
                          Download File
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Post Stats */}
            <div className="flex items-center justify-between py-4 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Heart className={`h-5 w-5 ${selectedPost.is_liked ? "fill-current text-red-500" : "text-gray-400"}`} />
                  <span className="text-gray-600 font-medium">{selectedPost.likes_count} likes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">{selectedPost.comments_count} comments</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikePost(selectedPost.id, selectedPost.is_liked)}
                  className={`${selectedPost.is_liked ? "text-red-500" : "text-gray-600"} hover:bg-gray-100`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${selectedPost.is_liked ? "fill-current" : ""}`} />
                  {selectedPost.is_liked ? "Liked" : "Like"}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Comments</h4>
              <div className="space-y-4">
                {/* Comment Input */}
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-neutral-700 text-white text-xs">
                      {(profile.full_name || profile.display_name || profile.username)?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input 
                      placeholder="Write a comment..." 
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  <Button size="sm" className="bg-black hover:bg-gray-800">
                    Post
                  </Button>
                </div>
                
                {/* Sample Comments */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-neutral-700 text-white text-xs">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-gray-900">John Doe</p>
                        <p className="text-sm text-gray-700 mt-1">Great post! Thanks for sharing this.</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 ml-3">
                        <button className="text-xs text-gray-500 hover:text-gray-700">Like</button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                        <span className="text-xs text-gray-400">2h</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-neutral-700 text-white text-xs">
                        JS
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-gray-900">Jane Smith</p>
                        <p className="text-sm text-gray-700 mt-1">This is really helpful information!</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 ml-3">
                        <button className="text-xs text-gray-500 hover:text-gray-700">Like</button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                        <span className="text-xs text-gray-400">1h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
