import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * HeroYachtMotion
 * Recreates the exact ocean sailing motion from motion.mp4 using the isolated 1st yacht asset.
 * Features:
 * - Fluid wave buoyancy (y-axis bobbing + wave pitch rotation)
 * - Multi-layered animated SVG wave swells and foam crests
 * - Interactive 3D mouse parallax tracking
 * - Smooth scroll exit into the deep section / card deck
 */
export default function HeroYachtMotion({ cursor }) {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();

  // Scroll translation: yacht rides down and fades smoothly as scroll deepens
  const scrollYOffset = useTransform(scrollY, [0, 600], [0, 180]);
  const scrollOpacity = useTransform(scrollY, [0, 500], [1, 0.15]);
  const scrollScale = useTransform(scrollY, [0, 600], [1, 0.88]);

  // Reactive cursor parallax
  const cursorOffset = useMemo(() => {
    if (!cursor || !cursor.inside || cursor.x === -999) {
      return { x: 0, y: 0, tilt: 0 };
    }
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const normX = (cursor.x - winW / 2) / (winW / 2);
    const normY = (cursor.y - winH / 2) / (winH / 2);
    return {
      x: normX * 24,
      y: normY * 16,
      tilt: normX * 4,
    };
  }, [cursor]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 2 }}
    >
      {/* ── OCEAN WAVE SWELLS (Behind Yacht) ──────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 h-72 md:h-96 opacity-60">
        {/* Deep ocean gradient layer */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(2,16,38,0.7) 40%, rgba(1,8,20,0.95) 100%)',
          }}
        />

        {/* Animated Background Wave 1 */}
        <motion.div
          className="absolute inset-x-0 bottom-12 h-40"
          animate={{ x: [-40, 40, -40], y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23082548' fill-opacity='0.45' d='M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,213.3C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '1440px 160px',
          }}
        />

        {/* Animated Mid Wave 2 */}
        <motion.div
          className="absolute inset-x-0 bottom-6 h-36"
          animate={{ x: [30, -30, 30], y: [-6, 6, -6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%230e3a6c' fill-opacity='0.55' d='M0,160L60,181.3C120,203,240,245,360,240C480,235,600,181,720,170.7C840,160,960,192,1080,208C1200,224,1320,224,1380,224L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '1440px 150px',
          }}
        />
      </div>

      {/* ── THE 1ST YACHT (Isolated Asset from motion.mp4) ──────────── */}
      <motion.div
        className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-4 sm:left-10 md:left-20 lg:left-28 z-20 pointer-events-auto cursor-pointer"
        style={{
          y: scrollYOffset,
          opacity: scrollOpacity,
          scale: scrollScale,
        }}
        whileHover={{ scale: 1.04 }}
      >
        {/* Parallax Container */}
        <motion.div
          animate={{
            x: cursorOffset.x,
            y: cursorOffset.y,
            rotateZ: cursorOffset.tilt,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="relative"
        >
          {/* Wave Buoyancy & Rocking Motion from motion.mp4 */}
          <motion.div
            animate={{
              y: [0, -20, 6, -14, 0],
              rotate: [-2.8, 3.2, -1.5, 2.4, -2.8],
              x: [0, 6, -4, 5, 0],
            }}
            transition={{
              duration: 6.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {/* Ambient Bioluminescent Water Glow beneath Keel */}
            <div
              className="absolute -bottom-6 left-1/4 w-3/4 h-16 rounded-full blur-xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(0,201,255,0.45) 0%, rgba(6,182,212,0.15) 50%, transparent 80%)',
              }}
            />

            {/* Tactical Vessel Radar Tag */}
            <div className="absolute -top-7 left-12 px-3 py-1 rounded-full border border-cyan-400/40 bg-black/75 backdrop-blur-md flex items-center gap-2 shadow-lg shadow-cyan-500/10">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-300 font-semibold uppercase">
                Bay of Bengal Fleet • Sector 04
              </span>
            </div>

            {/* The 1st Yacht Image */}
            <img
              src="/yacht_clean.png"
              alt="PUHAR Maritime Vessel"
              className="w-64 sm:w-80 md:w-96 lg:w-[440px] xl:w-[480px] h-auto object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] drop-shadow-[0_0_25px_rgba(0,201,255,0.25)] select-none"
              draggable={false}
            />

            {/* Dynamic Water Spray / Foam Wake */}
            <motion.div
              animate={{ opacity: [0.4, 0.9, 0.4], scaleX: [0.95, 1.08, 0.95] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-3 left-6 right-8 h-8 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(56,189,248,0.4) 40%, transparent 80%)',
                filter: 'blur(4px)',
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── FOREGROUND FOAM & SWELL LAYER (In front of yacht keel) ──── */}
      <div className="absolute inset-x-0 bottom-0 h-28 md:h-36 opacity-75 z-30 pointer-events-none">
        <motion.div
          className="absolute inset-x-0 bottom-0 h-28"
          animate={{ x: [-20, 20, -20], y: [2, -4, 2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%230369a1' fill-opacity='0.4' d='M0,224L48,229.3C96,235,192,245,288,234.7C384,224,480,192,576,192C672,192,768,224,864,229.3C960,235,1056,213,1152,197.3C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '1440px 120px',
          }}
        />

        {/* Shimmering Crest Highlight */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 201, 255, 0.08) 50%, rgba(2, 6, 23, 0.95) 100%)',
          }}
        />
      </div>
    </div>
  );
}
