"use client"

import { useState, useEffect, useRef } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Send,
  X,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Image as ImageIcon,
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

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  sender: Profile
  receiver: Profile
}

interface InlineChatProps {
  user: User
  otherUser: Profile
  isOpen: boolean
  onClose: () => void
}

export function InlineChat({ user, otherUser, isOpen, onClose }: InlineChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      setupRealtimeSubscription()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    try {
      // First, ensure a chat exists between the two users
      await ensureChatExists()

      // Get the chat ID
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("id")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${otherUser.id}),and(user_id.eq.${otherUser.id},friend_id.eq.${user.id})`)
        .single()

      if (chatError || !chat) {
        console.error("Error finding chat:", chatError)
        return
      }

      // Load messages for this chat
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(*),
          receiver:profiles(*)
        `)
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      const messagesList = (data || []).map(message => ({
        ...message,
        sender: message.sender[0] || message.sender,
        receiver: message.receiver[0] || message.receiver
      }))

      setMessages(messagesList)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const ensureChatExists = async () => {
    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from("chats")
        .select("id")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${otherUser.id}),and(user_id.eq.${otherUser.id},friend_id.eq.${user.id})`)
        .single()

      if (existingChat) {
        return existingChat.id
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          friend_id: otherUser.id
        })
        .select()
        .single()

      if (error) throw error
      return newChat.id
    } catch (error) {
      console.error("Error ensuring chat exists:", error)
      throw error
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          // Reload messages when new message is received
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      // Get or create chat
      const chatId = await ensureChatExists()

      const { data, error } = await supabase
        .from("messages")
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          receiver_id: otherUser.id,
          chat_id: chatId
        })
        .select(`
          *,
          sender:profiles(*),
          receiver:profiles(*)
        `)
        .single()

      if (error) throw error

      const newMsg = {
        ...data,
        sender: data.sender[0] || data.sender,
        receiver: data.receiver[0] || data.receiver
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage("")

      // Update chat's last message
      await supabase
        .from("chats")
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq("id", chatId)

    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col bg-white border-gray-200">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                  <AvatarImage src={otherUser.avatar_url} />
                  <AvatarFallback className="bg-neutral-700 text-white">
                    {(otherUser.full_name || otherUser.display_name || otherUser.username)?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                  otherUser.status === 'active' ? 'bg-green-500' :
                  otherUser.status === 'busy' ? 'bg-yellow-500' :
                  otherUser.status === 'inactive' ? 'bg-gray-400' :
                  'bg-gray-300'
                }`}></div>
              </div>
              
              <div>
                <DialogTitle className="text-lg font-semibold text-black">
                  {otherUser.full_name || otherUser.display_name || otherUser.username}
                </DialogTitle>
                <p className="text-gray-600 text-sm">
                  {otherUser.status === 'active' ? 'Online' : 
                   otherUser.status === 'busy' ? 'Busy' : 
                   otherUser.status === 'inactive' ? 'Away' : 'Offline'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 border-t border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-600">Send a message to begin chatting with {otherUser.full_name || otherUser.display_name || otherUser.username}</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user.id 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-black'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user.id ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
              <ImageIcon className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-12 border-gray-200 focus:border-blue-500"
                onKeyPress={handleKeyPress}
                disabled={sending}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-black hover:bg-gray-100"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
