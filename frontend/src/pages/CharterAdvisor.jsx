import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

import { advise, isAuthenticated } from '../api/charter';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import AuthModal from '../components/common/AuthModal';

const PRESET_SCENARIOS = [
  {
    name: 'Australia → Paradip (Panamax 75k)',
    description: 'Standard coal bulk route with high congestion monitoring at Paradip.',
    payload: {
      route: 'Australia-Paradip',
      origin_port: 'Hay Point',
      origin_region: 'Australia',
      destination: 'Paradip',
      candidate_ports: ['Paradip', 'Visakhapatnam', 'Gangavaram', 'Haldia'],
      vessel_name: 'MV Puhar Pioneer',
      vessel_class: 'Panamax',
      dwt: '75000',
      draft: '12.8',
      loa: '225',
      beam: '32.2',
      lat: '15.5',
      lon: '85.2',
      cargo: '70000',
      departure_date: new Date().toISOString().split('T')[0],
      eta: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16),
    },
  },
  {
    name: 'Indonesia → Haldia (Supramax 55k)',
    description: 'Shallow draft riverine port corridor with strict physical draft limits.',
    payload: {
      route: 'Indonesia-Haldia',
      origin_port: 'Taboneo',
      origin_region: 'Indonesia',
      destination: 'Haldia',
      candidate_ports: ['Haldia', 'Paradip', 'Visakhapatnam'],
      vessel_name: 'MV Bengal Voyager',
      vessel_class: 'Supramax',
      dwt: '56000',
      draft: '11.5',
      loa: '190',
      beam: '32.2',
      lat: '18.2',
      lon: '86.5',
      cargo: '52000',
      departure_date: new Date().toISOString().split('T')[0],
      eta: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 16),
    },
  },
  {
    name: 'Cyclone Threat Test (Bay of Bengal)',
    description: 'Simulates vessel approaching East Coast with severe weather monitoring.',
    payload: {
      route: 'Australia-Vizag',
      origin_port: 'Gladstone',
      origin_region: 'Australia',
      destination: 'Visakhapatnam',
      candidate_ports: ['Visakhapatnam', 'Gangavaram', 'Chennai', 'Paradip'],
      vessel_name: 'MV Storm Tracker',
      vessel_class: 'Capesize',
      dwt: '180000',
      draft: '17.5',
      loa: '292',
      beam: '45.0',
      lat: '16.8',
      lon: '84.1',
      cargo: '165000',
      departure_date: new Date().toISOString().split('T')[0],
      eta: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    },
  },
];

const ROUTE_OPTIONS = [
  'Australia-Paradip',
  'Australia-Vizag',
  'Australia-Gangavaram',
  'Australia-Haldia',
  'Indonesia-Paradip',
  'Indonesia-Vizag',
  'Indonesia-Gangavaram',
  'Indonesia-Haldia',
  'SouthAfrica-Paradip',
  'SouthAfrica-Vizag',
  'SouthAfrica-Gangavaram',
  'SouthAfrica-Haldia',
];

const PORT_OPTIONS = [
  'Paradip',
  'Visakhapatnam',
  'Gangavaram',
  'Haldia',
  'Chennai',
  'Ennore',
  'Gopalpur',
  'Dhamra',
  'Kakinada',
  'Krishnapatnam',
];

const VESSEL_CLASSES = ['Handysize', 'Supramax', 'Panamax', 'Capesize'];

export default function CharterAdvisor() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    route: 'Australia-Paradip',
    origin_port: 'Hay Point',
    origin_region: 'Australia',
    destination: 'Paradip',
    candidate_ports: ['Paradip', 'Visakhapatnam', 'Gangavaram', 'Haldia'],
    vessel_name: 'MV Puhar Star',
    vessel_class: 'Panamax',
    dwt: '75000',
    draft: '12.8',
    loa: '225',
    beam: '32.2',
    lat: '15.5',
    lon: '85.2',
    cargo: '70000',
    departure_date: new Date().toISOString().split('T')[0],
    eta: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCandidatePort = (port) => {
    setForm((prev) => {
      const exists = prev.candidate_ports.includes(port);
      const updated = exists
        ? prev.candidate_ports.filter((p) => p !== port)
        : [...prev.candidate_ports, port];
      return { ...prev, candidate_ports: updated.length ? updated : [port] };
    });
  };

  const loadPreset = (preset) => {
    setForm({ ...preset.payload });
    setResult(null);
    setError(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitted(true);

    try {
      const payload = {
        vessel: {
          name: form.vessel_name || 'Vessel',
          vessel_class: form.vessel_class || null,
          dwt: form.dwt ? parseFloat(form.dwt) : null,
          loa_m: form.loa ? parseFloat(form.loa) : null,
          beam_m: form.beam ? parseFloat(form.beam) : null,
          draft_m: form.draft ? parseFloat(form.draft) : null,
          lat: form.lat ? parseFloat(form.lat) : null,
          lon: form.lon ? parseFloat(form.lon) : null,
        },
        origin_region: form.origin_region,
        destination: form.destination,
        candidate_ports: form.candidate_ports.length > 0 ? form.candidate_ports : [form.destination],
        route: form.route,
        vessel_class: form.vessel_class,
        departure_date: form.departure_date ? new Date(form.departure_date).toISOString() : null,
        eta: form.eta ? new Date(form.eta).toISOString() : null,
        origin_port: form.origin_port || null,
        cargo_quantity_mt: form.cargo ? parseFloat(form.cargo) : null,
      };

      const res = await advise(payload);
      setResult(res);
      setActiveTab('summary');
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthed(false);
        setError('Authentication required. Please sign in to run the Charter Advisor.');
      } else {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Unified advisor pipeline run failed. Please check inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setSubmitted(false);
  };

  if (!authed) return <AuthModal onSuccess={() => setAuthed(true)} />;

  const isMandatoryReroute = result?.recommendation?.mandatory_reroute;
  const recommendedDest = result?.recommendation?.destination || form.destination;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 15%, rgba(0,201,255,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-display font-bold text-3xl text-white tracking-tight">
                    Charter Advisor
                  </h1>
                  <p className="text-xs text-cyan-400 font-mono tracking-wider uppercase">
                    Unified Multi-Model Maritime Orchestration
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
                Execute PUHAR’s comprehensive chartering pipeline in one run: freight forecasting,
                physical port limits, backhaul return matches, cyclone & traffic risks, and vessel cost optimization.
              </p>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-300 font-mono">Backend Pipeline Active</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Quick Scenarios:</span>
            {PRESET_SCENARIOS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => loadPreset(p)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-500/10 text-gray-300 hover:text-white transition-all duration-200"
              >
                {p.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Inputs Form (5 columns) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <h2 className="font-semibold text-sm text-white uppercase tracking-wider">
                  Voyage Parameters
                </h2>
                <span className="text-[11px] font-mono text-cyan-400/80">AdvisorRequest Schema</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Route & Ports Group */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-cyan-400/90 uppercase tracking-wider">
                    Corridor & Routing
                  </p>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Market Benchmark Route *</label>
                    <select
                      name="route"
                      value={form.route}
                      onChange={handleChange}
                      className="puhar-input text-xs"
                      style={{ colorScheme: 'dark' }}
                      required
                    >
                      {ROUTE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r.replace('-', ' → ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Origin Port</label>
                      <input
                        name="origin_port"
                        value={form.origin_port}
                        onChange={handleChange}
                        placeholder="e.g. Hay Point"
                        className="puhar-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Origin Region *</label>
                      <input
                        name="origin_region"
                        value={form.origin_region}
                        onChange={handleChange}
                        placeholder="e.g. Australia"
                        className="puhar-input text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Primary Destination Port *</label>
                    <select
                      name="destination"
                      value={form.destination}
                      onChange={handleChange}
                      className="puhar-input text-xs"
                      style={{ colorScheme: 'dark' }}
                      required
                    >
                      {PORT_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Candidate Ports Tag Selector */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Candidate Alternate Ports for Feasibility Assessment
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PORT_OPTIONS.slice(0, 6).map((p) => {
                        const isSelected = form.candidate_ports.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => toggleCandidatePort(p)}
                            className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 font-medium'
                                : 'bg-white/[0.02] border-white/10 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {p} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-2" />

                {/* Vessel Group */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-cyan-400/90 uppercase tracking-wider">
                    Vessel Specifications
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Vessel Name</label>
                      <input
                        name="vessel_name"
                        value={form.vessel_name}
                        onChange={handleChange}
                        placeholder="MV Puhar Star"
                        className="puhar-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Vessel Class *</label>
                      <select
                        name="vessel_class"
                        value={form.vessel_class}
                        onChange={handleChange}
                        className="puhar-input text-xs"
                        style={{ colorScheme: 'dark' }}
                        required
                      >
                        {VESSEL_CLASSES.map((vc) => (
                          <option key={vc} value={vc}>
                            {vc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">DWT (MT) *</label>
                      <input
                        name="dwt"
                        type="number"
                        value={form.dwt}
                        onChange={handleChange}
                        placeholder="75000"
                        className="puhar-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Draft (m)</label>
                      <input
                        name="draft"
                        type="number"
                        step="0.1"
                        value={form.draft}
                        onChange={handleChange}
                        placeholder="12.8"
                        className="puhar-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">LOA (m)</label>
                      <input
                        name="loa"
                        type="number"
                        step="0.1"
                        value={form.loa}
                        onChange={handleChange}
                        placeholder="225"
                        className="puhar-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Beam (m)</label>
                      <input
                        name="beam"
                        type="number"
                        step="0.1"
                        value={form.beam}
                        onChange={handleChange}
                        placeholder="32.2"
                        className="puhar-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Position Lat (deg)</label>
                      <input
                        name="lat"
                        type="number"
                        step="0.001"
                        value={form.lat}
                        onChange={handleChange}
                        placeholder="15.5"
                        className="puhar-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Position Lon (deg)</label>
                      <input
                        name="lon"
                        type="number"
                        step="0.001"
                        value={form.lon}
                        onChange={handleChange}
                        placeholder="85.2"
                        className="puhar-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-2" />

                {/* Cargo & Dates */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-cyan-400/90 uppercase tracking-wider">
                    Cargo & Voyage Schedule
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Cargo Quantity (MT)</label>
                      <input
                        name="cargo"
                        type="number"
                        value={form.cargo}
                        onChange={handleChange}
                        placeholder="70000"
                        className="puhar-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Departure Date</label>
                      <input
                        name="departure_date"
                        type="date"
                        value={form.departure_date}
                        onChange={handleChange}
                        className="puhar-input text-xs"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={loading || !form.destination || !form.route}
                    className="btn-primary flex-1 justify-center py-3"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-cyan-400 spin-ring" />
                        Running Pipeline...
                      </span>
                    ) : (
                      'Run Charter Advisor'
                    )}
                  </button>
                  {submitted && (
                    <button type="button" onClick={reset} className="btn-ghost text-xs">
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>

          {/* RIGHT: Results & Integrated Intelligence (7 columns) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 min-h-[640px] flex flex-col backdrop-blur-md">
              {/* Header with Module Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <h2 className="font-semibold text-sm text-white uppercase tracking-wider">
                  Advisor Intelligence Report
                </h2>

                {result && (
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    {[
                      { id: 'summary', label: 'Summary' },
                      { id: 'forecast', label: 'Forecast' },
                      { id: 'risk', label: 'Risk' },
                      { id: 'ports', label: 'Port Limits' },
                      { id: 'backhaul', label: 'Backhaul' },
                      { id: 'vessel', label: 'Vessel Cost' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === tab.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Initial Empty State */}
              {!submitted && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center mb-5 text-gray-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                    </svg>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-white mb-2">
                    Awaiting Voyage Parameters
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mb-6">
                    Select a preset scenario or enter vessel and route data on the left to trigger the full
                    PUHAR decision engine.
                  </p>
                  <button
                    type="button"
                    onClick={() => loadPreset(PRESET_SCENARIOS[0])}
                    className="btn-primary text-xs"
                  >
                    Load Sample Voyage
                  </button>
                </div>
              )}

              {/* Loading State with Pipeline Progress */}
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-14 h-14 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 spin-ring mb-6" />
                  <p className="font-display font-bold text-white text-base mb-2">
                    Executing Advisor Pipeline
                  </p>
                  <p className="text-xs text-gray-500 mb-8">
                    Querying ML freight models, risk feeds, port limits & backhaul databases...
                  </p>

                  <div className="w-full max-w-md space-y-2.5">
                    {[
                      'Freight Rate Forecaster (RandomForest)',
                      'Physical Port Limits & Depth Checks',
                      'Backhaul Export Commodities Engine',
                      'Weather, Cyclone & Congestion Risk Hub',
                      'Singapore HSFO Bunker & Voyage Optimizer',
                    ].map((step, idx) => (
                      <div
                        key={step}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
                      >
                        <span className="text-gray-300 font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          {step}
                        </span>
                        <span className="text-cyan-400/70 font-mono text-[10px]">Processing</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <ErrorState message={error} onRetry={() => handleSubmit()} />
                </div>
              )}

              {/* Results View */}
              {result && !loading && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Master Recommendation Banner */}
                    <div
                      className={`p-5 rounded-xl border ${
                        isMandatoryReroute
                          ? 'border-red-500/40 bg-red-950/20'
                          : 'border-cyan-500/40 bg-cyan-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                              isMandatoryReroute
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {isMandatoryReroute ? '⛔' : '⚓'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isMandatoryReroute
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {isMandatoryReroute ? 'Mandatory Cyclone Reroute' : 'Voyage Approved'}
                              </span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                Target Port: <strong className="text-white">{recommendedDest}</strong>
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white mt-1.5 leading-snug">
                              {isMandatoryReroute
                                ? `Voyage to ${form.destination} interrupted by active cyclone alert. Rerouted to safe haven: ${recommendedDest}.`
                                : `Charter path approved to ${form.destination} with verified physical constraints and positive backhaul coverage.`}
                            </p>
                            {isMandatoryReroute && (
                              <p className="text-xs text-red-400/80 mt-1 font-mono">
                                Notice: Emergency reroutes are mandatory per maritime safety protocols. No override controls.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TAB: SUMMARY */}
                    {activeTab === 'summary' && (
                      <div className="space-y-6">
                        {/* 4 Quadrants Quick Glance */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Freight Forecast Glance */}
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                              Forecast Rate
                            </span>
                            <p className="font-display font-bold text-lg text-emerald-400">
                              {result.forecast?.result?.indicative_rate
                                ? `$${result.forecast.result.indicative_rate.toFixed(2)}`
                                : 'Available'}
                            </p>
                            <span className="text-[10px] text-gray-500">USD / Ton</span>
                          </div>

                          {/* Risk Glance */}
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                              Risk Action
                            </span>
                            <p
                              className={`font-display font-bold text-base ${
                                isMandatoryReroute
                                  ? 'text-red-400'
                                  : result.risk?.result?.action === 'SUGGEST_REROUTE'
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {result.risk?.result?.action || 'ASSESSED'}
                            </p>
                            <span className="text-[10px] text-gray-500">
                              Confidence: {Math.round((result.risk?.confidence || 0) * 100)}%
                            </span>
                          </div>

                          {/* Port Feasibility Glance */}
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                              Viable Ports
                            </span>
                            <p className="font-display font-bold text-lg text-cyan-400">
                              {result.ports?.result?.viable_ports?.length || 0} /{' '}
                              {(result.ports?.result?.viable_ports?.length || 0) +
                                (result.ports?.result?.rejected_ports?.length || 0)}
                            </p>
                            <span className="text-[10px] text-gray-500">Physical Constraints</span>
                          </div>

                          {/* Backhaul Matches Glance */}
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                              Backhauls
                            </span>
                            <p className="font-display font-bold text-lg text-purple-400">
                              {result.backhaul?.result?.matches?.length || 0} Matches
                            </p>
                            <span className="text-[10px] text-gray-500">Documented Exports</span>
                          </div>
                        </div>

                        {/* Explainability AI List */}
                        <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>Explainability AI Reasoning Log</span>
                            <span className="text-[10px] text-gray-500 font-mono font-normal">
                              ({result.explainability?.length || 0} factors analyzed)
                            </span>
                          </h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {result.explainability?.map((reason, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 text-xs text-gray-300 p-2 rounded-lg bg-black/40 border border-white/5"
                              >
                                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                                <span className="leading-relaxed">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Vessel Cost Overview if present */}
                        {result.vessel_optimization && (
                          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                            <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">
                              Vessel Economic Optimization
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500 block">Total Voyage Cost</span>
                                <span className="font-mono font-bold text-white text-base">
                                  ${result.vessel_optimization.result?.total_voyage_cost_usd?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Route Distance</span>
                                <span className="font-mono text-gray-300">
                                  {result.vessel_optimization.result?.distance_nm || 'N/A'} NM
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Port Congestion Delay</span>
                                <span className="font-mono text-orange-400">
                                  {result.vessel_optimization.result?.congestion_idle_days || '0'} days
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: FREIGHT FORECAST */}
                    {activeTab === 'forecast' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-semibold text-white">Freight Rate Forecast</h3>
                              <p className="text-xs text-gray-500">
                                Route: {result.forecast?.result?.route || form.route} ({form.vessel_class})
                              </p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              Lowest: ${result.forecast?.result?.lowest_forecast_rate_usd_per_ton?.toFixed(2) || 'N/A'}/t
                            </span>
                          </div>

                          {result.forecast?.result?.forecast_values?.length ? (
                            <ResponsiveContainer width="100%" height={260}>
                              <LineChart data={result.forecast.result.forecast_values}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    background: '#0d0d0d',
                                    border: '1px solid rgba(0,201,255,0.3)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="rate_usd_per_ton"
                                  name="Forecast Rate ($/t)"
                                  stroke="#00c9ff"
                                  strokeWidth={2}
                                  dot={{ r: 3, fill: '#00c9ff' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="p-4 text-center text-xs text-gray-500">
                              {result.forecast?.result?.message || 'No historical forecast values available for this route.'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB: RISK */}
                    {activeTab === 'risk' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                          <h3 className="text-sm font-semibold text-white mb-2">Weather & Cyclone Status</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                              <span className="text-gray-400">Assessed Destination</span>
                              <span className="text-white font-mono">{form.destination}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                              <span className="text-gray-400">Decision</span>
                              <span className="font-mono font-bold text-cyan-400">
                                {result.risk?.result?.action || 'PROCEED'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                              <span className="text-gray-400">Recommended Safe Port</span>
                              <span className="text-emerald-400 font-mono">
                                {result.risk?.result?.recommended_port || form.destination}
                              </span>
                            </div>
                            {result.risk?.result?.alternates?.length > 0 && (
                              <div className="text-xs pt-2">
                                <span className="text-gray-400 block mb-1.5">Alternate Safe Ports</span>
                                <div className="flex flex-wrap gap-2">
                                  {result.risk.result.alternates.map((alt) => (
                                    <span
                                      key={alt}
                                      className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-gray-300 font-mono text-[11px]"
                                    >
                                      {alt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB: PORTS */}
                    {activeTab === 'ports' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                          <h3 className="text-sm font-semibold text-white mb-3">
                            Port Physical Constraints Evaluation
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-emerald-400 mb-2">Viable Ports</p>
                              <div className="space-y-2">
                                {result.ports?.result?.viable_ports?.map((p) => (
                                  <div
                                    key={p}
                                    className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-white flex items-center justify-between"
                                  >
                                    <span>{p}</span>
                                    <span className="text-emerald-400 text-[10px] font-mono">Passes Constraints</span>
                                  </div>
                                ))}
                                {!result.ports?.result?.viable_ports?.length && (
                                  <p className="text-xs text-gray-500">None passed</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-red-400 mb-2">Rejected Ports</p>
                              <div className="space-y-2">
                                {result.ports?.result?.rejected_ports?.map((rej) => (
                                  <div
                                    key={typeof rej === 'string' ? rej : rej.port}
                                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-white"
                                  >
                                    <div className="font-semibold text-red-300">
                                      {typeof rej === 'string' ? rej : rej.port}
                                    </div>
                                    {rej.reasons && (
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        Exceeds: {rej.reasons.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                ))}
                                {!result.ports?.result?.rejected_ports?.length && (
                                  <p className="text-xs text-gray-500">No rejections</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB: BACKHAUL */}
                    {activeTab === 'backhaul' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                          <h3 className="text-sm font-semibold text-white mb-2">
                            Return Cargo Matches ({form.destination} → {form.origin_region})
                          </h3>
                          <div className="space-y-2 mt-3">
                            {result.backhaul?.result?.matches?.map((m, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-semibold text-white">{m.commodity}</p>
                                  <p className="text-[10px] text-gray-400">Destination: {m.destination_region}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-purple-400/20 text-purple-300 font-mono text-[10px]">
                                  {m.confidence} Confidence
                                </span>
                              </div>
                            ))}
                            {!result.backhaul?.result?.matches?.length && (
                              <p className="text-xs text-gray-500 p-2">
                                No documented return cargo found matching this destination port and origin region.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB: VESSEL COST */}
                    {activeTab === 'vessel' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                          <h3 className="text-sm font-semibold text-white mb-3">Vessel Economic Breakdown</h3>
                          {result.vessel_optimization ? (
                            <div className="space-y-3 text-xs">
                              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                <span className="text-gray-400">Total Voyage Cost</span>
                                <span className="font-mono text-emerald-400 font-bold text-sm">
                                  ${result.vessel_optimization.result?.total_voyage_cost_usd?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                <span className="text-gray-400">Route Distance</span>
                                <span className="font-mono text-white">
                                  {result.vessel_optimization.result?.distance_nm || 'N/A'} NM
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                <span className="text-gray-400">Sea Days</span>
                                <span className="font-mono text-white">
                                  {result.vessel_optimization.result?.sea_days || 'N/A'} days
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                <span className="text-gray-400">Port Anchorage & Berth Idle Days</span>
                                <span className="font-mono text-orange-400">
                                  {result.vessel_optimization.result?.congestion_idle_days || '0'} days
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                <span className="text-gray-400">Fuel Cost (Singapore HSFO)</span>
                                <span className="font-mono text-white">
                                  ${result.vessel_optimization.result?.fuel_cost_usd?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Provide origin port, destination port, vessel DWT, and cargo quantity to view vessel cost optimization.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
