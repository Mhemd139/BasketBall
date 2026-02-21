import React from 'react';
import { motion } from 'framer-motion';

export function GameSVG({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <defs>
        <linearGradient id="gameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="gameGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C86432" />
          <stop offset="100%" stopColor="#7A3318" />
        </linearGradient>
        <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Ring */}
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        fill="none"
        stroke="url(#gameGradDark)"
        strokeWidth="4"
        strokeDasharray="10 10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      />

      {/* Dynamic Geometric Shield/Trophy */}
      <motion.path
        d="M 50 60 L 150 60 L 130 150 L 100 180 L 70 150 Z"
        fill="url(#gameGrad)"
        filter="url(#glowGold)"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      />
      
      {/* Inner Elements - The "Clash" */}
      <motion.path
        d="M 60 70 L 140 70 M 70 100 L 130 100 M 80 130 L 120 130"
        stroke="#FFF"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      />
      
      {/* Sparkles / Energy */}
      <motion.circle cx="100" cy="40" r="6" fill="#FFF"
        animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle cx="150" cy="100" r="4" fill="#FFF"
        animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle cx="50" cy="100" r="4" fill="#FFF"
        animate={{ x: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.2 }}
      />
    </motion.svg>
  );
}
