"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, MessageCircle, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ChatRoom {
  id: string
  name: string
  description: string | null
  member_count?: number
}

interface ChatSidebarProps {
  currentRoomId: string
  onRoomChange: (roomId: string) => void
  user: any
  onOnlineCountChange?: (count: number) => void
}

export function ChatSidebar({ currentRoomId, onRoomChange, user, onOnlineCountChange }: ChatSidebarProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRooms()
    setupPresenceTracking()
  }, [])

  useEffect(() => {
    onOnlineCountChange?.(onlineUsers.size)
  }, [onlineUsers.size, onOnlineCountChange])

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select(`
          id,
          name,
          description,
          room_members!inner(user_id)
        `)
        .eq("room_members.user_id", user.id)

      if (error) throw error

      const roomsWithCount =
        data?.map((room: any) => ({
          id: room.id,
          name: room.name,
          description: room.description,
          member_count: room.room_members?.length || 0,
        })) || []

      setRooms(roomsWithCount)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupPresenceTracking = () => {
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState()
        const users = new Set(Object.keys(newState))
        setOnlineUsers(users)
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setOnlineUsers((prev) => new Set([...prev, key]))
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            username: user.user_metadata?.username || user.email,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials(user?.user_metadata?.display_name || user?.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.display_name || user?.user_metadata?.username || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 w-8 p-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Online Users Count */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span>
            {onlineUsers.size} user{onlineUsers.size !== 1 ? "s" : ""} online
          </span>
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Chat Rooms</h2>
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No rooms available</div>
          ) : (
            <div className="space-y-1 pb-4">
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant={currentRoomId === room.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onRoomChange(room.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{room.name}</p>
                      {room.member_count && (
                        <Badge variant="secondary" className="ml-2 h-5 text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {room.member_count}
                        </Badge>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{room.description}</p>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
