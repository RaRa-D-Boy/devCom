"use client"

import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Hash, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface ChatRoom {
  id: string
  name: string
  description: string | null
}

interface ChatHeaderProps {
  roomId: string
  onlineCount: number
}

export function ChatHeader({ roomId, onlineCount }: ChatHeaderProps) {
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (roomId) {
      fetchRoomInfo()
    }
  }, [roomId])

  const fetchRoomInfo = async () => {
    try {
      // Get room details
      const { data: roomData, error: roomError } = await supabase
        .from("chat_rooms")
        .select("id, name, description")
        .eq("id", roomId)
        .single()

      if (roomError) throw roomError
      setRoom(roomData)

      // Get member count
      const { count, error: countError } = await supabase
        .from("room_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId)

      if (countError) throw countError
      setMemberCount(count || 0)
    } catch (error) {
      console.error("Error fetching room info:", error)
    }
  }

  if (!room) {
    return (
      <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="h-6 bg-muted animate-pulse rounded"></div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{room.name}</h1>
          </div>
          {room.description && <p className="text-sm text-muted-foreground hidden sm:block">{room.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
            {onlineCount} online
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {memberCount} members
          </Badge>
        </div>
      </div>
    </div>
  )
}
