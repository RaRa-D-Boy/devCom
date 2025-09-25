"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Chat } from "./types";
import { useTheme } from "@/contexts/theme-context";

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  showChatRoom: boolean;
}

export function ChatList({ chats, selectedChat, onChatSelect, showChatRoom }: ChatListProps) {
  const { theme, glassEffect } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  return (
    <div
      className={`w-full lg:w-80 border-r rounded-2xl p-4 ${
        isDarkTheme 
          ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border-neutral-700/30' :
            glassEffect === 'transparent' ? 'bg-transparent border-neutral-700' :
            'bg-neutral-900 border-neutral-700'
          : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border-white/20' :
            glassEffect === 'transparent' ? 'bg-transparent border-gray-200' :
            'bg-white border-gray-200'
      } ${showChatRoom ? "hidden lg:block" : "block"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Messages</h2>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
        <Input
          placeholder="Search messages..."
          className={`pl-10 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-0 ${
            isDarkTheme 
              ? glassEffect === 'translucent' ? 'bg-neutral-800/70 backdrop-blur-sm border border-neutral-700/30' :
                glassEffect === 'transparent' ? 'bg-transparent border border-neutral-700' :
                'bg-neutral-800 border border-neutral-700'
              : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                glassEffect === 'transparent' ? 'bg-transparent border border-gray-200' :
                'bg-white border border-gray-200'
          }`}
        />
      </div>

      <div className="space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              selectedChat?.id === chat.id
                ? "bg-primary text-primary-foreground"
                : isDarkTheme 
                  ? "hover:bg-gray-700" 
                  : "hover:bg-gray-100"
            }`}
            onClick={() => onChatSelect(chat)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className={`h-12 w-12 ring-2 ${isDarkTheme ? 'ring-neutral-700' : 'ring-gray-200'}`}>
                  <AvatarImage src={chat.friend.avatar_url} />
                  <AvatarFallback className="bg-neutral-700 text-white">
                    {
                      (chat.friend.full_name ||
                        chat.friend.display_name ||
                        chat.friend.username)?.[0]
                    }
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                    chat.friend.status === "active"
                      ? "bg-online-indicator"
                      : chat.friend.status === "busy"
                      ? "bg-away-indicator"
                      : chat.friend.status === "inactive"
                      ? "bg-offline-indicator"
                      : "bg-offline-indicator"
                  }`}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold truncate ${
                      selectedChat?.id === chat.id
                        ? "text-primary-foreground"
                        : isDarkTheme ? "text-white" : "text-black"
                    }`}
                  >
                    {chat.friend.full_name ||
                      chat.friend.display_name ||
                      chat.friend.username}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* Read/Unread status badge */}
                    {chat.unread_count > 0 ? (
                      <div className="w-2 h-2 bg-unread-badge rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-muted rounded-full"></div>
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm truncate ${
                    selectedChat?.id === chat.id
                      ? "text-primary-foreground/70"
                      : isDarkTheme ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {chat.last_message || "No messages yet"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
