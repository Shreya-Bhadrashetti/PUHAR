import React from 'react';
import { motion } from 'framer-motion';

/**
 * Layer 4: BulkCarrierShip
 * Loaded bulk carrier sailing mid-frame across the Bay of Bengal with natural buoyancy.
 * Includes detailed vector hull, deck cranes, cargo hatch covers, and water wake.
 * Swappable layer: replace SVG or mount custom asset from src/assets/scene/ship.svg.
 */
export default function BulkCarrierShip({ className = '', style = {}, useSailingVessel = false }) {
  return (
    <div
      className={`relative w-full flex items-center justify-center pointer-events-none select-none ${className}`}
      style={style}
    >
      {/* Wave buoyancy idle bobbing animation */}
      <motion.div
        animate={{
          y: [0, -14, 4, -10, 0],
          rotate: [-1.2, 1.8, -0.8, 1.2, -1.2],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative flex items-center justify-center"
      >
        {useSailingVessel ? (
          /* The 1st Yacht Cutout Asset from motion.mp4 */
          <div className="relative">
            <img
              src="/yacht_clean.png"
              alt="PUHAR Voyage Vessel"
              className="w-72 sm:w-96 md:w-[480px] lg:w-[560px] h-auto object-contain filter drop-shadow-[0_25px_35px_rgba(5,12,26,0.8)]"
              draggable={false}
            />
            {/* Waterline foam */}
            <div
              className="absolute -bottom-2 left-6 right-10 h-6 rounded-full opacity-70"
              style={{
                background: 'radial-gradient(ellipse, #FAF5EB 0%, #6DB7BD 50%, transparent 80%)',
                filter: 'blur(3px)',
              }}
            />
          </div>
        ) : (
          /* Hand-Crafted Loaded Bulk Carrier (Voyage Theme) */
          <svg
            className="w-[340px] sm:w-[520px] md:w-[720px] lg:w-[860px] h-auto overflow-visible"
            viewBox="0 0 860 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Hull red anti-fouling paint below waterline */}
              <linearGradient id="hullLower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C84B31" />
                <stop offset="100%" stopColor="#8A2818" />
              </linearGradient>

              {/* Hull black / deep indigo topsides */}
              <linearGradient id="hullTopsides" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E334D" />
                <stop offset="100%" stopColor="#0B1626" />
              </linearGradient>

              {/* Superstructure bridge */}
              <linearGradient id="bridgeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FAF5EB" />
                <stop offset="100%" stopColor="#D4C3A3" />
              </linearGradient>

              {/* Wake foam */}
              <linearGradient id="wakeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6DB7BD" stopOpacity="0" />
                <stop offset="40%" stopColor="#FAF5EB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6DB7BD" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* ── BOW WATER WAKE & SPRAY ── */}
            <ellipse cx="780" cy="272" rx="45" ry="10" fill="url(#wakeGrad)" />
            <path
              d="M740 268 Q 800 270 850 282 Q 790 280 730 276 Z"
              fill="#FAF5EB"
              opacity="0.7"
            />

            {/* ── STERN PROPELLER WASH ── */}
            <ellipse cx="110" cy="275" rx="70" ry="12" fill="url(#wakeGrad)" />

            {/* ── HULL: BULK CARRIER (Laden Supramax/Panamax) ── */}
            {/* Lower Hull (Red Keel) */}
            <path
              d="M70 275 L780 275 Q 815 275 830 260 L800 240 L110 240 L70 275 Z"
              fill="url(#hullLower)"
            />

            {/* Plimsoll line / Waterline Accent */}
            <line x1="80" y1="240" x2="805" y2="240" stroke="#FAF5EB" strokeWidth="2.5" opacity="0.85" />
            <line x1="80" y1="245" x2="800" y2="245" stroke="#E07A5F" strokeWidth="2" opacity="0.9" />

            {/* Main Topsides (Deep Indigo Hull) */}
            <path
              d="M100 240 L795 240 Q 825 210 845 175 L805 175 L110 175 Q 90 210 100 240 Z"
              fill="url(#hullTopsides)"
            />

            {/* Hull Name & Port: PUHAR - PARADIP */}
            <text x="730" y="205" fill="#FAF5EB" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700" letterSpacing="2">
              PUHAR
            </text>
            <text x="732" y="222" fill="#D4C3A3" fontSize="8" fontFamily="Syne, sans-serif" letterSpacing="1">
              PARADIP
            </text>

            {/* Draft Mark Numbers on Bow */}
            <g opacity="0.6">
              <line x1="822" y1="185" x2="828" y2="185" stroke="#FAF5EB" strokeWidth="1" />
              <line x1="820" y1="200" x2="826" y2="200" stroke="#FAF5EB" strokeWidth="1" />
              <line x1="816" y1="215" x2="822" y2="215" stroke="#FAF5EB" strokeWidth="1" />
              <line x1="810" y1="230" x2="816" y2="230" stroke="#FAF5EB" strokeWidth="1" />
            </g>

            {/* Deck Sheer Line & Bulwarks */}
            <rect x="110" y="172" width="695" height="4" fill="#D4C3A3" />

            {/* ── CARGO HATCH COVERS (5 Hatches for Dry Bulk Coal/Ore) ── */}
            <g transform="translate(230, 154)">
              {/* Hatch 1 */}
              <rect x="0" y="0" width="70" height="18" fill="#C84B31" rx="2" stroke="#FAF5EB" strokeWidth="1" />
              {/* Hatch 2 */}
              <rect x="100" y="0" width="70" height="18" fill="#C84B31" rx="2" stroke="#FAF5EB" strokeWidth="1" />
              {/* Hatch 3 */}
              <rect x="200" y="0" width="70" height="18" fill="#C84B31" rx="2" stroke="#FAF5EB" strokeWidth="1" />
              {/* Hatch 4 */}
              <rect x="300" y="0" width="70" height="18" fill="#C84B31" rx="2" stroke="#FAF5EB" strokeWidth="1" />
              {/* Hatch 5 */}
              <rect x="400" y="0" width="70" height="18" fill="#C84B31" rx="2" stroke="#FAF5EB" strokeWidth="1" />
            </g>

            {/* ── DECK CRANES (4 Electro-Hydraulic Jibs between Hatches) ── */}
            {[295, 395, 495, 595].map((xPos, idx) => (
              <g key={idx} transform={`translate(${xPos}, 105)`}>
                {/* Pedestal */}
                <rect x="0" y="40" width="16" height="28" fill="#FAF5EB" rx="1" />
                {/* Crane housing */}
                <rect x="-4" y="24" width="24" height="16" fill="#E8DFC8" rx="2" />
                {/* Crane jib arm angled forward */}
                <line x1="16" y1="28" x2="68" y2="6" stroke="#F4A261" strokeWidth="3.5" strokeLinecap="round" />
                {/* Hoist cable */}
                <line x1="68" y1="6" x2="68" y2="48" stroke="#D4C3A3" strokeWidth="1.2" strokeDasharray="2 2" />
                <rect x="64" y="48" width="8" height="6" fill="#C84B31" />
              </g>
            ))}

            {/* ── FOREMAST & BOWSPRIT ── */}
            <line x1="775" y1="172" x2="775" y2="105" stroke="#FAF5EB" strokeWidth="2.5" />
            <line x1="775" y1="115" x2="795" y2="172" stroke="#D4C3A3" strokeWidth="1.2" />
            {/* Masthead green starboard navigation lantern */}
            <circle cx="775" cy="105" r="3.5" fill="#2A9D8F" />

            {/* ── AFT SUPERSTRUCTURE (Bridge, Accommodation & Funnel) ── */}
            <g transform="translate(130, 80)">
              {/* Lower Tier accommodation */}
              <rect x="0" y="55" width="85" height="38" fill="url(#bridgeGrad)" rx="2" stroke="#0B1626" strokeWidth="1" />
              {/* Windows tier 1 */}
              <line x1="10" y1="72" x2="75" y2="72" stroke="#122B47" strokeWidth="3" strokeDasharray="6 4" />

              {/* Upper Navigation Bridge Deck */}
              <path d="M-5 55 L90 55 L85 28 L0 28 Z" fill="url(#bridgeGrad)" stroke="#0B1626" strokeWidth="1" />
              {/* Bridge Wheelhouse Windows */}
              <path d="M5 45 L80 45 L78 34 L7 34 Z" fill="#122B47" />

              {/* Radar Mast & Antenna */}
              <line x1="38" y1="28" x2="38" y2="-5" stroke="#1E334D" strokeWidth="2.5" />
              <line x1="26" y1="4" x2="50" y2="4" stroke="#FAF5EB" strokeWidth="2" />
              {/* Rotating radar scanner bar */}
              <rect x="24" y="-8" width="28" height="3" fill="#E07A5F" rx="1" />

              {/* Funnel (Exhaust Stack) */}
              <rect x="-24" y="20" width="22" height="45" fill="#0B1626" rx="2" />
              {/* Funnel Indian Maritime emblem band (Coral & Sand) */}
              <rect x="-24" y="30" width="22" height="12" fill="#E07A5F" />
              <rect x="-24" y="34" width="22" height="4" fill="#FAF5EB" />

              {/* Heat Haze / Exhaust Plume */}
              <path
                d="M-13 18 Q -20 0 -10 -15 T -5 -35"
                stroke="#FAF5EB"
                strokeWidth="2"
                opacity="0.25"
                fill="none"
              />

              {/* Lifeboat Davits */}
              <rect x="68" y="65" width="20" height="10" fill="#E07A5F" rx="3" />
            </g>
          </svg>
        )}
      </motion.div>
    </div>
  );
}
