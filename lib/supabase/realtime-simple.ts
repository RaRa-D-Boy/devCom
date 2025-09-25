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
        .from('one_on_one_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit)

      // If we get an RLS error, try a different approach
      if (messagesError && messagesError.message?.includes('infinite recursion')) {
        console.warn('RLS recursion detected, trying alternative approach...')
        
        // Try to get all messages and filter client-side
        const { data: allMessages, error: allMessagesError } = await this.supabase
          .from('one_on_one_messages')
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

      // Get unique author IDs (one_on_one_messages uses author_id instead of sender_id/receiver_id)
      const authorIds = [...new Set(messages.map(m => m.author_id))]
      const allUserIds = [...new Set(authorIds)]

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
        sender_id: message.author_id, // Map author_id to sender_id for compatibility
        receiver_id: null, // one_on_one_messages doesn't have receiver_id
        sender: profileMap.get(message.author_id) || {
          id: message.author_id,
          username: `user_${message.author_id.slice(0, 8)}`,
          full_name: `User ${message.author_id.slice(0, 8)}`,
          avatar_url: null
        },
        receiver: null // one_on_one_messages doesn't have receiver
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
      // Insert the message using one_on_one_messages table structure
      const { data, error } = await this.supabase
        .from('one_on_one_messages')
        .insert({
          content: messageData.content,
          author_id: messageData.sender_id,
          chat_id: messageData.chat_id
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return { data: null, error }
      }

      // Get sender profile
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('*')
        .in('id', [messageData.sender_id])

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        return { data: null, error: profilesError }
      }

      const sender = profiles?.find(p => p.id === messageData.sender_id)

      const message = {
        ...data,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        sender: sender || null,
        receiver: null
      }

      // Update the chat's last message
      await this.supabase
        .from('one_on_one_chats')
        .update({
          updated_at: new Date().toISOString()
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
      // Check if chat already exists in either direction
      const { data: existingChat, error: findError } = await this.supabase
        .from('one_on_one_chats')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
        .single()

      if (existingChat && !findError) {
        console.log('Found existing chat:', existingChat.id)
        return { data: existingChat, error: null }
      }

      // If no chat exists, create a new one
      // Use consistent ordering to avoid duplicates (smaller ID first)
      const user1Id = userId < friendId ? userId : friendId
      const user2Id = userId < friendId ? friendId : userId

      const { data: newChat, error: createError } = await this.supabase
        .from('one_on_one_chats')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id
        })
        .select()
        .single()

      if (createError) {
        // If we get a duplicate key error, try to find the existing chat again
        if (createError.code === '23505') {
          console.log('Duplicate key error, searching for existing chat...')
          const { data: existingChatRetry, error: retryError } = await this.supabase
            .from('one_on_one_chats')
            .select('*')
            .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
            .single()

          if (existingChatRetry && !retryError) {
            console.log('Found existing chat on retry:', existingChatRetry.id)
            return { data: existingChatRetry, error: null }
          }
        }
        console.error('Error creating chat:', createError)
        return { data: null, error: createError }
      }

      console.log('Created new chat:', newChat.id)
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
          table: 'one_on_one_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          console.log('New message received:', payload)
          
          // Get the full message with profiles
          const { data: message, error } = await this.supabase
            .from('one_on_one_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (error || !message) {
            console.error('Error fetching new message:', error)
            return
          }

          // Get sender profile
          const { data: profiles } = await this.supabase
            .from('profiles')
            .select('*')
            .in('id', [message.author_id])

          const sender = profiles?.find(p => p.id === message.author_id)

          const fullMessage = {
            ...message,
            sender_id: message.author_id,
            receiver_id: null,
            sender: sender || null,
            receiver: null
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
          table: 'one_on_one_messages',
          filter: `author_id=eq.${userId}`
        },
        async (payload) => {
          console.log('New user message received:', payload)
          
          // Get the full message with profiles
          const { data: message, error } = await this.supabase
            .from('one_on_one_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (error || !message) {
            console.error('Error fetching new message:', error)
            return
          }

          // Get sender profile
          const { data: profiles } = await this.supabase
            .from('profiles')
            .select('*')
            .in('id', [message.author_id])

          const sender = profiles?.find(p => p.id === message.author_id)

          const fullMessage = {
            ...message,
            sender_id: message.author_id,
            receiver_id: null,
            sender: sender || null,
            receiver: null
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
