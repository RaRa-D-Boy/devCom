"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "./theme-selector";
import { ColorPaletteSelector } from "./color-palette-selector";
import { GlassEffectSelector } from "./glass-effect-selector";
import { LanguageSelector } from "./language-selector";
import { useTheme } from "@/contexts/theme-context";
import { Palette, Save, RotateCcw } from "lucide-react";

export function AppearanceSettings() {
  const { 
    theme, 
    colorPalette, 
    glassEffect, 
    language,
    setTheme, 
    setColorPalette, 
    setGlassEffect, 
    setLanguage,
    saveSettings,
    isLoading
  } = useTheme();

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTheme('light');
    setColorPalette('blue');
    setGlassEffect('translucent');
    setLanguage('en');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Appearance</h2>
            <p className="text-muted-foreground">Customize your interface look and feel</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-border hover:bg-accent text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving || isLoading ? "Saving..." : saved ? "Saved!" : "Save Appearance"}
          </Button>
        </div>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSelector 
            currentTheme={theme} 
            onThemeChange={setTheme} 
          />
        </CardContent>
      </Card>

      {/* Color Palette Settings */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <ColorPaletteSelector 
            currentPalette={colorPalette} 
            onPaletteChange={(palette: string) => setColorPalette(palette as any)} 
          />
        </CardContent>
      </Card>

      {/* Glass Effect Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Glass Effects</CardTitle>
        </CardHeader>
        <CardContent>
          <GlassEffectSelector 
            currentEffect={glassEffect} 
            onEffectChange={setGlassEffect} 
          />
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSelector 
            currentLanguage={language} 
            onLanguageChange={setLanguage} 
          />
        </CardContent>
      </Card>

      {/* Preview Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Preview how your settings will look in the application
            </p>
            
         
            <div className="relative p-6 rounded-lg bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
              <div className={`rounded-lg border p-4 ${
                theme === 'dark' 
                  ? (glassEffect === 'translucent' 
                      ? 'bg-neutral-900/80 backdrop-blur-sm border-neutral-700' 
                      : glassEffect === 'transparent' 
                        ? 'bg-transparent border-neutral-600' 
                        : 'bg-neutral-900 border-neutral-700')
                  : (glassEffect === 'translucent' 
                      ? 'bg-white/80 backdrop-blur-sm border-gray-200' 
                      : glassEffect === 'transparent' 
                        ? 'bg-transparent border-gray-300' 
                        : 'bg-white border-gray-200')
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-400"></div>
                  <div>
                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Preview User</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Online</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className={`h-3 rounded ${
                    colorPalette === 'blue' ? 'bg-blue-500' :
                    colorPalette === 'purple' ? 'bg-purple-500' :
                    colorPalette === 'green' ? 'bg-green-500' :
                    colorPalette === 'orange' ? 'bg-orange-500' :
                    colorPalette === 'pink' ? 'bg-pink-500' :
                    colorPalette === 'indigo' ? 'bg-indigo-500' :
                    colorPalette === 'teal' ? 'bg-teal-500' :
                    'bg-red-500'
                  }`}></div>
                  <div className={`h-2 rounded w-3/4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  <div className={`h-2 rounded w-1/2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
