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
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      orange: 'btn-orange',
      ghost: 'btn-secondary border-transparent hover:border-transparent hover:bg-gray-100',
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
