import React from 'react'

interface AnimatedMeshBackgroundProps {
  children?: React.ReactNode
  className?: string
  suppressHydrationWarning?: boolean
}

export function AnimatedMeshBackground({ children, className = '', suppressHydrationWarning }: AnimatedMeshBackgroundProps) {
  return (
    <div className={`relative overflow-x-hidden min-h-screen ${className}`} suppressHydrationWarning={suppressHydrationWarning}>
      {/* Static CSS gradient background — replaces heavy animated SVG */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-mesh-dark" />

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
