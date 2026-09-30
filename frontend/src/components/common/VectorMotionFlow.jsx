import { useEffect, useRef } from 'react';

/**
 * VectorMotionFlow
 * High-performance generative vector motion flow canvas.
 * Renders flowing maritime streamlines, velocity vectors, bathymetric contours,
 * and particle tracers with interactive cursor perturbation.
 */
export default function VectorMotionFlow({ cursor, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    // Streamline definitions
    const STREAMLINE_COUNT = 36;
    const streamlines = [];
    for (let i = 0; i < STREAMLINE_COUNT; i++) {
      streamlines.push({
        baseY: (i / STREAMLINE_COUNT) * height,
        speed: 0.0015 + (i % 5) * 0.0006,
        amplitude: 25 + (i % 6) * 12,
        frequency: 0.002 + (i % 4) * 0.001,
        phase: Math.random() * Math.PI * 2,
        colorIndex: i % 4,
        lineWidth: i % 3 === 0 ? 1.5 : 0.8,
        opacity: 0.12 + (i % 4) * 0.08,
      });
    }

    // Floating vector particles
    const PARTICLE_COUNT = 45;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.6 + Math.random() * 1.2,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1.2 + Math.random() * 2,
        trail: [],
        maxTrail: 10 + Math.floor(Math.random() * 14),
        hue: Math.random() > 0.4 ? 'rgba(0, 201, 255,' : 'rgba(79, 209, 197,',
      });
    }

    // Nautical grid points
    const gridPoints = [];
    for (let gx = 80; gx < width; gx += 160) {
      for (let gy = 60; gy < height; gy += 140) {
        gridPoints.push({
          x: gx,
          y: gy,
          lat: (12 + (height - gy) * 0.015).toFixed(2),
          lon: (80 + gx * 0.012).toFixed(2),
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const mouseX = cursor?.inside ? cursor.x : width * 0.5;
      const mouseY = cursor?.inside ? cursor.y : height * 0.4;

      // ── 1. Bathymetric / Contour Streamlines ──
      for (let i = 0; i < streamlines.length; i++) {
        const line = streamlines[i];
        ctx.beginPath();

        let prevX = 0;
        let prevY = line.baseY;

        ctx.moveTo(0, line.baseY);

        for (let x = 0; x <= width; x += 24) {
          // Base harmonic wave
          let y = line.baseY + Math.sin(x * line.frequency + time * line.speed * 60 + line.phase) * line.amplitude;
          y += Math.cos(x * line.frequency * 0.5 - time * 0.5) * (line.amplitude * 0.4);

          // Cursor fluid repulsion / swell
          if (cursor?.inside) {
            const dx = x - mouseX;
            const dy = y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 260) {
              const force = (1 - dist / 260);
              const angle = Math.atan2(dy, dx);
              y += Math.sin(angle) * force * 35;
            }
          }

          ctx.lineTo(x, y);
        }

        const colors = [
          `rgba(0, 201, 255, ${line.opacity})`,
          `rgba(13, 79, 139, ${line.opacity * 1.3})`,
          `rgba(45, 142, 240, ${line.opacity})`,
          `rgba(79, 209, 197, ${line.opacity * 0.9})`,
        ];

        ctx.strokeStyle = colors[line.colorIndex];
        ctx.lineWidth = line.lineWidth;
        ctx.stroke();
      }

      // ── 2. Vector Particles with Velocity Trails ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Store trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.maxTrail) p.trail.shift();

        // Cursor attraction/swirl
        if (cursor?.inside) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 240 && dist > 20) {
            p.vx += (dx / dist) * 0.08;
            p.vy += (dy / dist) * 0.08;
          }
        }

        // Apply velocities with damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        if (p.vx < 0.6) p.vx += 0.04;

        // Wrap edges
        if (p.x > width + 20) {
          p.x = -20;
          p.y = Math.random() * height;
          p.trail = [];
        }
        if (p.y > height + 20) p.y = -20;
        if (p.y < -20) p.y = height + 20;

        // Draw particle trail
        if (p.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let j = 1; j < p.trail.length; j++) {
            ctx.lineTo(p.trail[j].x, p.trail[j].y);
          }
          ctx.strokeStyle = `${p.hue} 0.25)`;
          ctx.lineWidth = p.size * 0.6;
          ctx.stroke();
        }

        // Draw particle head
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.hue} 0.8)`;
        ctx.shadowColor = '#00c9ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── 3. Nautical Coordinate Crosshairs & Vector Markers ──
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
      for (let i = 0; i < gridPoints.length; i++) {
        const pt = gridPoints[i];
        const pulse = (Math.sin(time + pt.pulsePhase) + 1) * 0.5;

        // Crosshair
        ctx.strokeStyle = `rgba(0, 201, 255, ${0.1 + pulse * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt.x - 5, pt.y);
        ctx.lineTo(pt.x + 5, pt.y);
        ctx.moveTo(pt.x, pt.y - 5);
        ctx.lineTo(pt.x, pt.y + 5);
        ctx.stroke();

        // Coordinate text
        if (i % 2 === 0) {
          ctx.fillText(`${pt.lat}°N ${pt.lon}°E`, pt.x + 8, pt.y + 12);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [cursor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      style={{ zIndex: 1 }}
    />
  );
}
