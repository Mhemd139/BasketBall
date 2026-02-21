'use client';
import { motion } from 'framer-motion';
import React from 'react';
import { ProfileHeaderSVG } from '@/components/ui/svg/ProfileHeaderSVG';

interface AnimatedMeshBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  suppressHydrationWarning?: boolean;
}

export function AnimatedMeshBackground({ children, className = '', suppressHydrationWarning }: AnimatedMeshBackgroundProps) {
  return (
    <div className={`relative overflow-hidden min-h-screen ${className}`} suppressHydrationWarning={suppressHydrationWarning}>
      {/* Premium Nano Banana SVG Background Applied Globally */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ProfileHeaderSVG className="w-full h-full opacity-90" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
