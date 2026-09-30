import React from 'react';
import { motion } from 'framer-motion';

/**
 * Layer 5: ForegroundWaves
 * Rolling Bay of Bengal water crests and sea foam in the warm sunrise-to-dusk palette.
 * Swappable layer: replace SVG or mount custom asset from src/assets/scene/waves.svg.
 */
export default function ForegroundWaves({ className = '' }) {
  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none select-none ${className}`}>
      {/* ── BACK WAVE LAYER: Deep Teal Sea Swell ── */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-48 md:h-64"
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 260"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 C240,140 480,40 720,100 C960,160 1200,60 1440,110 L1440,260 L0,260 Z"
            fill="#0D3B43"
          />
          {/* Subtle wave crest highlight */}
          <path
            d="M0,80 C240,140 480,40 720,100 C960,160 1200,60 1440,110"
            stroke="#2A7B88"
            strokeWidth="3"
            opacity="0.6"
          />
        </svg>
      </motion.div>

      {/* ── MID WAVE LAYER: Teal Water with Foam Lines ── */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-36 md:h-48"
        animate={{ x: [24, -24, 24] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,50 C180,10 360,90 600,40 C840,-10 1080,70 1440,30 L1440,200 L0,200 Z"
            fill="#124E5B"
          />
          {/* Foam crest line */}
          <path
            d="M0,50 C180,10 360,90 600,40 C840,-10 1080,70 1440,30"
            stroke="#6DB7BD"
            strokeWidth="4"
            opacity="0.8"
          />
          {/* Surface foam ripples */}
          <path
            d="M200,80 Q 320,65 440,82 M800,75 Q 940,60 1080,78"
            stroke="#FAF5EB"
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="16 12"
          />
        </svg>
      </motion.div>

      {/* ── FRONT WAVE LAYER: Deep Indigo Base Water ── */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-24 md:h-32"
        animate={{ x: [-15, 15, -15] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,35 C300,75 600,10 900,55 C1200,90 1350,30 1440,40 L1440,140 L0,140 Z"
            fill="#050C1A"
          />
          {/* White foam rim */}
          <path
            d="M0,35 C300,75 600,10 900,55 C1200,90 1350,30 1440,40"
            stroke="#FAF5EB"
            strokeWidth="2.5"
            opacity="0.75"
          />
        </svg>
      </motion.div>
    </div>
  );
}
