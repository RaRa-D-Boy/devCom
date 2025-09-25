import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const fetchUnreadCount = async () => {
      try {
        // Get all chats where user is either user1 or user2
        const { data: chats, error: chatsError } = await supabase
          .from("one_on_one_chats")
          .select("id")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

        if (chatsError) {
          console.error("Error fetching chats:", chatsError)
          return
        }

        if (!chats || chats.length === 0) {
          setUnreadCount(0)
          setLoading(false)
          return
        }

        // Get total unread messages across all chats
        let totalUnread = 0
        for (const chat of chats) {
          const { count } = await supabase
            .from("one_on_one_messages")
            .select("*", { count: 'exact', head: true })
            .eq("chat_id", chat.id)
            .neq("author_id", userId)
            // Note: For proper unread tracking, we'd need a read status field

          totalUnread += count || 0
        }

        setUnreadCount(totalUnread)
      } catch (error) {
        console.error("Error fetching unread count:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('unread-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'one_on_one_messages',
          filter: `author_id=neq.${userId}`
        },
        () => {
          // Refresh unread count when new messages arrive
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return { unreadCount, loading }
}
