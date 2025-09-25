"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Eye, EyeOff, Layers } from "lucide-react";

interface GlassEffectSelectorProps {
  currentEffect: 'translucent' | 'transparent' | 'opaque';
  onEffectChange: (effect: 'translucent' | 'transparent' | 'opaque') => void;
}

const glassEffects = [
  {
    id: 'translucent' as const,
    name: 'Translucent',
    description: 'Semi-transparent with blur',
    icon: Eye,
    preview: 'bg-white/30 backdrop-blur-md border-white/20',
    opacity: '30%'
  },
  {
    id: 'transparent' as const,
    name: 'Transparent',
    description: 'Fully see-through',
    icon: EyeOff,
    preview: 'bg-white/10 backdrop-blur-sm border-white/10',
    opacity: '10%'
  },
  {
    id: 'opaque' as const,
    name: 'Opaque',
    description: 'Solid background',
    icon: Layers,
    preview: 'bg-white/90 backdrop-blur-none border-gray-200',
    opacity: '90%'
  }
];

export function GlassEffectSelector({ currentEffect, onEffectChange }: GlassEffectSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Glass Effect</h3>
        <p className="text-muted-foreground text-sm">Choose the transparency level for interface elements</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {glassEffects.map((effect) => {
          const Icon = effect.icon;
          const isSelected = currentEffect === effect.id;
          
          return (
            <Card 
              key={effect.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-none ${
                isSelected 
                  ? ' shadow-md' 
                  : 'hover:shadow-sm'
              }`}
              onClick={() => onEffectChange(effect.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{effect.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm mb-3">{effect.description}</p>
                
                {/* Glass Effect Preview */}
                <div className="relative">
                  {/* Background pattern */}
                  <div className="w-full h-20 rounded-lg bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="text-white text-xs font-medium">Background</div>
                  </div>
                  
                  {/* Glass effect overlay */}
                  <div className={`absolute inset-2 rounded-lg border ${effect.preview} flex items-center justify-center`}>
                    <div className="text-black text-xs font-medium">Glass Effect</div>
                  </div>
                  
                  {/* Opacity indicator */}
                  <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {effect.opacity}
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
