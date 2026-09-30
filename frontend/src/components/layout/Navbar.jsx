import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * Fixed Navbar (Voyage Theme)
 * - Left: PUHAR wordmark + hand-crafted nautical logo mark (compass/sail/anchor motif)
 * - Center: Dashboard, About PUHAR, Trends (smooth scroll + scroll-spy active state)
 * - Right: Profile chip with avatar and Indian username "kaveri_nair" with dropdown
 */
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll spy on landing page
  useEffect(() => {
    if (location.pathname !== '/') return;

    function handleScroll() {
      const scrollY = window.scrollY;
      const heroThreshold = window.innerHeight * 0.7;
      const cardsEl = document.getElementById('feature-cards') || document.getElementById('about');
      const trendsEl = document.getElementById('trends');

      const trendsTop = trendsEl ? trendsEl.offsetTop - 200 : 2400;
      const cardsTop = cardsEl ? cardsEl.offsetTop - 200 : 800;

      if (scrollY >= trendsTop) {
        setActiveSection('trends');
      } else if (scrollY >= cardsTop) {
        setActiveSection('about');
      } else {
        setActiveSection('dashboard');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Handle nav clicks
  const handleNavClick = (sectionId, e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      if (sectionId === 'dashboard') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
      setActiveSection(sectionId);
    } else {
      // Navigate to landing and pass hash to scroll after mount
      navigate(`/#${sectionId}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050C1A]/90 backdrop-blur-md border-b border-[#D4C3A3]/15 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* ── LEFT: PUHAR NAUTICAL LOGO & WORDMARK ── */}
        <Link
          to="/"
          onClick={(e) => handleNavClick('dashboard', e)}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#E07A5F] rounded-lg px-1.5 py-1"
        >
          {/* Nautical Compass & Sail Logo Mark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#122B47] to-[#0A1628] border border-[#E07A5F]/40 flex items-center justify-center shadow-md shadow-[#050C1A]/80 group-hover:border-[#E07A5F] transition-colors">
            <svg
              className="w-6 h-6 text-[#FAF5EB] group-hover:scale-105 transition-transform"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer compass ring */}
              <circle cx="16" cy="16" r="13" stroke="#D4C3A3" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.7" />
              {/* Starboard Sail motif in Coral Accent */}
              <path d="M16 5 L23 20 L16 18 Z" fill="#E07A5F" />
              {/* Port Sail motif in Sand Pale */}
              <path d="M16 7 L10 20 L16 18 Z" fill="#FAF5EB" opacity="0.9" />
              {/* Keel / hull base */}
              <path d="M8 22 Q 16 26 24 22 L22 25 Q 16 28 10 25 Z" fill="#D4C3A3" />
              {/* Compass needle center pivot */}
              <circle cx="16" cy="18" r="1.5" fill="#FAF5EB" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-display font-black text-xl sm:text-2xl tracking-[0.14em] text-[#FAF5EB] leading-none">
              PUHAR
            </span>
            <span className="text-[9px] uppercase tracking-[0.24em] text-[#D4C3A3]/80 font-medium mt-1">
              East Coast Chartering
            </span>
          </div>
        </Link>

        {/* ── CENTER: NAVIGATION LINKS ── */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-full bg-[#0A1628]/80 border border-[#D4C3A3]/15">
          <button
            onClick={(e) => handleNavClick('dashboard', e)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
              activeSection === 'dashboard' && location.pathname === '/'
                ? 'bg-[#E07A5F] text-[#FAF5EB] shadow-md shadow-[#E07A5F]/25'
                : 'text-[#E8DFC8] hover:text-[#FAF5EB] hover:bg-[#122238]/60'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={(e) => handleNavClick('feature-cards', e)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
              activeSection === 'about' && location.pathname === '/'
                ? 'bg-[#E07A5F] text-[#FAF5EB] shadow-md shadow-[#E07A5F]/25'
                : 'text-[#E8DFC8] hover:text-[#FAF5EB] hover:bg-[#122238]/60'
            }`}
          >
            About PUHAR
          </button>

          <button
            onClick={(e) => handleNavClick('trends', e)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
              activeSection === 'trends' && location.pathname === '/'
                ? 'bg-[#E07A5F] text-[#FAF5EB] shadow-md shadow-[#E07A5F]/25'
                : 'text-[#E8DFC8] hover:text-[#FAF5EB] hover:bg-[#122238]/60'
            }`}
          >
            Trends
          </button>
        </nav>

        {/* ── RIGHT: INDIAN PROFILE CHIP ("kaveri_nair") ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0A1628] hover:bg-[#122238] border border-[#D4C3A3]/25 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {/* Illustrated Maritime Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2A4860] to-[#E07A5F] p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0A1628] flex items-center justify-center text-[11px] font-bold text-[#FAF5EB] font-heading">
                KN
              </div>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#FAF5EB] font-heading leading-tight">
                kaveri_nair
              </span>
              <span className="text-[9px] text-[#6DB7BD] font-medium leading-none">
                Fleet Dispatcher
              </span>
            </div>

            {/* Chevron icon */}
            <svg
              className={`w-3.5 h-3.5 text-[#D4C3A3] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-52 rounded-xl bg-[#0A1628] border border-[#D4C3A3]/20 shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-[#D4C3A3]/10">
                <p className="font-semibold text-[#FAF5EB]">Kaveri Nair</p>
                <p className="text-[10px] text-[#8F836E]">kaveri.nair@paradip-charter.in</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                  <span className="text-[10px] text-[#2A9D8F] font-medium">Paradip Port Active</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-[#E8DFC8] hover:bg-[#122238] hover:text-[#FAF5EB] transition-colors flex items-center justify-between"
                >
                  <span>Charterer Profile</span>
                  <span className="text-[9px] text-[#8F836E]">Shift A</span>
                </button>
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-[#E8DFC8] hover:bg-[#122238] hover:text-[#FAF5EB] transition-colors"
                >
                  Fleet Settings
                </button>
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-[#E8DFC8] hover:bg-[#122238] hover:text-[#FAF5EB] transition-colors"
                >
                  Port Preferences
                </button>
              </div>

              <div className="pt-1 border-t border-[#D4C3A3]/10">
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-[#E07A5F] hover:bg-[#122238] transition-colors font-medium"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
