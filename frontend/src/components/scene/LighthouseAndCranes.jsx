import React from 'react';

/**
 * Layer 3: LighthouseAndCranes
 * East Coast India port infrastructure:
 * - Left: Paradip / Vizag port bulk gantry cranes & coal conveyors
 * - Right: Coastal lighthouse with flashing amber/coral beacon on rocky promontory
 * Swappable layer: replace SVG or mount custom asset from src/assets/scene/harbor.svg.
 */
export default function LighthouseAndCranes({ className = '' }) {
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
          {/* Lighthouse beam gradient */}
          <radialGradient id="beaconGlow" cx="0%" cy="50%" r="90%">
            <stop offset="0%" stopColor="#FFF2D6" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#F4A261" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F4A261" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── LEFT: PORT BULK CRANES & TERMINAL (Paradip / Haldia style) ── */}
        <g opacity="0.85" transform="translate(60, 500)">
          {/* Jetty / Breakwater foundation */}
          <path d="M-60 180 L280 180 L260 210 L-60 210 Z" fill="#0C1D2A" />

          {/* Crane 1 - High Gantry Bulk Loader */}
          <g transform="translate(20, 0)">
            {/* Legs A-frame */}
            <path d="M10 180 L40 60 L70 180 M25 120 L55 120" stroke="#E07A5F" strokeWidth="4" />
            {/* Cab */}
            <rect x="30" y="45" width="28" height="20" fill="#E8DFC8" rx="2" />
            {/* Horizontal boom & jibs */}
            <path d="M-10 50 L140 50 M140 50 L45 10 M-10 50 L45 10" stroke="#F4A261" strokeWidth="3" />
            {/* Hoist cable & bulk grab bucket */}
            <line x1="100" y1="50" x2="100" y2="120" stroke="#D4C3A3" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="94" y="120" width="12" height="12" fill="#E07A5F" />
          </g>

          {/* Crane 2 - Mid Crane */}
          <g transform="translate(130, 25)">
            <path d="M10 155 L35 50 L60 155 M22 100 L48 100" stroke="#E07A5F" strokeWidth="3.5" />
            <rect x="26" y="38" width="22" height="16" fill="#FAF5EB" rx="2" />
            <path d="M-5 42 L110 42 M110 42 L40 8 M-5 42 L40 8" stroke="#F4A261" strokeWidth="2.5" />
            <line x1="85" y1="42" x2="85" y2="95" stroke="#D4C3A3" strokeWidth="1.5" />
          </g>

          {/* Terminal Silos / Storage Sheds */}
          <rect x="200" y="130" width="45" height="50" fill="#173445" rx="3" />
          <rect x="250" y="115" width="55" height="65" fill="#122736" rx="3" />
        </g>

        {/* ── RIGHT: LIGHTHOUSE ON ROCKY CAPE (Dolphin's Nose / False Point) ── */}
        <g transform="translate(1160, 480)">
          {/* Rocky cliff base */}
          <path
            d="M20 230 L80 160 L140 170 L210 145 L280 230 Z"
            fill="#091A26"
          />

          {/* Lighthouse Tower: red and white bands */}
          <g transform="translate(140, 50)">
            {/* Tapered tower body */}
            <path d="M12 110 L20 15 L40 15 L48 110 Z" fill="#FAF5EB" />
            {/* Red bands */}
            <path d="M15 85 L18 60 L42 60 L45 85 Z" fill="#E07A5F" />
            <path d="M19 40 L21 20 L39 20 L41 40 Z" fill="#E07A5F" />
            {/* Gallery deck */}
            <rect x="14" y="10" width="32" height="5" fill="#0C1D2A" rx="1" />
            {/* Lantern room */}
            <rect x="18" y="-4" width="24" height="14" fill="#F4A261" rx="2" />
            {/* Dome roof */}
            <path d="M18 -4 Q 30 -16 42 -4 Z" fill="#E07A5F" />

            {/* Glowing Lantern Beacon Beam sweeping left over the waters */}
            <polygon
              points="18,3 -450,-120 -430,90 18,7"
              fill="url(#beaconGlow)"
              opacity="0.65"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
