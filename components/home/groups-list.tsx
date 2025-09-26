"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Eye,
  Users,
  Plus,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTheme } from "@/contexts/theme-context"

interface GroupsListProps {
  user: User
}

export function GroupsList({ user }: GroupsListProps) {
  const [groups, setGroups] = useState<any[]>([])
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { theme, glassEffect } = useTheme()
  const isDarkTheme = theme === 'dark'

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          creator:profiles(*),
          members_count:group_members(count)
        `)
        .order("created_at", { ascending: false })
        .limit(10) // Limit to 10 groups for performance

      if (error) throw error

      const groupsList = (data || []).map(group => ({
        ...group,
        members_count: group.members_count?.[0]?.count || 0
      }))

      setGroups(groupsList)
    } catch (error) {
      console.error("Error loading groups:", error)
    }
  }

  const handleJoinGroup = async (group: any) => {
    setIsJoiningGroup(true)
    try {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "member",
          status: "active"
        })

      if (error) throw error

      // Show success message or update UI
      console.log(`Joined group: ${group.name}`)
      // Refresh the groups list
      loadGroups()
    } catch (error) {
      console.error("Error joining group:", error)
    } finally {
      setIsJoiningGroup(false)
    }
  }

  const handleViewGroup = (group: any) => {
    // Navigate to group page
    router.push(`/groups/${group.id}`)
  }

  return (
    <div className={`rounded-2xl p-4 ${
      isDarkTheme 
        ? glassEffect === 'translucent' ? 'bg-transparent lg:bg-neutral-900/70 backdrop-blur-sm border-0 lg:border border-gray-700/30' :
          glassEffect === 'transparent' ? 'bg-transparent' :
          'bg-transparent lg:bg-neutral-900 border-0 lg:border border-gray-700'
        : glassEffect === 'translucent' ? 'bg-transparent lg:bg-white/80 backdrop-blur-sm border-0 lg:border border-white/20' :
          glassEffect === 'transparent' ? 'bg-transparent' :
          'bg-transparent lg:bg-white border-0 lg:border border-gray-200'
    }`}>
      <div className="hidden lg:flex items-center justify-between mb-2">
        <h3 className={`font-semibold text-lg ${isDarkTheme ? 'text-white' : 'text-black'}`}>All Groups</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${isDarkTheme ? 'text-white/60' : 'text-black/60'}`}>{groups.length}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 p-0 ${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-white hover:bg-black'}`}
                  onClick={() => router.push('/groups/create')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Group</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Desktop Layout - Full cards */}
      <div className="hidden lg:block space-y-2 max-h-[500px] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.id} className={`flex items-center space-x-2 p-3 border rounded-2xl shadow-sm hover:shadow-md transition-all ${
            isDarkTheme 
              ? 'border-gray-600 hover:bg-gray-700' 
              : 'border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="relative">
              <Avatar className={`h-10 w-10 ring-2 ${isDarkTheme ? 'ring-gray-600' : 'ring-gray-200'}`}>
                <AvatarFallback className="bg-neutral-700 text-white text-sm">
                  {group.name?.[0] || 'G'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                {group.name}
              </p>
              <div className="flex items-center space-x-1">
                <p className={`text-xs truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{group.members_count} members</p>
                {group.creator && (
                  <>
                    <span className={isDarkTheme ? 'text-gray-500' : 'text-gray-300'}>•</span>
                    <p className={`text-xs truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>by {group.creator.username}</p>
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
                      className={`h-8 w-8 p-0 ${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-white hover:bg-black'}`}
                      onClick={() => handleViewGroup(group)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Group</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-white hover:bg-black'}`}
                      onClick={() => handleJoinGroup(group)}
                      disabled={isJoiningGroup}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Join Group</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-center py-4">
            <p className={`text-sm ${isDarkTheme ? 'text-white' : 'text-black'}`}>No groups found</p>
          </div>
        )}
      </div>

      {/* Mobile Layout - Horizontal stories-like layout */}
      <div className="lg:hidden">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide bg-transparent">
          {groups.map((group) => (
            <div key={group.id} className="flex-shrink-0 text-center">
              <div className="relative mb-2">
                <div 
                  className="h-16 w-16 rounded-full p-0.5 cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
                  }}
                  onClick={() => handleViewGroup(group)}
                >
                  <div className="h-full w-full rounded-full bg-white p-0.5">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-neutral-700 text-white text-sm">
                        {group.name?.[0] || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 border-2 border-white rounded-full bg-green-500"></div>
              </div>
              <p className={`text-xs truncate w-16 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {group.name}
              </p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-5 w-5 p-0 ${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-white hover:bg-black'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewGroup(group)
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-5 w-5 p-0 ${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-white hover:bg-black'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleJoinGroup(group)
                  }}
                  disabled={isJoiningGroup}
                >
                  <Users className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {groups.length === 0 && (
          <div className="text-center py-4">
            <p className={`text-sm ${isDarkTheme ? 'text-white' : 'text-black'}`}>No groups found</p>
          </div>
        )}
      </div>
    </div>
  )
}
