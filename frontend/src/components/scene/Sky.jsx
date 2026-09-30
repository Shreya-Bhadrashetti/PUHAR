import React from 'react';

/**
 * Layer 1: Sky
 * Warm sunrise-to-dusk Bay of Bengal sky with soft glowing sun disc and coastal atmospheric haze.
 * Swappable layer: replace SVG or mount custom asset from src/assets/scene/sky.svg.
 */
export default function Sky({ className = '' }) {
  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dawn-to-dusk sky gradient: deep indigo at top, warm amber/coral at horizon */}
          <linearGradient id="skyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#081426" />
            <stop offset="35%" stopColor="#122B47" />
            <stop offset="65%" stopColor="#2A4860" />
            <stop offset="82%" stopColor="#8A5A55" />
            <stop offset="93%" stopColor="#D47A5A" />
            <stop offset="100%" stopColor="#F4A261" />
          </linearGradient>

          {/* Sun atmospheric glow */}
          <radialGradient id="sunGlow" cx="68%" cy="72%" r="28%">
            <stop offset="0%" stopColor="#FFF2D6" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#F4A261" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#E07A5F" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E07A5F" stopOpacity="0" />
          </radialGradient>

          {/* Warm maritime mist */}
          <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4A261" stopOpacity="0" />
            <stop offset="100%" stopColor="#F4A261" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {/* Sky backdrop */}
        <rect width="1440" height="900" fill="url(#skyGrad)" />

        {/* Atmospheric Sun Disc */}
        <circle cx="980" cy="620" r="160" fill="url(#sunGlow)" />
        <circle cx="980" cy="620" r="48" fill="#FFF8E7" opacity="0.9" />

        {/* Drifting coastal cloud silhouettes */}
        <path
          d="M120 280 Q 220 250 360 270 T 600 260 T 780 290 L 780 320 L 120 320 Z"
          fill="#354E66"
          fillOpacity="0.22"
        />
        <path
          d="M820 330 Q 940 300 1100 320 T 1380 310 L 1380 360 L 820 360 Z"
          fill="#4A5868"
          fillOpacity="0.2"
        />

        {/* Horizon mist band */}
        <rect y="640" width="1440" height="120" fill="url(#mistGrad)" />
      </svg>
    </div>
  );
}
