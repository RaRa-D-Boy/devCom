'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in TabsList component, using fallback values');
  }
  
  const getTabsListBackground = () => {
    if (theme === 'dark') {
      switch (glassEffect) {
        case 'translucent':
          return 'bg-neutral-800/70 backdrop-blur-sm'
        case 'transparent':
          return 'bg-transparent'
        case 'opaque':
          return 'bg-neutral-800'
        default:
          return 'bg-neutral-800/70 backdrop-blur-sm'
      }
    } else {
      switch (glassEffect) {
        case 'translucent':
          return 'bg-gray-100/80 backdrop-blur-sm'
        case 'transparent':
          return 'bg-transparent'
        case 'opaque':
          return 'bg-gray-100'
        default:
          return 'bg-gray-100/80 backdrop-blur-sm'
      }
    }
  }

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        getTabsListBackground(),
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in TabsTrigger component, using fallback values');
  }
  
  const getTabsTriggerStyles = () => {
    if (theme === 'dark') {
      switch (glassEffect) {
        case 'translucent':
          return 'data-[state=active]:bg-neutral-700/80 data-[state=active]:backdrop-blur-sm'
        case 'transparent':
          return 'data-[state=active]:bg-neutral-700/50'
        case 'opaque':
          return 'data-[state=active]:bg-neutral-700'
        default:
          return 'data-[state=active]:bg-neutral-700/80 data-[state=active]:backdrop-blur-sm'
      }
    } else {
      switch (glassEffect) {
        case 'translucent':
          return 'data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm'
        case 'transparent':
          return 'data-[state=active]:bg-white/50'
        case 'opaque':
          return 'data-[state=active]:bg-white'
        default:
          return 'data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm'
      }
    }
  }

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm data-[state=active]:text-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        getTabsTriggerStyles(),
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
