"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  avatarUrl?: string;
  displayName?: string;
  onAvatarChange: (url: string | null) => void;
  userId: string;
}

export function AvatarUpload({ avatarUrl, displayName, onAvatarChange, userId }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      
      // Check if user is authenticated
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('User not authenticated');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${userId}/${Date.now()}.${fileExt}`;

      console.log('Uploading avatar:', { fileName, userId, fileSize: file.size, fileType: file.type });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-media')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);
      
      // Clean up old avatar if it exists and is from our storage
      if (avatarUrl && avatarUrl.includes('profile-media')) {
        try {
          const oldFileName = avatarUrl.split('profile-media/')[1];
          if (oldFileName) {
            await supabase.storage
              .from('profile-media')
              .remove([oldFileName]);
            console.log('Cleaned up old avatar:', oldFileName);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup old avatar:', cleanupError);
          // Don't fail the upload if cleanup fails
        }
      }
      
      onAvatarChange(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange(null);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="h-20 w-20 ring-4 ring-gray-200">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-neutral-700 text-white text-lg">
            {displayName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white/90 hover:bg-white text-black h-8 w-8 p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Change Avatar"}
          </Button>
          
          {avatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              className="border-gray-300 hover:bg-gray-50 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        
        <p className="text-gray-600 text-sm">
          JPG, PNG or GIF. Max size 2MB.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
