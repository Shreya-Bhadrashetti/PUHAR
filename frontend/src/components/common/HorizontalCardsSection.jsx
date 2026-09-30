import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Ship,
  ArrowRight,
  ShieldCheck,
  Compass,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const CARDS = [
  {
    id: 'backhaul',
    route: '/backhaul',
    badge: '01',
    title: 'Backhaul Matcher',
    subtitle: 'Explainability AI',
    tag: 'ROUTE OPTIMIZATION',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    description:
      'Eliminate empty return voyages by matching high-value export commodities across East Coast Indian ports with transparent AI rationale.',
    points: [
      'Documented port export commodity matching',
      'Origin-to-destination trade lane alignment',
      'Explainable AI reasoning log with confidence score',
      'Direct integration with Paradip, Vizag & Haldia ports',
    ],
    icon: RotateCcw,
    themeColor: '#00c9ff',
    gradient: 'from-cyan-500/20 via-blue-600/10 to-transparent',
    glowColor: 'rgba(0, 201, 255, 0.25)',
    borderGlow: 'hover:border-cyan-400/50',
  },
  {
    id: 'risk',
    route: '/risk',
    badge: '02',
    title: 'Risk Mitigation',
    subtitle: 'Cyclone & Congestion AI',
    tag: 'REAL-TIME SAFETY',
    tagColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    description:
      'Continuous maritime hazard tracking in the Bay of Bengal with automatic cyclone corridor analysis and mandatory safe-haven rerouting.',
    points: [
      'GDACS & Open-Meteo live cyclone corridor track',
      'Automatic mandatory reroute on Red Alerts',
      'Port wind, wave height and squall warnings',
      'Vessel draft & LOA safety check at alternate ports',
    ],
    icon: AlertTriangle,
    themeColor: '#f97316',
    gradient: 'from-orange-500/20 via-red-600/10 to-transparent',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    borderGlow: 'hover:border-orange-400/50',
  },
  {
    id: 'forecast',
    route: '/forecast',
    badge: '03',
    title: 'Freight Forecasting',
    subtitle: 'Rate Intelligence ML',
    tag: 'PREDICTIVE ANALYTICS',
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    description:
      'RandomForest-trained 7-day spot freight forecasting for key corridors including Australia, Indonesia, and South Africa to East Coast India.',
    points: [
      '7-day spot rate forward projection ($/ton)',
      'Optimal charter window date recommendation',
      'Dry-bulk market volatility benchmarking',
      'Panamax, Capesize & Supramax historical curves',
    ],
    icon: TrendingUp,
    themeColor: '#10b981',
    gradient: 'from-emerald-500/20 via-teal-600/10 to-transparent',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    borderGlow: 'hover:border-emerald-400/50',
  },
  {
    id: 'vessel',
    route: '/vessel-optimization',
    badge: '04',
    title: 'Vessel Optimization',
    subtitle: 'Voyage Cost Economics',
    tag: 'FLEET EFFICIENCY',
    tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    description:
      'Optimize vessel selection, fuel consumption and total voyage expense against authoritative physical port limits and terminal wait times.',
    points: [
      'Physical port draft, beam, LOA & DWT validation',
      'Singapore HSFO bunker fuel price integration',
      'Anchorage & berth congestion idle day calculation',
      'Comprehensive total voyage cost & sea-day model',
    ],
    icon: Ship,
    themeColor: '#a855f7',
    gradient: 'from-purple-500/20 via-indigo-600/10 to-transparent',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    borderGlow: 'hover:border-purple-400/50',
  },
];

export default function HorizontalCardsSection({ sectionRef }) {
  const navigate = useNavigate();
  const targetRef = useRef(null);

  // Map vertical scroll of this pinned container into horizontal translation
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Smooth scroll translation from 3% to -62% across the 4 wide cards
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-60%']);

  return (
    <section ref={targetRef} className="relative bg-black h-[320vh]">
      {/* Sticky viewport container */}
      <div
        ref={sectionRef}
        className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center px-6 md:px-12"
      >
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #00c9ff, transparent 70%)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #7928ca, transparent 70%)' }}
          />
        </div>

        {/* Section Header */}
        <div className="max-w-7xl mx-auto w-full mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                Platform Intelligence Suite
              </p>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-white tracking-tight">
              Modular Maritime Decision Engine
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
            <span>SCROLL TO EXPLORE DECK</span>
            <span className="animate-pulse">→</span>
          </div>
        </div>

        {/* Horizontal Scrolling Card Track */}
        <div className="relative w-full overflow-visible z-10">
          <motion.div style={{ x }} className="flex gap-8 w-max pl-2 pr-24">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`relative w-[340px] sm:w-[420px] md:w-[480px] h-[520px] rounded-3xl p-8 flex flex-col justify-between backdrop-blur-2xl bg-white/[0.03] border border-white/10 ${card.borderGlow} transition-all duration-300 shadow-2xl group overflow-hidden`}
                  style={{
                    boxShadow: `0 20px 50px -15px ${card.glowColor}`,
                  }}
                >
                  {/* Subtle Card Gradient Tint */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none`}
                  />

                  {/* Top Row: Tag, Badge & Animated Floating Icon */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <span
                        className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${card.tagColor} tracking-widest`}
                      >
                        {card.tag}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-gray-500 group-hover:text-white transition-colors">
                          {card.badge}
                        </span>
                        {/* Floating Icon Sphere */}
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/[0.05] group-hover:scale-110 transition-transform duration-300"
                          style={{
                            boxShadow: `0 0 25px ${card.glowColor}`,
                          }}
                        >
                          <Icon className="w-6 h-6 text-white" style={{ color: card.themeColor }} />
                        </motion.div>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-1 group-hover:text-cyan-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono tracking-wider uppercase mb-4">
                      {card.subtitle}
                    </p>

                    <p className="text-sm text-gray-300 leading-relaxed mb-6 font-light">
                      {card.description}
                    </p>
                  </div>

                  {/* Middle Feature Highlights List */}
                  <div className="relative z-10 space-y-2 mb-6">
                    {card.points.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-400">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: card.themeColor }}
                        />
                        <span className="line-clamp-1">{pt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Action Button */}
                  <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(card.route)}
                      className="w-full py-3.5 px-6 rounded-xl flex items-center justify-between text-sm font-semibold text-white transition-all duration-300 group/btn"
                      style={{
                        background: `linear-gradient(135deg, ${card.glowColor}, rgba(255,255,255,0.05))`,
                        border: `1px solid ${card.themeColor}55`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = card.themeColor;
                        e.currentTarget.style.boxShadow = `0 0 30px ${card.glowColor}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${card.themeColor}55`;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span>Explore Module</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Scroll Progress Bar at Bottom of Pinned View */}
        <div className="max-w-7xl mx-auto w-full mt-8 relative z-10 flex items-center gap-4">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              style={{ scaleX: scrollYProgress, transformOrigin: '0%' }}
              className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-500 rounded-full"
            />
          </div>
          <span className="text-[11px] font-mono text-gray-500">01 / 04</span>
        </div>
      </div>
    </section>
  );
}
