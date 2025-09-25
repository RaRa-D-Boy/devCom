import * as React from 'react'

import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in Card component, using fallback values');
  }
  
  const getCardBackground = () => {
    if (theme === 'dark') {
      switch (glassEffect) {
        case 'translucent':
          return 'bg-neutral-900/70 backdrop-blur-sm'
        case 'transparent':
          return 'bg-transparent'
        case 'opaque':
          return 'bg-neutral-900'
        default:
          return 'bg-neutral-900/80 backdrop-blur-sm'
      }
    } else {
      switch (glassEffect) {
        case 'translucent':
          return 'bg-white/80 backdrop-blur-sm'
        case 'transparent':
          return 'bg-transparent'
        case 'opaque':
          return 'bg-white'
        default:
          return 'bg-white/80 backdrop-blur-sm'
      }
    }
  }

  return (
    <div
      data-slot="card"
      className={cn(
        'text-card-foreground flex flex-col gap-6 rounded-xl border-none py-6 shadow-sm',
        getCardBackground(),
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
