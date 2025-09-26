"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Wifi,
  WifiOff,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChatList } from "./chat-list";
import { MessageBubble } from "./message-bubble";
import { useTheme } from "@/contexts/theme-context";
import { MessageInput } from "./message-input";
import { CameraModal } from "./camera-modal";
import { Chat, Message, Profile } from "./types";


interface MessagesInterfaceProps {
  user: User;
  profile: Profile;
  initialChatId?: string;
  initialGroupId?: string;
}

export function MessagesInterface({ user, profile, initialChatId, initialGroupId }: MessagesInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null); // Group chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected"
  >("connected");
  const [showChatRoom, setShowChatRoom] = useState(false); // For mobile responsive behavior
  const [isGroupChat, setIsGroupChat] = useState(false); // Track if current chat is a group
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const { theme, glassEffect } = useTheme();
  const isDarkTheme = theme === 'dark';


  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    loadChats();
    
    // Load group if initialGroupId is provided
    if (initialGroupId) {
      loadGroup(initialGroupId);
    }
  }, [initialGroupId]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      
      // Subscribe to real-time message updates
      const channel = supabase
        .channel(`messages:${selectedChat.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'one_on_one_messages',
            filter: `chat_id=eq.${selectedChat.id}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              // Handle message updates (like deletion)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === payload.new.id
                    ? {
                        ...msg,
                        is_deleted: payload.new.is_deleted,
                        content: payload.new.is_deleted ? "[Message deleted]" : payload.new.content,
                        edited_at: payload.new.edited_at,
                        is_edited: payload.new.is_edited
                      }
                    : msg
                )
              );
            } else if (payload.eventType === 'INSERT') {
              // Handle new messages
              if (payload.new.author_id !== user.id) {
                loadMessages(selectedChat.id); // Reload to get full message data
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat, user.id]);

  const loadChats = async () => {
    try {
      // Get chats where user is either user1 or user2
      const { data, error } = await supabase
        .from("one_on_one_chats")
        .select(
          `
          *,
          user1:profiles!one_on_one_chats_user1_id_fkey(*),
          user2:profiles!one_on_one_chats_user2_id_fkey(*)
        `
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const chatsList = (data || []).map((chat) => {
        // Determine which user is the "friend" (not the current user)
        const friend = chat.user1_id === user.id ? chat.user2 : chat.user1;
        const friendId =
          chat.user1_id === user.id ? chat.user2_id : chat.user1_id;

        return {
          id: chat.id,
          user_id: user.id,
          friend_id: friendId,
          friend: friend,
          last_message: undefined, // We'll get this from messages
          last_message_at: chat.updated_at,
          unread_count: 0, // We'll calculate this properly
        };
      });

      // Get last messages and unread counts for each chat
      for (let chat of chatsList) {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("one_on_one_messages")
          .select("content, created_at, author_id")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (lastMessage) {
          chat.last_message = lastMessage.content;
          chat.last_message_at = lastMessage.created_at;
        }

        // Get unread count (messages not sent by current user)
        const { count: unreadCount } = await supabase
          .from("one_on_one_messages")
          .select("*", { count: "exact", head: true })
          .eq("chat_id", chat.id)
          .neq("author_id", user.id);
        // Note: We'll need to add a read status field later for proper unread tracking

        chat.unread_count = unreadCount || 0;
      }

      setChats(chatsList);
      
      // Auto-select chat if initialChatId is provided
      if (initialChatId && chatsList.length > 0) {
        const targetChat = chatsList.find(chat => chat.id === initialChatId);
        if (targetChat) {
          setSelectedChat(targetChat);
        } else if (!selectedChat) {
          // Fallback to first chat if initialChatId not found
          setSelectedChat(chatsList[0]);
        }
      } else if (chatsList.length > 0 && !selectedChat) {
        setSelectedChat(chatsList[0]);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroup = async (groupId: string) => {
    try {
      // Get group details
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      if (groupData) {
        setSelectedGroup(groupData);
        setIsGroupChat(true);
        setSelectedChat(null); // Clear individual chat selection
        setShowChatRoom(true); // Show chat room for mobile
      }
    } catch (error) {
      console.error("Error loading group:", error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      // First, get all messages for the chat
      const { data: messagesData, error: messagesError } = await supabase
        .from("one_on_one_messages")
        .select(
          `
          *,
          author:profiles!one_on_one_messages_author_id_fkey(*)
        `
        )
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Get reply information for messages that have replies
      const replyIds =
        messagesData
          ?.filter((msg) => msg.reply_to_id)
          .map((msg) => msg.reply_to_id) || [];
      let replyData: any[] = [];

      if (replyIds.length > 0) {
        const { data: replies, error: repliesError } = await supabase
          .from("one_on_one_messages")
          .select(
            `
            id,
            content,
            author_id,
            author:profiles!one_on_one_messages_author_id_fkey(username, full_name)
          `
          )
          .in("id", replyIds);

        if (!repliesError && replies) {
          replyData = replies;
        }
      }

      const messagesList = (messagesData || []).map((message) => {
        const replyInfo = replyData.find(
          (reply) => reply.id === message.reply_to_id
        );

        return {
          id: message.id,
          content: message.content,
          sender_id: message.author_id,
          receiver_id: selectedChat?.friend_id || "", // Use friend_id as receiver_id
          created_at: message.created_at,
          sender: message.author,
          // Add new fields
          edited_at: message.edited_at,
          is_edited: message.is_edited,
          is_deleted: message.is_deleted,
          reply_to_id: message.reply_to_id,
          media_urls: message.media_urls,
          media_types: message.media_types,
          media_sizes: message.media_sizes,
          media_names: message.media_names,
          message_type: message.message_type,
          // Reply information
          reply_to_content: replyInfo?.content,
          reply_to_sender_id: replyInfo?.author_id,
          reply_to_username: replyInfo?.author?.username,
          reply_to_full_name: replyInfo?.author?.full_name,
        };
      });

      setMessages(messagesList);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setShowChatRoom(true); // Show chat room on mobile
  };

  const handleBackToMessages = () => {
    setShowChatRoom(false); // Hide chat room on mobile
  };


  const handleMediaSelect = (accept: string) => {
    // Small delay to ensure popover closes before opening file dialog
    setTimeout(() => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        setSelectedFiles((prev) => [...prev, ...files]);
      };
      input.click();
    }, 100);
  };

  const startCamera = async (mode: 'photo' | 'video') => {
    try {
      setCameraMode(mode);
      setCameraModalOpen(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: mode === 'video'
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraModalOpen(false);
    setRecording(false);
    setRecordedChunks([]);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new window.File([blob], `photo_${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });
            setSelectedFiles((prev) => [...prev, file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const startRecording = () => {
    if (stream) {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const file = new window.File([blob], `video_${Date.now()}.webm`, {
          type: 'video/webm'
        });
        setSelectedFiles((prev) => [...prev, file]);
        stopCamera();
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };



  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("chat-media")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-media").getPublicUrl(fileName);

      return {
        url: publicUrl,
        type: file.type,
        size: file.size,
        name: file.name,
      };
    });

    return Promise.all(uploadPromises);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      // First, get the message to check for media files
      const { data: messageData, error: fetchError } = await supabase
        .from("one_on_one_messages")
        .select("media_urls, media_names")
        .eq("id", messageId)
        .single();

      if (fetchError) throw fetchError;

      // Delete media files from storage if they exist
      if (messageData?.media_urls && messageData.media_urls.length > 0) {
        const filePaths = messageData.media_urls.map((url: string) => {
          // Extract file path from URL - handle different URL formats
          if (url.includes('/storage/v1/object/public/chat-media/')) {
            // Full Supabase URL format
            return url.split('/storage/v1/object/public/chat-media/')[1];
          } else if (url.includes('/chat-media/')) {
            // Partial URL format
            return url.split('/chat-media/')[1];
          } else {
            // Assume it's already a file path
            const urlParts = url.split('/');
            return urlParts.slice(-2).join('/');
          }
        });

        console.log('Deleting media files:', filePaths);

        // Delete files from storage
        const { error: storageError } = await supabase.storage
          .from('chat-media')
          .remove(filePaths);

        if (storageError) {
          console.error("Error deleting media files:", storageError);
          // Continue with message deletion even if media deletion fails
        } else {
          console.log('Successfully deleted media files');
        }
      }

      // Delete the message from database
      const { error } = await supabase.rpc("delete_one_on_one_message", {
        message_id: messageId,
        user_id: user.id,
      });

      if (error) throw error;

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_deleted: true, content: "[Message deleted]" }
            : msg
        )
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedChat)
      return;

    setUploading(true);
    try {
      let mediaData = null;

      // Upload files if any
      if (selectedFiles.length > 0) {
        mediaData = await uploadFiles(selectedFiles);
      }

      if (editingMessage) {
        // Edit existing message
        const { error } = await supabase.rpc("edit_one_on_one_message", {
          message_id: editingMessage.id,
          new_content: newMessage.trim(),
          user_id: user.id,
        });

        if (error) throw error;

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessage.id
              ? {
                  ...msg,
                  content: newMessage.trim(),
                  is_edited: true,
                  edited_at: new Date().toISOString(),
                }
              : msg
          )
        );

        setEditingMessage(null);
      } else {
        // Send new message
        const messageData: any = {
          content: newMessage.trim(),
          author_id: user.id,
          chat_id: selectedChat.id,
          reply_to_id: replyingTo?.id || null,
        };

        // Add media data if available
        if (mediaData) {
          messageData.media_urls = mediaData.map((m) => m.url);
          messageData.media_types = mediaData.map((m) => m.type);
          messageData.media_sizes = mediaData.map((m) => m.size);
          messageData.media_names = mediaData.map((m) => m.name);
        }

        const { data, error } = await supabase
          .from("one_on_one_messages")
          .insert(messageData)
          .select(
            `
            *,
            author:profiles!one_on_one_messages_author_id_fkey(*)
          `
          )
          .single();

        if (error) throw error;

        const newMsg = {
          id: data.id,
          content: data.content,
          sender_id: data.author_id,
          receiver_id: selectedChat.friend_id,
          created_at: data.created_at,
          sender: data.author,
          // Add new fields
          edited_at: data.edited_at,
          is_edited: data.is_edited,
          is_deleted: data.is_deleted,
          reply_to_id: data.reply_to_id,
          media_urls: data.media_urls,
          media_types: data.media_types,
          media_sizes: data.media_sizes,
          media_names: data.media_names,
          message_type: data.message_type,
        };

        setMessages((prev) => [...prev, newMsg]);

        // Update the chat's last message
        await supabase
          .from("one_on_one_chats")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedChat.id);
      }

      setNewMessage("");
      setSelectedFiles([]);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout user={user} profile={profile} activePage="messages">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className={`mt-4 ${isDarkTheme ? 'text-white' : 'text-black'}`}>Loading messages...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} profile={profile} activePage="messages">
      <div className="flex h-full pb-20 lg:pb-4">
        {/* Chat List */}
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          showChatRoom={showChatRoom}
        />

        {/* Chat Area */}
        <div
          className={`w-full lg:flex-1 flex flex-col ${
            showChatRoom ? "block" : "hidden lg:flex"
          }`}
        >
          {(selectedChat || (isGroupChat && selectedGroup)) ? (
            <>
              {/* Chat Header */}
              <div className={`py-4 px-0 lg:p-4 border-b ${isDarkTheme ? 'border-neutral-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Back Arrow - Only visible on mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToMessages}
                      className="text-foreground hover:bg-accent lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    {isGroupChat && selectedGroup ? (
                      // Group Chat Header
                      <>
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage src={selectedGroup.avatar_url} />
                          <AvatarFallback className="bg-neutral-700 text-white">
                            {selectedGroup.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {selectedGroup.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-muted-foreground text-sm">
                              Group Chat
                            </p>
                            <div className="flex items-center space-x-1">
                              {connectionStatus === "connected" ? (
                                <Wifi className="h-3 w-3 text-green-500" />
                              ) : (
                                <WifiOff className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-xs text-gray-500">
                                {connectionStatus === "connected"
                                  ? "Live"
                                  : "Offline"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : selectedChat ? (
                      // Individual Chat Header
                      <>
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage src={selectedChat.friend.avatar_url} />
                          <AvatarFallback className="bg-neutral-700 text-white">
                            {
                              (selectedChat.friend.full_name ||
                                selectedChat.friend.display_name ||
                                selectedChat.friend.username)?.[0]
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {selectedChat.friend.full_name ||
                              selectedChat.friend.display_name ||
                              selectedChat.friend.username}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-muted-foreground text-sm">
                              {selectedChat.friend.status === "active"
                                ? "Online"
                                : selectedChat.friend.status === "busy"
                                ? "Busy"
                                : selectedChat.friend.status === "inactive"
                                ? "Away"
                                : "Offline"}
                            </p>
                            <div className="flex items-center space-x-1">
                              {connectionStatus === "connected" ? (
                                <Wifi className="h-3 w-3 text-green-500" />
                              ) : (
                                <WifiOff className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-xs text-gray-500">
                                {connectionStatus === "connected"
                                  ? "Live"
                                  : "Offline"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:bg-accent"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:bg-accent"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:bg-accent"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {isGroupChat ? (
                  // Group Chat Placeholder
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className={`h-16 w-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-300'}`} />
                      <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                        {selectedGroup?.name}
                      </h3>
                      <p className={`mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        Group chat coming soon!
                      </p>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                        Group messaging functionality will be implemented in a future update.
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className={`h-16 w-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-300'}`} />
                      <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        No messages yet
                      </h3>
                      <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-400'}>
                        Start the conversation by sending a message
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      currentUserId={user.id}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>

              {/* Message Input */}
              {!isGroupChat && (
                <MessageInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  replyingTo={replyingTo}
                  editingMessage={editingMessage}
                  uploading={uploading}
                  onSendMessage={handleSendMessage}
                  onCancelReply={cancelReply}
                  onCancelEdit={cancelEdit}
                  onMediaSelect={handleMediaSelect}
                  onCameraStart={startCamera}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className={`h-16 w-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                  No chat selected
                </h3>
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                  Choose a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        mode={cameraMode}
        recording={recording}
        onClose={stopCamera}
        onCapturePhoto={capturePhoto}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />
    </AppLayout>
  );
}
