import React from 'react';
import { motion } from 'framer-motion';

export function TrainingSVG({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <defs>
        <linearGradient id="trainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="trainGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Dynamic Court Lines Background */}
      <motion.path
        d="M 20 20 L 180 20 M 20 100 L 180 100 M 20 180 L 180 180"
        stroke="rgba(59, 130, 246, 0.2)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.ellipse
        cx="100" cy="100" rx="40" ry="80"
        fill="none"
        stroke="rgba(59, 130, 246, 0.2)"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Central Interactive Icon (Whistle / Clipboard motif) */}
      <motion.rect
        x="70"
        y="50"
        width="60"
        height="80"
        rx="10"
        fill="url(#trainGradDark)"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      />
      <motion.rect
        x="60"
        y="70"
        width="80"
        height="100"
        rx="10"
        fill="url(#trainGrad)"
        filter="url(#glowBlue)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
      />

      {/* Clipboard Lines */}
      <motion.path
        d="M 80 100 L 120 100 M 80 120 L 120 120 M 80 140 L 100 140"
        stroke="#FFF"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />

      {/* Floating Checkmarks / Progress Orbs */}
      <motion.circle cx="150" cy="60" r="10" fill="#34D399"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 1.2 }}
      />
      <motion.path d="M 145 60 L 148 64 L 155 56" stroke="#FFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 1.5 }}
      />
      
      {/* Pulse Rings */}
      <motion.circle cx="100" cy="120" r="40" fill="none" stroke="#2563EB" strokeWidth="2"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
