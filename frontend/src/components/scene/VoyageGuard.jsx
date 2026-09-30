import React, { useState, useEffect } from 'react';

/**
 * WP 03 · COURSE CHANGE · 215° — VOYAGEGUARD
 * "Course altered south-southwest. Avoid the squall, clear the choke point."
 * Hand-drawn sea chart with coast hatching, depth soundings, and compass rose.
 * 5-stage sequential routing progression:
 * 1. CYCLONE ALERT
 * 2. TRAFFIC CONGESTION
 * 3. PORT CONSTRAINT
 * 4. REROUTING
 * 5. RECOMMENDED ROUTE
 * Abstract chevron vessel marker traveling the active route.
 */
export default function VoyageGuard() {
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const stages = [
    { id: 0, tag: 'BASELINE TRACK', desc: 'Direct rhumb line across open waters' },
    { id: 1, tag: 'CYCLONE ALERT', desc: 'Severe vortex intercepts passage at 12°N' },
    { id: 2, tag: 'TRAFFIC CONGESTION', desc: 'Malacca choke point queue: 18h dwell' },
    { id: 3, tag: 'PORT CONSTRAINT', desc: 'Laden draft exceeds inner lock clearance' },
    { id: 4, tag: 'RECOMMENDED ROUTE', desc: 'Course altered 215° · Evasive bypass confirmed' },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <section id="voyageguard" className="waypoint-section" style={{ minHeight: '120vh' }}>
      <div className="voyage-container">
        {/* Waypoint Header */}
        <div className="waypoint-header">
          <div className="log-stamp" style={{ marginBottom: '12px' }}>
            WP 03 · COURSE CHANGE · 215°
          </div>
          <p className="margin-note" style={{ margin: '0 auto 20px auto' }}>
            "Course altered south-southwest. Avoid the squall, clear the choke point."
          </p>
          <h2 className="waypoint-title">VOYAGEGUARD</h2>
          <p className="waypoint-subline">
            Autonomous passage resilience. The digital twin continuously reconciles cyclonic alerts, chokepoint queuing, and harbor draft locks to chart the safest viable track.
          </p>
        </div>

        {/* 5-Stage Stepper Buttons with pause/play */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {/* Pause/Play Toggle */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid var(--c-cream-line)',
                color: 'var(--c-cream-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'all 0.2s',
              }}
              title={isPlaying ? 'Pause auto-advance' : 'Resume auto-advance'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {stages.map((stg) => {
              const isActive = stage === stg.id;
              const isPast = stage > stg.id;
              return (
                <button
                  key={stg.id}
                  onClick={() => { setStage(stg.id); setIsPlaying(false); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: isActive ? 'var(--c-coral)' : isPast ? 'rgba(47,184,198,0.15)' : 'rgba(11, 20, 51, 0.85)',
                    border: `1px solid ${isActive ? 'var(--c-coral)' : isPast ? 'var(--c-turquoise)' : 'var(--c-cream-line)'}`,
                    color: isActive ? '#FFFFFF' : isPast ? 'var(--c-turquoise)' : 'var(--c-cream)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    cursor: 'pointer',
                    transition: 'all 0.25s var(--ease-voyage)',
                  }}
                >
                  <span>{isPast ? '✓' : `0${stg.id + 1}`}</span>
                  <span style={{ fontWeight: 600 }}>{stg.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Progress line under buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', maxWidth: '700px', margin: '0 auto' }}>
            {stages.map((stg, i) => (
              <React.Fragment key={stg.id}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: stage >= stg.id ? 'var(--c-coral)' : 'var(--c-cream-line)',
                  border: stage === stg.id ? '2px solid var(--c-cream)' : 'none',
                  flexShrink: 0,
                  transition: 'background 0.4s',
                }} />
                {i < stages.length - 1 && (
                  <div style={{
                    flex: 1, height: '1px',
                    background: stage > stg.id ? 'var(--c-coral)' : 'var(--c-cream-line)',
                    transition: 'background 0.4s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Stage description */}
          <p style={{
            textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px',
            color: 'var(--c-cream-dim)', marginTop: '10px', fontStyle: 'italic',
          }}>
            {stages[stage].desc}
          </p>
        </div>

        {/* Sea Chart Viewport */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '520px',
            border: '1px solid var(--c-cream-line)',
            background: 'rgba(11, 20, 51, 0.55)',
            overflow: 'hidden',
          }}
        >
          {/* Compass Rose in Corner */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <svg width="68" height="68" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="rgba(243, 233, 210, 0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <polygon points="50,10 54,46 50,50 46,46" fill="var(--c-coral)" />
              <polygon points="50,90 54,54 50,50 46,54" fill="var(--c-cream-dim)" />
              <polygon points="10,50 46,46 50,50 46,54" fill="var(--c-cream-dim)" />
              <polygon points="90,50 54,46 50,50 54,54" fill="var(--c-cream-dim)" />
              <text x="50" y="8" fill="var(--c-coral)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">N</text>
            </svg>
          </div>

          <svg
            viewBox="0 0 1000 500"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Nautical Soundings across the chart */}
            <g opacity="0.4" fontFamily="var(--font-mono)" fontSize="9" fill="var(--c-cream-dim)">
              <text x="180" y="140">48</text>
              <text x="320" y="210">112</text>
              <text x="440" y="120">215</text>
              <text x="620" y="180">840</text>
              <text x="780" y="320">1420</text>
              <text x="260" y="380">32</text>
              <text x="560" y="390">640</text>
            </g>

            {/* Abstract Coastlines with Hatching */}
            <g stroke="rgba(243, 233, 210, 0.3)" strokeWidth="1.5" fill="none" filter="url(#hand-drawn-wobble)">
              {/* Malay Peninsula / Sumatra */}
              <path d="M 220 80 L 260 210 L 320 380 L 360 480" />
              {/* Bay of Bengal Western Rim (India) */}
              <path d="M 780 60 L 740 180 L 710 320 L 680 440" />
            </g>

            {/* ORIGIN PORT: Singapore */}
            <g transform="translate(280, 260)">
              <circle cx="0" cy="0" r="6" fill="var(--c-turquoise)" />
              <circle cx="0" cy="0" r="14" stroke="var(--c-turquoise)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <text x="-20" y="-18" fill="var(--c-cream)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600">
                SINGAPORE [SGSIN]
              </text>
            </g>

            {/* DESTINATION PORT: Chennai */}
            <g transform="translate(730, 260)">
              <circle cx="0" cy="0" r="6" fill={stage === 3 ? 'var(--c-warn)' : 'var(--c-turquoise)'} />
              <circle cx="0" cy="0" r="14" stroke={stage === 3 ? 'var(--c-warn)' : 'var(--c-turquoise)'} strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <text x="-15" y="-18" fill="var(--c-cream)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600">
                CHENNAI [INMAA]
              </text>
            </g>

            {/* BASELINE ROUTE (Dims when reroute activates) */}
            <path
              d="M 280 260 L 730 260"
              stroke={stage >= 1 && stage < 4 ? 'var(--c-coral)' : 'rgba(243, 233, 210, 0.3)'}
              strokeWidth={stage >= 1 && stage < 4 ? 2.5 : 1.5}
              strokeDasharray={stage === 4 ? '4 6' : '6 4'}
              fill="none"
              opacity={stage === 4 ? 0.25 : 0.85}
            />

            {/* STAGE 1: CYCLONE ALERT */}
            {stage >= 1 && (
              <g transform="translate(500, 260)">
                <circle cx="0" cy="0" r="42" fill="rgba(242, 97, 122, 0.15)" stroke="var(--c-coral)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="0" cy="0" r="6" fill="var(--c-coral)" />
                <path d="M 0 0 C 15 -25, 35 -15, 30 15 C 25 35, -20 40, -35 15" stroke="var(--c-coral)" strokeWidth="2" fill="none" />
                <rect x="-85" y="-60" width="170" height="22" fill="var(--c-navy)" stroke="var(--c-coral)" strokeWidth="1" />
                <text x="0" y="-45" fill="var(--c-coral)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="700" textAnchor="middle">
                  CYCLONE 03B INTERCEPT
                </text>
              </g>
            )}

            {/* STAGE 2: TRAFFIC CONGESTION */}
            {stage >= 2 && (
              <g transform="translate(340, 260)">
                <ellipse cx="0" cy="0" rx="30" ry="16" fill="rgba(229, 168, 59, 0.25)" stroke="var(--c-warn)" strokeWidth="1.5" />
                <text x="0" y="32" fill="var(--c-warn)" fontFamily="var(--font-mono)" fontSize="9" fontWeight="600" textAnchor="middle">
                  MALACCA QUEUE: +18H
                </text>
              </g>
            )}

            {/* STAGE 3: PORT DRAFT CONSTRAINT */}
            {stage >= 3 && (
              <g transform="translate(730, 260)">
                <rect x="-70" y="24" width="140" height="20" fill="var(--c-navy)" stroke="var(--c-warn)" strokeWidth="1" />
                <text x="0" y="38" fill="var(--c-warn)" fontFamily="var(--font-mono)" fontSize="9" fontWeight="600" textAnchor="middle">
                  DRAFT GATE: 12.8M MAX
                </text>
              </g>
            )}

            {/* STAGE 4: RECOMMENDED ROUTE (Evasive course altered 215°) */}
            {stage === 4 && (
              <g>
                <path
                  d="M 280 260 C 400 390, 610 390, 730 260"
                  stroke="var(--c-turquoise)"
                  strokeWidth="3.5"
                  fill="none"
                  filter="url(#hand-drawn-wobble)"
                />
                <rect x="420" y="405" width="160" height="24" fill="var(--c-navy)" stroke="var(--c-turquoise)" strokeWidth="1" />
                <text x="500" y="421" fill="var(--c-turquoise)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="700" textAnchor="middle">
                  ✓ RECOMMENDED: 215° BYPASS
                </text>
              </g>
            )}

            {/* Abstract Vessel Chevron — smooth CSS transition */}
            <g
              style={{ transition: 'transform 1.2s cubic-bezier(0.45, 0, 0.55, 1)' }}
              transform={`translate(${stage === 4 ? 500 : 380}, ${stage === 4 ? 355 : 260}) rotate(${stage === 4 ? 20 : 0})`}
            >
              <polygon points="-10,-6 12,0 -10,6 -5,0" fill="var(--c-cream)" stroke="var(--c-navy)" strokeWidth="1" />
              {/* Wake trail */}
              <path d="M -16 0 Q -30 -4 -45 0 Q -30 4 -16 0" stroke="rgba(243,233,210,0.3)" strokeWidth="1" fill="none" />
            </g>
          </svg>

          {/* Directive Status Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '12px 24px',
              background: 'rgba(6, 11, 28, 0.92)',
              borderTop: '1px solid var(--c-cream-line)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <div>
              <span style={{ color: 'var(--c-cream-dim)' }}>STAGE: </span>
              <strong style={{ color: 'var(--c-coral)' }}>{stages[stage].tag}</strong>
              <span style={{ color: 'var(--c-cream-dim)', marginLeft: '12px' }}>
                {stages[stage].desc}
              </span>
            </div>
            <div style={{ color: 'var(--c-turquoise)' }}>
              HEADING: {stage === 4 ? '215° SSW' : '285° WNW'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
