import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Sky from './Sky';
import DistantHills from './DistantHills';
import LighthouseAndCranes from './LighthouseAndCranes';
import BulkCarrierShip from './BulkCarrierShip';
import ForegroundWaves from './ForegroundWaves';
import FeatureCard from './FeatureCard';

/**
 * PinnedHeroSequence
 * Scroll-scrubbed sequence modelled on the reference video motion.mp4:
 * 1. Beat 1, Hero: Full illustrated scene with ship mid-frame, large "PUHAR" pop-in + tagline + Explore button.
 * 2. Scroll 1: Parallax layer drift. Ship & waves move up & scale, title fades out upward.
 * 3. Beat 2: Statement headline fades in over dimmed scene with coral accent keyphrase.
 * 4. Scroll 2: 4 feature cards rise from below with stagger and overflowing illustrated objects.
 * 5. Reverses naturally on scroll back up.
 * 6. Idle loop on ship and waves when idle.
 */
export default function PinnedHeroSequence() {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Scrubbed scroll progress across 300vh
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ── TRANSFORMATIONS (Reversible scrub) ──
  // Beat 1: Title & Hero elements
  const titleY = useTransform(scrollYProgress, [0, 0.28], [0, -120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.92]);

  // Parallax layers
  const skyY = useTransform(scrollYProgress, [0, 0.6], [0, -60]);
  const hillsY = useTransform(scrollYProgress, [0, 0.6], [0, -90]);
  const harborY = useTransform(scrollYProgress, [0, 0.6], [0, -130]);
  const shipY = useTransform(scrollYProgress, [0, 0.45, 0.75], [0, -40, -180]);
  const shipScale = useTransform(scrollYProgress, [0, 0.45], [1, 1.08]);
  const wavesY = useTransform(scrollYProgress, [0, 0.6], [0, -50]);

  // Scene dimming for Beat 2 & 3
  const sceneDim = useTransform(scrollYProgress, [0.22, 0.45], [0, 0.78]);

  // Beat 2: Statement Headline
  const statementOpacity = useTransform(scrollYProgress, [0.26, 0.38, 0.52, 0.60], [0, 1, 1, 0]);
  const statementY = useTransform(scrollYProgress, [0.26, 0.38, 0.52, 0.60], [40, 0, 0, -40]);

  // Beat 3: Feature Cards Rise
  const cardsY = useTransform(scrollYProgress, [0.55, 0.85], ['100%', '0%']);
  const cardsOpacity = useTransform(scrollYProgress, [0.52, 0.75], [0, 1]);

  const handleExploreClick = () => {
    if (containerRef.current) {
      const targetScroll = containerRef.current.offsetTop + window.innerHeight * 0.9;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative h-[320vh] bg-[#050C1A]">
      {/* ── STICKY VIEWPORT CONTAINER ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* ── LAYERED ILLUSTRATED SCENE ── */}
        <div className="absolute inset-0 z-0">
          {/* Layer 1: Sky */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: skyY }}
            className="absolute inset-0"
          >
            <Sky />
          </motion.div>

          {/* Layer 2: Distant Hills (Eastern Ghats) */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: hillsY }}
            className="absolute inset-0"
          >
            <DistantHills />
          </motion.div>

          {/* Layer 3: Lighthouse & Port Cranes */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: harborY }}
            className="absolute inset-0"
          >
            <LighthouseAndCranes />
          </motion.div>

          {/* Layer 4: Loaded Bulk Carrier Ship (Mid-frame) */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: shipY, scale: shipScale }}
            className="absolute inset-x-0 bottom-24 sm:bottom-28 md:bottom-32 flex items-center justify-center z-10"
          >
            <BulkCarrierShip />
          </motion.div>

          {/* Layer 5: Foreground Waves */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: wavesY }}
            className="absolute inset-x-0 bottom-0 z-20"
          >
            <ForegroundWaves />
          </motion.div>

          {/* Scene Dimming Overlay */}
          <motion.div
            style={{ opacity: sceneDim }}
            className="absolute inset-0 bg-[#050C1A] pointer-events-none z-25"
          />
        </div>

        {/* ── BEAT 1: HERO OVERLAY (PUHAR Headline + Tagline + Button) ── */}
        <motion.div
          style={shouldReduceMotion ? {} : { y: titleY, opacity: titleOpacity, scale: titleScale }}
          className="relative z-30 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-48 text-center pointer-events-none"
        >
          {/* Maritime Sector Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A1628]/80 border border-[#D4C3A3]/25 mb-4 backdrop-blur-sm pointer-events-auto"
          >
            <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
            <span className="text-[11px] font-mono tracking-widest text-[#FAF5EB] uppercase font-medium">
              Bay of Bengal • Bulk Cargo Intelligence
            </span>
          </motion.div>

          {/* Dominant "PUHAR" Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
            className="font-display font-black text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] tracking-[0.14em] text-[#FAF5EB] leading-none select-none drop-shadow-[0_8px_24px_rgba(5,12,26,0.9)]"
          >
            PUHAR
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-[#E8DFC8] font-body font-normal tracking-[0.18em] uppercase max-w-xl px-4 drop-shadow-md"
          >
            Smart chartering with backhaul intelligence
          </motion.p>

          {/* "Explore" Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 pointer-events-auto"
          >
            <button
              onClick={handleExploreClick}
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#E07A5F] hover:bg-[#F26444] text-[#FAF5EB] font-heading font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#E07A5F]/30 hover:shadow-[#E07A5F]/50 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#FAF5EB]"
            >
              <span>Explore Platform</span>
              <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </motion.div>
        </motion.div>

        {/* ── BEAT 2: SHORT STATEMENT HEADLINE (Over Dimmed Scene) ── */}
        <motion.div
          style={shouldReduceMotion ? {} : { opacity: statementOpacity, y: statementY }}
          className="absolute inset-0 z-35 flex items-center justify-center px-6 pointer-events-none"
        >
          <div className="max-w-3xl text-center">
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#6DB7BD] mb-3 block">
              The East Coast Corridor Protocol
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#FAF5EB] leading-tight tracking-wide">
              Eliminating ballast legs across Paradip, Haldia & Vizag with{' '}
              <span className="text-[#E07A5F] underline decoration-[#E07A5F]/40 underline-offset-8">
                Autonomous Voyage Optimization
              </span>
              .
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-[#D4C3A3] font-body tracking-wider max-w-lg mx-auto">
              Synthesizing vessel telemetry, dry-bulk market spreads, and Bay of Bengal cyclonic paths into actionable chartering fixtures.
            </p>
          </div>
        </motion.div>

        {/* ── BEAT 3: FOUR FEATURE CARDS (Rise from below with stagger) ── */}
        <motion.div
          id="feature-cards"
          style={shouldReduceMotion ? {} : { y: cardsY, opacity: cardsOpacity }}
          className="absolute inset-x-0 bottom-0 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 pt-6"
        >
          <div className="mb-4 text-center">
            <span className="text-[10px] font-mono tracking-widest text-[#E07A5F] uppercase font-semibold">
              Operational Fleet Modules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {/* Card 01 */}
            <FeatureCard
              number="01"
              tag="ML Fixtures"
              title="Backhaul Matcher + Explainable AI"
              subtitle="Paradip ⇄ Singapore"
              description="Eliminate empty-leg ballast runs with AI-ranked return cargo fixtures and transparent revenue breakdowns."
              to="/backhaul"
              delay={0.05}
              objectIllustration={
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
                  {/* Compass Rose & Intersecting Voyage Arrows */}
                  <circle cx="50" cy="50" r="38" fill="#122B47" stroke="#D4C3A3" strokeWidth="2" />
                  <path d="M50 18 L58 46 L82 50 L58 54 L50 82 L42 54 L18 50 L42 46 Z" fill="#E07A5F" />
                  <circle cx="50" cy="50" r="8" fill="#FAF5EB" />
                  {/* Container cargo block */}
                  <rect x="36" y="62" width="28" height="14" rx="2" fill="#F4A261" stroke="#050C1A" strokeWidth="1.5" />
                  <line x1="43" y1="62" x2="43" y2="76" stroke="#050C1A" strokeWidth="1" />
                  <line x1="50" y1="62" x2="50" y2="76" stroke="#050C1A" strokeWidth="1" />
                  <line x1="57" y1="62" x2="57" y2="76" stroke="#050C1A" strokeWidth="1" />
                </svg>
              }
            />

            {/* Card 02 */}
            <FeatureCard
              number="02"
              tag="Cyclone Shield"
              title="Risk Mitigation & Weather Routing"
              subtitle="Bay of Bengal Sector"
              description="Predictive cyclone path monitors, wave swell alerts, and mandatory rerouting past severe maritime zones."
              to="/risk"
              delay={0.15}
              objectIllustration={
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
                  {/* Cyclone Radar Shield & Lighthouse Beam */}
                  <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="#173445" stroke="#E07A5F" strokeWidth="2.5" />
                  {/* Concentric radar rings */}
                  <circle cx="50" cy="50" r="22" stroke="#6DB7BD" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                  <circle cx="50" cy="50" r="12" stroke="#6DB7BD" strokeWidth="1.5" fill="none" />
                  {/* Warning beacon triangle */}
                  <path d="M50 34 L62 58 L38 58 Z" fill="#E07A5F" />
                  <circle cx="50" cy="53" r="2" fill="#FAF5EB" />
                  <line x1="50" y1="42" x2="50" y2="48" stroke="#FAF5EB" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />

            {/* Card 03 */}
            <FeatureCard
              number="03"
              tag="Market Forecast"
              title="Freight Rate Forecasting"
              subtitle="East Coast Bulk Spreads"
              description="Forecast 30-day spot and period dry bulk rates with seasonal volatility cones and Baltic index correlation."
              to="/forecast"
              delay={0.25}
              objectIllustration={
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
                  {/* Brass Astrolabe / Rising Freight Arc */}
                  <circle cx="50" cy="50" r="36" fill="#122B47" stroke="#F4A261" strokeWidth="2" />
                  {/* Astrolabe quadrant markings */}
                  <path d="M50 14 L50 86 M14 50 L86 50" stroke="#D4C3A3" strokeWidth="1" strokeDasharray="2 2" />
                  {/* Upward market rate curve */}
                  <path d="M26 68 Q 42 62 52 45 T 76 26" stroke="#E07A5F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <circle cx="76" cy="26" r="4.5" fill="#FAF5EB" stroke="#E07A5F" strokeWidth="1.5" />
                </svg>
              }
            />

            {/* Card 04 */}
            <FeatureCard
              number="04"
              tag="CII Compliance"
              title="Vessel Optimization & CII Advisory"
              subtitle="Speed & Emissions Tradeoff"
              description="Balance bunker fuel burn, economic speed, and IMO Carbon Intensity Indicator ratings for maximum net TCE."
              to="/vessel"
              delay={0.35}
              objectIllustration={
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
                  {/* Ship Propeller & Hydrodynamic Stream */}
                  <circle cx="50" cy="50" r="36" fill="#152E3C" stroke="#6DB7BD" strokeWidth="2" />
                  {/* Propeller hub & 4 blades */}
                  <path d="M50 50 C45 35 30 25 35 18 C40 12 55 25 50 50 Z" fill="#E07A5F" />
                  <path d="M50 50 C65 45 75 30 82 35 C88 40 75 55 50 50 Z" fill="#F4A261" />
                  <path d="M50 50 C55 65 70 75 65 82 C60 88 45 75 50 50 Z" fill="#E07A5F" />
                  <path d="M50 50 C35 55 25 70 18 65 C12 60 25 45 50 50 Z" fill="#F4A261" />
                  <circle cx="50" cy="50" r="7" fill="#FAF5EB" />
                </svg>
              }
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
