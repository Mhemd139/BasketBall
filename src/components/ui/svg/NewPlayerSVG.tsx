import React from 'react';
import { motion } from 'framer-motion';

export function NewPlayerSVG({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <defs>
        <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="jerseyGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <filter id="glowJersey" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Court lines background */}
      <motion.path
        d="M 20 180 L 180 180 M 50 160 L 150 160"
        stroke="rgba(59, 130, 246, 0.15)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.circle cx="100" cy="180" r="30" fill="none"
        stroke="rgba(59, 130, 246, 0.12)" strokeWidth="2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Jersey body */}
      <motion.path
        d="M 70 75 L 55 85 L 55 160 Q 55 170 65 170 L 135 170 Q 145 170 145 160 L 145 85 L 130 75 L 120 90 Q 100 100 80 90 Z"
        fill="url(#jerseyGrad)"
        filter="url(#glowJersey)"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
      />

      {/* Jersey sleeves */}
      <motion.path
        d="M 70 75 L 40 95 L 45 115 L 55 105 L 55 85"
        fill="url(#jerseyGradDark)"
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
      />
      <motion.path
        d="M 130 75 L 160 95 L 155 115 L 145 105 L 145 85"
        fill="url(#jerseyGradDark)"
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
      />

      {/* Jersey collar */}
      <motion.path
        d="M 80 90 Q 100 100 120 90 Q 115 75 100 70 Q 85 75 80 90"
        fill="url(#jerseyGradDark)"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Jersey number */}
      <motion.text
        x="100" y="140"
        textAnchor="middle"
        fill="white"
        fontSize="36"
        fontWeight="900"
        fontFamily="sans-serif"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.6 }}
      >
        +
      </motion.text>

      {/* Plus badge */}
      <motion.circle cx="150" cy="60" r="14" fill="#22C55E"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5, delay: 0.9 }}
      />
      <motion.path d="M 144 60 L 156 60 M 150 54 L 150 66" stroke="#FFF" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />

      {/* Pulse ring */}
      <motion.circle cx="100" cy="130" r="45" fill="none" stroke="#2563EB" strokeWidth="2"
        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
