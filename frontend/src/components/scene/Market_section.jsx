import React, { useState, useEffect, useRef } from 'react';

/**
 * WP 01 · 08°N 72°E · 0400 LT — THE MARKET
 * "Read the market before you move the vessel."
 * Visual concept:
 * Numbers are buoy tags bobbing at different depths on thin tether lines.
 * No SaaS cards. Connected by thin cream linework. Numbers count up on enter.
 * Small schools of fish drifting slowly far behind in the ocean depths.
 */
export default function MarketSection() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [activeBuoy, setActiveBuoy] = useState(null);
  const [counts, setCounts] = useState({
    bdi: 1200,
    tce: 18000,
    bunker: 540,
    coal: 110,
    ore: 95,
    usdinr: 82.5,
    dxy: 98.2,
  });

  const TARGET = { bdi: 1842, tce: 24150, bunker: 628, coal: 134, ore: 118, usdinr: 86.42, dxy: 103.8 };

  const buoysBase = [
    {
      id: 'bdi', code: 'BDI', name: 'Baltic Dry Index',
      unit: 'pts', delta: '▲ +37', isPos: true, depth: '24 M', x: 18, y: 22,
      detail: 'Composite of 23 dry bulk shipping routes. Iron ore demand from Paradip and Haldia coal are primary drivers.',
      sparkline: [1180,1210,1195,1240,1280,1265,1310,1355,1390,1430,1480,1540,1610,1680,1760,1820,1842],
    },
    {
      id: 'tce', code: 'TCE', name: 'Time Charter Equiv',
      unit: '/day', delta: '▲ +$620', isPos: true, depth: '42 M', x: 72, y: 18,
      detail: 'Daily earnings for a Panamax bulk carrier on East Coast India routes including port disbursements at Vizag.',
      sparkline: [18000,18400,18900,19400,19900,20400,21000,21500,22000,22500,23000,23400,23700,23900,24050,24120,24150],
    },
    {
      id: 'bunker', code: 'VLSFO', name: 'Very Low Sulfur Fuel',
      unit: '/MT', delta: '▼ -$12', isPos: false, depth: '68 M', x: 12, y: 62,
      detail: 'IMO 2020 compliant VLSFO price ex-Singapore STS. Critical cost variable for Bay of Bengal voyages.',
      sparkline: [640,635,630,625,620,618,622,628,632,630,625,618,614,612,610,615,628],
    },
    {
      id: 'coal', code: 'API4', name: 'Richards Bay Coal',
      unit: '/MT', delta: '▲ +$2.4', isPos: true, depth: '85 M', x: 82, y: 58,
      detail: 'Richards Bay FOB thermal coal benchmark. Principal cargo for Panamax carriers bound for Paradip and Ennore TPP.',
      sparkline: [110,111,112,114,115,117,118,120,122,124,126,128,130,131,132,133,134],
    },
    {
      id: 'ore', code: 'FE 62%', name: 'Iron Ore Fines',
      unit: '/MT', delta: '▲ +$1.8', isPos: true, depth: '110 M', x: 48, y: 78,
      detail: 'CFR China 62% Fe fines index. Governs return-leg cargo economics on Paradip–Port Hedland corridors.',
      sparkline: [95,96,97,98,100,101,102,104,105,107,109,111,113,115,116,117,118],
    },
    {
      id: 'usdinr', code: 'USD/INR', name: 'Exchange Rate',
      unit: 'INR', delta: '▲ +0.14', isPos: true, depth: '35 M', x: 35, y: 12,
      detail: 'Spot exchange rate. Freight contracted in USD; port dues, crew wages and pilotage settled in INR.',
      sparkline: [82.5,82.7,82.9,83.1,83.4,83.7,84.0,84.3,84.6,84.9,85.2,85.5,85.8,86.0,86.2,86.35,86.42],
    },
    {
      id: 'dxy', code: 'DXY', name: 'US Dollar Index',
      unit: 'pts', delta: '▼ -0.3', isPos: false, depth: '55 M', x: 62, y: 84,
      detail: 'Dollar strength vs 6-currency basket. Rising DXY suppresses commodity prices and compresses TCE margins.',
      sparkline: [98.2,98.6,99.1,99.6,100.2,100.8,101.5,102.0,102.5,103.0,103.4,103.6,103.8,103.7,103.8,103.8,103.8],
    },
  ];

  // Derive buoys with live count values
  const buoys = buoysBase.map((b) => ({
    ...b,
    value: b.id === 'tce' ? `$${counts[b.id].toLocaleString()}`
      : (b.id === 'bunker' || b.id === 'coal' || b.id === 'ore') ? `$${counts[b.id]}`
      : b.id === 'usdinr' ? counts[b.id].toFixed(2)
      : b.id === 'dxy' ? counts[b.id].toFixed(1)
      : counts[b.id].toLocaleString(),
  }));

  // Trigger count-up when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const duration = 80;
    const interval = setInterval(() => {
      frame++;
      const ease = 1 - Math.pow(1 - Math.min(1, frame / duration), 3);
      setCounts({
        bdi: Math.round(1200 + (TARGET.bdi - 1200) * ease),
        tce: Math.round(18000 + (TARGET.tce - 18000) * ease),
        bunker: Math.round(540 + (TARGET.bunker - 540) * ease),
        coal: Math.round(110 + (TARGET.coal - 110) * ease),
        ore: Math.round(95 + (TARGET.ore - 95) * ease),
        usdinr: 82.5 + (TARGET.usdinr - 82.5) * ease,
        dxy: 98.2 + (TARGET.dxy - 98.2) * ease,
      });
      if (frame >= duration) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [inView]);

  const activeBuoyData = buoys.find((b) => b.id === activeBuoy);

  // Mini inline sparkline renderer
  const renderSparkline = (pts, isPos, w = 260, h = 50) => {
    const min = Math.min(...pts), max = Math.max(...pts);
    const rng = max - min || 1;
    const px = (i) => (i / (pts.length - 1)) * w;
    const py = (v) => h - ((v - min) / rng) * h;
    const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
    const color = isPos ? '#2FB8C6' : '#E5A83B';
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx={px(pts.length - 1)} cy={py(pts[pts.length - 1])} r="3" fill={color} />
      </svg>
    );
  };

  const tickerItems = [
    'BDI ▲ 1,842 pts', 'TCE $24,150/day', 'VLSFO ▼ $628/MT', 'API4 ▲ $134/MT',
    'Fe 62% ▲ $118/MT', 'USD/INR ▲ 86.42', 'DXY ▼ 103.8', 'PARADIP: SIGNAL 4',
    'VIZAG: BERTH OPEN', 'HALDIA: DRAFT 11.5M', 'CHENNAI: NORMAL',
  ];

  return (
    <section id="trends" className="waypoint-section" ref={sectionRef} style={{ minHeight: '120vh', position: 'relative' }}>
      {/* Background Drifting Fish SVG Silhouette */}
      <div
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.16, zIndex: 1 }}
        aria-hidden="true"
      >
        <style>{`
          @keyframes fishDrift { from { transform: translateX(0); } to { transform: translateX(120px); } }
          .fish-group { animation: fishDrift 18s linear infinite alternate; }
          @keyframes buoyBob {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
            50%       { transform: translate(-50%, -50%) translateY(-6px); }
          }
          @keyframes pulseRing {
            0%   { transform: scale(0.8); opacity: 0.9; }
            100% { transform: scale(2.6); opacity: 0; }
          }
          @keyframes slideInRight {
            from { transform: translateX(30px); opacity: 0; }
            to   { transform: translateX(0); opacity: 1; }
          }
          @keyframes tickerScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
        <svg viewBox="0 0 1200 800" style={{ width: '100%', height: '100%' }}>
          <g className="fish-group" filter="url(#hand-drawn-wobble)">
            <path d="M 120 240 Q 145 235 160 242 Q 170 240 180 238 L 195 232 L 190 245 L 195 252 L 175 246 Q 145 252 120 240 Z" fill="#2FB8C6" />
            <path d="M 160 210 Q 185 205 200 212 Q 210 210 220 208 L 235 202 L 230 215 L 235 222 L 215 216 Q 185 222 160 210 Z" fill="#2FB8C6" transform="scale(0.85)" />
            <path d="M 90 280 Q 115 275 130 282 Q 140 280 150 278 L 165 272 L 160 285 L 165 292 L 145 286 Q 115 292 90 280 Z" fill="#2FB8C6" transform="scale(0.9)" />
            <path d="M 230 260 Q 255 255 270 262 Q 280 260 290 258 L 305 252 L 300 265 L 305 272 L 285 266 Q 255 272 230 260 Z" fill="#2FB8C6" transform="scale(0.75)" />
          </g>
        </svg>
      </div>

      <div className="voyage-container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Waypoint Header */}
        <div className="waypoint-header">
          <div className="log-stamp" style={{ marginBottom: '12px' }}>
            WP 01 · 08°N 72°E · 0400 LT
          </div>
          <p className="margin-note" style={{ margin: '0 auto 20px auto' }}>
            "Currents shifting. Rate indices firming across the Arabian Sea."
          </p>
          <h2 className="waypoint-title">THE MARKET</h2>
          <p className="waypoint-subline">
            Read the market before you move the vessel. Click any buoy for a full depth sounding.
          </p>
        </div>

        {/* Buoy Tag Constellation (Natural Floating Depths with Tether Lines) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '620px',
            border: '1px solid var(--c-cream-line)',
            background: 'rgba(11, 20, 51, 0.45)',
            overflow: 'hidden',
          }}
        >
          {/* Depth Sounding Grid Lines & Maritime Latitude Ruler */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <svg style={{ width: '100%', height: '100%' }}>
              {/* Horizontal Sounding Strata Lines */}
              {[120, 240, 360, 480].map((y) => (
                <g key={y}>
                  <line
                    x1="0"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke="rgba(243, 233, 210, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                  <text
                    x="20"
                    y={y - 6}
                    fill="var(--c-cream-dim)"
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                    letterSpacing="0.1em"
                  >
                    SOUNDING: {(y / 4).toFixed(0)} M
                  </text>
                </g>
              ))}

              {/* Thin Vertical Tether Lines for Buoys */}
              {buoys.map((b) => (
                <line
                  key={`tether-${b.id}`}
                  x1={`${b.x}%`}
                  y1="0"
                  x2={`${b.x}%`}
                  y2={`${b.y}%`}
                  stroke="rgba(243, 233, 210, 0.18)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              ))}
            </svg>
          </div>

          {/* Floating Buoy Tags — each bobs independently */}
          {buoys.map((b, idx) => {
            const isActive = activeBuoy === b.id;
            const bobDelay = idx * 0.45;
            return (
              <div
                key={b.id}
                onClick={() => setActiveBuoy(isActive ? null : b.id)}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`, top: `${b.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isActive ? 10 : 3,
                  cursor: 'pointer',
                  animation: `buoyBob ${3.2 + bobDelay}s ease-in-out ${bobDelay}s infinite`,
                }}
              >
                {/* Depth flag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: b.isPos ? 'var(--c-turquoise)' : 'var(--c-warn)', borderRadius: '1px' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', color: 'var(--c-cream-dim)' }}>DEPTH {b.depth}</span>
                </div>

                {/* Pulse ring on active buoy */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '16px', height: '16px', marginTop: '-8px', marginLeft: '-8px',
                    borderRadius: '50%',
                    border: `2px solid ${b.isPos ? 'var(--c-turquoise)' : 'var(--c-warn)'}`,
                    animation: 'pulseRing 1.2s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Tag body */}
                <div style={{
                  padding: '8px 14px',
                  background: isActive ? 'rgba(6, 11, 28, 0.97)' : 'rgba(6, 11, 28, 0.92)',
                  border: `1px solid ${isActive ? (b.isPos ? 'var(--c-turquoise)' : 'var(--c-warn)') : 'var(--c-cream-line)'}`,
                  boxShadow: isActive ? `0 0 18px ${b.isPos ? 'rgba(47,184,198,0.35)' : 'rgba(229,168,59,0.35)'}` : '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'all 0.25s var(--ease-voyage)',
                  minWidth: '120px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '2px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--c-cream)' }}>{b.code}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: b.isPos ? 'var(--c-turquoise)' : 'var(--c-warn)', fontWeight: 500 }}>{b.delta}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--c-cream)', lineHeight: 1.1 }}>
                    {b.value}{' '}<span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--c-cream-dim)' }}>{b.unit}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--c-cream-dim)', marginTop: '2px' }}>{b.name}</div>
                </div>
              </div>
            );
          })}

          {/* Detail Panel — slides in from right */}
          {activeBuoyData && (
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '300px',
              background: 'rgba(5, 12, 26, 0.97)',
              borderLeft: '1px solid var(--c-cream-line)',
              padding: '24px 20px',
              zIndex: 20,
              display: 'flex', flexDirection: 'column', gap: '16px',
              animation: 'slideInRight 0.25s ease-out',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--c-cream-dim)', letterSpacing: '0.12em' }}>DEPTH SOUNDING · {activeBuoyData.depth}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--c-cream)', marginTop: '4px' }}>{activeBuoyData.code}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--c-cream-dim)' }}>{activeBuoyData.name}</div>
                </div>
                <button onClick={() => setActiveBuoy(null)} style={{
                  background: 'transparent', border: '1px solid var(--c-cream-line)',
                  color: 'var(--c-cream-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px',
                  cursor: 'pointer', padding: '4px 10px',
                }}>✕</button>
              </div>

              {/* Live value */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(11, 20, 51, 0.75)',
                border: `1px solid ${activeBuoyData.isPos ? 'var(--c-turquoise)' : 'var(--c-warn)'}`,
                display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--c-cream)' }}>{activeBuoyData.value}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--c-cream-dim)' }}>{activeBuoyData.unit}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginLeft: 'auto', color: activeBuoyData.isPos ? 'var(--c-turquoise)' : 'var(--c-warn)', fontWeight: 600 }}>{activeBuoyData.delta}</span>
              </div>

              {/* Sparkline */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--c-cream-dim)', marginBottom: '8px', letterSpacing: '0.1em' }}>17-POINT SOUNDING PROFILE</div>
                {renderSparkline(activeBuoyData.sparkline, activeBuoyData.isPos)}
              </div>

              {/* Detail description */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--c-cream-dim)', lineHeight: 1.65, margin: 0 }}>{activeBuoyData.detail}</p>

              <div style={{ marginTop: 'auto', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--c-cream-dim)', borderTop: '1px solid var(--c-cream-line)', paddingTop: '12px' }}>
                SOURCE: BALTIC EXCHANGE / IMF / NCDEX · 0400 LT
              </div>
            </div>
          )}
        </div>

        {/* Live Market Ticker Tape */}
        <div style={{
          marginTop: '2px', overflow: 'hidden',
          background: 'rgba(5, 12, 26, 0.92)',
          border: '1px solid var(--c-cream-line)', borderTop: 'none',
          padding: '8px 0',
        }}>
          <div style={{ display: 'flex', animation: 'tickerScroll 30s linear infinite', whiteSpace: 'nowrap' }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px',
                color: item.includes('▲') ? 'var(--c-turquoise)' : item.includes('▼') ? 'var(--c-warn)' : 'var(--c-cream-dim)',
                letterSpacing: '0.08em', padding: '0 24px',
                borderRight: '1px solid var(--c-cream-line)',
              }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
