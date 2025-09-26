"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Plus, 
  Search,
  Crown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CreateGroupModal } from "./create-group-modal"
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

interface Group {
  id: string
  name: string
  description?: string
  avatar_url?: string
  cover_image_url?: string
  created_by: string
  created_at: string
  member_count: number
  is_admin: boolean
  last_message?: string
  last_message_at?: string
}

interface GroupsInterfaceProps {
  user: User
  profile: Profile
}

export function GroupsInterface({ user, profile }: GroupsInterfaceProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'solid';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    console.warn('Theme context not available in GroupsInterface component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark'

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      // Get user's group memberships with group details
      const { data: memberships, error: membershipsError } = await supabase
        .from("group_members")
        .select(`
          *,
          group:groups(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      if (membershipsError) throw membershipsError

      // Get actual member counts for each group
      const groupsList = await Promise.all(
        (memberships || []).map(async (membership) => {
          const group = membership.group[0] || membership.group
          
          // Debug: Log the group data to see what fields are available
          console.log("Group data:", group)
          console.log("Cover image URL:", group.cover_image_url)
          
          // Get actual member count
          const { count: memberCount, error: countError } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)
            .eq("status", "active")

          if (countError) {
            console.error("Error getting member count for group:", group.id, countError)
          }

          return {
            ...group,
            is_admin: membership.role === 'admin' || membership.role === 'creator',
            member_count: memberCount || 0,
            last_message: "Last message preview...",
            last_message_at: new Date().toISOString()
          }
        })
      )

      setGroups(groupsList)
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupCreated = (groupId: string) => {
    // Reload groups to show the newly created group
    loadGroups()
    setCreateGroupModalOpen(false)
  }

  const handleGroupClick = (groupId: string) => {
    // Navigate to group chat room
    router.push(`/messages?group=${groupId}`)
  }

  if (loading) {
    return (
      <AppLayout user={user} profile={profile} activePage="groups">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-black">Loading groups...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user} profile={profile} activePage="groups">
      <div className="pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Groups</h1>
          <Button 
            onClick={() => setCreateGroupModalOpen(true)}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
          <Input 
            placeholder="Search groups..." 
            className={`pl-10 ${isDarkTheme ? 'border-gray-600 focus:border-white/50' : 'border-gray-200 focus:border-blue-500'}`}
          />
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div 
              key={group.id} 
              onClick={() => handleGroupClick(group.id)}
              className="relative rounded-2xl shadow-2xl border border-none hover:shadow-md transition-shadow overflow-hidden min-h-[200px] cursor-pointer"
            >
              {/* Background Media - covers entire card */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: group.cover_image_url 
                    ? `url(${group.cover_image_url})` 
                    : `url('/pattern6.jpg')`
                }}
              >
                {/* Debug: Show cover image URL */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-1 rounded">
                    Cover: {group.cover_image_url || 'None'}
                  </div>
                )}
                {/* Gradient overlay - transparent at top, theme-aware fade at bottom */}
                <div className={`absolute inset-0 bg-gradient-to-b from-slate-600 via-transparent ${isDarkTheme ? 'to-gray-900/80' : 'to-white/80'}`}></div>
              </div>
              
              {/* Content Overlay */}
              <div className="relative z-10 h-full flex min-h-[200px] flex-col justify-between p-4">
                {/* Top Section - Group Info */}
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-white/50">
                      <AvatarImage src={group.avatar_url} />
                      <AvatarFallback className="bg-neutral-700 text-white">
                        {group.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {group.is_admin && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate drop-shadow-lg">{group.name}</h3>
                    <p className="text-white/80 text-sm drop-shadow">{group.member_count} members</p>
                  </div>
                </div>
                
                {/* Bottom Section - Content with Theme-Aware Background */}
                <div className={`rounded-2xl p-3 shadow-lg ${
                  isDarkTheme 
                    ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
                      glassEffect === 'transparent' ? 'bg-transparent' :
                      'bg-neutral-900 border border-gray-700'
                    : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                      glassEffect === 'transparent' ? 'bg-transparent' :
                      'bg-white border border-gray-200'
                }`}>
                  {group.description && (
                    <p className={`text-sm mb-2 line-clamp-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {group.description}
                    </p>
                  )}
                  
                  <div className={`flex items-center justify-between text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Last active: {new Date(group.last_message_at || group.created_at).toLocaleDateString()}</span>
                    {group.is_admin && (
                      <span className="text-yellow-600">Admin</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <div className={`rounded-2xl shadow-sm border p-8 ${
              isDarkTheme 
                ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border-gray-700/30' :
                  glassEffect === 'transparent' ? 'bg-transparent border-gray-700' :
                  'bg-neutral-900 border-gray-700'
                : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border-white/20' :
                  glassEffect === 'transparent' ? 'bg-transparent border-gray-200' :
                  'bg-white border-gray-200'
            }`}>
              <Users className={`h-16 w-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>No groups yet</h3>
              <p className={`mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Create or join a group to start collaborating</p>
              <Button 
                onClick={() => setCreateGroupModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        user={user}
        isOpen={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </AppLayout>
  )
}
