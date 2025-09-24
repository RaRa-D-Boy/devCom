"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Eye,
  Users,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface GroupsListProps {
  user: User
}

export function GroupsList({ user }: GroupsListProps) {
  const [groups, setGroups] = useState<any[]>([])
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_chats")
        .select(`
          *,
          creator:profiles(*),
          members_count:group_chat_members(count)
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
        .from("group_chat_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "member"
        })

      if (error) throw error

      // Show success message or update UI
      console.log(`Joined group: ${group.name}`)
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
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg text-black">All Groups</h3>
        <span className="text-sm text-white/60">{groups.length}</span>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 shadow-sm hover:shadow-md transition-all">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                <AvatarFallback className="bg-neutral-700 text-white text-sm">
                  {group.name?.[0] || 'G'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-black">
                {group.name}
              </p>
              <div className="flex items-center space-x-1">
                <p className="text-xs text-gray-500 truncate">{group.members_count} members</p>
                {group.creator && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-500 truncate">by {group.creator.username}</p>
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
                      className="h-8 w-8 p-0 text-gray-600 hover:text-white hover:bg-black"
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
            <p className="text-black text-sm">No groups found</p>
          </div>
        )}
      </div>
    </div>
  )
}
