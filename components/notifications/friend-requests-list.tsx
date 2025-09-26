"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Check, 
  X,
  Loader2,
  Users
} from "lucide-react";
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

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  user: Profile;
}

interface FriendRequestsListProps {
  user: User;
}

export function FriendRequestsList({ user }: FriendRequestsListProps) {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    console.warn('Theme context not available in FriendRequestsList component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends?type=requests');
      const result = await response.json();

      if (response.ok) {
        setFriendRequests(result.requests || []);
      } else {
        console.error('Failed to load friend requests:', result.error);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, friendId: string) => {
    try {
      setProcessing(requestId);
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friend_id: friendId,
          action: 'accept_request'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove the request from the list
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        console.log('Friend request accepted successfully');
      } else {
        console.error('Failed to accept friend request:', result.error);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: string, friendId: string) => {
    try {
      setProcessing(requestId);
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friend_id: friendId,
          action: 'reject_request'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove the request from the list
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        console.log('Friend request rejected successfully');
      } else {
        console.error('Failed to reject friend request:', result.error);
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className={`h-5 w-5 ${isDarkTheme ? 'text-white' : 'text-black'}`} />
          <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
            Friend Requests
          </h2>
          {friendRequests.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {friendRequests.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Friend Requests List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {friendRequests.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className={`h-12 w-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              No pending friend requests
            </p>
          </div>
        ) : (
          friendRequests.map((request) => {
            const requester = request.user;
            const displayName = requester.full_name || requester.display_name || requester.username;
            const userTitle = requester.job_title || requester.role || 'Developer';

            return (
              <Card
                key={request.id}
                className={`transition-all duration-200 ${
                  isDarkTheme 
                    ? 'bg-neutral-800/50 border-neutral-700' 
                    : 'bg-blue-50/50 border-blue-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={requester.avatar_url} />
                        <AvatarFallback className="bg-neutral-700 text-white text-sm">
                          {displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white rounded-full ${
                        requester.status === 'active' ? 'bg-green-500' :
                        requester.status === 'busy' ? 'bg-yellow-500' :
                        requester.status === 'inactive' ? 'bg-gray-400' :
                        'bg-gray-300'
                      }`}></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                            {displayName}
                          </h3>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                            @{requester.username}
                          </p>
                          {userTitle && (
                            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                              {userTitle}
                            </p>
                          )}
                          {requester.company && (
                            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                              {requester.company}
                            </p>
                          )}
                          <p className={`text-xs mt-2 ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id, requester.id)}
                            disabled={processing === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id, requester.id)}
                            disabled={processing === request.id}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
