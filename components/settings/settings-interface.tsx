"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save,
  User as UserIcon,
  Shield,
  Palette,
  Bell,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  bio?: string
  status?: 'active' | 'busy' | 'offline' | 'inactive'
  role?: string
  company?: string
  location?: string
  website?: string
  github_url?: string
  linkedin_url?: string
  created_at: string
}

interface SettingsInterfaceProps {
  user: User
  profile: Profile
}

export function SettingsInterface({ user, profile }: SettingsInterfaceProps) {
  const [profileData, setProfileData] = useState<Profile>(profile)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    messages: true,
    mentions: true,
    friendRequests: true
  })
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowMessages: true
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id)

      if (error) throw error
      
      // Show success message
      console.log("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout user={user} profile={profile} activePage="settings">
      <div className="pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <Button 
          onClick={handleSaveProfile}
          disabled={loading}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
          <TabsTrigger value="profile" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <UserIcon className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4">Profile Information</h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-20 w-20 ring-4 ring-gray-200">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="bg-neutral-700 text-white text-lg">
                  {(profileData.full_name || profileData.display_name || profileData.username)?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                  Change Avatar
                </Button>
                <p className="text-gray-600 text-sm mt-1">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-black">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-black">Display Name</Label>
                <Input
                  id="displayName"
                  value={profileData.display_name || ''}
                  onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-black">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.full_name || ''}
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-black">Role</Label>
                <Input
                  id="role"
                  value={profileData.role || ''}
                  onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company" className="text-black">Company</Label>
                <Input
                  id="company"
                  value={profileData.company || ''}
                  onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-black">Location</Label>
                <Input
                  id="location"
                  value={profileData.location || ''}
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="bio" className="text-black">Bio</Label>
              <textarea
                id="bio"
                value={profileData.bio || ''}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4">Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Email Notifications</p>
                  <p className="text-gray-600 text-sm">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Push Notifications</p>
                  <p className="text-gray-600 text-sm">Receive push notifications</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Message Notifications</p>
                  <p className="text-gray-600 text-sm">Get notified about new messages</p>
                </div>
                <Switch
                  checked={notifications.messages}
                  onCheckedChange={(checked) => setNotifications({...notifications, messages: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Mention Notifications</p>
                  <p className="text-gray-600 text-sm">Get notified when mentioned</p>
                </div>
                <Switch
                  checked={notifications.mentions}
                  onCheckedChange={(checked) => setNotifications({...notifications, mentions: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Friend Request Notifications</p>
                  <p className="text-gray-600 text-sm">Get notified about friend requests</p>
                </div>
                <Switch
                  checked={notifications.friendRequests}
                  onCheckedChange={(checked) => setNotifications({...notifications, friendRequests: checked})}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4">Privacy Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-black">Profile Visibility</Label>
                <select 
                  value={privacy.profileVisibility}
                  onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Show Online Status</p>
                  <p className="text-gray-600 text-sm">Let others see when you're online</p>
                </div>
                <Switch
                  checked={privacy.showOnlineStatus}
                  onCheckedChange={(checked) => setPrivacy({...privacy, showOnlineStatus: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Allow Friend Requests</p>
                  <p className="text-gray-600 text-sm">Let others send you friend requests</p>
                </div>
                <Switch
                  checked={privacy.allowFriendRequests}
                  onCheckedChange={(checked) => setPrivacy({...privacy, allowFriendRequests: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Allow Direct Messages</p>
                  <p className="text-gray-600 text-sm">Let others send you direct messages</p>
                </div>
                <Switch
                  checked={privacy.allowMessages}
                  onCheckedChange={(checked) => setPrivacy({...privacy, allowMessages: checked})}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4">Appearance Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-black">Theme</Label>
                <select className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">Language</Label>
                <select className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  )
}
