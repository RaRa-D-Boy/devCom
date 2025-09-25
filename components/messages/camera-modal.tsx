"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video as VideoIcon, Pause, X } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  mode: 'photo' | 'video';
  recording: boolean;
  onClose: () => void;
  onCapturePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function CameraModal({
  isOpen,
  mode,
  recording,
  onClose,
  onCapturePhoto,
  onStartRecording,
  onStopRecording,
  videoRef,
  canvasRef,
}: CameraModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'photo' ? 'Take Photo' : 'Record Video'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Recording indicator */}
          {recording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Recording...</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-4">
          {mode === 'photo' ? (
            <Button
              onClick={onCapturePhoto}
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture Photo
            </Button>
          ) : (
            <>
              {!recording ? (
                <Button
                  onClick={onStartRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full"
                >
                  <VideoIcon className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={onStopRecording}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-full"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {mode === 'photo' 
              ? 'Click "Capture Photo" to take a picture'
              : 'Click "Start Recording" to begin video recording'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
