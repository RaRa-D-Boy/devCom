"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { useState } from "react"

interface MessageInputProps {
  roomId: string
  userId: string
  onMessageSent?: () => void
}

export function MessageInput({ roomId, userId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const { error } = await supabase.from("messages").insert({
        content: message.trim(),
        user_id: userId,
        room_id: roomId,
      })

      if (error) throw error

      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as any)
    }
  }

  return (
    <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
      <form onSubmit={sendMessage} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Enter to send)"
          disabled={sending}
          className="flex-1 bg-input/50"
          maxLength={1000}
        />
        <Button type="submit" disabled={sending || !message.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
