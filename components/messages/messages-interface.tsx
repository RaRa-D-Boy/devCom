"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  MessageCircle, 
  Plus, 
  Search,
  Send,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

interface Chat {
  id: string
  user_id: string
  friend_id: string
  friend: Profile
  last_message?: string
  last_message_at?: string
  unread_count: number
}

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  sender: Profile
}

interface MessagesInterfaceProps {
  user: User
  profile: Profile
}

export function MessagesInterface({ user, profile }: MessagesInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
    }
  }, [selectedChat])

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select(`
          *,
          friend:profiles!chats_friend_id_fkey(*)
        `)
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false })

      if (error) throw error

      const chatsList = (data || []).map(chat => ({
        ...chat,
        friend: chat.friend[0] || chat.friend,
        unread_count: Math.floor(Math.random() * 5) // Mock unread count
      }))

      setChats(chatsList)
      if (chatsList.length > 0 && !selectedChat) {
        setSelectedChat(chatsList[0])
      }
    } catch (error) {
      console.error("Error loading chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (error) throw error

      const messagesList = (data || []).map(message => ({
        ...message,
        sender: message.sender[0] || message.sender
      }))

      setMessages(messagesList)
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          content: newMessage,
          sender_id: user.id,
          receiver_id: selectedChat.friend_id,
          chat_id: selectedChat.id
        })
        .select(`
          *,
          sender:profiles(*)
        `)
        .single()

      if (error) throw error

      const newMsg = {
        ...data,
        sender: data.sender[0] || data.sender
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleOpenChatRoom = (friendId: string) => {
    router.push(`/chat/${friendId}`)
  }

  if (loading) {
    return (
      <AppLayout user={user} profile={profile} activePage="messages">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-black">Loading messages...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user} profile={profile} activePage="messages">
      <div className="flex h-full pb-20 lg:pb-4">
        {/* Chat List */}
        <div className="w-80 border-r border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Messages</h2>
            <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search messages..." 
              className="pl-10 border-gray-200 focus:border-blue-500"
            />
          </div>

              <div className="space-y-2">
                {chats.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`p-3 rounded-lg transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-black text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedChat(chat)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                              <AvatarImage src={chat.friend.avatar_url} />
                              <AvatarFallback className="bg-neutral-700 text-white">
                                {(chat.friend.full_name || chat.friend.display_name || chat.friend.username)?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                              chat.friend.status === 'active' ? 'bg-green-500' :
                              chat.friend.status === 'busy' ? 'bg-yellow-500' :
                              chat.friend.status === 'inactive' ? 'bg-gray-400' :
                              'bg-gray-300'
                            }`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-black truncate">
                                {chat.friend.full_name || chat.friend.display_name || chat.friend.username}
                              </h3>
                              {chat.unread_count > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                                  {chat.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm truncate">
                              {chat.last_message || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenChatRoom(chat.friend_id)}
                        className="text-gray-600 hover:text-white hover:bg-black"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                    <AvatarImage src={selectedChat.friend.avatar_url} />
                    <AvatarFallback className="bg-neutral-700 text-white">
                      {(selectedChat.friend.full_name || selectedChat.friend.display_name || selectedChat.friend.username)?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-black">
                      {selectedChat.friend.full_name || selectedChat.friend.display_name || selectedChat.friend.username}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {selectedChat.friend.status === 'active' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => (
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
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border-gray-200 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2">No chat selected</h3>
                <p className="text-gray-600">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
