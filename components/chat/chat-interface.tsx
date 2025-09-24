"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChatSidebar } from "./chat-sidebar"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"

interface ChatInterfaceProps {
  user: any
  profile: any
}

export function ChatInterface({ user, profile }: ChatInterfaceProps) {
  const [currentRoomId, setCurrentRoomId] = useState<string>("")
  const [onlineCount, setOnlineCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Get the default room (General) on load
    const getDefaultRoom = async () => {
      const { data } = await supabase.from("chat_rooms").select("id").eq("name", "General").single()

      if (data) {
        setCurrentRoomId(data.id)
      }
    }

    getDefaultRoom()
  }, [])

  const handleRoomChange = (roomId: string) => {
    setCurrentRoomId(roomId)
  }

  const handleOnlineCountChange = (count: number) => {
    setOnlineCount(count)
  }

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar
        currentRoomId={currentRoomId}
        onRoomChange={handleRoomChange}
        user={user}
        onOnlineCountChange={handleOnlineCountChange}
      />

      <div className="flex-1 flex flex-col chat-gradient">
        {currentRoomId ? (
          <>
            <ChatHeader roomId={currentRoomId} onlineCount={onlineCount} />
            <MessageList roomId={currentRoomId} currentUserId={user.id} />
            <MessageInput roomId={currentRoomId} userId={user.id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Welcome to Chat!</p>
              <p className="text-sm">Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
