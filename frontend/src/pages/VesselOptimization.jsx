import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { optimizeVessel } from '../api/forecast';
import { isAuthenticated } from '../api/charter';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import AuthModal from '../components/common/AuthModal';

const VESSEL_CLASSES = ['Handysize', 'Supramax', 'Panamax', 'Capesize'];

// Ports supported by optimization_reference (need route + port_constraints data)
const KNOWN_PORTS = [
  'Paradip', 'Visakhapatnam', 'Gangavaram', 'Haldia',
  'Chennai', 'Ennore', 'Kolkata',
];

export default function VesselOptimization() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [form, setForm] = useState({
    vesselName: 'MV Vessel',
    vesselClass: 'Panamax',
    dwt: '',
    loa: '',
    beam: '',
    draft: '',
    origin: '',
    destination: '',
    cargo: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setValidationError(null);
  };

  const validate = () => {
    if (!form.dwt || parseFloat(form.dwt) <= 0)
      return 'Vessel DWT is required for cost optimization. Please enter the vessel DWT in metric tonnes.';
    if (!form.origin) return 'Origin port is required.';
    if (!form.destination) return 'Destination port is required.';
    if (!form.cargo || parseFloat(form.cargo) <= 0) return 'Cargo quantity (MT) must be greater than 0.';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const ve = validate();
    if (ve) { setValidationError(ve); return; }

    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitted(true);

    try {
      const vessel = {
        name: form.vesselName || 'Vessel',
        vessel_class: form.vesselClass || null,
        dwt: parseFloat(form.dwt),
        loa_m: form.loa ? parseFloat(form.loa) : null,
        beam_m: form.beam ? parseFloat(form.beam) : null,
        draft_m: form.draft ? parseFloat(form.draft) : null,
      };
      const res = await optimizeVessel({
        vessel,
        origin_port: form.origin,
        destination_port: form.destination,
        cargo_quantity_mt: parseFloat(form.cargo),
      });
      setResult(res);
    } catch (err) {
      if (err.response?.status === 401) { setError('auth'); setAuthed(false); return; }
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Vessel optimization failed. Check port names and vessel data.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); setSubmitted(false); setValidationError(null); };

  if (!authed) return <AuthModal onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 transition-colors mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Vessel Optimization</h1>
              <p className="text-xs text-violet-400 tracking-wider uppercase mt-0.5">Cost Intelligence</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Optimize vessel selection and calculate total voyage costs using real port constraints, fuel prices, and congestion data.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Vessel & Voyage Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FField label="Vessel Name" name="vesselName" value={form.vesselName} onChange={handleChange} placeholder="MV Vessel" />

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Vessel Class</label>
                  <select name="vesselClass" value={form.vesselClass} onChange={handleChange} className="puhar-input" style={{ colorScheme: 'dark' }}>
                    {VESSEL_CLASSES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <FField
                  label={<>DWT (MT) <span className="text-violet-400">*</span></>}
                  name="dwt" type="number" value={form.dwt} onChange={handleChange}
                  placeholder="e.g. 75000"
                />

                <div className="grid grid-cols-3 gap-2">
                  <FField label="LOA (m)" name="loa" type="number" value={form.loa} onChange={handleChange} placeholder="250" />
                  <FField label="Beam (m)" name="beam" type="number" value={form.beam} onChange={handleChange} placeholder="43" />
                  <FField label="Draft (m)" name="draft" type="number" step="0.1" value={form.draft} onChange={handleChange} placeholder="12.5" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Origin Port <span className="text-violet-400">*</span>
                  </label>
                  <input name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. Hay Point, Taboneo" className="puhar-input" required />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Destination Port <span className="text-violet-400">*</span>
                  </label>
                  <select name="destination" value={form.destination} onChange={handleChange} className="puhar-input" style={{ colorScheme: 'dark' }}>
                    <option value="">Select destination</option>
                    {KNOWN_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <FField
                  label={<>Cargo Quantity (MT) <span className="text-violet-400">*</span></>}
                  name="cargo" type="number" value={form.cargo} onChange={handleChange}
                  placeholder="e.g. 50000"
                />

                {validationError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400 leading-relaxed">{validationError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ borderColor: 'rgba(139,92,246,0.4)', color: '#a78bfa' }}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-violet-400 spin-ring" />
                        Optimizing...
                      </span>
                    ) : 'Optimize Vessel'}
                  </button>
                  {submitted && <button type="button" onClick={reset} className="btn-ghost">Reset</button>}
                </div>
              </form>

              <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                <p className="text-[10px] text-violet-400/70 leading-relaxed">
                  DWT is required. The optimizer uses port constraint data, Singapore HSFO fuel prices, and historical congestion data.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 min-h-[500px]">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Optimization Results</h2>

              {!submitted && (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/[0.02] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Enter vessel and voyage details to calculate optimization.</p>
                  <p className="text-xs text-gray-700 mt-1">DWT is required for cost calculation.</p>
                </div>
              )}

              {loading && <Loader message="Optimizing voyage cost..." />}
              {error && !loading && error !== 'auth' && <ErrorState message={error} />}
              {result && !loading && <OptimizationResult result={result} form={form} />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function OptimizationResult({ result, form }) {
  const r = result.result || {};
  const status = r.status;

  if (status === 'input_incomplete') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-sm font-semibold text-red-400 mb-2">Input Incomplete</p>
          <p className="text-xs text-red-300/70 leading-relaxed">{result.reasons?.[0] || 'Vessel DWT is required.'}</p>
        </div>
      </motion.div>
    );
  }

  if (status === 'reference_data_unavailable') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm font-semibold text-yellow-400 mb-2">Reference Data Unavailable</p>
          <p className="text-xs text-yellow-300/70 leading-relaxed">{result.reasons?.[0]}</p>
          <p className="text-xs text-gray-600 mt-2">
            Try ports with known constraint records: Paradip, Visakhapatnam, Gangavaram, Haldia.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === 'no_feasible_vessel') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
          <p className="text-sm font-semibold text-orange-400 mb-2">No Feasible Vessel</p>
          <p className="text-xs text-orange-300/70 leading-relaxed">{result.reasons?.[0] || 'Cargo quantity exceeds vessel DWT or port limit.'}</p>
        </div>
      </motion.div>
    );
  }

  if (status !== 'success') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-sm font-semibold text-red-400 mb-2">Optimization Error</p>
          <p className="text-xs text-red-300/70 leading-relaxed">{result.reasons?.[0] || r.message || 'Unknown error.'}</p>
        </div>
      </motion.div>
    );
  }

  const opt = r.vessel_options?.[0] || {};
  const confidence = Math.round((result.confidence || 0) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Recommended Vessel Banner */}
      <div className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Recommended Vessel Class</p>
          <p className="font-display font-bold text-xl text-violet-400">{r.recommended_vessel}</p>
          <p className="text-xs text-gray-500 mt-0.5">{r.origin_port} → {r.destination_port} · {r.cargo_quantity_mt?.toLocaleString()} MT cargo</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Confidence</p>
          <p className="font-mono text-sm text-white">{confidence}%</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Voyage Cost Breakdown</p>
        <div className="grid grid-cols-2 gap-3">
          <CostCard label="Total Voyage Cost" value={`$${opt.total_voyage_cost_usd?.toLocaleString()}`} highlight />
          <CostCard label="Fuel Cost" value={`$${opt.fuel_cost_usd?.toLocaleString()}`} />
          <CostCard label="Idle / Wait Cost" value={`$${opt.idle_cost_usd?.toLocaleString()}`} />
          <CostCard label="Voyage Days" value={`${opt.total_voyage_days} days`} />
        </div>
      </div>

      {/* Route & Fuel */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Distance" value={`${opt.distance_nm?.toLocaleString()} nm`} />
        <InfoCard label="Speed" value={`${opt.speed_knots} knots`} />
        <InfoCard label="Fuel Consumed" value={`${opt.fuel_consumed_tonnes?.toLocaleString()} MT`} />
        <InfoCard label="Fuel Price" value={`$${opt.fuel_price_usd_per_tonne}/MT (HSFO SGP)`} />
      </div>

      {/* Congestion */}
      <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Port Congestion</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-mono text-sm text-white">{opt.anchorage_wait_days}d</p>
            <p className="text-[10px] text-gray-600">Anchorage</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm text-white">{opt.berth_wait_days}d</p>
            <p className="text-[10px] text-gray-600">Berth Wait</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm text-white">{opt.berth_occupancy_pct}%</p>
            <p className="text-[10px] text-gray-600">Berth Occupancy</p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {result.reasons?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Optimization Explanation</p>
          {result.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      )}

      {result.data_as_of && (
        <p className="text-[10px] text-gray-700 font-mono">Data as of: {new Date(result.data_as_of).toLocaleString()}</p>
      )}
    </motion.div>
  );
}

function CostCard({ label, value, highlight }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-violet-500/30 bg-violet-500/10' : 'border-white/8 bg-white/[0.02]'}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-display font-bold text-lg ${highlight ? 'text-violet-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-3 rounded-xl border border-white/8 bg-white/[0.02]">
      <p className="text-[10px] text-gray-600 mb-0.5">{label}</p>
      <p className="text-sm text-gray-300 font-medium">{value}</p>
    </div>
  );
}

function FField({ label, name, value, onChange, placeholder, type = 'text', step }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} step={step} className="puhar-input" style={{ colorScheme: 'dark' }} />
    </div>
  );
}
