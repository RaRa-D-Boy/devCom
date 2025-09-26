"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  company?: string;
  job_title?: string;
  status?: 'active' | 'busy' | 'offline' | 'inactive';
}

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userProfile: Profile | null;
  currentUser: User;
}

export function FriendRequestModal({
  isOpen,
  onClose,
  onConfirm,
  userProfile,
  currentUser,
}: FriendRequestModalProps) {
  const [isSending, setIsSending] = useState(false);
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    console.warn('Theme context not available in FriendRequestModal component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';

  const handleConfirm = async () => {
    if (!userProfile) return;
    
    setIsSending(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!userProfile) return null;

  const displayName = userProfile.full_name || userProfile.display_name || userProfile.username;
  const userTitle = userProfile.job_title || userProfile.role || 'Developer';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span>Send Friend Request</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to send a friend request to this user?
          </DialogDescription>
        </DialogHeader>

        {/* User Profile Preview */}
        <div className="flex items-center space-x-4 p-4 rounded-lg border bg-muted/50">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={userProfile.avatar_url} />
              <AvatarFallback className="bg-neutral-700 text-white text-lg">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 border-2 border-white rounded-full ${
              userProfile.status === 'active' ? 'bg-green-500' :
              userProfile.status === 'busy' ? 'bg-yellow-500' :
              userProfile.status === 'inactive' ? 'bg-gray-400' :
              'bg-gray-300'
            }`}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{displayName}</h3>
            <p className="text-sm text-muted-foreground truncate">@{userProfile.username}</p>
            {userTitle && (
              <p className="text-sm text-muted-foreground truncate">{userTitle}</p>
            )}
            {userProfile.company && (
              <p className="text-xs text-muted-foreground truncate">{userProfile.company}</p>
            )}
            {userProfile.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {userProfile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-muted-foreground">
          <p>Once you send a friend request, the user will be notified and can accept or decline your request.</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSending}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Friend Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
