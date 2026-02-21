'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const BouncingBasketballLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] gap-8">
      {/* 3D-ish Basketball SVG */}
      <motion.div
        animate={{
          y: [0, -80, 0], // Bounce up and down
          rotate: [0, 180, 360], // Spin continuously
        }}
        transition={{
          y: {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeOut",
            repeatType: "reverse"
          },
          rotate: {
            duration: 2.4, // Slower spin
            repeat: Infinity,
            ease: "linear"
          }
        }}
        className="relative w-16 h-16 drop-shadow-2xl z-10"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base ball */}
          <circle cx="50" cy="50" r="48" fill="url(#ballGradient)" stroke="#C2410C" strokeWidth="2" />
          
          {/* Inner shadow/highlight for 3D effect */}
          <circle cx="50" cy="50" r="48" fill="url(#ballHighlight)" />

          {/* Lines */}
          <path d="M50 2 V98" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
          <path d="M2 50 H98" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
          <path d="M25 10 C45 35 45 65 25 90" stroke="#7C2D12" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M75 10 C55 35 55 65 75 90" stroke="#7C2D12" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Gradients */}
          <defs>
            <radialGradient id="ballGradient" cx="0.4" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="70%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9A3412" />
            </radialGradient>
            <radialGradient id="ballHighlight" cx="0.3" cy="0.3" r="0.4">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Shadow */}
      <motion.div
        animate={{
          scale: [1, 0.4, 1], // Shrink when ball goes up
          opacity: [0.6, 0.1, 0.6], // Fade when ball goes up
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeOut",
          repeatType: "reverse"
        }}
        className="w-12 h-3 bg-black/40 rounded-[100%] blur-[2px]"
      />
    </div>
  );
};
