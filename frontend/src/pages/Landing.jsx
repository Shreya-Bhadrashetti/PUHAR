import React from 'react';
import PinnedHeroSequence from '../components/scene/PinnedHeroSequence';
import MarketSection from '../components/scene/Market_section';
import FreightRateGraph from '../components/scene/FreightRateGraph';
import WeatherSection from '../components/scene/WeatherSection';
import VoyageGuard from '../components/scene/VoyageGuard';

/**
 * Landing Page — "Voyage" Narrative Architecture
 * Sequence:
 * 1. PinnedHeroSequence:
 *    - Beat 1: Illustrated Bay of Bengal layered scene + "PUHAR" pop-in + tagline + Explore
 *    - Scroll 1: Parallax layer shift (bulk carrier ship & waves scale, sky drifts, title fades)
 *    - Beat 2: Statement headline ("Autonomous Voyage Optimization")
 *    - Scroll 2: 4 Feature cards (01 Backhaul, 02 Risk, 03 Forecast, 04 Vessel)
 * 2. Waypoint 01: The Market (Buoy tags at different depths, counts up, drifting fish)
 * 3. Sounding Profile: Freight Rate Graph (Depth sounding profile, BDI 2,006 pts, 95% Bayesian fan)
 * 4. Waypoint 02: Storm Front (Animated falling barometer dial, wind rose, cyclone 03B isobars)
 * 5. Waypoint 03: VoyageGuard (5-stage sequential passage resilience with active chevron vessel)
 * 6. Voyage Handcrafted Footer
 */
export default function Landing({ trendsRef }) {
  return (
    <div className="bg-[#050C1A] text-[#FAF5EB] selection:bg-[#E07A5F] selection:text-white">
      {/* ── SCROLL-PINNED VOYAGE SEQUENCE (Hero + Statement + 4 Feature Cards) ── */}
      <PinnedHeroSequence />

      {/* ── SHARED SVG FILTER DEFINITIONS (Hand-Drawn Nautical Line Wobble) ── */}
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none"
        style={{ position: 'absolute', width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="hand-drawn-wobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── WP 01: THE MARKET ── */}
      <div ref={trendsRef} id="trends">
        <MarketSection />
      </div>

      {/* ── DEPTH SOUNDING PROFILE: FREIGHT RATE GRAPH ── */}
      <div className="bg-[#050C1A] py-10">
        <FreightRateGraph />
      </div>

      {/* ── WP 02: STORM FRONT (WEATHER) ── */}
      <WeatherSection />

      {/* ── WP 03: VOYAGEGUARD COURSE CHANGE 215° ── */}
      <VoyageGuard />

      {/* ── VOYAGE FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-[#D4C3A3]/15 py-12 px-6 bg-[#050C1A]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A1628] border border-[#E07A5F]/40 flex items-center justify-center">
              <span className="font-display font-black text-xs text-[#FAF5EB]">P</span>
            </div>
            <span className="font-display font-bold text-sm tracking-widest text-[#FAF5EB]">PUHAR</span>
          </div>
          <p className="text-xs text-[#D4C3A3]/70 text-center font-body">
            Predictive Unified Hub for Agile Routing — Bulk-Cargo Chartering Advisor for East Coast India Ports
          </p>
          <p className="text-xs text-[#8F836E] font-mono">© 2026 PUHAR • Bay of Bengal</p>
        </div>
      </footer>
    </div>
  );
}
