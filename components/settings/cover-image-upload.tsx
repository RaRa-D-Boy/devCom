"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface CoverImageUploadProps {
  coverImageUrl?: string;
  onCoverImageChange: (url: string | null) => void;
  userId: string;
}

const PATTERN_IMAGES = [
  "/pattern.jpg",
  "/pattern2.jpg", 
  "/pattern3.jpg",
  "/pattern4.jpg",
  "/pattern5.jpg",
  "/pattern6.jpg",
  "/pattern7.jpg"
];

export function CoverImageUpload({ coverImageUrl, onCoverImageChange, userId }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imagePosition, setImagePosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  const [aspectRatio, setAspectRatio] = useState<'16/9' | '4/3' | '3/2' | '1/1'>('16/9');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
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
      const fileName = `covers/${userId}/${Date.now()}.${fileExt}`;

      console.log('Uploading cover image:', { fileName, userId, fileSize: file.size, fileType: file.type });

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
      
      // Clean up old cover image if it exists and is from our storage
      if (coverImageUrl && coverImageUrl.includes('profile-media')) {
        try {
          const oldFileName = coverImageUrl.split('profile-media/')[1];
          if (oldFileName) {
            await supabase.storage
              .from('profile-media')
              .remove([oldFileName]);
            console.log('Cleaned up old cover image:', oldFileName);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup old cover image:', cleanupError);
          // Don't fail the upload if cleanup fails
        }
      }
      
      onCoverImageChange(publicUrl);
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert(`Failed to upload cover image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePatternSelect = (patternUrl: string) => {
    onCoverImageChange(patternUrl);
  };

  const handleRemoveCover = () => {
    onCoverImageChange(null);
  };

  const currentImage = coverImageUrl || "/pattern.jpg"; // Default pattern

  return (
    <div className="space-y-4">
      {/* Current cover image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`relative w-full aspect-[${aspectRatio}] rounded-lg overflow-hidden border border-gray-200`}>
          <Image
            src={currentImage}
            alt="Cover"
            fill
            className={`object-cover object-${imagePosition}`}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white/90 hover:bg-white text-black"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRemoveCover}
              className="bg-white/90 hover:bg-white text-black"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Pattern selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose a pattern:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto scrollbar-hide">
          {PATTERN_IMAGES.map((pattern, index) => (
            <button
              key={index}
              onClick={() => handlePatternSelect(pattern)}
              className={`relative aspect-[${aspectRatio}] rounded-lg overflow-hidden border-2 transition-all ${
                currentImage === pattern
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image
                src={pattern}
                alt={`Pattern ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Image Controls */}
      {coverImageUrl && (
        <div className="space-y-4">
          {/* Aspect Ratio Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Aspect Ratio:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '16/9', label: 'Widescreen (16:9)', icon: '📺' },
                { value: '4/3', label: 'Standard (4:3)', icon: '📱' },
                { value: '3/2', label: 'Photo (3:2)', icon: '📷' },
                { value: '1/1', label: 'Square (1:1)', icon: '⬜' }
              ].map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspectRatio === ratio.value
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{ratio.icon}</span>
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Image Position:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'center', label: 'Center', icon: '🎯' },
                { value: 'top', label: 'Top', icon: '⬆️' },
                { value: 'bottom', label: 'Bottom', icon: '⬇️' },
                { value: 'left', label: 'Left', icon: '⬅️' },
                { value: 'right', label: 'Right', icon: '➡️' }
              ].map((position) => (
                <button
                  key={position.value}
                  onClick={() => setImagePosition(position.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    imagePosition === position.value
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{position.icon}</span>
                  {position.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      

      {/* Preview Section */}
      {coverImageUrl && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Preview:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desktop Preview */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Desktop View</p>
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={currentImage}
                  alt="Desktop Preview"
                  fill
                  className={`object-cover object-${imagePosition}`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            
            {/* Mobile Preview */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Mobile View</p>
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={currentImage}
                  alt="Mobile Preview"
                  fill
                  className={`object-cover object-${imagePosition}`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Upload a custom cover image or choose from patterns. Max size 5MB. Use the controls above to adjust positioning and aspect ratio.
      </p>
    </div>
  );
}
