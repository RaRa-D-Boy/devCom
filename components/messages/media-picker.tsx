"use client";

import { Button } from "@/components/ui/button";
import {
  Camera,
  Video as VideoIcon,
  Music,
  FileText,
  FolderOpen,
  Folder,
} from "lucide-react";

interface MediaPickerProps {
  isOpen: boolean;
  onMediaSelect: (accept: string) => void;
  onCameraStart: (mode: 'photo' | 'video') => void;
  onClose: () => void;
}

export function MediaPicker({ isOpen, onMediaSelect, onCameraStart, onClose }: MediaPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 p-4 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl z-50">
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900 mb-3">
          Upload Media
        </h4>

        {/* Images */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Images
          </p>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCameraStart('photo');
              }}
              className="flex-1 justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMediaSelect("image/*");
              }}
              className="flex-1 justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
            >
              <Folder className="h-4 w-4 mr-2" />
              Gallery
            </Button>
          </div>
        </div>

        {/* Videos */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Videos
          </p>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCameraStart('video');
              }}
              className="flex-1 justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
            >
              <VideoIcon className="h-4 w-4 mr-2" />
              Camera
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMediaSelect("video/*");
              }}
              className="flex-1 justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
            >
              <Folder className="h-4 w-4 mr-2" />
              Library
            </Button>
          </div>
        </div>

        {/* Audio */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Audio
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMediaSelect("audio/*");
            }}
            className="w-full justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
          >
            <Music className="h-4 w-4 mr-2" />
            Music & Audio Files
          </Button>
        </div>

        {/* Documents */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Documents
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMediaSelect(
                ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
              );
            }}
            className="w-full justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
          >
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </Button>
        </div>

        {/* Files */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Other Files
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMediaSelect(".zip,.rar,.7z,.tar,.gz");
            }}
            className="w-full justify-start text-xs h-9 bg-white/50 hover:bg-white/70 border border-white/30"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Archives & Files
          </Button>
        </div>
      </div>
    </div>
  );
}
