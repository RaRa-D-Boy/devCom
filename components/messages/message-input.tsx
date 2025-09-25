"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, X, Send, Smile, Paperclip } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { MediaPicker } from "./media-picker";
import { Message } from "./types";
import { useTheme } from "@/contexts/theme-context";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  replyingTo: Message | null;
  editingMessage: Message | null;
  uploading: boolean;
  onSendMessage: () => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onMediaSelect: (accept: string) => void;
  onCameraStart: (mode: 'photo' | 'video') => void;
}

export function MessageInput({
  newMessage,
  setNewMessage,
  selectedFiles,
  setSelectedFiles,
  replyingTo,
  editingMessage,
  uploading,
  onSendMessage,
  onCancelReply,
  onCancelEdit,
  onMediaSelect,
  onCameraStart,
}: MessageInputProps) {
  const [mediaPopoverOpen, setMediaPopoverOpen] = useState(false);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  
  // Safe theme hook usage with fallback
  let colorPalette = 'blue';
  let theme = 'light';
  
  try {
    const themeContext = useTheme();
    colorPalette = themeContext.colorPalette;
    theme = themeContext.theme;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in MessageInput component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200; // 200px max height
    const newHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(newMessage + emoji);
    setEmojiPopoverOpen(false);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  return (
    <div className="p-4 border-t border-gray-200">
      {/* Reply context */}
      {replyingTo && (
        <div className="mb-3 p-2 bg-gray-100 rounded-lg border-l-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">
                Replying to{" "}
                {replyingTo.sender.full_name ||
                  replyingTo.sender.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit context */}
      {editingMessage && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">
                Editing message
              </p>
              <p className="text-xs text-blue-500 truncate">
                {editingMessage.content}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg"
            >
              <FileText className="h-4 w-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0 text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-2 relative media-popover-container">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-black hover:bg-gray-100"
          onClick={() => setMediaPopoverOpen(!mediaPopoverOpen)}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <MediaPicker
          isOpen={mediaPopoverOpen}
          onMediaSelect={onMediaSelect}
          onCameraStart={onCameraStart}
          onClose={() => setMediaPopoverOpen(false)}
        />

        <div className="flex-1 relative">
          <Textarea
            value={newMessage}
            onChange={handleTextareaChange}
            placeholder={
              editingMessage
                ? "Edit your message..."
                : "Type a message..."
            }
            className={`pr-12 border-gray-200 focus:border-transparent resize-none min-h-[40px] max-h-[200px] ${
              isDarkTheme 
                ? 'text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50' 
                : 'focus:ring-0'
            }`}
            onKeyPress={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), onSendMessage())
            }
            rows={1}
          />
          <div className="emoji-popover-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEmojiPopoverOpen(!emojiPopoverOpen)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-black hover:bg-gray-100"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <EmojiPicker
              isOpen={emojiPopoverOpen}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setEmojiPopoverOpen(false)}
            />
          </div>
        </div>

        <Button
          onClick={onSendMessage}
          disabled={
            (!newMessage.trim() && selectedFiles.length === 0) ||
            uploading
          }
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
