"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Theme = 'light' | 'dark' | 'auto';
export type ColorPalette = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'indigo' | 'teal' | 'red';
export type GlassEffect = 'translucent' | 'transparent' | 'opaque';

interface ThemeContextType {
  theme: Theme;
  colorPalette: ColorPalette;
  glassEffect: GlassEffect;
  language: string;
  setTheme: (theme: Theme) => void;
  setColorPalette: (palette: ColorPalette) => void;
  setGlassEffect: (effect: GlassEffect) => void;
  setLanguage: (language: string) => void;
  applyTheme: () => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [colorPalette, setColorPalette] = useState<ColorPalette>('blue');
  const [glassEffect, setGlassEffect] = useState<GlassEffect>('translucent');
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Load settings from database on mount
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('appearance_settings')
          .select('theme, color_palette, glass_effect, language')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setTheme(data.theme);
          setColorPalette(data.color_palette);
          setGlassEffect(data.glass_effect);
          setLanguage(data.language);
        }
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
      // Fallback to localStorage
      const savedTheme = localStorage.getItem('theme') as Theme;
      const savedPalette = localStorage.getItem('colorPalette') as ColorPalette;
      const savedGlassEffect = localStorage.getItem('glassEffect') as GlassEffect;
      const savedLanguage = localStorage.getItem('language');

      if (savedTheme) setTheme(savedTheme);
      if (savedPalette) setColorPalette(savedPalette);
      if (savedGlassEffect) setGlassEffect(savedGlassEffect);
      if (savedLanguage) setLanguage(savedLanguage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings to database
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase.rpc('upsert_user_appearance_settings', {
          user_uuid: user.id,
          new_theme: theme,
          new_color_palette: colorPalette,
          new_glass_effect: glassEffect,
          new_language: language
        });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save theme preferences to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('colorPalette', colorPalette);
  }, [colorPalette]);

  useEffect(() => {
    localStorage.setItem('glassEffect', glassEffect);
  }, [glassEffect]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Apply theme to document
  const applyTheme = () => {
    const root = document.documentElement;
    
    // Apply theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto theme - follow system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply color palette
    root.setAttribute('data-color-palette', colorPalette);

    // Apply glass effect
    root.setAttribute('data-glass-effect', glassEffect);

    // Apply language
    root.setAttribute('lang', language);
  };

  // Apply theme when it changes
  useEffect(() => {
    applyTheme();
  }, [theme, colorPalette, glassEffect, language]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    colorPalette,
    glassEffect,
    language,
    setTheme,
    setColorPalette,
    setGlassEffect,
    setLanguage,
    applyTheme,
    saveSettings,
    loadSettings,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
