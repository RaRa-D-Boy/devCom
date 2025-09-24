import { useState, useEffect, useCallback, useRef } from 'react'
import { simpleRealtimeMessaging, Message, Chat } from '@/lib/supabase/realtime-simple'

interface UseSimpleRealtimeMessagingProps {
  userId: string
  chatId?: string
  autoConnect?: boolean
}

interface UseSimpleRealtimeMessagingReturn {
  messages: Message[]
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  sendMessage: (content: string, receiverId: string) => Promise<{ success: boolean; error?: string }>
  loadMessages: () => Promise<void>
  getOrCreateChat: (friendId: string) => Promise<{ data: Chat | null; error: any }>
  clearError: () => void
}

export function useSimpleRealtimeMessaging({
  userId,
  chatId,
  autoConnect = true
}: UseSimpleRealtimeMessagingProps): UseSimpleRealtimeMessagingReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  
  const unsubscribeFunctions = useRef<(() => void)[]>([])

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load messages for a specific chat
  const loadMessages = useCallback(async () => {
    if (!chatId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await simpleRealtimeMessaging.loadChatMessages(chatId)
      
      if (error) {
        setError(`Failed to load messages: ${error.message}`)
        return
      }

      setMessages(data || [])
    } catch (err) {
      setError(`Failed to load messages: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [chatId])

  // Get or create chat
  const getOrCreateChat = useCallback(async (friendId: string) => {
    try {
      return await simpleRealtimeMessaging.getOrCreateChat(userId, friendId)
    } catch (err) {
      return { data: null, error: err }
    }
  }, [userId])

  // Send message
  const sendMessage = useCallback(async (content: string, receiverId: string) => {
    if (!content.trim()) {
      return { success: false, error: 'Message content cannot be empty' }
    }

    try {
      // Get or create chat
      const { data: chat, error: chatError } = await getOrCreateChat(receiverId)
      
      if (chatError || !chat) {
        return { success: false, error: `Failed to get/create chat: ${chatError?.message || 'Unknown error'}` }
      }

      // Send message
      const { data: message, error: messageError } = await simpleRealtimeMessaging.sendMessage({
        content: content.trim(),
        sender_id: userId,
        receiver_id: receiverId,
        chat_id: chat.id
      })

      if (messageError || !message) {
        return { success: false, error: `Failed to send message: ${messageError?.message || 'Unknown error'}` }
      }

      // Add message to local state immediately for better UX
      setMessages(prev => [...prev, message])

      return { success: true }
    } catch (err) {
      return { success: false, error: `Failed to send message: ${err}` }
    }
  }, [userId, getOrCreateChat])

  // Handle new message
  const handleNewMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) return prev
      
      return [...prev, message]
    })
  }, [])

  // Handle errors
  const handleError = useCallback((err: any) => {
    console.error('Realtime error:', err)
    setError(`Connection error: ${err.message || err}`)
    setConnectionStatus('disconnected')
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!autoConnect || !userId) return

    setConnectionStatus('connecting')

    // Subscribe to user messages (all chats)
    const unsubscribeUserMessages = simpleRealtimeMessaging.subscribeToUserMessages(
      userId,
      handleNewMessage,
      handleError
    )

    // Subscribe to specific chat messages if chatId is provided
    let unsubscribeChatMessages: (() => void) | undefined
    if (chatId) {
      unsubscribeChatMessages = simpleRealtimeMessaging.subscribeToChatMessages(
        chatId,
        handleNewMessage,
        handleError
      )
    }

    // Store unsubscribe functions
    unsubscribeFunctions.current = [
      unsubscribeUserMessages,
      ...(unsubscribeChatMessages ? [unsubscribeChatMessages] : [])
    ]

    setConnectionStatus('connected')

    // Load initial data
    if (chatId) {
      loadMessages()
    }

    // Cleanup function
    return () => {
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe())
      unsubscribeFunctions.current = []
      setConnectionStatus('disconnected')
    }
  }, [userId, chatId, autoConnect, handleNewMessage, handleError, loadMessages])

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId && connectionStatus === 'connected') {
      loadMessages()
    }
  }, [chatId, connectionStatus, loadMessages])

  return {
    messages,
    loading,
    error,
    connectionStatus,
    sendMessage,
    loadMessages,
    getOrCreateChat,
    clearError
  }
}
