"use client";

import { ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/components/messages/types';
import { ProfileProvider } from '@/contexts/profile-context';
import { ThemeProvider } from '@/contexts/theme-context';

interface AppProvidersProps {
  children: ReactNode;
  user: User;
  profile: Profile;
}

export function AppProviders({ children, user, profile }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ProfileProvider user={user} initialProfile={profile}>
        {children}
      </ProfileProvider>
    </ThemeProvider>
  );
}
