"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/app-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  TrendingUp,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { useTheme } from "@/contexts/theme-context"

interface Profile {
  id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  status?: 'active' | 'busy' | 'offline' | 'inactive'
  role?: string
  company?: string
  location?: string
  created_at: string
}

interface Activity {
  id: string
  type: 'like' | 'comment' | 'friend_request' | 'post' | 'join_group'
  user: Profile
  target_user?: Profile
  content?: string
  created_at: string
  is_read: boolean
}

interface ActivityInterfaceProps {
  user: User
  profile: Profile
}

export function ActivityInterface({ user, profile }: ActivityInterfaceProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available in ActivityInterface component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      // Mock activities for now
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'like',
          user: {
            id: '2',
            username: 'johndoe',
            full_name: 'John Doe',
            avatar_url: '',
            role: 'Frontend Developer',
            created_at: new Date().toISOString()
          },
          content: 'liked your post about React hooks',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          is_read: false
        },
        {
          id: '2',
          type: 'comment',
          user: {
            id: '3',
            username: 'janedoe',
            full_name: 'Jane Doe',
            avatar_url: '',
            role: 'UI/UX Designer',
            created_at: new Date().toISOString()
          },
          content: 'commented on your post: "Great insights on TypeScript!"',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          is_read: false
        },
        {
          id: '3',
          type: 'friend_request',
          user: {
            id: '4',
            username: 'bobsmith',
            full_name: 'Bob Smith',
            avatar_url: '',
            role: 'Backend Developer',
            created_at: new Date().toISOString()
          },
          content: 'sent you a friend request',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          is_read: true
        },
        {
          id: '4',
          type: 'join_group',
          user: {
            id: '5',
            username: 'alicejohnson',
            full_name: 'Alice Johnson',
            avatar_url: '',
            role: 'Full Stack Developer',
            created_at: new Date().toISOString()
          },
          content: 'joined the React Developers group',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          is_read: true
        }
      ]

      setActivities(mockActivities)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'post':
        return <Bell className="h-4 w-4 text-purple-500" />
      case 'join_group':
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-500/20 border-red-500/30'
      case 'comment':
        return 'bg-blue-500/20 border-blue-500/30'
      case 'friend_request':
        return 'bg-green-500/20 border-green-500/30'
      case 'post':
        return 'bg-purple-500/20 border-purple-500/30'
      case 'join_group':
        return 'bg-orange-500/20 border-orange-500/30'
      default:
        return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <AppLayout user={user} profile={profile} activePage="activity">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className={`mt-4 ${isDarkTheme ? 'text-white' : 'text-black'}`}>Loading notification...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user} profile={profile} activePage="activity">
      <div className="pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Notification</h1>
       
      </div>

      {/* Activity Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {activities.filter(a => a.type === 'like').length}
              </p>
              <p className="text-gray-600 text-sm">Likes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {activities.filter(a => a.type === 'comment').length}
              </p>
              <p className="text-gray-600 text-sm">Comments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <UserPlus className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {activities.filter(a => a.type === 'friend_request').length}
              </p>
              <p className="text-gray-600 text-sm">Requests</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {activities.length}
              </p>
              <p className="text-gray-600 text-sm">Total</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Notifications and Friend Requests */}
      <NotificationsList user={user} />
      </div>
    </AppLayout>
  )
}
