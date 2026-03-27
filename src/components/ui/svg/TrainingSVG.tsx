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
        <linearGradient id="trainGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="trainGradDark2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
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

      {/* Whistle body */}
      <motion.rect
        x="72" y="65" width="56" height="85" rx="12"
        fill="url(#trainGrad2)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
      />

      {/* Whistle top */}
      <motion.rect
        x="85" y="45" width="30" height="28" rx="6"
        fill="url(#trainGradDark2)"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
      />

      {/* Clipboard lines */}
      <motion.path
        d="M 85 95 L 115 95 M 85 110 L 115 110 M 85 125 L 105 125"
        stroke="#FFF"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      />

      {/* Checkmark badge */}
      <motion.circle cx="140" cy="55" r="12" fill="#22C55E"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 1.0 }}
      />
      <motion.path d="M 135 55 L 138 59 L 145 51" stroke="#FFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 1.3 }}
      />

      {/* Pulse ring */}
      <motion.circle cx="100" cy="110" r="40" fill="none" stroke="#2563EB" strokeWidth="2"
        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
