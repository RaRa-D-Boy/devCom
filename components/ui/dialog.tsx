'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in DialogContent component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';
  
  const getDialogBackground = () => {
    if (theme === 'dark') {
      switch (glassEffect) {
        case 'translucent':
          return 'bg-neutral-900/90 backdrop-blur-xl border-neutral-700/50'
        case 'transparent':
          return 'bg-neutral-900/70 backdrop-blur-lg border-neutral-700/30'
        case 'opaque':
          return 'bg-neutral-900 border-neutral-700'
        default:
          return 'bg-neutral-900/90 backdrop-blur-xl border-neutral-700/50'
      }
    } else {
      switch (glassEffect) {
        case 'translucent':
          return 'bg-white/90 backdrop-blur-xl border-white/50'
        case 'transparent':
          return 'bg-white/70 backdrop-blur-lg border-white/30'
        case 'opaque':
          return 'bg-white border-gray-200'
        default:
          return 'bg-white/90 backdrop-blur-xl border-white/50'
      }
    }
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          getDialogBackground(),
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={`ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 ${
              isDarkTheme 
                ? 'text-white hover:bg-gray-700/50' 
                : 'text-black hover:bg-gray-100/50'
            }`}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available in DialogTitle component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';
  
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-lg leading-none font-semibold',
        isDarkTheme ? 'text-white' : 'text-black',
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available in DialogDescription component, using fallback values');
  }
  
  const isDarkTheme = theme === 'dark';
  
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm',
        isDarkTheme ? 'text-gray-300' : 'text-gray-600',
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
