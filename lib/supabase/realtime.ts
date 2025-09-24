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

export class RealtimeMessaging {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()

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
        (payload) => {
          console.log('New message received:', payload)
          onMessage(payload.new as Message)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('Message updated:', payload)
          onMessage(payload.new as Message)
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
        (payload) => {
          console.log('New user message received:', payload)
          onMessage(payload.new as Message)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`
        },
        (payload) => {
          console.log('User message updated:', payload)
          onMessage(payload.new as Message)
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
   * Subscribe to chat list updates for a user
   */
  subscribeToUserChats(
    userId: string,
    onChatUpdate: (chat: Chat) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `user_chats:${userId}`
    
    // Remove existing channel if it exists
    this.unsubscribeFromChannel(channelName)

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `or(user_id=eq.${userId},friend_id=eq.${userId})`
        },
        (payload) => {
          console.log('Chat update received:', payload)
          onChatUpdate(payload.new as Chat)
        }
      )
      .subscribe((status) => {
        console.log(`User ${userId} chats subscription status:`, status)
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to user ${userId} chats`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to user ${userId} chats`)
          onError?.(new Error(`Failed to subscribe to user ${userId} chats`))
        }
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName)
  }

  /**
   * Send a message
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
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return { data: null, error }
      }

      // Update the chat's last message
      await this.supabase
        .from('chats')
        .update({
          last_message: messageData.content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', messageData.chat_id)

      const message = {
        ...data,
        sender: data.sender[0] || data.sender,
        receiver: data.receiver[0] || data.receiver
      }

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
   * Load messages for a specific chat
   */
  async loadChatMessages(chatId: string, limit: number = 50): Promise<{ data: Message[] | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error loading messages:', error)
        return { data: null, error }
      }

      const messages = (data || []).map(message => ({
        ...message,
        sender: message.sender[0] || message.sender,
        receiver: message.receiver[0] || message.receiver
      }))

      return { data: messages, error: null }
    } catch (error) {
      console.error('Error in loadChatMessages:', error)
      return { data: null, error }
    }
  }

  /**
   * Load user's chats
   */
  async loadUserChats(userId: string): Promise<{ data: Chat[] | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('chats')
        .select(`
          *,
          user:profiles!chats_user_id_fkey(*),
          friend:profiles!chats_friend_id_fkey(*)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error loading user chats:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in loadUserChats:', error)
      return { data: null, error }
    }
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

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.supabase.realtime.getChannels().length > 0 ? 'connected' : 'disconnected'
  }
}

// Export a singleton instance
export const realtimeMessaging = new RealtimeMessaging()
