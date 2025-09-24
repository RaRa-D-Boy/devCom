"use client"

import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface MessageListProps {
  roomId: string
  currentUserId: string
}

export function MessageList({ roomId, currentUserId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (roomId) {
      fetchMessages()
      setupRealtimeSubscription()
    }

    return () => {
      supabase.removeAllChannels()
    }
  }, [roomId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          profiles!inner(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data: newMessage, error } = await supabase
            .from("messages")
            .select(`
              id,
              content,
              created_at,
              updated_at,
              user_id,
              profiles!inner(
                username,
                display_name,
                avatar_url
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (!error && newMessage) {
            setMessages((prev) => [...prev, newMessage])
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Handle message updates (like edits)
          const { data: updatedMessage, error } = await supabase
            .from("messages")
            .select(`
              id,
              content,
              created_at,
              updated_at,
              user_id,
              profiles!inner(
                username,
                display_name,
                avatar_url
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (!error && updatedMessage) {
            setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Handle message deletions
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId)
    setEditContent(currentContent)
  }

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from("messages")
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("user_id", currentUserId) // Ensure user can only edit their own messages

      if (error) throw error

      setEditingMessageId(null)
      setEditContent("")
    } catch (error) {
      console.error("Error updating message:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", currentUserId) // Ensure user can only delete their own messages

      if (error) throw error
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const isMessageEdited = (message: Message) => {
    return new Date(message.updated_at) > new Date(message.created_at)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.user_id === currentUserId
            const displayName = message.profiles.display_name || message.profiles.username
            const isEditing = editingMessageId === message.id

            return (
              <div key={message.id} className={`flex gap-3 group ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {getUserInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex-1 max-w-xs sm:max-w-md ${isOwnMessage ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${isOwnMessage ? "order-2" : ""}`}>{displayName}</span>
                    <span className={`text-xs text-muted-foreground ${isOwnMessage ? "order-1" : ""}`}>
                      {formatMessageTime(message.created_at)}
                      {isMessageEdited(message) && <span className="ml-1">(edited)</span>}
                    </span>
                  </div>

                  <div className="relative">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSaveEdit(message.id)
                            } else if (e.key === "Escape") {
                              handleCancelEdit()
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleSaveEdit(message.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`inline-block p-3 rounded-lg text-sm ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-muted-foreground rounded-bl-sm"
                          }`}
                        >
                          {message.content}
                        </div>

                        {/* Message actions - only show for own messages */}
                        {isOwnMessage && (
                          <div
                            className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isOwnMessage ? "-left-8" : "-right-8"
                            }`}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                                <DropdownMenuItem onClick={() => handleEditMessage(message.id, message.content)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ScrollArea>
  )
}
