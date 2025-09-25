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
import { SkillsInput } from "./skills-input"
import { CoverImageUpload } from "./cover-image-upload"
import { AvatarUpload } from "./avatar-upload"
import { AppearanceSettings } from "./appearance-settings"
import { Profile } from "../messages/types"
import { useProfile } from "@/contexts/profile-context"
import { useTheme } from "@/contexts/theme-context"

interface SettingsInterfaceProps {
  user: User
  profile: Profile
}

export function SettingsInterface({ user, profile }: SettingsInterfaceProps) {
  const { updateProfile, refreshProfile } = useProfile();
  const { theme, glassEffect, colorPalette } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [profileData, setProfileData] = useState<Profile>({
    ...profile,
    skills: profile.skills || [],
    programming_languages: profile.programming_languages || [],
    frameworks: profile.frameworks || [],
    tools: profile.tools || [],
    status: profile.status || 'offline',
    position: profile.position || 'junior'
  })
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
  const [appearance, setAppearance] = useState({
    theme: 'light',
    language: 'en'
  })
  const [loading, setLoading] = useState({
    profile: false,
    notifications: false,
    privacy: false,
    appearance: false
  })
  const [saved, setSaved] = useState({
    profile: false,
    notifications: false,
    privacy: false,
    appearance: false
  })
  const supabase = createClient()

  const handleSaveProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }))
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id)

      if (error) throw error
      
      // Update the profile context
      updateProfile(profileData);
      
      // Show success message
      setSaved(prev => ({ ...prev, profile: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, profile: false })), 3000)
      console.log("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(prev => ({ ...prev, notifications: true }))
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: notifications })
        .eq("id", user.id)

      if (error) throw error
      
      setSaved(prev => ({ ...prev, notifications: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, notifications: false })), 3000)
      console.log("Notification preferences updated successfully")
    } catch (error) {
      console.error("Error updating notifications:", error)
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }))
    }
  }

  const handleSavePrivacy = async () => {
    setLoading(prev => ({ ...prev, privacy: true }))
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          profile_visibility: privacy.profileVisibility,
          show_online_status: privacy.showOnlineStatus,
          allow_friend_requests: privacy.allowFriendRequests,
          allow_messages: privacy.allowMessages
        })
        .eq("id", user.id)

      if (error) throw error
      
      setSaved(prev => ({ ...prev, privacy: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, privacy: false })), 3000)
      console.log("Privacy settings updated successfully")
    } catch (error) {
      console.error("Error updating privacy:", error)
    } finally {
      setLoading(prev => ({ ...prev, privacy: false }))
    }
  }

  const handleSaveAppearance = async () => {
    setLoading(prev => ({ ...prev, appearance: true }))
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          theme_preference: appearance.theme,
          language_preference: appearance.language
        })
        .eq("id", user.id)

      if (error) throw error
      
      setSaved(prev => ({ ...prev, appearance: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, appearance: false })), 3000)
      console.log("Appearance settings updated successfully")
    } catch (error) {
      console.error("Error updating appearance:", error)
    } finally {
      setLoading(prev => ({ ...prev, appearance: false }))
    }
  }

  return (
    <AppLayout user={user} profile={profile} activePage="settings">
      <div className="pb-20 lg:pb-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Settings</h1>
        </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 p-2 h-auto ${
          isDarkTheme 
            ? glassEffect === 'translucent' ? 'bg-neutral-800/70 backdrop-blur-sm border border-gray-700/30' :
              glassEffect === 'transparent' ? 'bg-transparent border border-gray-600' :
              'bg-neutral-800 border border-gray-700'
            : glassEffect === 'translucent' ? 'bg-gray-100/80 backdrop-blur-sm border border-white/20' :
              glassEffect === 'transparent' ? 'bg-transparent border border-gray-200' :
              'bg-gray-100 border border-gray-200'
        }`}>
          <TabsTrigger value="profile" className={`p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200'}`}>
            <UserIcon className="h-4 w-4 mr-2" />
            <span className="hidden lg:block">Profile</span> 
          </TabsTrigger>
          <TabsTrigger value="notifications" className={`p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200'}`}>
            <Bell className="h-4 w-4 mr-2" />
           <span className="hidden lg:block">Notifications</span> 
          </TabsTrigger>
          <TabsTrigger value="privacy" className={`p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200'}`}>
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden lg:block">Privacy</span> 
          </TabsTrigger>
          <TabsTrigger value="appearance" className={`p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isDarkTheme ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200'}`}>
            <Palette className="h-4 w-4 mr-2" />
            <span className="hidden lg:block">Appearance</span> 
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="space-y-6">
            {/* Cover Image Section */}
            <div className={`rounded-2xl p-6 shadow-sm ${
              isDarkTheme 
                ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
                  glassEffect === 'transparent' ? 'bg-transparent border border-gray-600' :
                  'bg-neutral-900 border border-gray-700'
                : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                  glassEffect === 'transparent' ? 'bg-transparent border border-gray-200' :
                  'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-black'}`}>Cover Image</h3>
              <CoverImageUpload
                coverImageUrl={profileData.cover_image_url}
                onCoverImageChange={(url) => setProfileData({...profileData, cover_image_url: url || undefined})}
                userId={user.id}
              />
            </div>

            {/* Profile Information */}
            <div className={`rounded-2xl p-6 shadow-sm ${
              isDarkTheme 
                ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
                  glassEffect === 'transparent' ? 'bg-transparent border border-gray-600' :
                  'bg-neutral-900 border border-gray-700'
                : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                  glassEffect === 'transparent' ? 'bg-transparent border border-gray-200' :
                  'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-black'}`}>Profile Information</h3>
              
              {/* Avatar Upload */}
              <div className="mb-6">
                <AvatarUpload
                  avatarUrl={profileData.avatar_url}
                  displayName={profileData.display_name || profileData.full_name || profileData.username}
                  onAvatarChange={(url) => setProfileData({...profileData, avatar_url: url || undefined})}
                  userId={user.id}
                />
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className={isDarkTheme ? 'text-white' : 'text-black'}>Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName" className={isDarkTheme ? 'text-white' : 'text-black'}>Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.display_name || ''}
                    onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className={isDarkTheme ? 'text-white' : 'text-black'}>Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.full_name || ''}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className={isDarkTheme ? 'text-white' : 'text-black'}>Status</Label>
                  <select
                    id="status"
                    value={profileData.status}
                    onChange={(e) => setProfileData({...profileData, status: e.target.value as any})}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="busy">🟡 Busy</option>
                    <option value="away">🟠 Away</option>
                    <option value="inactive">⚫ Inactive</option>
                    <option value="offline">⚪ Offline</option>
                  </select>
                </div>
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="role" className={isDarkTheme ? 'text-white' : 'text-black'}>Role</Label>
                  <select
                    id="role"
                    value={profileData.role || ''}
                    onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select a role</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Mobile Developer">Mobile Developer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="System Administrator">System Administrator</option>
                    <option value="Security Engineer">Security Engineer</option>
                    <option value="Technical Writer">Technical Writer</option>
                    <option value="Solution Architect">Solution Architect</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position" className={isDarkTheme ? 'text-white' : 'text-black'}>Position Level</Label>
                  <select
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData({...profileData, position: e.target.value as any})}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="intern">Intern</option>
                    <option value="student">Student</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="principal">Principal</option>
                    <option value="architect">Architect</option>
                    <option value="manager">Manager</option>
                    <option value="director">Director</option>
                    <option value="vp">VP</option>
                    <option value="cto">CTO</option>
                    <option value="cfo">CFO</option>
                    <option value="founder">Founder</option>
                    <option value="consultant">Consultant</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company" className={isDarkTheme ? 'text-white' : 'text-black'}>Company</Label>
                  <Input
                    id="company"
                    value={profileData.company || ''}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className={isDarkTheme ? 'text-white' : 'text-black'}>Location</Label>
                  <Input
                    id="location"
                    value={profileData.location || ''}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="bio" className={isDarkTheme ? 'text-white' : 'text-black'}>Bio</Label>
                <textarea
                  id="bio"
                  value={profileData.bio || ''}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  rows={4}
                  placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                />
              </div>

              {/* Skills Section */}
              <div className="space-y-4 mb-6">
                <h4 className={`text-md font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Skills & Technologies</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label className={isDarkTheme ? 'text-white' : 'text-black'}>General Skills</Label>
                    <SkillsInput
                      skills={profileData.skills || []}
                      onSkillsChange={(skills) => setProfileData({...profileData, skills})}
                      placeholder="Add skills like 'Problem Solving', 'Team Leadership'..."
                    />
                  </div>
                  
                  <div>
                    <Label className={isDarkTheme ? 'text-white' : 'text-black'}>Programming Languages</Label>
                    <SkillsInput
                      skills={profileData.programming_languages || []}
                      onSkillsChange={(programming_languages) => setProfileData({...profileData, programming_languages})}
                      placeholder="Add languages like 'JavaScript', 'Python', 'Java'..."
                    />
                  </div>
                  
                  <div>
                    <Label className={isDarkTheme ? 'text-white' : 'text-black'}>Frameworks & Libraries</Label>
                    <SkillsInput
                      skills={profileData.frameworks || []}
                      onSkillsChange={(frameworks) => setProfileData({...profileData, frameworks})}
                      placeholder="Add frameworks like 'React', 'Vue.js', 'Express'..."
                    />
                  </div>
                  
                  <div>
                    <Label className={isDarkTheme ? 'text-white' : 'text-black'}>Tools & Technologies</Label>
                    <SkillsInput
                      skills={profileData.tools || []}
                      onSkillsChange={(tools) => setProfileData({...profileData, tools})}
                      placeholder="Add tools like 'Docker', 'AWS', 'Git'..."
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github" className={isDarkTheme ? 'text-white' : 'text-black'}>GitHub</Label>
                  <Input
                    id="github"
                    value={profileData.github_url || ''}
                    onChange={(e) => setProfileData({...profileData, github_url: e.target.value})}
                    placeholder="https://github.com/username"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gitlab" className={isDarkTheme ? 'text-white' : 'text-black'}>GitLab</Label>
                  <Input
                    id="gitlab"
                    value={profileData.gitlab_url || ''}
                    onChange={(e) => setProfileData({...profileData, gitlab_url: e.target.value})}
                    placeholder="https://gitlab.com/username"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="portfolio" className={isDarkTheme ? 'text-white' : 'text-black'}>Portfolio/Website</Label>
                  <Input
                    id="portfolio"
                    value={profileData.portfolio_url || ''}
                    onChange={(e) => setProfileData({...profileData, portfolio_url: e.target.value})}
                    placeholder="https://yourportfolio.com"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className={isDarkTheme ? 'text-white' : 'text-black'}>LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profileData.linkedin_url || ''}
                    onChange={(e) => setProfileData({...profileData, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Profile Save Button */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveProfile}
                disabled={loading.profile}
                className={`${saved.profile ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading.profile ? "Saving..." : saved.profile ? "Saved!" : "Save Profile"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className={`rounded-2xl p-6 shadow-sm ${
            isDarkTheme 
              ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
                glassEffect === 'transparent' ? 'bg-transparent border border-gray-600' :
                'bg-neutral-900 border border-gray-700'
              : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                glassEffect === 'transparent' ? 'bg-transparent border border-gray-200' :
                'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-black'}`}>Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Email Notifications</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Push Notifications</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Receive push notifications</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Message Notifications</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Get notified about new messages</p>
                </div>
                <Switch
                  checked={notifications.messages}
                  onCheckedChange={(checked) => setNotifications({...notifications, messages: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Mention Notifications</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Get notified when mentioned</p>
                </div>
                <Switch
                  checked={notifications.mentions}
                  onCheckedChange={(checked) => setNotifications({...notifications, mentions: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Friend Request Notifications</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Get notified about friend requests</p>
                </div>
                <Switch
                  checked={notifications.friendRequests}
                  onCheckedChange={(checked) => setNotifications({...notifications, friendRequests: checked})}
                />
              </div>
            </div>

            {/* Notifications Save Button */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveNotifications}
                disabled={loading.notifications}
                className={`${saved.notifications ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading.notifications ? "Saving..." : saved.notifications ? "Saved!" : "Save Notifications"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <div className={`rounded-2xl p-6 shadow-sm ${
            isDarkTheme 
              ? glassEffect === 'translucent' ? 'bg-neutral-900/70 backdrop-blur-sm border border-gray-700/30' :
                glassEffect === 'transparent' ? 'bg-transparent border border-gray-600' :
                'bg-neutral-900 border border-gray-700'
              : glassEffect === 'translucent' ? 'bg-white/80 backdrop-blur-sm border border-white/20' :
                glassEffect === 'transparent' ? 'bg-transparent border border-gray-200' :
                'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-black'}`}>Privacy Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={isDarkTheme ? 'text-white' : 'text-black'}>Profile Visibility</Label>
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
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Show Online Status</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Let others see when you're online</p>
                </div>
                <Switch
                  checked={privacy.showOnlineStatus}
                  onCheckedChange={(checked) => setPrivacy({...privacy, showOnlineStatus: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Allow Friend Requests</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Let others send you friend requests</p>
                </div>
                <Switch
                  checked={privacy.allowFriendRequests}
                  onCheckedChange={(checked) => setPrivacy({...privacy, allowFriendRequests: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>Allow Direct Messages</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Let others send you direct messages</p>
                </div>
                <Switch
                  checked={privacy.allowMessages}
                  onCheckedChange={(checked) => setPrivacy({...privacy, allowMessages: checked})}
                />
              </div>
            </div>

            {/* Privacy Save Button */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSavePrivacy}
                disabled={loading.privacy}
                className={`${saved.privacy ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading.privacy ? "Saving..." : saved.privacy ? "Saved!" : "Save Privacy"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  )
}
