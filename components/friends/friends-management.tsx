"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  Clock,
  MapPin,
  Building,
  Github,
  Linkedin,
  Globe
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

interface Profile {
  id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  status?: 'active' | 'busy' | 'offline' | 'inactive'
  role?: string
  company?: string
  location?: string
  bio?: string
  github_url?: string
  linkedin_url?: string
  portfolio_url?: string
}

interface FriendRequest {
  request_id: string
  requester_id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  status?: string
  role?: string
  company?: string
  location?: string
  request_created_at: string
}

interface FriendsManagementProps {
  user: User
}

export function FriendsManagement({ user }: FriendsManagementProps) {
  const [friends, setFriends] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available in FriendsManagement component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    loadFriendsData()
  }, [])

  const loadFriendsData = async () => {
    setLoading(true)
    try {
      // Load all friends data in parallel
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        fetch('/api/friends/list?type=friends'),
        fetch('/api/friends/list?type=pending'),
        fetch('/api/friends/list?type=sent')
      ])

      const [friendsData, pendingData, sentData] = await Promise.all([
        friendsRes.json(),
        pendingRes.json(),
        sentRes.json()
      ])

      if (friendsRes.ok) setFriends(friendsData.friends || [])
      if (pendingRes.ok) setPendingRequests(pendingData.requests || [])
      if (sentRes.ok) setSentRequests(sentData.requests || [])
    } catch (error) {
      console.error('Error loading friends data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requesterId: string) => {
    try {
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId })
      })

      const result = await response.json()

      if (response.ok) {
        // Reload data to reflect changes
        loadFriendsData()
      } else {
        console.error('Error accepting request:', result.error)
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleDeclineRequest = async (requesterId: string) => {
    try {
      const response = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId })
      })

      const result = await response.json()

      if (response.ok) {
        // Reload data to reflect changes
        loadFriendsData()
      } else {
        console.error('Error declining request:', result.error)
      }
    } catch (error) {
      console.error('Error declining friend request:', error)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          friend_id: friendId, 
          action: 'remove_friend' 
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Reload data to reflect changes
        loadFriendsData()
      } else {
        console.error('Error removing friend:', result.error)
      }
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'inactive': return 'bg-gray-400'
      default: return 'bg-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className={`mt-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading friends...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
          Friends Management
        </h2>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-sm">
            {friends.length} Friends
          </Badge>
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingRequests.length} Pending
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-3 ${
          isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Friends ({friends.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({pendingRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Sent ({sentRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className={`h-12 w-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                No friends yet. Start connecting with other developers!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className={`p-4 rounded-lg border ${
                    isDarkTheme ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback className="bg-neutral-700 text-white">
                            {(friend.full_name || friend.display_name || friend.username)?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(friend.status)}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                          {friend.full_name || friend.display_name || friend.username}
                        </h3>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          @{friend.username}
                        </p>
                        {friend.role && (
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                            {friend.role}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.id)}
                      className={`h-8 w-8 p-0 ${
                        isDarkTheme 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                          : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'
                      }`}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {friend.bio && (
                    <p className={`text-sm mt-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {friend.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3 text-xs">
                    {friend.location && (
                      <div className={`flex items-center space-x-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="h-3 w-3" />
                        <span>{friend.location}</span>
                      </div>
                    )}
                    {friend.company && (
                      <div className={`flex items-center space-x-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Building className="h-3 w-3" />
                        <span>{friend.company}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    {friend.github_url && (
                      <a
                        href={friend.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${
                          isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {friend.linkedin_url && (
                      <a
                        href={friend.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${
                          isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {friend.portfolio_url && (
                      <a
                        href={friend.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${
                          isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className={`h-12 w-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                No pending friend requests
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.request_id}
                  className={`p-4 rounded-lg border ${
                    isDarkTheme ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatar_url} />
                        <AvatarFallback className="bg-neutral-700 text-white">
                          {(request.full_name || request.display_name || request.username)?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                          {request.full_name || request.display_name || request.username}
                        </h3>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          @{request.username}
                        </p>
                        <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                          Requested {formatDate(request.request_created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.requester_id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineRequest(request.requester_id)}
                        className={`${
                          isDarkTheme 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className={`h-12 w-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                No sent friend requests
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <div
                  key={request.request_id}
                  className={`p-4 rounded-lg border ${
                    isDarkTheme ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatar_url} />
                        <AvatarFallback className="bg-neutral-700 text-white">
                          {(request.full_name || request.display_name || request.username)?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                          {request.full_name || request.display_name || request.username}
                        </h3>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          @{request.username}
                        </p>
                        <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                          Sent {formatDate(request.request_created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
