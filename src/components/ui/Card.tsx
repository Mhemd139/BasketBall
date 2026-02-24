import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  variant?: 'default' | 'feature';
  color?: 'orange' | 'purple' | 'green' | 'blue';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, variant = 'default', color, children, ...props }, ref) => {
    const baseClasses = [
      'relative overflow-hidden rounded-3xl transition-all duration-300',
      'bg-[#1C2541]/40 backdrop-blur-2xl border border-white/5 shadow-xl' // Blue/Gold Pro Max Minimalist Base
    ];
    
    if (variant === 'feature') {
      baseClasses.push('bg-gradient-to-br from-royal to-navy-900 border-royal/50 shadow-float text-white');
    }
    
    if (interactive) {
      baseClasses.push('cursor-pointer hover:shadow-card hover:-translate-y-1 active:scale-[0.98]');
    }
    
    if (color === 'orange') baseClasses.push('ring-1 ring-neon/20 shadow-neon/5');
    if (color === 'purple') baseClasses.push('ring-1 ring-electric/20 shadow-electric/5');
    if (color === 'green') baseClasses.push('ring-1 ring-emerald-500/20 shadow-emerald-500/5');
    if (color === 'blue') baseClasses.push('ring-1 ring-blue-500/20 shadow-blue-500/5');
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses.join(' '), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-syncopate font-bold text-royal tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm font-outfit font-medium text-royal/60', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
