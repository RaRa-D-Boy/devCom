"use client"

import { useState, useEffect, useRef } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  X,
  BookOpen,
  Heart,
  MessageCircle,
  Paperclip,
  Mic,
  Sparkles,
  Send,
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

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  sender: Profile
  receiver: Profile
}

interface ChatInitiationModalProps {
  user: User
  otherUser: Profile
  isOpen: boolean
  onClose: () => void
  onStartChat: () => void
}

export function ChatInitiationModal({ user, otherUser, isOpen, onClose, onStartChat }: ChatInitiationModalProps) {
  const [isRecording, setIsRecording] = useState(false)
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
    autoConnect: isOpen
  })

  // Initialize chat when modal opens
  useEffect(() => {
    if (isOpen) {
      const initializeChat = async () => {
        const { data: chat, error } = await getOrCreateChat(otherUser.id)
        if (chat && !error) {
          setChatId(chat.id)
        }
      }
      initializeChat()
    }
  }, [isOpen, otherUser.id, getOrCreateChat])

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
        
        // Navigate to dedicated chat page after successful message send
        setTimeout(() => {
          onClose() // Close the modal first
          router.push(`/chat/${otherUser.id}`) // Navigate to dedicated chat page
        }, 500) // Small delay to show the message was sent
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

  const handleStartRecording = () => {
    setIsRecording(true)
    // Add voice recording logic here
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Stop recording and process audio
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] p-0 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-100 border-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {/* User Info Card - Compact version when messages exist */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 mb-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-purple-200">
                <AvatarImage src={otherUser.avatar_url} />
                <AvatarFallback className="bg-neutral-700 text-white">
                  {(otherUser.full_name || otherUser.display_name || otherUser.username)?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {otherUser.full_name || otherUser.display_name || otherUser.username}
                </h3>
                <p className="text-xs text-gray-600">@{otherUser.username}</p>
              </div>
              <div className={`w-2 h-2 rounded-full border border-white ${
                otherUser.status === 'active' ? 'bg-green-500' :
                otherUser.status === 'busy' ? 'bg-yellow-500' :
                otherUser.status === 'inactive' ? 'bg-gray-400' :
                'bg-gray-300'
              }`}></div>
            </div>
          </div>
          
         
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-6 pb-6">
          {/* Greeting Section - Only show if no messages */}
          {messages.length === 0 && !loading && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                Hello {otherUser.full_name || otherUser.display_name || otherUser.username}
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                How can I help you today?
              </p>
            </div>
          )}

          

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-600 text-sm">Send a message to begin chatting with {otherUser.full_name || otherUser.display_name || otherUser.username}</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-3 py-2 rounded-2xl ${
                    message.sender_id === user.id 
                      ? 'bg-black text-white' 
                      : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-white/50'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user.id ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="space-y-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-white/50">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-8 h-8 rounded-full p-0 ${
                    isRecording 
                      ? 'bg-black animate-pulse' 
                      : 'bg-black hover:bg-gray-800'
                  }`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                  <Mic className="h-4 w-4 text-white" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="border-0 bg-transparent focus:ring-0 text-sm placeholder:text-gray-500"
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-white/50"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-8 h-8 p-0 bg-black hover:bg-gray-800 text-white rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
