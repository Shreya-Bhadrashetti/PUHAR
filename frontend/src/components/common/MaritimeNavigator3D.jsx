import { useRef, useEffect } from 'react';

/**
 * MaritimeNavigator3D
 * Centered responsive 3D maritime navigator whose head and eyes smoothly follow the cursor.
 * Uses lerped 3D perspective transforms with cybernetic maritime styling.
 */
export default function MaritimeNavigator3D({ cursor }) {
  const containerRef = useRef(null);
  const headRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);

  const stateRef = useRef({
    currentYaw: 0,
    currentPitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    pupilX: 0,
    pupilY: 0,
    targetPupilX: 0,
    targetPupilY: 0,
    ambientAngle: 0,
  });

  useEffect(() => {
    let animId;
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const loop = () => {
      const state = stateRef.current;
      state.ambientAngle += 0.02;

      if (cursor && cursor.inside && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Relative delta from center
        const dx = cursor.x + (rect.left > 0 ? 0 : 0); // cursor is relative to hero
        // Better: calculate angle towards cursor
        const heroEl = containerRef.current.parentElement;
        const heroRect = heroEl ? heroEl.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        const relX = (cursor.x - heroRect.width / 2) / (heroRect.width / 2);
        const relY = (cursor.y - heroRect.height / 2) / (heroRect.height / 2);

        // Clamped subtle head angles (-18 to +18 deg)
        state.targetYaw = Math.max(-18, Math.min(18, relX * 22));
        state.targetPitch = Math.max(-14, Math.min(14, -relY * 18));

        // Pupil offsets (-6px to +6px)
        state.targetPupilX = Math.max(-5, Math.min(5, relX * 6));
        state.targetPupilY = Math.max(-4, Math.min(4, relY * 5));
      } else {
        // Return gently to center with subtle ambient sway
        state.targetYaw = Math.sin(state.ambientAngle * 0.7) * 4;
        state.targetPitch = Math.cos(state.ambientAngle * 0.5) * 2;
        state.targetPupilX = Math.sin(state.ambientAngle * 0.7) * 1.5;
        state.targetPupilY = Math.cos(state.ambientAngle * 0.5) * 1;
      }

      // Smooth lerp (0.07 factor ensures butter-smooth tracking with zero snapping)
      state.currentYaw = lerp(state.currentYaw, state.targetYaw, 0.07);
      state.currentPitch = lerp(state.currentPitch, state.targetPitch, 0.07);
      state.pupilX = lerp(state.pupilX, state.targetPupilX, 0.09);
      state.pupilY = lerp(state.pupilY, state.targetPupilY, 0.09);

      if (headRef.current) {
        headRef.current.style.transform = `perspective(900px) rotateX(${state.currentPitch.toFixed(2)}deg) rotateY(${state.currentYaw.toFixed(2)}deg)`;
      }

      if (leftPupilRef.current) {
        leftPupilRef.current.style.transform = `translate(${state.pupilX.toFixed(2)}px, ${state.pupilY.toFixed(2)}px)`;
      }
      if (rightPupilRef.current) {
        rightPupilRef.current.style.transform = `translate(${state.pupilX.toFixed(2)}px, ${state.pupilY.toFixed(2)}px)`;
      }

      if (ring1Ref.current) {
        ring1Ref.current.style.transform = `perspective(800px) rotateX(${(state.currentPitch * 0.5).toFixed(2)}deg) rotateY(${(state.currentYaw * 0.5).toFixed(2)}deg) rotateZ(${(state.ambientAngle * 10).toFixed(2)}deg)`;
      }
      if (ring2Ref.current) {
        ring2Ref.current.style.transform = `perspective(800px) rotateX(${(-state.currentPitch * 0.4).toFixed(2)}deg) rotateY(${(-state.currentYaw * 0.4).toFixed(2)}deg) rotateZ(${(-state.ambientAngle * 7).toFixed(2)}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [cursor]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* Holographic Navigational Rings */}
        <div
          ref={ring1Ref}
          className="absolute inset-0 rounded-full border border-cyan-400/20"
          style={{
            borderStyle: 'dashed',
            borderDasharray: '6 8',
            boxShadow: '0 0 40px rgba(0,201,255,0.08)',
            willChange: 'transform',
          }}
        />
        <div
          ref={ring2Ref}
          className="absolute inset-6 rounded-full border border-blue-500/20"
          style={{
            borderStyle: 'dotted',
            borderDasharray: '4 12',
            willChange: 'transform',
          }}
        />

        {/* 3D Head Container */}
        <div
          ref={headRef}
          className="relative w-44 h-52 md:w-52 md:h-60 flex flex-col items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* Cybernetic Nav Head Base / Helmet */}
          <div
            className="relative w-36 h-44 md:w-44 md:h-52 rounded-3xl overflow-hidden border border-cyan-400/30 backdrop-blur-md"
            style={{
              background: 'linear-gradient(165deg, rgba(13,79,139,0.35) 0%, rgba(8,8,8,0.75) 60%, rgba(0,201,255,0.15) 100%)',
              boxShadow: '0 0 30px rgba(0,201,255,0.2), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            {/* Forehead Nav Compass Marker */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-70">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <div className="w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            {/* Visor Area */}
            <div className="absolute top-12 md:top-14 left-3 right-3 h-16 md:h-18 rounded-2xl bg-black/80 border border-cyan-400/40 p-2 flex items-center justify-around shadow-inner">
              {/* Left Eye */}
              <div className="relative w-10 h-7 md:w-12 md:h-8 rounded-full bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center overflow-hidden">
                <div
                  ref={leftPupilRef}
                  className="relative w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_12px_#00c9ff] flex items-center justify-center"
                  style={{ willChange: 'transform' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                </div>
                {/* HUD Eye Reticle */}
                <div className="absolute inset-0 border border-cyan-300/30 rounded-full pointer-events-none" />
              </div>

              {/* Center Bridge Sensor */}
              <div className="w-1 h-3 rounded bg-cyan-400/40" />

              {/* Right Eye */}
              <div className="relative w-10 h-7 md:w-12 md:h-8 rounded-full bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center overflow-hidden">
                <div
                  ref={rightPupilRef}
                  className="relative w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_12px_#00c9ff] flex items-center justify-center"
                  style={{ willChange: 'transform' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                </div>
                {/* HUD Eye Reticle */}
                <div className="absolute inset-0 border border-cyan-300/30 rounded-full pointer-events-none" />
              </div>
            </div>

            {/* Chin / Maritime Audio Filter Grid */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60">
              <div className="w-12 h-0.5 bg-cyan-400/40 rounded-full" />
              <div className="w-8 h-0.5 bg-cyan-400/30 rounded-full" />
              <div className="w-4 h-0.5 bg-cyan-400/20 rounded-full" />
            </div>

            {/* Scanning Laser Sweep */}
            <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none animate-pulse" />
          </div>

          {/* Neck / Collar Assembly */}
          <div
            className="w-24 h-6 md:w-30 md:h-8 -mt-1 rounded-b-xl border border-cyan-500/20 bg-dark-3/80 flex items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(180deg, rgba(13,13,13,0.9) 0%, rgba(8,8,8,0.95) 100%)',
            }}
          >
            <span className="w-1 h-1 rounded-full bg-cyan-400/70" />
            <span className="text-[8px] font-mono tracking-widest text-cyan-400/60 uppercase">NAV·AI</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
