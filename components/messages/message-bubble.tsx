"use client";

import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Reply,
  FileText,
  Download,
} from "lucide-react";
import { Message } from "./types";
import { useTheme } from "@/contexts/theme-context";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({ 
  message, 
  currentUserId, 
  onReply, 
  onEdit, 
  onDelete 
}: MessageBubbleProps) {
  const isOwnMessage = message.sender_id === currentUserId;
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  let isDarkTheme = false;
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
    isDarkTheme = theme === 'dark';
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available, using fallback values');
  }

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`max-w-xs lg:max-w-md group relative`}>
        {/* Reply indicator */}
        {message.reply_to_id && (
          <div
            className={`mb-2 p-2 rounded-lg border-l-4 ${
              isOwnMessage
                ? "bg-primary/20 border-primary"
                : isDarkTheme 
                  ? "bg-neutral-800/50 border-neutral-700"
                  : "bg-gray-100/50 border-gray-300"
            }`}
          >
            <p className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Replying to {message.reply_to_username || "Unknown"}
            </p>
            <p className={`text-xs truncate ${isOwnMessage ? 'text-primary-foreground/70' : isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {message.reply_to_content}
            </p>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : isDarkTheme 
                ? "bg-neutral-800 text-white"
                : "bg-gray-100 text-black"
          }`}
        >
          {/* Media display */}
          {message.media_urls &&
            message.media_urls.length > 0 && 
            !message.is_deleted && (
              <div className="mb-2 space-y-2">
                {message.media_urls.map((url, index) => (
                  <div key={index} className="relative">
                    {message.media_types?.[index]?.startsWith(
                      "image/"
                    ) ? (
                      <img
                        src={url}
                        alt={
                          message.media_names?.[index] || "Image"
                        }
                        className="max-w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                      />
                    ) : message.media_types?.[index]?.startsWith(
                        "video/"
                      ) ? (
                      <video
                        src={url}
                        controls
                        className="max-w-full h-auto rounded-lg"
                        preload="metadata"
                      />
                    ) : (
                      <div
                        className={`p-3 rounded-lg border-2 border-dashed ${
                          isOwnMessage
                            ? "border-primary-foreground/30"
                            : isDarkTheme 
                              ? "border-neutral-600"
                              : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {message.media_names?.[index] ||
                                "File"}
                            </p>
                            <p className="text-xs opacity-75">
                              {message.media_sizes?.[index]
                                ? `${(
                                    message.media_sizes[index] /
                                    1024 /
                                    1024
                                  ).toFixed(1)} MB`
                                : "Unknown size"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              window.open(url, "_blank")
                            }
                            className="p-1"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* Message content */}
          <p className="text-sm">{message.content}</p>

          {/* Message metadata */}
          <div className="flex items-center justify-between mt-1">
            <p
              className={`text-xs ${
                isOwnMessage
                  ? "text-primary-foreground/70"
                  : isDarkTheme 
                    ? "text-gray-400"
                    : "text-gray-600"
              }`}
            >
              {new Date(message.created_at).toLocaleTimeString()}
              {message.is_edited && (
                <span className="ml-1 italic">(edited)</span>
              )}
            </p>

            {/* Message actions - only show for user's own messages */}
            {isOwnMessage &&
              !message.is_deleted && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReply(message)}
                    className="h-6 w-6 p-0"
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(message)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(message.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
