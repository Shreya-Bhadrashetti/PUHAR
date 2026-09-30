import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * FeatureCard
 * Hand-crafted voyage feature card with an illustrated vector object that overflows the top rim.
 * Style: Warm sunrise-to-dusk Bay of Bengal palette, clean typography, uneven rhythm, no generic glassmorphic blobs.
 */
export default function FeatureCard({
  number,
  title,
  subtitle,
  description,
  to,
  tag,
  objectIllustration,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-50px' }}
      transition={{ duration: 0.8, delay, ease: [0.19, 1, 0.22, 1] }}
      className="relative flex flex-col pt-16 sm:pt-20 pb-8 px-6 sm:px-7 rounded-2xl bg-[#0A1628]/95 border border-[#D4C3A3]/25 shadow-xl hover:border-[#E07A5F]/60 transition-all duration-300 group hover:-translate-y-2"
      style={{
        boxShadow: '0 20px 40px -15px rgba(5,12,26,0.85), inset 0 1px 0 rgba(250,245,235,0.08)',
      }}
    >
      {/* ── OVERFLOWING ILLUSTRATED OBJECT (Bursts past card top) ── */}
      <div className="absolute -top-14 sm:-top-16 left-1/2 -translate-x-1/2 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center pointer-events-none group-hover:scale-108 transition-transform duration-300">
        {objectIllustration}
      </div>

      {/* Top Meta: Number + Tag */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#E07A5F] tracking-tight">
          {number}
        </span>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#122B47] text-[#6DB7BD] border border-[#6DB7BD]/30">
          {tag}
        </span>
      </div>

      {/* Card Title */}
      <h3 className="font-display font-bold text-lg sm:text-xl text-[#FAF5EB] tracking-wide mb-2 group-hover:text-[#FAF5EB] transition-colors leading-snug">
        {title}
      </h3>

      {/* Subtitle / Corridor */}
      <p className="text-[11px] font-mono uppercase tracking-wider text-[#D4C3A3]/75 mb-3">
        {subtitle}
      </p>

      {/* Description */}
      <p className="text-xs sm:text-sm text-[#E8DFC8]/90 leading-relaxed font-body flex-1 mb-6">
        {description}
      </p>

      {/* "Learn more" / "Explore Module" Outline Button */}
      <Link
        to={to}
        className="inline-flex items-center justify-between px-5 py-2.5 rounded-xl border border-[#D4C3A3]/40 text-xs font-semibold text-[#FAF5EB] uppercase tracking-wider hover:bg-[#E07A5F] hover:border-[#E07A5F] hover:text-[#FAF5EB] transition-all group/btn focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
      >
        <span>Launch Module</span>
        <svg
          className="w-4 h-4 text-[#D4C3A3] group-hover/btn:text-[#FAF5EB] group-hover/btn:translate-x-1 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </motion.div>
  );
}
