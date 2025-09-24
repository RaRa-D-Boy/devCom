"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRealtimeMessaging } from "@/hooks/use-realtime-messaging"
import { Send, Wifi, WifiOff } from "lucide-react"

interface Profile {
  id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
}

interface RealtimeDemoProps {
  user: User
  otherUserId: string
}

export function RealtimeDemo({ user, otherUserId }: RealtimeDemoProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const {
    messages,
    loading,
    error,
    connectionStatus,
    sendMessage,
    clearError
  } = useRealtimeMessaging({
    userId: user.id,
    autoConnect: true
  })

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const result = await sendMessage(message.trim(), otherUserId)
      
      if (result.success) {
        setMessage("")
      } else {
        console.error("Failed to send message:", result.error)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Real-time Chat Demo</CardTitle>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
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

        {/* Messages Display */}
        <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg max-w-xs ${
                  msg.sender_id === user.id
                    ? 'bg-black text-white ml-auto'
                    : 'bg-gray-100 text-black'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Connection Info */}
        <div className="text-xs text-gray-500">
          <p>User ID: {user.id}</p>
          <p>Other User ID: {otherUserId}</p>
          <p>Messages: {messages.length}</p>
        </div>
      </CardContent>
    </Card>
  )
}
