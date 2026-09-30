import React from 'react';

/**
 * Layer 2: DistantHills
 * Eastern Ghats coastal hills undulating along the Bay of Bengal coastline.
 * Swappable layer: replace SVG or mount custom asset from src/assets/scene/hills.svg.
 */
export default function DistantHills({ className = '' }) {
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
          <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#253E52" />
            <stop offset="100%" stopColor="#152636" />
          </linearGradient>

          <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1C4B56" />
            <stop offset="100%" stopColor="#0B2A32" />
          </linearGradient>
        </defs>

        {/* Far Ridge: Simhachalam & Eastern Ghats bluffs */}
        <path
          d="M0 640 Q 180 570 380 610 T 780 580 T 1140 600 Q 1320 570 1440 620 L 1440 760 L 0 760 Z"
          fill="url(#hillFar)"
          opacity="0.85"
        />

        {/* Near Coastline Headland: Dolphin's Nose Vizag / Gopalpur Bluff */}
        <path
          d="M0 680 Q 220 630 460 670 T 920 650 Q 1180 620 1440 660 L 1440 800 L 0 800 Z"
          fill="url(#hillNear)"
          opacity="0.95"
        />

        {/* Subtle coastline shoreline sandbar */}
        <path
          d="M0 720 Q 350 710 700 725 T 1440 720 L 1440 750 L 0 750 Z"
          fill="#D4C3A3"
          opacity="0.18"
        />
      </svg>
    </div>
  );
}
