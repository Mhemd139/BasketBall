import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'orange' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      default: '',
      lg: 'px-8 py-4 text-lg',
    }
    
    const variantClasses = {
      primary: 'bg-gradient-to-b from-electric to-blue-600 text-white shadow-lg shadow-electric/20 hover:shadow-electric/40 ring-1 ring-white/20 ring-inset active:scale-[0.97] transition-all duration-300',
      secondary: 'bg-gradient-to-b from-royal to-navy-800 text-white shadow-md shadow-royal/20 hover:shadow-royal/40 ring-1 ring-white/10 ring-inset active:scale-[0.97] transition-all duration-300',
      orange: 'bg-gradient-to-b from-neon to-orange-600 text-white shadow-lg shadow-neon/20 hover:shadow-neon/40 ring-1 ring-white/20 ring-inset active:scale-[0.97] transition-all duration-300',
      ghost: 'hover:bg-royal/5 text-royal font-bold active:scale-[0.97] transition-all duration-200',
      outline: 'border-2 border-royal/10 bg-transparent text-royal hover:border-royal/30 font-bold active:scale-[0.97] transition-all duration-200',
    }

    return (
      <button
        className={cn('btn', variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
