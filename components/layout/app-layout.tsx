"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Users, 
  Bell,
  Settings,
  LogOut,
  Home,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
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

interface AppLayoutProps {
  user: User
  profile: Profile
  children: React.ReactNode
  activePage?: 'home' | 'messages' | 'groups' | 'activity' | 'settings'
}

export function AppLayout({ user, profile, children, activePage = 'home' }: AppLayoutProps) {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const getButtonClass = (page: string) => {
    const baseClass = "w-12 h-12 text-black hover:bg-gray-100"
    return activePage === page 
      ? `${baseClass} bg-black text-white rounded-full` 
      : baseClass
  }

  return (
    <div className="h-screen dev-background relative overflow-hidden p-0 lg:p-4">
      <div className="lg:container mx-auto h-full">
        <div className="bg-white/90 lg:rounded-2xl h-full relative">
          <div className="flex h-full">
            
            {/* Sidebar Navigation - Desktop */}
            <div className="hidden lg:flex flex-col items-center w-16 p-2 space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={getButtonClass('home')}
                      onClick={() => router.push('/home')}
                    >
                      <Home className={`h-5 w-5 ${activePage === 'home' ? 'text-white' : 'text-black'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Home</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={getButtonClass('messages')}
                      onClick={() => router.push('/messages')}
                    >
                      <MessageCircle className={`h-5 w-5 ${activePage === 'messages' ? 'text-white' : 'text-black'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Messages</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={getButtonClass('groups')}
                      onClick={() => router.push('/groups')}
                    >
                      <Users className={`h-5 w-5 ${activePage === 'groups' ? 'text-white' : 'text-black'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Groups</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={getButtonClass('activity')}
                      onClick={() => router.push('/activity')}
                    >
                      <Bell className={`h-5 w-5 ${activePage === 'activity' ? 'text-white' : 'text-black'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Activity</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={getButtonClass('settings')}
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className={`h-5 w-5 ${activePage === 'settings' ? 'text-white' : 'text-black'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="flex-1"></div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-12 h-12 text-black hover:bg-gray-100">
                      <LogOut className="h-5 w-5 text-black" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/50 backdrop-blur-2xl rounded-2xl p-4 z-50 m-4">
        <div className="flex justify-around items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'home' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/home')}
          >
            <Home className="h-5 w-5" />
            <span className="mt-1 hidden md:block">Home</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'messages' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/messages')}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="mt-1 hidden md:block">Messages</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'groups' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/groups')}
          >
            <Users className="h-5 w-5" />
            <span className="mt-1 hidden md:block">Groups</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'activity' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/activity')}
          >
            <Bell className="h-5 w-5" />
            <span className="mt-1 hidden md:block">Activity</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'settings' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-5 w-5" />
            <span className="mt-1 hidden md:block">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
