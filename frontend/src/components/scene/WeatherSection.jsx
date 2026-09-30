import React, { useState, useEffect } from 'react';

/**
 * WP 02 · WATCH 2 · BAROMETER FALLING — THE WEATHER (INTERACTIVE)
 * Features:
 * - Interactive Storm Intensity Slider (1014 hPa -> 978 hPa)
 * - Animated falling barometer needle reacting to slider / live front
 * - Dynamic wind rose compass with bearing angle
 * - Port Weather Threat Inspector (Paradip, Vizag, Haldia, Chennai)
 * - Direct passage vs Southern Evasive Route toggle
 */
export default function WeatherSection() {
  const [pressure, setPressure] = useState(992);
  const [windAngle, setWindAngle] = useState(65);
  const [isSimulating, setIsSimulating] = useState(true);
  const [activePort, setActivePort] = useState('paradip');
  const [routeMode, setRouteMode] = useState('evasive');
  const [hoveredIsobar, setHoveredIsobar] = useState(null);

  const ports = {
    paradip: {
      name: 'Paradip Port',
      signal: 'SIGNAL 4 · LOCAL CAUTIONARY',
      wind: '58 KTS · ENE',
      wave: '5.8 M',
      pressure: 988,
      status: 'Advisory in force',
      isSevere: true,
    },
    vizag: {
      name: 'Visakhapatnam',
      signal: 'SIGNAL 3 · DISTANT CAUTIONARY',
      wind: '42 KTS · NE',
      wave: '4.2 M',
      pressure: 994,
      status: 'Vessels anchored outer roads',
      isSevere: false,
    },
    haldia: {
      name: 'Haldia Dock Complex',
      signal: 'SIGNAL 3 · SWELL WATCH',
      wind: '36 KTS · E',
      wave: '3.6 M',
      pressure: 998,
      status: 'River pilotage restricted',
      isSevere: false,
    },
    chennai: {
      name: 'Chennai Port',
      signal: 'SIGNAL 1 · SQUALL WARNING',
      wind: '24 KTS · ESE',
      wave: '2.4 M',
      pressure: 1004,
      status: 'Berthing normal',
      isSevere: false,
    },
  };

  // Continuous idle wind/bearing drift
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setWindAngle((a) => (a + 1) % 360);
    }, 120);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived metrics from pressure slider
  const windKnots = Math.round(18 + (1014 - pressure) * 1.4);
  const waveHeight = (1.5 + (1014 - pressure) * 0.14).toFixed(1);

  return (
    <section id="weather" className="waypoint-section" style={{ minHeight: '120vh' }}>
      <div className="voyage-container">
        {/* Waypoint Header */}
        <div className="waypoint-header">
          <div className="log-stamp" style={{ marginBottom: '12px' }}>
            WP 02 · WATCH 2 · BAROMETER FALLING
          </div>
          <p className="margin-note" style={{ margin: '0 auto 20px auto' }}>
            "Barometer dropping. We will not sail into that."
          </p>
          <h2 className="waypoint-title">STORM FRONT</h2>
          <p className="waypoint-subline">
            Monsoonal depression tracking across the central Bay of Bengal. Isobars compress, wind velocity surges, and wave swell forces an immediate southerly course correction.
          </p>
        </div>

        {/* Interactive Controls Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
            padding: '12px 20px',
            background: 'rgba(11, 20, 51, 0.75)',
            border: '1px solid var(--c-cream-line)',
          }}
        >
          {/* Pressure Scrub Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--c-cream)' }}>
              SIMULATE FRONT INTENSITY:
            </span>
            <input
              type="range"
              min="976"
              max="1014"
              value={pressure}
              onChange={(e) => {
                setIsSimulating(false);
                setPressure(Number(e.target.value));
              }}
              style={{ accentColor: 'var(--c-coral)', cursor: 'pointer', width: '140px' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--c-coral)', fontWeight: 700 }}>
              {pressure} hPa
            </span>
            {/* Resume simulation button */}
            {!isSimulating && (
              <button
                onClick={() => setIsSimulating(true)}
                style={{
                  padding: '4px 10px',
                  background: 'transparent',
                  border: '1px solid var(--c-cream-line)',
                  color: 'var(--c-cream-dim)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                ▶ LIVE
              </button>
            )}
            {/* Severe weather flash warning */}
            {pressure < 985 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--c-coral)',
                fontWeight: 700, letterSpacing: '0.1em',
                animation: 'severeFlash 0.8s ease-in-out infinite alternate',
              }}>
                ⚠ SEVERE
              </span>
            )}
          </div>

          {/* East Coast Port Quick-Select */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(ports).map(([key, p]) => (
              <button
                key={key}
                onClick={() => {
                  setActivePort(key);
                  setPressure(p.pressure);
                }}
                style={{
                  padding: '5px 12px',
                  background: activePort === key ? 'var(--c-coral)' : 'rgba(6, 11, 28, 0.9)',
                  border: `1px solid ${activePort === key ? 'var(--c-coral)' : 'var(--c-cream-line)'}`,
                  color: activePort === key ? '#FFFFFF' : 'var(--c-cream)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Route Mode Switcher */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setRouteMode('evasive')}
              style={{
                padding: '5px 12px',
                background: routeMode === 'evasive' ? 'rgba(47, 184, 198, 0.25)' : 'transparent',
                border: '1px solid var(--c-turquoise)',
                color: 'var(--c-turquoise)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ✓ SOUTHERN EVASIVE
            </button>
            <button
              onClick={() => setRouteMode('direct')}
              style={{
                padding: '5px 12px',
                background: routeMode === 'direct' ? 'rgba(242, 97, 122, 0.25)' : 'transparent',
                border: '1px solid var(--c-coral)',
                color: 'var(--c-coral)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ⚠️ DIRECT (PROHIBITED)
            </button>
          </div>
        </div>

        {/* The Meteorological Chart Composition */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '560px',
            border: '1px solid var(--c-cream-line)',
            background: 'rgba(19, 25, 56, 0.65)',
            overflow: 'hidden',
          }}
        >
          {/* Animated Barometer Dial (Top-Left Edge) */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '28px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 18px',
              background: 'rgba(6, 11, 28, 0.9)',
              border: '1px solid var(--c-cream-line)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="var(--c-cream-line)" strokeWidth="2" fill="none" />
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={50 + Math.cos(angle) * 36}
                    y1={50 + Math.sin(angle) * 36}
                    x2={50 + Math.cos(angle) * 42}
                    y2={50 + Math.sin(angle) * 42}
                    stroke="var(--c-cream)"
                    strokeWidth="1.5"
                  />
                );
              })}
              <line
                x1="50"
                y1="50"
                x2={50 + Math.cos(((pressure - 950) * 4 * Math.PI) / 180) * 34}
                y2={50 + Math.sin(((pressure - 950) * 4 * Math.PI) / 180) * 34}
                stroke="var(--c-coral)"
                strokeWidth="2.5"
              />
              <circle cx="50" cy="50" r="4" fill="var(--c-cream)" />
            </svg>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--c-coral)' }}>
                BAROMETER PRESSURE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--c-cream)' }}>
                {pressure} <span style={{ fontSize: '11px', color: 'var(--c-cream-dim)' }}>hPa</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--c-cream-dim)' }}>
                {ports[activePort].signal}
              </div>
            </div>
          </div>

          {/* Wind Rose Compass (Top-Right Edge) */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              right: '28px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 18px',
              background: 'rgba(6, 11, 28, 0.9)',
              border: '1px solid var(--c-cream-line)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="var(--c-cream-line)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <text x="50" y="16" fill="var(--c-coral)" fontSize="12" fontFamily="var(--font-mono)" textAnchor="middle">N</text>
              <text x="86" y="54" fill="var(--c-cream-dim)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">E</text>
              <text x="50" y="92" fill="var(--c-cream-dim)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">S</text>
              <text x="14" y="54" fill="var(--c-cream-dim)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">W</text>
              <polygon
                points="50,22 55,50 50,45 45,50"
                fill="var(--c-coral)"
                transform={`rotate(${windAngle} 50 50)`}
              />
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--c-cream-dim)' }}>
                CURRENT WIND VECTOR
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--c-cream)' }}>
                {windKnots} KTS · {windAngle}° BEARING
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--c-cream-dim)' }}>
                SIGNIFICANT WAVE: {waveHeight} M
              </div>
            </div>
          </div>

          {/* Central Cyclone Isobars & Hand-Drawn Storm Spiral */}
          <svg
            viewBox="0 0 1000 500"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <style>{`
              @keyframes severeFlash {
                from { opacity: 1; } to { opacity: 0.3; }
              }
              .isobar-group { cursor: crosshair; }
              .isobar-group:hover .isobar-label { display: block; }
              .isobar-label { display: none; }
            `}</style>

            {/* Concentric Isobar Pressure Contours — each hoverable */}
            <g filter="url(#hand-drawn-wobble)">
              {[
                { r: 220, p: Math.round(pressure + 20), opacity: 0.12, sw: 1, dash: '6 8', col: 'rgba(243,233,210,' },
                { r: 165, p: Math.round(pressure + 12), opacity: 0.22, sw: 1.5, dash: '4 6', col: 'rgba(243,233,210,' },
                { r: 110, p: Math.round(pressure + 6),  opacity: 0.45, sw: 2,   dash: '3 4', col: 'rgba(242,97,122,' },
                { r: 55,  p: pressure,                   opacity: 1,    sw: 2.5, dash: 'none', col: 'rgba(242,97,122,' },
              ].map(({ r, p, opacity, sw, dash, col }) => (
                <g
                  key={r}
                  className="isobar-group"
                  onMouseEnter={() => setHoveredIsobar({ r, p })}
                  onMouseLeave={() => setHoveredIsobar(null)}
                >
                  <circle
                    cx="500" cy="250" r={r}
                    stroke={`${col}${opacity})`}
                    strokeWidth={sw}
                    strokeDasharray={dash === 'none' ? undefined : dash}
                    fill="none"
                  />
                  {/* Invisible wider hit area */}
                  <circle cx="500" cy="250" r={r} stroke="transparent" strokeWidth="12" fill="none" />
                  {/* Hover label */}
                  {hoveredIsobar?.r === r && (
                    <g transform={`translate(${500 + r + 8}, 250)`}>
                      <rect x="0" y="-14" width="72" height="22" fill="var(--c-navy)" stroke="var(--c-cream-line)" strokeWidth="1" rx="2" />
                      <text x="6" y="2" fill="var(--c-cream)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600">{p} hPa</text>
                    </g>
                  )}
                </g>
              ))}

              <path d="M 500 250 C 540 180, 640 150, 710 220 C 780 290, 750 420, 620 450" stroke="var(--c-coral)" strokeWidth="2.5" fill="none" />
              <path d="M 500 250 C 440 310, 340 320, 270 240 C 210 170, 260 70, 390 50" stroke="var(--c-cream-dim)" strokeWidth="1.8" fill="none" />
            </g>

            <circle cx="500" cy="250" r="12" fill="var(--c-coral)" />
            <circle cx="500" cy="250" r="4" fill="var(--c-navy)" />
            <text
              x="500"
              y="285"
              fill="var(--c-coral)"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              letterSpacing="0.14em"
            >
              CYCLONE 03B · {pressure} hPa
            </text>

            {/* Direct Danger Route (Active if routeMode === 'direct') */}
            <line
              x1="180"
              y1="250"
              x2="820"
              y2="250"
              stroke="var(--c-coral)"
              strokeWidth={routeMode === 'direct' ? '3.5' : '1.5'}
              strokeDasharray={routeMode === 'direct' ? 'none' : '6 4'}
              opacity={routeMode === 'direct' ? 1 : 0.4}
            />

            {/* Southern Evasive Waypoint Course (Active if routeMode === 'evasive') */}
            <path
              d="M 180 250 C 340 390, 660 390, 820 250"
              stroke="var(--c-turquoise)"
              strokeWidth={routeMode === 'evasive' ? '3.5' : '1.5'}
              fill="none"
              filter="url(#hand-drawn-wobble)"
              opacity={routeMode === 'evasive' ? 1 : 0.4}
            />

            {/* Anchor Flag Callouts */}
            <g
              transform="translate(500, 395)"
              onClick={() => setRouteMode('evasive')}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="-105"
                y="-12"
                width="210"
                height="24"
                fill="var(--c-navy)"
                stroke="var(--c-turquoise)"
                strokeWidth={routeMode === 'evasive' ? '2' : '1'}
              />
              <text x="0" y="4" fill="var(--c-turquoise)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600" textAnchor="middle">
                SOUTHERN CLEARANCE (+64 NM)
              </text>
            </g>

            <g
              transform="translate(500, 215)"
              onClick={() => setRouteMode('direct')}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="-115"
                y="-12"
                width="230"
                height="24"
                fill="var(--c-navy)"
                stroke="var(--c-coral)"
                strokeWidth={routeMode === 'direct' ? '2' : '1'}
              />
              <text x="0" y="4" fill="var(--c-coral)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600" textAnchor="middle">
                {routeMode === 'direct' ? '⚠️ DANGER: 6.8M SWELL INTERCEPT' : '❌ DIRECT PASSAGE PROHIBITED'}
              </text>
            </g>
          </svg>

          {/* Bottom Telemetry Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '12px 24px',
              background: 'rgba(6, 11, 28, 0.94)',
              borderTop: '1px solid var(--c-cream-line)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--c-cream-dim)',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span>
              {routeMode === 'evasive' ? 'ROUTE IMPACT: +64 NM SOUTHERN BYPASS' : 'DIRECT IMPACT: 0 NM (HULL DAMAGE RISK)'}
            </span>
            <span>
              {routeMode === 'evasive' ? 'HULL STRESS REDUCTION: -74%' : 'ESTIMATED WAVE IMPACT: EXCEEDS 180 MPa'}
            </span>
            <span style={{ color: routeMode === 'evasive' ? 'var(--c-turquoise)' : 'var(--c-coral)', fontWeight: 600 }}>
              {routeMode === 'evasive' ? 'DECISION: EVASIVE PASSAGE CONFIRMED' : 'WARNING: UNCHARTED SWELL VORTEX'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
