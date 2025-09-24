"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus,
  Upload,
  Smile,
  Link,
  X,
  Video,
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

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'document'
  url?: string
  preview?: string
}

interface PostCreationModalProps {
  user: User
  profile: Profile
  onPostCreated: () => void
}

export function PostCreationModal({ user, profile, onPostCreated }: PostCreationModalProps) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [newPost, setNewPost] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const supabase = createClient()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: getFileType(file),
        preview: createPreview(file)
      }
      setMediaFiles(prev => [...prev, mediaFile])
    })
  }

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    return 'document'
  }

  const createPreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return ''
  }

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const uploadMediaToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('post-media')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleCreatePost = async () => {
    if (!newPost.trim() && mediaFiles.length === 0) return

    setIsCreatingPost(true)
    try {
      // Upload media files first
      const mediaUrls: string[] = []
      for (const mediaFile of mediaFiles) {
        const url = await uploadMediaToSupabase(mediaFile.file)
        mediaUrls.push(url)
      }

      // Determine post type
      let postType: 'text' | 'image' | 'video' | 'document' | 'mixed' = 'text'
      if (mediaFiles.length > 0) {
        const types = [...new Set(mediaFiles.map(f => f.type))]
        if (types.length === 1) {
          postType = types[0] as 'image' | 'video' | 'document'
        } else {
          postType = 'mixed'
        }
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: newPost,
          author_id: user.id,
          media_urls: mediaUrls,
          post_type: postType
        })
        .select(`
          *,
          author:profiles(*)
        `)
        .single()

      if (error) throw error

      setNewPost("")
      setMediaFiles([])
      setIsPostModalOpen(false)
      onPostCreated() // Notify parent component
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsCreatingPost(false)
    }
  }

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-50">
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-gray-900/95 backdrop-blur-xl border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="ring-2 ring-white/30">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-neutral-700 text-white">
                  {(profile.full_name || profile.display_name || profile.username)?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-white">
                  {profile.full_name || profile.display_name || profile.username}
                </h4>
                <p className="text-white/60 text-sm">@{profile.username}</p>
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's happening in your world?"
                className="w-full p-4 glass border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/10 text-white placeholder:text-white/70 min-h-[120px]"
                rows={4}
              />
              
              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {mediaFiles.map((media) => (
                      <div key={media.id} className="relative group">
                        {media.type === 'image' && media.preview && (
                          <div className="relative">
                            <img 
                              src={media.preview} 
                              alt="Preview" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeMediaFile(media.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {media.type === 'video' && (
                          <div className="relative bg-gray-800 rounded-lg h-32 flex items-center justify-center">
                            <Video className="h-8 w-8 text-white/60" />
                            <p className="text-white/60 text-xs mt-1">{media.file.name}</p>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeMediaFile(media.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {media.type === 'document' && (
                          <div className="relative bg-gray-800 rounded-lg h-32 flex flex-col items-center justify-center">
                            <File className="h-8 w-8 text-white/60" />
                            <p className="text-white/60 text-xs mt-1 truncate px-2">{media.file.name}</p>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeMediaFile(media.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <input
                    type="file"
                    id="modal-media-upload"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/20"
                    onClick={() => document.getElementById('modal-media-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2 text-white" />
                    Media
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Smile className="h-4 w-4 mr-2 text-white" />
                    Emoji
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Link className="h-4 w-4 mr-2 text-white" />
                    Link
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsPostModalOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={(!newPost.trim() && mediaFiles.length === 0) || isCreatingPost}
                    className="bg-black hover:bg-gray-800 text-white border-0"
                  >
                    {isCreatingPost ? "Sharing..." : "Share"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
