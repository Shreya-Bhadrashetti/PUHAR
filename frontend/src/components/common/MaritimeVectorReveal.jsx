/**
 * MaritimeVectorReveal
 * Luminous vector chart & telemetry graphics revealed exclusively through the cursor spotlight mask.
 * Renders vector shipping lanes, compass roses, bathymetric contours, and East Coast port waypoints.
 */
export default function MaritimeVectorReveal({ cursor }) {
  if (!cursor || !cursor.inside) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{
        zIndex: 2,
        WebkitMaskImage: `radial-gradient(circle 260px at ${cursor.x}px ${cursor.y}px, black 0%, black 45%, transparent 80%)`,
        maskImage: `radial-gradient(circle 260px at ${cursor.x}px ${cursor.y}px, black 0%, black 45%, transparent 80%)`,
        filter: 'drop-shadow(0 0 25px rgba(0,201,255,0.45))',
      }}
    >
      {/* High-tech vector maritime chart background */}
      <svg
        className="w-full h-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="revealGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00c9ff" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#0d4f8b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="routeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c9ff" />
            <stop offset="50%" stopColor="#4fd1c5" />
            <stop offset="100%" stopColor="#2d8ef0" />
          </linearGradient>
          <linearGradient id="routeGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#00c9ff" />
          </linearGradient>
          <pattern id="vectorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,201,255,0.12)" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.5" fill="rgba(0,201,255,0.3)" />
          </pattern>
        </defs>

        {/* Vector Grid Overlay */}
        <rect width="100%" height="100%" fill="url(#vectorGrid)" />

        {/* Bathymetric Depth Isolines */}
        <path
          d="M 50 150 Q 400 120 700 240 T 1300 200 T 1600 280"
          stroke="rgba(0,201,255,0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M 20 320 Q 380 290 680 410 T 1280 370 T 1620 460"
          stroke="rgba(0,201,255,0.3)"
          strokeWidth="1.8"
        />
        <path
          d="M 0 520 Q 420 490 740 600 T 1320 560 T 1600 640"
          stroke="rgba(45,142,240,0.35)"
          strokeWidth="2"
        />
        <path
          d="M 0 720 Q 360 680 720 800 T 1300 750 T 1600 850"
          stroke="rgba(13,79,139,0.4)"
          strokeWidth="2.2"
        />

        {/* East Coast Shipping Corridor Vector Corridors */}
        {/* Route 1: Australia -> Paradip */}
        <path
          d="M 1500 950 C 1200 800, 900 650, 750 380"
          stroke="url(#routeGrad1)"
          strokeWidth="2.5"
          strokeDasharray="8 4"
        />
        {/* Route 2: Indonesia -> Haldia */}
        <path
          d="M 1400 900 C 1150 720, 880 500, 790 260"
          stroke="url(#routeGrad2)"
          strokeWidth="2"
          strokeDasharray="6 3"
        />
        {/* Route 3: Coastal Feeder Route: Chennai -> Vizag -> Paradip */}
        <path
          d="M 550 750 C 620 580, 680 480, 750 380"
          stroke="#00c9ff"
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        {/* Port Nodes & Waypoint Markers */}
        {/* Haldia */}
        <g transform="translate(790, 260)">
          <circle r="18" fill="none" stroke="rgba(0,201,255,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          <circle r="7" fill="#00c9ff" />
          <circle r="3" fill="#ffffff" />
          <text x="24" y="5" fill="#00c9ff" fontSize="13" fontFamily="monospace" fontWeight="bold">
            HALDIA [22.03°N 88.10°E]
          </text>
          <text x="24" y="20" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="sans-serif">
            Max Draft 11.2m · Riverine Access
          </text>
        </g>

        {/* Paradip */}
        <g transform="translate(750, 380)">
          <circle r="24" fill="none" stroke="rgba(0,201,255,0.5)" strokeWidth="1.5" />
          <circle r="16" fill="rgba(0,201,255,0.15)" />
          <circle r="8" fill="#4fd1c5" />
          <circle r="3.5" fill="#ffffff" />
          <text x="30" y="5" fill="#4fd1c5" fontSize="14" fontFamily="monospace" fontWeight="bold">
            PARADIP [20.26°N 86.68°E]
          </text>
          <text x="30" y="22" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="sans-serif">
            Major Deepwater Bulk Terminal · Capesize Capable
          </text>
        </g>

        {/* Visakhapatnam */}
        <g transform="translate(680, 520)">
          <circle r="20" fill="none" stroke="rgba(45,142,240,0.5)" strokeWidth="1" strokeDasharray="4 3" />
          <circle r="7" fill="#2d8ef0" />
          <circle r="3" fill="#ffffff" />
          <text x="26" y="5" fill="#2d8ef0" fontSize="13" fontFamily="monospace" fontWeight="bold">
            VISAKHAPATNAM [17.69°N 83.29°E]
          </text>
          <text x="26" y="20" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="sans-serif">
            Inner/Outer Harbour · Iron Ore Hub
          </text>
        </g>

        {/* Chennai */}
        <g transform="translate(550, 750)">
          <circle r="18" fill="none" stroke="rgba(0,201,255,0.4)" strokeWidth="1" />
          <circle r="6" fill="#00c9ff" />
          <circle r="2.5" fill="#ffffff" />
          <text x="24" y="5" fill="#00c9ff" fontSize="12" fontFamily="monospace" fontWeight="bold">
            CHENNAI [13.10°N 80.30°E]
          </text>
        </g>

        {/* Luminous Navigational Compass Rose in the Upper Right */}
        <g transform="translate(1320, 220)">
          <circle r="85" fill="none" stroke="rgba(0,201,255,0.25)" strokeWidth="1" strokeDasharray="6 4" />
          <circle r="70" fill="none" stroke="rgba(0,201,255,0.4)" strokeWidth="1.2" />
          <circle r="55" fill="rgba(0,201,255,0.05)" />
          {/* Compass Points */}
          <polygon points="0,-65 6,-18 0,0 -6,-18" fill="#00c9ff" />
          <polygon points="0,65 6,18 0,0 -6,18" fill="rgba(0,201,255,0.4)" />
          <polygon points="65,0 18,6 0,0 18,-6" fill="rgba(0,201,255,0.6)" />
          <polygon points="-65,0 -18,6 0,0 -18,-6" fill="rgba(0,201,255,0.4)" />
          <text x="0" y="-74" fill="#00c9ff" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">N</text>
          <text x="76" y="4" fill="rgba(0,201,255,0.8)" fontSize="11" fontFamily="monospace" textAnchor="middle">E</text>
          <text x="0" y="82" fill="rgba(0,201,255,0.8)" fontSize="11" fontFamily="monospace" textAnchor="middle">S</text>
          <text x="-76" y="4" fill="rgba(0,201,255,0.8)" fontSize="11" fontFamily="monospace" textAnchor="middle">W</text>
          <circle r="4" fill="#ffffff" />
        </g>

        {/* Telemetry Vectors & Route Speed Indicators */}
        <g transform="translate(920, 480)" fill="rgba(0,201,255,0.8)" fontFamily="monospace" fontSize="10">
          <rect x="-8" y="-12" width="130" height="42" fill="rgba(0,0,0,0.7)" rx="4" stroke="rgba(0,201,255,0.3)" />
          <text x="0" y="5" fill="#00c9ff">BAY OF BENGAL</text>
          <text x="0" y="20" fill="rgba(255,255,255,0.7)">SPD: 13.4 KTS · OK</text>
        </g>
      </svg>

      {/* Spotlight feathered glow perimeter */}
      <div
        style={{
          position: 'absolute',
          left: cursor.x - 260,
          top: cursor.y - 260,
          width: 520,
          height: 520,
          borderRadius: '50%',
          border: '1px solid rgba(0, 201, 255, 0.35)',
          background: 'radial-gradient(circle, rgba(0,201,255,0.06) 0%, transparent 70%)',
          boxShadow: '0 0 50px rgba(0,201,255,0.25), inset 0 0 40px rgba(0,201,255,0.15)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
