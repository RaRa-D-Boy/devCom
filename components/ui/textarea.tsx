import * as React from 'react'

import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in Textarea component, using fallback values');
  }
  
  const getTextareaBackground = () => {
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
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        getTextareaBackground(),
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
