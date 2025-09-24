import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeMessaging, Message, Chat } from '@/lib/supabase/realtime'

interface UseRealtimeMessagingProps {
  userId: string
  chatId?: string
  autoConnect?: boolean
}

interface UseRealtimeMessagingReturn {
  messages: Message[]
  chats: Chat[]
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  sendMessage: (content: string, receiverId: string) => Promise<{ success: boolean; error?: string }>
  loadMessages: () => Promise<void>
  loadChats: () => Promise<void>
  getOrCreateChat: (friendId: string) => Promise<{ data: Chat | null; error: any }>
  clearError: () => void
}

export function useRealtimeMessaging({
  userId,
  chatId,
  autoConnect = true
}: UseRealtimeMessagingProps): UseRealtimeMessagingReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<Chat[]>([])
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
      const { data, error } = await realtimeMessaging.loadChatMessages(chatId)
      
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

  // Load user's chats
  const loadChats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await realtimeMessaging.loadUserChats(userId)
      
      if (error) {
        setError(`Failed to load chats: ${error.message}`)
        return
      }

      setChats(data || [])
    } catch (err) {
      setError(`Failed to load chats: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Get or create chat
  const getOrCreateChat = useCallback(async (friendId: string) => {
    try {
      return await realtimeMessaging.getOrCreateChat(userId, friendId)
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
      const { data: message, error: messageError } = await realtimeMessaging.sendMessage({
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

  // Handle chat update
  const handleChatUpdate = useCallback((chat: Chat) => {
    setChats(prev => {
      const existingIndex = prev.findIndex(c => c.id === chat.id)
      if (existingIndex >= 0) {
        // Update existing chat
        const updated = [...prev]
        updated[existingIndex] = chat
        return updated
      } else {
        // Add new chat
        return [chat, ...prev]
      }
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
    const unsubscribeUserMessages = realtimeMessaging.subscribeToUserMessages(
      userId,
      handleNewMessage,
      handleError
    )

    // Subscribe to user chats
    const unsubscribeUserChats = realtimeMessaging.subscribeToUserChats(
      userId,
      handleChatUpdate,
      handleError
    )

    // Subscribe to specific chat messages if chatId is provided
    let unsubscribeChatMessages: (() => void) | undefined
    if (chatId) {
      unsubscribeChatMessages = realtimeMessaging.subscribeToChatMessages(
        chatId,
        handleNewMessage,
        handleError
      )
    }

    // Store unsubscribe functions
    unsubscribeFunctions.current = [
      unsubscribeUserMessages,
      unsubscribeUserChats,
      ...(unsubscribeChatMessages ? [unsubscribeChatMessages] : [])
    ]

    setConnectionStatus('connected')

    // Load initial data
    loadChats()
    if (chatId) {
      loadMessages()
    }

    // Cleanup function
    return () => {
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe())
      unsubscribeFunctions.current = []
      setConnectionStatus('disconnected')
    }
  }, [userId, chatId, autoConnect, handleNewMessage, handleChatUpdate, handleError, loadChats, loadMessages])

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId && connectionStatus === 'connected') {
      loadMessages()
    }
  }, [chatId, connectionStatus, loadMessages])

  return {
    messages,
    chats,
    loading,
    error,
    connectionStatus,
    sendMessage,
    loadMessages,
    loadChats,
    getOrCreateChat,
    clearError
  }
}
