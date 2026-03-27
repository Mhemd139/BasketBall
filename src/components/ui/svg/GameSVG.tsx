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
        <linearGradient id="gameGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="gameGradDark2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>
      </defs>

      {/* Court lines background */}
      <motion.path
        d="M 20 180 L 180 180 M 50 160 L 150 160"
        stroke="rgba(249, 115, 22, 0.15)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.circle cx="100" cy="180" r="30" fill="none"
        stroke="rgba(249, 115, 22, 0.12)" strokeWidth="2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Trophy cup */}
      <motion.path
        d="M 65 65 L 135 65 L 125 130 Q 100 150 75 130 Z"
        fill="url(#gameGrad2)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
      />

      {/* Trophy handles */}
      <motion.path
        d="M 65 75 Q 40 75 40 95 Q 40 115 65 110"
        fill="none" stroke="url(#gameGradDark2)" strokeWidth="6" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        d="M 135 75 Q 160 75 160 95 Q 160 115 135 110"
        fill="none" stroke="url(#gameGradDark2)" strokeWidth="6" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />

      {/* Trophy base */}
      <motion.rect
        x="85" y="150" width="30" height="8" rx="4"
        fill="url(#gameGradDark2)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
      <motion.rect
        x="78" y="158" width="44" height="8" rx="4"
        fill="url(#gameGradDark2)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />

      {/* Star on trophy */}
      <motion.path
        d="M 100 85 L 104 97 L 117 97 L 107 105 L 110 117 L 100 110 L 90 117 L 93 105 L 83 97 L 96 97 Z"
        fill="#FFF"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.7 }}
        style={{ transformOrigin: "100px 100px" }}
      />

      {/* Winner badge */}
      <motion.circle cx="150" cy="55" r="12" fill="#FBBF24"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 1.0 }}
      />
      <motion.text x="150" y="60" textAnchor="middle" fill="#FFF" fontSize="14" fontWeight="900" fontFamily="sans-serif"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      >
        1
      </motion.text>

      {/* Pulse ring */}
      <motion.circle cx="100" cy="110" r="45" fill="none" stroke="#F97316" strokeWidth="2"
        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
