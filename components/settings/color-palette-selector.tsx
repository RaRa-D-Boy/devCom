"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Palette } from "lucide-react";

interface ColorPaletteSelectorProps {
  currentPalette: string;
  onPaletteChange: (palette: string) => void;
}

const colorPalettes = [
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Calm and professional',
    colors: {
      primary: 'bg-blue-500',
      secondary: 'bg-blue-100',
      accent: 'bg-blue-600',
      background: 'bg-blue-50'
    },
    preview: 'from-blue-400 to-blue-600'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Creative and elegant',
    colors: {
      primary: 'bg-purple-500',
      secondary: 'bg-purple-100',
      accent: 'bg-purple-600',
      background: 'bg-purple-50'
    },
    preview: 'from-purple-400 to-purple-600'
  },
  {
    id: 'green',
    name: 'Forest Green',
    description: 'Natural and refreshing',
    colors: {
      primary: 'bg-green-500',
      secondary: 'bg-green-100',
      accent: 'bg-green-600',
      background: 'bg-green-50'
    },
    preview: 'from-green-400 to-green-600'
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    description: 'Warm and energetic',
    colors: {
      primary: 'bg-orange-500',
      secondary: 'bg-orange-100',
      accent: 'bg-orange-600',
      background: 'bg-orange-50'
    },
    preview: 'from-orange-400 to-orange-600'
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    description: 'Soft and modern',
    colors: {
      primary: 'bg-pink-500',
      secondary: 'bg-pink-100',
      accent: 'bg-pink-600',
      background: 'bg-pink-50'
    },
    preview: 'from-pink-400 to-pink-600'
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    description: 'Sophisticated and deep',
    colors: {
      primary: 'bg-indigo-500',
      secondary: 'bg-indigo-100',
      accent: 'bg-indigo-600',
      background: 'bg-indigo-50'
    },
    preview: 'from-indigo-400 to-indigo-600'
  },
  {
    id: 'teal',
    name: 'Aqua Teal',
    description: 'Fresh and balanced',
    colors: {
      primary: 'bg-teal-500',
      secondary: 'bg-teal-100',
      accent: 'bg-teal-600',
      background: 'bg-teal-50'
    },
    preview: 'from-teal-400 to-teal-600'
  },
  {
    id: 'red',
    name: 'Crimson Red',
    description: 'Bold and passionate',
    colors: {
      primary: 'bg-red-500',
      secondary: 'bg-red-100',
      accent: 'bg-red-600',
      background: 'bg-red-50'
    },
    preview: 'from-red-400 to-red-600'
  }
];

export function ColorPaletteSelector({ currentPalette, onPaletteChange }: ColorPaletteSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Color Palette</h3>
        <p className="text-muted-foreground text-sm">Choose your preferred color scheme</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colorPalettes.map((palette) => {
          const isSelected = currentPalette === palette.id;
          
          return (
            <Card 
              key={palette.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-0 ring-none ${
                isSelected 
                  ? 'shadow-md ' 
                  : 'hover:shadow-sm border-0'
              }`}
              onClick={() => onPaletteChange(palette.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground text-sm">{palette.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                
                <p className="text-muted-foreground text-xs mb-3">{palette.description}</p>
                
                {/* Color Preview */}
                <div className="space-y-2">
                  <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${palette.preview}`}></div>
                  <div className="flex space-x-1">
                    <div className={`w-4 h-4 rounded-full ${palette.colors.primary}`}></div>
                    <div className={`w-4 h-4 rounded-full ${palette.colors.secondary}`}></div>
                    <div className={`w-4 h-4 rounded-full ${palette.colors.accent}`}></div>
                    <div className={`w-4 h-4 rounded-full ${palette.colors.background}`}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
