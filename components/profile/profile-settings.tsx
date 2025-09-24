"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Save, 
  Upload, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  MapPin, 
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Settings,
  User as UserIcon,
  Bell,
  Palette
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string
  full_name?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  cover_image_url?: string
  bio?: string
  status?: 'active' | 'busy' | 'offline' | 'inactive'
  location?: string
  website?: string
  github_url?: string
  linkedin_url?: string
  twitter_url?: string
  portfolio_url?: string
  role?: string
  company?: string
  job_title?: string
  skills?: string[]
  programming_languages?: string[]
  frameworks?: string[]
  tools?: string[]
  experience_level?: 'junior' | 'mid' | 'senior' | 'lead' | 'architect'
  years_of_experience?: number
  education?: string
  certifications?: string[]
  projects?: string[]
  achievements?: string[]
  interests?: string[]
  timezone?: string
  availability?: 'available' | 'busy' | 'unavailable'
  looking_for_work?: boolean
  remote_work?: boolean
  profile_visibility?: 'public' | 'friends' | 'private'
  last_seen?: string
  profile_completed?: boolean
  theme_preference?: 'light' | 'dark' | 'auto'
  notification_preferences?: any
  social_links?: any
  contact_info?: any
  professional_info?: any
  created_at: string
  updated_at?: string
}

interface ProfileSettingsProps {
  user: User
  profile: Profile
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const [formData, setFormData] = useState<Partial<Profile>>(profile)
  const [loading, setLoading] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [newFramework, setNewFramework] = useState("")
  const [newTool, setNewTool] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayAdd = (field: string, value: string, setter: (value: string) => void) => {
    if (value.trim() && !formData[field as keyof Profile]?.includes(value.trim())) {
      const currentArray = formData[field as keyof Profile] as string[] || []
      handleInputChange(field, [...currentArray, value.trim()])
      setter("")
    }
  }

  const handleArrayRemove = (field: string, index: number) => {
    const currentArray = formData[field as keyof Profile] as string[] || []
    handleInputChange(field, currentArray.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const { profile: updatedProfile } = await response.json()
      setFormData(updatedProfile)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and preferences</p>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Professional
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {(formData.full_name || formData.display_name || formData.username)?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username || ""}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name || ""}
                      onChange={(e) => handleInputChange("display_name", e.target.value)}
                      placeholder="Enter display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name || ""}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name || ""}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        value={formData.location || ""}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="Enter location"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status || "offline"} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formData.role || ""}
                      onChange={(e) => handleInputChange("role", e.target.value)}
                      placeholder="e.g., Frontend Developer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company || ""}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title || ""}
                      onChange={(e) => handleInputChange("job_title", e.target.value)}
                      placeholder="Enter job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select value={formData.experience_level || "junior"} onValueChange={(value) => handleInputChange("experience_level", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid-level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="architect">Architect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_of_experience">Years of Experience</Label>
                    <Input
                      id="years_of_experience"
                      type="number"
                      value={formData.years_of_experience || ""}
                      onChange={(e) => handleInputChange("years_of_experience", parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      value={formData.education || ""}
                      onChange={(e) => handleInputChange("education", e.target.value)}
                      placeholder="e.g., Computer Science, MIT"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="looking_for_work"
                      checked={formData.looking_for_work || false}
                      onCheckedChange={(checked) => handleInputChange("looking_for_work", checked)}
                    />
                    <Label htmlFor="looking_for_work">Looking for work</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remote_work"
                      checked={formData.remote_work || false}
                      onCheckedChange={(checked) => handleInputChange("remote_work", checked)}
                    />
                    <Label htmlFor="remote_work">Open to remote work</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="website"
                        value={formData.website || ""}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub</Label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="github_url"
                        value={formData.github_url || ""}
                        onChange={(e) => handleInputChange("github_url", e.target.value)}
                        placeholder="https://github.com/username"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="linkedin_url"
                        value={formData.linkedin_url || ""}
                        onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="twitter_url"
                        value={formData.twitter_url || ""}
                        onChange={(e) => handleInputChange("twitter_url", e.target.value)}
                        placeholder="https://twitter.com/username"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_url">Portfolio</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="portfolio_url"
                        value={formData.portfolio_url || ""}
                        onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skills & Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skills */}
                <div className="space-y-3">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd("skills", newSkill, setNewSkill)}
                    />
                    <Button onClick={() => handleArrayAdd("skills", newSkill, setNewSkill)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          onClick={() => handleArrayRemove("skills", index)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Programming Languages */}
                <div className="space-y-3">
                  <Label>Programming Languages</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="Add a language"
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd("programming_languages", newLanguage, setNewLanguage)}
                    />
                    <Button onClick={() => handleArrayAdd("programming_languages", newLanguage, setNewLanguage)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.programming_languages?.map((language, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {language}
                        <button
                          onClick={() => handleArrayRemove("programming_languages", index)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Frameworks */}
                <div className="space-y-3">
                  <Label>Frameworks & Libraries</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFramework}
                      onChange={(e) => setNewFramework(e.target.value)}
                      placeholder="Add a framework"
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd("frameworks", newFramework, setNewFramework)}
                    />
                    <Button onClick={() => handleArrayAdd("frameworks", newFramework, setNewFramework)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.frameworks?.map((framework, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {framework}
                        <button
                          onClick={() => handleArrayRemove("frameworks", index)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="space-y-3">
                  <Label>Tools & Technologies</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      placeholder="Add a tool"
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd("tools", newTool, setNewTool)}
                    />
                    <Button onClick={() => handleArrayAdd("tools", newTool, setNewTool)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tools?.map((tool, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {tool}
                        <button
                          onClick={() => handleArrayRemove("tools", index)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile_visibility">Profile Visibility</Label>
                    <Select value={formData.profile_visibility || "public"} onValueChange={(value) => handleInputChange("profile_visibility", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme_preference">Theme</Label>
                    <Select value={formData.theme_preference || "auto"} onValueChange={(value) => handleInputChange("theme_preference", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone || "UTC"} onValueChange={(value) => handleInputChange("timezone", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select value={formData.availability || "available"} onValueChange={(value) => handleInputChange("availability", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="min-w-32">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
