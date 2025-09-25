"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  MessageCircle, 
  Share2,
  Eye,
  Play,
  Pause,
  File,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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

interface ActivityFeedProps {
  user: User
  onViewPost: (post: Post) => void
}

export function ActivityFeed({ user, onViewPost }: ActivityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const { theme, glassEffect } = useTheme()
  
  const isDarkTheme = theme === 'dark'

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(*),
          likes_count:post_likes(count),
          comments_count:post_comments(count)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      // Check if current user liked each post
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { data: likeData } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .single()

          return {
            ...post,
            is_liked: !!likeData,
            likes_count: post.likes_count?.[0]?.count || 0,
            comments_count: post.comments_count?.[0]?.count || 0
          }
        })
      )

      setPosts(postsWithLikes)
    } catch (error) {
      console.error("Error loading posts:", error)
    }
  }

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

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      ))
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const toggleVideoPlay = (postId: string, videoElement: HTMLVideoElement) => {
    if (playingVideos.has(postId)) {
      videoElement.pause()
      setPlayingVideos(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    } else {
      videoElement.play()
      setPlayingVideos(prev => new Set(prev).add(postId))
    }
  }

  return (
    <div className="lg:col-span-2">
      {/* Activity Feed Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Activity Feed</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className={`text-sm ${isDarkTheme ? 'text-white/70' : 'text-black/70'}`}>Live</span>
        </div>
      </div>

      {/* Scrollable Activity Feed */}
      <div className="h-[calc(100vh-200px)] lg:h-[calc(100vh-100px)] overflow-y-auto">
        <div className="space-y-0 ">
          {posts.map((post) => (
            <div key={post.id} className="relative rounded-2xl shadow-2xl border border-none mb-4 hover:shadow-md transition-shadow overflow-hidden min-h-[400px]">
              {/* Background Media - covers entire card */}
              {post.media_urls && post.media_urls.length > 0 ? (
                <div className="absolute inset-0">
                  {post.post_type === 'image' ? (
                    <img 
                      src={post.media_urls[0]} 
                      alt="Post background" 
                      className="w-full h-full object-cover"
                    />
                  ) : post.post_type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video 
                        src={post.media_urls[0]} 
                        className="w-full h-full object-cover"
                        muted
                        loop
                        ref={(video) => {
                          if (video) {
                            video.onended = () => {
                              setPlayingVideos(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(post.id)
                                return newSet
                              })
                            }
                          }
                        }}
                      />
                      {/* Custom Video Controls */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            const video = e.currentTarget.parentElement?.querySelector('video') as HTMLVideoElement
                            if (video) {
                              toggleVideoPlay(post.id, video)
                            }
                          }}
                        >
                          {playingVideos.has(post.id) ? (
                            <Pause className="h-8 w-8" />
                          ) : (
                            <Play className="h-8 w-8 ml-1" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <File className={`h-16 w-16 ${isDarkTheme ? 'text-gray-300' : 'text-gray-400'}`} />
                    </div>
                  )}
                  {/* Gradient overlay - transparent at top, theme-aware fade at bottom */}
                  <div className={`absolute inset-0 bg-gradient-to-b from-slate-600 via-transparent ${isDarkTheme ? 'to-gray-900/80' : 'to-white/80'}`}></div>
                </div>
              ) : (
                <div className={`absolute inset-0 ${isDarkTheme ? 'bg-gray-800' : 'bg-gray-50'}`}></div>
              )}
              
              {/* Content Overlay */}
              <div className="relative z-10 h-full flex min-h-[400px] flex-col justify-between">
                {/* Top Section - User Info */}
                <div className="flex items-start p-6 space-x-4">
                  <Avatar className="ring-2 ring-white/50">
                    <AvatarImage src={post.author.avatar_url} />
                    <AvatarFallback className="bg-neutral-700 text-white">
                      {(post.author.full_name || post.author.display_name || post.author.username)?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-white truncate drop-shadow-lg">
                        {post.author.full_name || post.author.display_name || post.author.username}
                      </h4>
                      <span className="text-white/80 text-sm drop-shadow">@{post.author.username}</span>
                      <span className="text-white/60 text-sm">•</span>
                      <span className="text-white/80 text-sm drop-shadow">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {post.post_type && post.post_type !== 'text' && (
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                          {post.post_type}
                        </Badge>
                      )}
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
                    {post.content && (
                      <p className={`leading-relaxed ${isDarkTheme ? 'text-white' : 'text-black'}`}>{post.content}</p>
                    )}
                    
                    <div className={`flex items-center space-x-6 pt-3 ${glassEffect !== 'transparent' ? `border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}` : ''}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikePost(post.id, post.is_liked)}
                        className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${post.is_liked ? "text-red-500" : ""}`}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${post.is_liked ? "fill-current text-red-500" : ""}`} />
                        {post.likes_count}
                      </Button>
                      <Button variant="ghost" size="sm" className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments_count}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                        onClick={() => onViewPost(post)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className={`${isDarkTheme ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-16">
              <div className={`rounded-2xl shadow-sm p-8 ${
                isDarkTheme 
                  ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
                    glassEffect === 'transparent' ? 'bg-transparent' :
                    'bg-neutral-900 border border-gray-700'
                  : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                    glassEffect === 'transparent' ? 'bg-transparent' :
                    'bg-white border border-gray-200'
              }`}>
                <MessageCircle className={`h-16 w-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>No posts yet</h3>
                <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Be the first to share something with your network!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
