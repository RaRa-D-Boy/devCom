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
import { useUnreadCount } from "@/hooks/use-unread-count"
import { Profile } from "../messages/types"
import { useProfile } from "@/contexts/profile-context"
import { useTheme } from "@/contexts/theme-context"

interface AppLayoutProps {
  user: User
  profile: Profile
  children: React.ReactNode
  activePage?: 'home' | 'messages' | 'groups' | 'activity' | 'settings'
}

export function AppLayout({ user, profile, children, activePage = 'home' }: AppLayoutProps) {
  const supabase = createClient()
  const router = useRouter()
  const { unreadCount } = useUnreadCount(user.id)
  const { backgroundImage } = useProfile()
  const { glassEffect, colorPalette, theme } = useTheme()

  // Check if theme is dark
  const isDarkTheme = theme === 'dark'
  
  // Log appearance settings
  console.log('Appearance Settings:', {
    theme,
    isDarkTheme,
    colorPalette,
    glassEffect,
    backgroundImage
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const getButtonClass = (page: string) => {
    const baseClass = "w-12 h-12 transition-all"
    return activePage === page 
      ? `${baseClass} bg-primary text-primary-foreground rounded-full` 
      : `${baseClass} text-foreground hover:bg-accent`
  }

  return (
    <div 
      className={`h-screen relative overflow-hidden p-0 lg:p-4 ${isDarkTheme ? 'dark' : ''}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'url(/dev.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="lg:container mx-auto h-full">
        <div className={`lg:rounded-2xl h-full relative ${
          isDarkTheme 
            ? glassEffect === 'translucent' ? 'glass-dark' :
              glassEffect === 'transparent' ? 'bg-black/20 backdrop-blur-sm border border-gray-700/30' :
              'bg-card backdrop-blur-none border-border'
            : glassEffect === 'translucent' ? 'bg-white/30 backdrop-blur-md border border-white/20' :
              glassEffect === 'transparent' ? 'bg-white/10 backdrop-blur-sm border border-white/10' :
              'bg-white/90 backdrop-blur-none border border-gray-200'
        }`}>
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
                      <Home className={`h-5 w-5 ${activePage === 'home' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
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
                      className={`${getButtonClass('messages')} relative`}
                      onClick={() => router.push('/messages')}
                    >
                      <MessageCircle className={`h-5 w-5 ${activePage === 'messages' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Messages {unreadCount > 0 && `(${unreadCount} unread)`}</p>
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
                      <Users className={`h-5 w-5 ${activePage === 'groups' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
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
                      <Bell className={`h-5 w-5 ${activePage === 'activity' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
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
                      <Settings className={`h-5 w-5 ${activePage === 'settings' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="flex-1"></div>
                
                {/* Theme Status Indicator */}
              
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className={`w-12 h-12 ${isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`}>
                      <LogOut className={`h-5 w-5 ${isDarkTheme ? 'text-white' : 'text-black'}`} />
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
        {/* Theme Status for Mobile */}
        
        <div className="flex justify-around items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'home' 
                ? `bg-primary text-primary-foreground` 
                : isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/home')}
          >
            <Home className={`h-5 w-5 ${activePage === 'home' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`}/>
            <span className="mt-1 hidden lg:block">Home</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all relative ${
              activePage === 'messages' 
                ? `bg-primary text-primary-foreground` 
                : isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/messages')}
          >
            <MessageCircle className={`h-5 w-5 ${activePage === 'messages' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="mt-1 hidden lg:block">Messages</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'groups' 
                ? `bg-primary text-primary-foreground` 
                : isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/groups')}
          >
            <Users className={`h-5 w-5 ${activePage === 'groups' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
            <span className="mt-1 hidden lg:block">Groups</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'activity' 
                ? `bg-primary text-primary-foreground` 
                : isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/activity')}
          >
            <Bell className={`h-5 w-5 ${activePage === 'activity' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
            <span className="mt-1 hidden lg:block">Activity</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center text-xs px-3 py-2 rounded-full transition-all ${
              activePage === 'settings' 
                ? `bg-primary text-primary-foreground` 
                : isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'
            }`}
            onClick={() => router.push('/settings')}
          >
            <Settings className={`h-5 w-5 ${activePage === 'settings' ? 'text-primary-foreground' : isDarkTheme ? 'text-white' : 'text-black'}`} />
            <span className="mt-1 hidden lg:block">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
