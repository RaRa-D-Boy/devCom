"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/components/messages/types';
import { createClient } from '@/lib/supabase/client';

interface ProfileContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  refreshProfile: () => Promise<void>;
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
  user: User;
  initialProfile: Profile;
}

export function ProfileProvider({ children, user, initialProfile }: ProfileProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const supabase = createClient();

  // Set initial background image
  useEffect(() => {
    if (profile?.cover_image_url) {
      setBackgroundImage(profile.cover_image_url);
    } else {
      // Use default pattern if no cover image
      setBackgroundImage('/pattern.jpg');
    }
  }, [profile?.cover_image_url]);

  const updateProfile = (updates: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const value: ProfileContextType = {
    profile,
    setProfile,
    updateProfile,
    refreshProfile,
    backgroundImage,
    setBackgroundImage,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
