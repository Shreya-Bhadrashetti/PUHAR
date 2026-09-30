import React, { useState, useEffect, useRef } from 'react';
import { CORRIDOR_ROUTES, BDI_CHART_SERIES } from '../../data/maritimeData';

/**
 * Depth Sounding Freight Rate Chart — Interactive Maritime Profile
 * Features:
 * - Corridor route switcher (BDI, AUS-Paradip, IDN-Haldia, SAF-Vizag)
 * - Interactive mouse scrub crosshair with sounding lead line and depth metrics
 * - Confidence fan toggle (95% Bayesian probability envelope)
 * - Stroke draw-on-scroll with live leading navigator dot
 * - Hand-drawn nautical line wobble filter
 */
export default function FreightRateGraph() {
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('BDI');
  const [showConfidence, setShowConfidence] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverX, setHoverX] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const routeData = CORRIDOR_ROUTES[selectedRoute] || CORRIDOR_ROUTES.BDI;
  const series = routeData.series;

  const svgWidth = 1100;
  const svgHeight = 400;
  const paddingLeft = 70;
  const paddingRight = 70;
  const paddingTop = 40;
  const paddingBottom = 60;

  const minBdi = routeData.minVal;
  const maxBdi = routeData.maxVal;

  const getX = (index) => {
    const count = series.length - 1;
    const availableWidth = svgWidth - paddingLeft - paddingRight;
    return paddingLeft + (index / count) * availableWidth;
  };

  const getY = (val) => {
    if (val === null || val === undefined) return null;
    const availableHeight = svgHeight - paddingTop - paddingBottom;
    const normalized = (val - minBdi) / (maxBdi - minBdi);
    return svgHeight - paddingBottom - normalized * availableHeight;
  };

  const presentDayIndex = series.findIndex((d) => d.date === '2026-09-01');

  // Actual Historical Path
  let actualPathD = '';
  for (let i = 0; i <= presentDayIndex; i++) {
    const x = getX(i);
    const y = getY(series[i].actual);
    if (i === 0) actualPathD += `M ${x} ${y}`;
    else actualPathD += ` L ${x} ${y}`;
  }

  // Forecast Path
  let forecastPathD = '';
  for (let i = presentDayIndex; i < series.length; i++) {
    const x = getX(i);
    const y = getY(series[i].forecast);
    if (i === presentDayIndex) forecastPathD += `M ${x} ${y}`;
    else forecastPathD += ` L ${x} ${y}`;
  }

  // Confidence Fan
  let confidenceBandD = '';
  for (let i = presentDayIndex; i < series.length; i++) {
    const x = getX(i);
    const y = getY(series[i].upper);
    if (i === presentDayIndex) confidenceBandD += `M ${x} ${y}`;
    else confidenceBandD += ` L ${x} ${y}`;
  }
  for (let i = series.length - 1; i >= presentDayIndex; i--) {
    const x = getX(i);
    const y = getY(series[i].lower);
    confidenceBandD += ` L ${x} ${y}`;
  }
  confidenceBandD += ' Z';

  const presentX = getX(presentDayIndex);

  // SVG Mouse Move Scrub Handler
  const handleSvgMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scale = svgWidth / rect.width;
    const svgCursorX = clientX * scale;

    const availableWidth = svgWidth - paddingLeft - paddingRight;
    const count = series.length - 1;
    const rawIndex = Math.round(((svgCursorX - paddingLeft) / availableWidth) * count);
    const clampedIndex = Math.max(0, Math.min(count, rawIndex));

    setHoveredPoint(series[clampedIndex]);
    setHoverX(getX(clampedIndex));
  };

  const handleSvgMouseLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
  };

  return (
    <div
      ref={sectionRef}
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '40px auto 0 auto',
        padding: '0 2rem',
      }}
    >
      {/* Route Corridor Switcher Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Route Corridor Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.values(CORRIDOR_ROUTES).map((route) => {
            const isActive = selectedRoute === route.id;
            return (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(route.id)}
                style={{
                  padding: '6px 14px',
                  background: isActive ? 'var(--c-coral)' : 'rgba(11, 20, 51, 0.85)',
                  border: `1px solid ${isActive ? 'var(--c-coral)' : 'var(--c-cream-line)'}`,
                  color: isActive ? '#FFFFFF' : 'var(--c-cream)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  transition: 'all 0.2s var(--ease-voyage)',
                }}
              >
                {route.id}: {route.name.split('(')[0]}
              </button>
            );
          })}
        </div>

        {/* Confidence Fan Toggle */}
        <button
          onClick={() => setShowConfidence(!showConfidence)}
          style={{
            padding: '6px 14px',
            background: showConfidence ? 'rgba(47, 184, 198, 0.2)' : 'transparent',
            border: '1px solid var(--c-turquoise)',
            color: 'var(--c-turquoise)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            cursor: 'pointer',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{showConfidence ? '✓' : '○'}</span>
          <span>95% BAYESIAN FAN</span>
        </button>
      </div>

      {/* Chart Metadata Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: '1px solid var(--c-cream-line)',
          paddingBottom: '12px',
          marginBottom: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--c-coral)', fontWeight: 600 }}>
            SOUNDING PROFILE // {routeData.spot}
          </span>
          <span style={{ color: 'var(--c-cream-dim)' }}>
            30-DAY PROJECTION: {routeData.projection}
          </span>
          <span style={{ color: 'var(--c-turquoise)', fontSize: '10px' }}>
            VESSEL CLASS: {routeData.vessel}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', color: 'var(--c-cream-dim)' }}>
          <span>── Historical Spot</span>
          <span>┄┄ Projected Sounding</span>
          {showConfidence && <span>░ 95% Confidence Fan</span>}
        </div>
      </div>

      {/* SVG Sounding Canvas with Mouse Move Scrub */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          background: 'rgba(6, 11, 28, 0.75)',
          border: '1px solid var(--c-cream-line)',
          position: 'relative',
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          {/* Depth Sounding Grid Lines */}
          {routeData.gridSteps.map((gridVal) => {
            const y = getY(gridVal);
            return (
              <g key={gridVal}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="rgba(243, 233, 210, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  fill="var(--c-cream-dim)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Departure Date Divider */}
          <line
            x1={presentX}
            y1={paddingTop}
            x2={presentX}
            y2={svgHeight - paddingBottom}
            stroke="var(--c-coral)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text
            x={presentX}
            y={paddingTop - 12}
            fill="var(--c-coral)"
            fontSize="10"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            TODAY'S FIXTURE
          </text>

          {/* Confidence Fan (Toggleable) */}
          {showConfidence && (
            <path
              d={confidenceBandD}
              fill="rgba(47, 184, 198, 0.12)"
              stroke="rgba(47, 184, 198, 0.25)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
          )}

          {/* Historical Path with hand-drawn wobble */}
          <path
            d={actualPathD}
            stroke="var(--c-cream)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#hand-drawn-wobble)"
          />

          {/* Forecast Path */}
          <path
            d={forecastPathD}
            stroke="var(--c-turquoise)"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
            filter="url(#hand-drawn-wobble)"
          />

          {/* Leading Navigator Dot */}
          {isInView && (
            <circle
              cx={presentX}
              cy={getY(series[presentDayIndex].actual)}
              r="5"
              fill="var(--c-coral)"
              stroke="var(--c-cream)"
              strokeWidth="2"
            />
          )}

          {/* Data Points */}
          {series.map((pt, i) => {
            const x = getX(i);
            const isHist = pt.actual !== null;
            const y = getY(isHist ? pt.actual : pt.forecast);
            const isHovered = hoveredPoint && hoveredPoint.date === pt.date;

            return (
              <g key={pt.date}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3}
                  fill={isHist ? 'var(--c-cream)' : 'var(--c-turquoise)'}
                  stroke={isHovered ? 'var(--c-coral)' : 'none'}
                  strokeWidth={isHovered ? 2 : 0}
                />
                {pt.label && (
                  <text
                    x={x}
                    y={svgHeight - paddingBottom + 24}
                    fill="var(--c-cream-dim)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Interactive Scrub Lead Line & Dynamic Sounding Box */}
          {hoveredPoint && hoverX !== null && (
            <g>
              {/* Vertical Sounding Lead Line */}
              <line
                x1={hoverX}
                y1={paddingTop}
                x2={hoverX}
                y2={svgHeight - paddingBottom}
                stroke="var(--c-coral)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              {/* Callout Box */}
              <g
                transform={`translate(${hoverX > svgWidth - 180 ? hoverX - 170 : hoverX + 15}, ${Math.min(
                  svgHeight - paddingBottom - 65,
                  Math.max(paddingTop + 10, getY(hoveredPoint.actual || hoveredPoint.forecast) - 25)
                )})`}
              >
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="54"
                  fill="var(--c-navy)"
                  stroke="var(--c-cream-line)"
                  strokeWidth="1"
                  rx="2"
                  filter="drop-shadow(0 4px 12px rgba(0,0,0,0.8))"
                />
                <text x="10" y="16" fill="var(--c-cream-dim)" fontSize="10" fontFamily="var(--font-mono)">
                  {hoveredPoint.date} • {hoveredPoint.actual !== null ? 'HISTORICAL SPOT' : 'BAYESIAN PROJECTION'}
                </text>
                <text x="10" y="32" fill="var(--c-cream)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                  {routeData.unit}: {hoveredPoint.actual || hoveredPoint.forecast}
                </text>
                {hoveredPoint.upper && (
                  <text x="10" y="46" fill="var(--c-turquoise)" fontSize="9" fontFamily="var(--font-mono)">
                    FAN: [{hoveredPoint.lower} — {hoveredPoint.upper}]
                  </text>
                )}
              </g>
            </g>
          )}
        </svg>

        {/* Bottom Interactive Hint */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            borderTop: '1px solid var(--c-cream-line)',
            background: 'rgba(5, 12, 26, 0.95)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--c-cream-dim)',
          }}
        >
          <span>SCRUB OVER CHART FOR EXACT DAILY SOUNDINGS</span>
          <span>ACTIVE CORRIDOR: {routeData.name}</span>
        </div>
      </div>
    </div>
  );
}
