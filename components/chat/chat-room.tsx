"use client"

import { useState, useEffect, useRef } from "react"
import { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Send,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSimpleRealtimeMessaging } from "@/hooks/use-simple-realtime-messaging"

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

interface ChatRoomProps {
  user: User
  profile: Profile
  otherUser: Profile
}

export function ChatRoom({ user, profile, otherUser }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Use simple real-time messaging hook
  const {
    messages,
    loading,
    error,
    connectionStatus,
    sendMessage,
    getOrCreateChat,
    clearError
  } = useSimpleRealtimeMessaging({
    userId: user.id,
    chatId: chatId || undefined,
    autoConnect: true
  })

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      const { data: chat, error } = await getOrCreateChat(otherUser.id)
      if (chat && !error) {
        setChatId(chat.id)
      }
    }
    initializeChat()
  }, [otherUser.id, getOrCreateChat])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const result = await sendMessage(newMessage.trim(), otherUser.id)
      
      if (result.success) {
        setNewMessage("")
      } else {
        console.error("Failed to send message:", result.error)
      }
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 200 // 200px max height
    const newHeight = Math.min(scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
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

  if (loading) {
    return (
      <AppLayout user={user} profile={profile} activePage="messages">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-black">Loading chat...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user} profile={profile} activePage="messages">
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/messages")}
                className="text-black hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
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
                <h3 className="font-semibold text-black">
                  {otherUser.full_name || otherUser.display_name || otherUser.username}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600 text-sm">
                    {otherUser.status === 'active' ? 'Online' : 
                     otherUser.status === 'busy' ? 'Busy' : 
                     otherUser.status === 'inactive' ? 'Away' : 'Offline'}
                  </p>
                  <div className="flex items-center space-x-1">
                    {connectionStatus === 'connected' ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
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
          
          {/* Error Display */}
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-600 text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="text-red-600 hover:bg-red-100 h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-hidden">
          <div className="h-full overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
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
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mt-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-black hover:bg-gray-100">
              <ImageIcon className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Textarea
                value={newMessage}
                onChange={handleTextareaChange}
                placeholder="Type a message..."
                className="pr-12 border-gray-200 focus:border-transparent focus:ring-0 resize-none min-h-[40px] max-h-[200px]"
                onKeyPress={handleKeyPress}
                disabled={sending}
                rows={1}
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
      </div>
    </AppLayout>
  )
}
