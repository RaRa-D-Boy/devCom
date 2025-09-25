import * as React from 'react'

import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  // Safe theme hook usage with fallback
  let theme = 'light';
  let glassEffect = 'translucent';
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    // Fallback to default values if theme context is not available
    console.warn('Theme context not available in Input component, using fallback values');
  }
  
  const getInputBackground = () => {
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
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        getInputBackground(),
        className,
      )}
      {...props}
    />
  )
}

export { Input }
