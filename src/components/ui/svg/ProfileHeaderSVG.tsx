import React from 'react';
import { motion } from 'framer-motion';

export function ProfileHeaderSVG({ className = '' }: { className?: string }) {
  // Nano Banana Style Generative SVG - Complex Tech/Organic Hybrid
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1000 400" 
      preserveAspectRatio="xMidYMid slice" 
      className={className}
    >
      <defs>
        {/* Deep Field Void */}
        <linearGradient id="deepVoid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="50%" stopColor="#1C2541" />
          <stop offset="100%" stopColor="#050B14" />
        </linearGradient>

        <radialGradient id="neonPulse1" cx="30%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3A506B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
        </radialGradient>
        
        <radialGradient id="neonPulse2" cx="80%" cy="70%" r="50%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="electricCore" cx="60%" cy="20%" r="40%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#050B14" stopOpacity="0" />
        </radialGradient>

        {/* Nano Mesh overlay */}
        <pattern id="nanoMesh" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(59, 130, 246, 0.15)" />
          <circle cx="7" cy="7" r="1" fill="rgba(249, 115, 22, 0.1)" />
        </pattern>

        <filter id="hyperGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Base Canvas */}
      <rect width="100%" height="100%" fill="url(#deepVoid)" />
      
      {/* Animated Atmosphere */}
      <motion.rect 
        width="100%" height="100%" fill="url(#neonPulse1)" 
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: 'center' }}
      />
      <motion.rect 
        width="100%" height="100%" fill="url(#electricCore)" 
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ transformOrigin: 'top right' }}
      />
      <motion.rect 
        width="100%" height="100%" fill="url(#neonPulse2)" 
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Nano Banana Data Streams */}
      <motion.path
        d="M -100 200 Q 250 50 500 250 T 1100 150"
        fill="none" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, strokeOpacity: [0.1, 0.8, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        filter="url(#hyperGlow)"
      />
      <motion.path
        d="M -100 250 Q 300 350 600 150 T 1100 280"
        fill="none" stroke="#F97316" strokeWidth="1" strokeOpacity="0.3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, strokeOpacity: [0.1, 0.5, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear", delay: 3 }}
      />
      
      {/* Geometric Tech Interfaces */}
      <g stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none">
        <motion.circle cx="850" cy="100" r="150" strokeDasharray="4 8"
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '850px 100px' }}
        />
        <motion.circle cx="850" cy="100" r="100" strokeDasharray="1 10" strokeWidth="3" stroke="rgba(59,130,246,0.2)"
          animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '850px 100px' }}
        />
        <rect x="50" y="50" width="40" height="40" stroke="rgba(255,255,255,0.1)" />
        <rect x="60" y="60" width="20" height="20" fill="rgba(249,115,22,0.2)" />
        <path d="M 50 50 L 30 30 M 90 90 L 110 110" />
      </g>

      {/* Nano Mesh Overlay for Premium Grain */}
      <rect width="100%" height="100%" fill="url(#nanoMesh)" style={{ mixBlendMode: 'overlay' }} />

      {/* Foreground Abstract Geometric Block */}
      <motion.path
        d="M 200 400 L 250 250 L 400 200 L 550 350 Z"
        fill="rgba(255, 255, 255, 0.02)"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth="2"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ backdropFilter: 'blur(10px)' }}
      />
    </svg>
  );
}
