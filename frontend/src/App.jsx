import { useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import CharterAdvisor from './pages/CharterAdvisor';
import BackhaulMatches from './pages/BackhaulMatches';
import RiskAlerts from './pages/RiskAlerts';
import Forecast from './pages/Forecast';
import VesselOptimization from './pages/VesselOptimization';

export default function App() {
  const location = useLocation();

  // Refs for smooth-scroll nav targets (only used on Landing)
  const featuresRef = useRef(null);
  const trendsRef = useRef(null);

  // Navbar is shown on all pages
  return (
    <>
      <Navbar featuresRef={featuresRef} trendsRef={trendsRef} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Landing featuresRef={featuresRef} trendsRef={trendsRef} />
            }
          />
          <Route path="/charter" element={<CharterAdvisor />} />
          <Route path="/backhaul" element={<BackhaulMatches />} />
          <Route path="/risk" element={<RiskAlerts />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/vessel" element={<VesselOptimization />} />
          <Route path="/vessel-optimization" element={<VesselOptimization />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
                <p className="font-display font-bold text-6xl text-gray-800">404</p>
                <p className="text-gray-500">Page not found</p>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}
