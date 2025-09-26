"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Plus, 
  Users, 
  Shield, 
  Image as ImageIcon,
  Upload,
  Settings,
  Lock,
  Globe
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { createClient } from "@/lib/supabase/client"

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
}

interface CreateGroupModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (groupId: string) => void
}

export function CreateGroupModal({ user, isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxMembers, setMaxMembers] = useState(100)
  const [allowMemberInvites, setAllowMemberInvites] = useState(true)
  const [requireApproval, setRequireApproval] = useState(true)
  
  // Member management
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<Profile[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  
  // UI state
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'members' | 'settings'>('basic')
  
  // Safe theme hook usage with fallback
  let theme = 'light';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available in CreateGroupModal component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';

  // Load user's friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends()
    }
  }, [isOpen])

  const loadFriends = async () => {
    setLoadingFriends(true)
    try {
      // Use the new friends API endpoint
      const response = await fetch('/api/friends/list?type=for_groups')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch friends')
      }

      setFriends(result.friends || [])
    } catch (error) {
      console.error('Error loading friends:', error)
    } finally {
      setLoadingFriends(false)
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleMember = (friend: Profile) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === friend.id)
      if (isSelected) {
        // Remove from members and admins
        setSelectedAdmins(prev => prev.filter(a => a.id !== friend.id))
        return prev.filter(m => m.id !== friend.id)
      } else {
        return [...prev, friend]
      }
    })
  }

  const toggleAdmin = (friend: Profile) => {
    setSelectedAdmins(prev => {
      const isSelected = prev.some(a => a.id === friend.id)
      if (isSelected) {
        return prev.filter(a => a.id !== friend.id)
      } else {
        // Add to members if not already there
        setSelectedMembers(prev => {
          const isMember = prev.some(m => m.id === friend.id)
          return isMember ? prev : [...prev, friend]
        })
        return [...prev, friend]
      }
    })
  }

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImage) {
      console.log('No cover image to upload')
      return null
    }

    try {
      const supabase = createClient()
      const fileExt = coverImage.name.split('.').pop()
      const fileName = `${user.id}/group-covers/${Date.now()}.${fileExt}`
      
      console.log('Uploading cover image:', {
        fileName,
        fileSize: coverImage.size,
        fileType: coverImage.type
      })
      
      const { data, error } = await supabase.storage
        .from('group-media')
        .upload(fileName, coverImage)

      if (error) {
        console.error('Storage upload error:', error)
        throw error
      }

      console.log('Upload successful, data:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('group-media')
        .getPublicUrl(fileName)

      console.log('Generated public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Error uploading cover image:', error)
      return null
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return

    setCreating(true)
    try {
      // Upload cover image if provided
      const coverImageUrl = await uploadCoverImage()

      // Prepare group data
      const groupData = {
        name: groupName.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl,
        is_private: isPrivate,
        max_members: maxMembers,
        allow_member_invites: allowMemberInvites,
        require_approval: requireApproval,
        initial_members: selectedMembers.filter(m => !selectedAdmins.some(a => a.id === m.id)).map(m => m.id),
        initial_admins: selectedAdmins.map(a => a.id)
      }

      console.log('Creating group with data:', groupData)
      console.log('Cover image URL being saved:', coverImageUrl)

      // Create group
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create group')
      }

      onGroupCreated(result.group.id)
      onClose()
      
      // Reset form
      setGroupName("")
      setDescription("")
      setCoverImage(null)
      setCoverImagePreview(null)
      setSelectedMembers([])
      setSelectedAdmins([])
      setActiveTab('basic')
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'settings', label: 'Settings', icon: Shield }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-black'}`}>
            Create New Group
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground' 
                    : isDarkTheme 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            )
          })}
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Group Name */}
            <div className="space-y-2">
              <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Group Name *</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className={`${
                  isDarkTheme 
                    ? 'text-white placeholder:text-gray-400' 
                    : 'text-black placeholder:text-gray-500'
                }`}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your group..."
                rows={3}
                className={`${
                  isDarkTheme 
                    ? 'text-white placeholder:text-gray-400' 
                    : 'text-black placeholder:text-gray-500'
                }`}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Cover Image</Label>
              <div className="space-y-3">
                {coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCoverImage(null)
                        setCoverImagePreview(null)
                      }}
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    isDarkTheme ? 'border-gray-600' : 'border-gray-300'
                  }`}>
                    <ImageIcon className={`h-8 w-8 mx-auto mb-2 ${
                      isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Upload a cover image for your group
                    </p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                  id="cover-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  className={`w-full ${
                    isDarkTheme 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Cover Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Select friends to add to your group. You can only add friends as members.
            </div>

            {loadingFriends ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className={`mt-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading friends...
                </p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className={`h-12 w-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  You don't have any friends yet. Add friends to invite them to your group.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {friends.map((friend) => {
                  const isMember = selectedMembers.some(m => m.id === friend.id)
                  const isAdmin = selectedAdmins.some(a => a.id === friend.id)
                  
                  return (
                    <div
                      key={friend.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isMember 
                          ? isDarkTheme 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-primary/5 border-primary/20'
                          : isDarkTheme 
                            ? 'border-gray-600' 
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback className="bg-neutral-700 text-white">
                            {(friend.full_name || friend.display_name || friend.username)?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                            {friend.full_name || friend.display_name || friend.username}
                          </p>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isMember && (
                          <Badge variant={isAdmin ? "default" : "secondary"}>
                            {isAdmin ? "Admin" : "Member"}
                          </Badge>
                        )}
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMember(friend)}
                          className={`h-8 w-8 p-0 ${
                            isMember 
                              ? 'text-primary hover:text-primary/80' 
                              : isDarkTheme 
                                ? 'text-gray-400 hover:text-white' 
                                : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        {isMember && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAdmin(friend)}
                            className={`h-8 w-8 p-0 ${
                              isAdmin 
                                ? 'text-primary hover:text-primary/80' 
                                : isDarkTheme 
                                  ? 'text-gray-400 hover:text-white' 
                                  : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Selected Members Summary */}
            {(selectedMembers.length > 0 || selectedAdmins.length > 0) && (
              <div className={`p-4 rounded-lg border ${
                isDarkTheme ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${isDarkTheme ? 'text-white' : 'text-black'}`}>
                  Selected Members ({selectedMembers.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => {
                    const isAdmin = selectedAdmins.some(a => a.id === member.id)
                    return (
                      <Badge key={member.id} variant={isAdmin ? "default" : "secondary"}>
                        {member.full_name || member.username} {isAdmin && "(Admin)"}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Privacy Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Private Group</Label>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Only members can see and join this group
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isPrivate ? <Lock className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-primary" />}
                <Switch
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Maximum Members</Label>
              <Input
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 100)}
                min="2"
                max="1000"
                className={`${
                  isDarkTheme 
                    ? 'text-white placeholder:text-gray-400' 
                    : 'text-black placeholder:text-gray-500'
                }`}
              />
            </div>

            {/* Allow Member Invites */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Allow Member Invites</Label>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Members can invite their friends to the group
                </p>
              </div>
              <Switch
                checked={allowMemberInvites}
                onCheckedChange={setAllowMemberInvites}
              />
            </div>

            {/* Require Approval */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className={`${isDarkTheme ? 'text-white' : 'text-black'}`}>Require Approval</Label>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  New join requests need admin approval
                </p>
              </div>
              <Switch
                checked={requireApproval}
                onCheckedChange={setRequireApproval}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creating}
            className={`${
              isDarkTheme 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || creating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
