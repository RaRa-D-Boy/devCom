"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon, Monitor, Check } from "lucide-react";

interface ThemeSelectorProps {
  currentTheme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
}

const themes = [
  {
    id: 'light' as const,
    name: 'Light',
    description: 'Clean and bright interface',
    icon: Sun,
    preview: 'bg-white text-black border-gray-200'
  },
  {
    id: 'dark' as const,
    name: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
    preview: 'bg-gray-900 text-white border-gray-700'
  },
  {
    id: 'auto' as const,
    name: 'Auto',
    description: 'Follows system preference',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-white to-gray-900 text-black border-gray-400'
  }
];

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Theme</h3>
        <p className="text-muted-foreground text-sm">Choose your preferred theme</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = currentTheme === theme.id;
          
          return (
            <Card 
              key={theme.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-0 ${
                isSelected 
                  ? 'ring-none shadow-md' 
                  : 'hover:shadow-sm'
              }`}
              onClick={() => onThemeChange(theme.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{theme.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm mb-3">{theme.description}</p>
                
                {/* Theme Preview */}
                <div className={`w-full h-16 rounded-lg border-2 ${theme.preview} flex items-center justify-center`}>
                  <div className="w-8 h-8 rounded-full bg-gray-400"></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
