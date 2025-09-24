"use client"

import { useState, useEffect } from "react"
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
  const supabase = createClient()

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          group:groups(*)
        `)
        .eq("user_id", user.id)

      if (error) throw error

      const groupsList = (data || []).map(membership => ({
        ...membership.group[0] || membership.group,
        is_admin: membership.role === 'admin',
        member_count: Math.floor(Math.random() * 50) + 5, // Mock member count
        last_message: "Last message preview...",
        last_message_at: new Date().toISOString()
      }))

      setGroups(groupsList)
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-black">Groups</h1>
        <Button className="bg-black hover:bg-gray-800 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Search groups..." 
          className="pl-10 border-gray-200 focus:border-blue-500"
        />
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start space-x-3 mb-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-gray-200">
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
                <h3 className="font-semibold text-black truncate">{group.name}</h3>
                <p className="text-gray-600 text-sm">{group.member_count} members</p>
              </div>
            </div>
            
            {group.description && (
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">{group.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last active: {new Date(group.last_message_at || group.created_at).toLocaleDateString()}</span>
              {group.is_admin && (
                <span className="text-yellow-600">Admin</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-4">Create or join a group to start collaborating</p>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  )
}
