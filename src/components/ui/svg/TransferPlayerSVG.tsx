import React from 'react';
import { motion } from 'framer-motion';

export function TransferPlayerSVG({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <defs>
        <linearGradient id="transferGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="transferGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
        <filter id="glowTransfer" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Dashed circle path */}
      <motion.circle cx="100" cy="110" r="60" fill="none"
        stroke="rgba(34, 197, 94, 0.25)" strokeWidth="3" strokeDasharray="8 6"
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: 1, rotate: 360 }}
        transition={{ opacity: { duration: 0.5 }, rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
      />

      {/* Left jersey (source) */}
      <motion.path
        d="M 45 90 L 35 98 L 35 145 Q 35 150 40 150 L 75 150 Q 80 150 80 145 L 80 98 L 70 90 L 65 98 Q 57 103 50 98 Z"
        fill="url(#transferGradDark)"
        opacity={0.5}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 0.5 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      />
      <motion.text x="57" y="130" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif" opacity={0.7}
        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.3 }}>
        7
      </motion.text>

      {/* Right jersey (destination) */}
      <motion.path
        d="M 120 80 L 108 89 L 108 140 Q 108 147 115 147 L 155 147 Q 162 147 162 140 L 162 89 L 150 80 L 144 89 Q 135 95 126 89 Z"
        fill="url(#transferGrad)"
        filter="url(#glowTransfer)"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 }}
      />
      <motion.text x="135" y="125" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="sans-serif"
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
        7
      </motion.text>

      {/* Transfer arrow */}
      <motion.path
        d="M 78 105 L 108 105"
        stroke="#22C55E" strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      />
      <motion.path
        d="M 100 98 L 108 105 L 100 112"
        stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />

      {/* Success badge */}
      <motion.circle cx="155" cy="68" r="12" fill="#22C55E"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5, delay: 1.2 }}
      />
      <motion.path d="M 150 68 L 153 72 L 160 64" stroke="#FFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 1.5 }}
      />

      {/* Pulse */}
      <motion.circle cx="100" cy="110" r="35" fill="none" stroke="#22C55E" strokeWidth="2"
        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
