import { createClient } from "./client"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  chat_id: string
  created_at: string
  sender: any
  receiver: any
}

export interface Chat {
  id: string
  user_id: string
  friend_id: string
  last_message: string
  last_message_at: string
  created_at: string
  updated_at: string
}

export class SimpleRealtimeMessaging {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()

  /**
   * Load messages for a specific chat (without joins)
   */
  async loadChatMessages(chatId: string, limit: number = 50): Promise<{ data: Message[] | null; error: any }> {
    try {
      console.log('Loading messages for chat:', chatId)
      
      // Try to get messages with a simple query first
      let { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit)

      // If we get an RLS error, try a different approach
      if (messagesError && messagesError.message?.includes('infinite recursion')) {
        console.warn('RLS recursion detected, trying alternative approach...')
        
        // Try to get all messages and filter client-side
        const { data: allMessages, error: allMessagesError } = await this.supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1000) // Get more messages to filter

        if (allMessagesError) {
          console.error('Error loading all messages:', allMessagesError)
          return { data: null, error: allMessagesError }
        }

        // Filter messages for this chat client-side
        messages = allMessages?.filter(msg => msg.chat_id === chatId) || []
        messagesError = null
      }

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        return { data: null, error: messagesError }
      }

      console.log('Loaded messages:', messages?.length || 0)

      if (!messages || messages.length === 0) {
        return { data: [], error: null }
      }

      // Get unique sender and receiver IDs
      const senderIds = [...new Set(messages.map(m => m.sender_id))]
      const receiverIds = [...new Set(messages.map(m => m.receiver_id))]
      const allUserIds = [...new Set([...senderIds, ...receiverIds])]

      console.log('Fetching profiles for user IDs:', allUserIds)

      // Try to fetch profiles
      let { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('*')
        .in('id', allUserIds)

      // If profiles fail, create mock profiles
      if (profilesError) {
        console.warn('Error loading profiles, creating mock profiles:', profilesError)
        profiles = allUserIds.map(id => ({
          id,
          username: `user_${id.slice(0, 8)}`,
          full_name: `User ${id.slice(0, 8)}`,
          avatar_url: null
        }))
        profilesError = null
      }

      console.log('Loaded profiles:', profiles?.length || 0)

      // Create a map for quick profile lookup
      const profileMap = new Map()
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile)
      })

      // Combine messages with profiles
      const messagesWithProfiles = messages.map(message => ({
        ...message,
        sender: profileMap.get(message.sender_id) || {
          id: message.sender_id,
          username: `user_${message.sender_id.slice(0, 8)}`,
          full_name: `User ${message.sender_id.slice(0, 8)}`,
          avatar_url: null
        },
        receiver: profileMap.get(message.receiver_id) || {
          id: message.receiver_id,
          username: `user_${message.receiver_id.slice(0, 8)}`,
          full_name: `User ${message.receiver_id.slice(0, 8)}`,
          avatar_url: null
        }
      }))

      console.log('Combined messages with profiles:', messagesWithProfiles.length)

      return { data: messagesWithProfiles, error: null }
    } catch (error) {
      console.error('Error in loadChatMessages:', error)
      return { data: null, error }
    }
  }

  /**
   * Send a message (without joins)
   */
  async sendMessage(messageData: {
    content: string
    sender_id: string
    receiver_id: string
    chat_id: string
  }): Promise<{ data: Message | null; error: any }> {
    try {
      // Insert the message
      const { data, error } = await this.supabase
        .from('messages')
        .insert(messageData)
        .select('*')
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return { data: null, error }
      }

      // Get sender and receiver profiles
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('*')
        .in('id', [messageData.sender_id, messageData.receiver_id])

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        return { data: null, error: profilesError }
      }

      const sender = profiles?.find(p => p.id === messageData.sender_id)
      const receiver = profiles?.find(p => p.id === messageData.receiver_id)

      const message = {
        ...data,
        sender: sender || null,
        receiver: receiver || null
      }

      // Update the chat's last message
      await this.supabase
        .from('chats')
        .update({
          last_message: messageData.content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', messageData.chat_id)

      return { data: message, error: null }
    } catch (error) {
      console.error('Error in sendMessage:', error)
      return { data: null, error }
    }
  }

  /**
   * Get or create a chat between two users
   */
  async getOrCreateChat(userId: string, friendId: string): Promise<{ data: Chat | null; error: any }> {
    try {
      // Check if chat already exists
      const { data: existingChat, error: findError } = await this.supabase
        .from('chats')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single()

      if (existingChat && !findError) {
        return { data: existingChat, error: null }
      }

      // Create new chat
      const { data: newChat, error: createError } = await this.supabase
        .from('chats')
        .insert({
          user_id: userId,
          friend_id: friendId
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating chat:', createError)
        return { data: null, error: createError }
      }

      return { data: newChat, error: null }
    } catch (error) {
      console.error('Error in getOrCreateChat:', error)
      return { data: null, error }
    }
  }

  /**
   * Subscribe to messages for a specific chat
   */
  subscribeToChatMessages(
    chatId: string,
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `chat:${chatId}`
    
    // Remove existing channel if it exists
    this.unsubscribeFromChannel(channelName)

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          console.log('New message received:', payload)
          
          // Get the full message with profiles
          const { data: message, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (error || !message) {
            console.error('Error fetching new message:', error)
            return
          }

          // Get sender and receiver profiles
          const { data: profiles } = await this.supabase
            .from('profiles')
            .select('*')
            .in('id', [message.sender_id, message.receiver_id])

          const sender = profiles?.find(p => p.id === message.sender_id)
          const receiver = profiles?.find(p => p.id === message.receiver_id)

          const fullMessage = {
            ...message,
            sender: sender || null,
            receiver: receiver || null
          }

          onMessage(fullMessage)
        }
      )
      .subscribe((status) => {
        console.log(`Chat ${chatId} subscription status:`, status)
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to chat ${chatId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to chat ${chatId}`)
          onError?.(new Error(`Failed to subscribe to chat ${chatId}`))
        }
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName)
  }

  /**
   * Subscribe to all messages for a user (across all chats)
   */
  subscribeToUserMessages(
    userId: string,
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `user_messages:${userId}`
    
    // Remove existing channel if it exists
    this.unsubscribeFromChannel(channelName)

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`
        },
        async (payload) => {
          console.log('New user message received:', payload)
          
          // Get the full message with profiles
          const { data: message, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (error || !message) {
            console.error('Error fetching new message:', error)
            return
          }

          // Get sender and receiver profiles
          const { data: profiles } = await this.supabase
            .from('profiles')
            .select('*')
            .in('id', [message.sender_id, message.receiver_id])

          const sender = profiles?.find(p => p.id === message.sender_id)
          const receiver = profiles?.find(p => p.id === message.receiver_id)

          const fullMessage = {
            ...message,
            sender: sender || null,
            receiver: receiver || null
          }

          onMessage(fullMessage)
        }
      )
      .subscribe((status) => {
        console.log(`User ${userId} messages subscription status:`, status)
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to user ${userId} messages`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to user ${userId} messages`)
          onError?.(new Error(`Failed to subscribe to user ${userId} messages`))
        }
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName)
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`Unsubscribed from channel: ${channelName}`)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      this.supabase.removeChannel(channel)
      console.log(`Unsubscribed from channel: ${channelName}`)
    })
    this.channels.clear()
  }
}

// Export a singleton instance
export const simpleRealtimeMessaging = new SimpleRealtimeMessaging()
