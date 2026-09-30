import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { assessRisk } from '../api/risk';
import { isAuthenticated } from '../api/charter';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import AuthModal from '../components/common/AuthModal';

// Known risk-model ports from backend engine.py
const RISK_PORTS = [
  'Paradip', 'Visakhapatnam', 'Gangavaram', 'Haldia',
  'Chennai', 'Ennore', 'Kamarajar', 'Kolkata',
];

// Vessel class options
const VESSEL_CLASSES = ['Handysize', 'Supramax', 'Panamax', 'Capesize'];

export default function RiskAlerts() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [form, setForm] = useState({
    vesselName: 'MV Vessel',
    vesselClass: 'Panamax',
    dwt: '',
    draft: '',
    lat: '',
    lon: '',
    destination: '',
    eta: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.destination || !form.lat || !form.lon) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitted(true);
    try {
      const vessel = {
        name: form.vesselName || 'Vessel',
        vessel_class: form.vesselClass || null,
        dwt: form.dwt ? parseFloat(form.dwt) : null,
        draft_m: form.draft ? parseFloat(form.draft) : null,
        lat: parseFloat(form.lat),
        lon: parseFloat(form.lon),
      };
      const res = await assessRisk({
        vessel,
        destination: form.destination,
        eta: form.eta ? new Date(form.eta).toISOString() : null,
      });
      setResult(res);
    } catch (err) {
      if (err.response?.status === 401) { setError('auth'); setAuthed(false); return; }
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Risk assessment failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); setSubmitted(false); };

  if (!authed) return <AuthModal onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 20%, rgba(249,115,22,0.04) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Risk Mitigation</h1>
              <p className="text-xs text-orange-400 tracking-wider uppercase mt-0.5">Cyclone & Congestion AI</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Real-time voyage risk assessment. Get live cyclone tracking, port congestion alerts, and intelligent rerouting recommendations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Voyage Details</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vessel Info */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Vessel Name</label>
                  <input name="vesselName" value={form.vesselName} onChange={handleChange} placeholder="MV Vessel" className="puhar-input" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Vessel Class</label>
                  <select name="vesselClass" value={form.vesselClass} onChange={handleChange} className="puhar-input" style={{ colorScheme: 'dark' }}>
                    {VESSEL_CLASSES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">DWT (MT)</label>
                    <input name="dwt" type="number" value={form.dwt} onChange={handleChange} placeholder="e.g. 75000" className="puhar-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Draft (m)</label>
                    <input name="draft" type="number" step="0.1" value={form.draft} onChange={handleChange} placeholder="e.g. 12.5" className="puhar-input" />
                  </div>
                </div>

                {/* Position */}
                <div className="pt-1">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Vessel Position <span className="text-orange-400">*</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Latitude</label>
                      <input name="lat" type="number" step="0.001" value={form.lat} onChange={handleChange} placeholder="e.g. 12.5" className="puhar-input" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Longitude</label>
                      <input name="lon" type="number" step="0.001" value={form.lon} onChange={handleChange} placeholder="e.g. 86.2" className="puhar-input" required />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-700 mt-1.5">Required for cyclone corridor intersection</p>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Destination Port <span className="text-orange-400">*</span>
                  </label>
                  <select name="destination" value={form.destination} onChange={handleChange} className="puhar-input" required style={{ colorScheme: 'dark' }}>
                    <option value="">Select destination port</option>
                    {RISK_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">ETA (Optional)</label>
                  <input name="eta" type="datetime-local" value={form.eta} onChange={handleChange} className="puhar-input" style={{ colorScheme: 'dark' }} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading || !form.destination || !form.lat || !form.lon} className="btn-primary flex-1 justify-center" style={{ borderColor: 'rgba(249,115,22,0.4)', color: '#f97316' }}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-orange-400 spin-ring" />
                        Assessing...
                      </span>
                    ) : 'Assess Risk'}
                  </button>
                  {submitted && <button type="button" onClick={reset} className="btn-ghost">Reset</button>}
                </div>
              </form>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 min-h-[500px]">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Risk Assessment</h2>

              {!submitted && (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/[0.02] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Enter voyage details to assess risk conditions.</p>
                  <p className="text-xs text-gray-700 mt-2">Vessel position (lat/lon) is required for cyclone analysis.</p>
                </div>
              )}

              {loading && <Loader message="Fetching live weather & cyclone data..." />}

              {error && !loading && error !== 'auth' && (
                <ErrorState message={error} onRetry={() => handleSubmit({ preventDefault: () => {} })} />
              )}

              {result && !loading && <RiskResult result={result} form={form} />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function RiskResult({ result, form }) {
  const action = result.result?.action || 'UNKNOWN';
  const mandatory = result.result?.mandatory || false;
  const recommended = result.result?.recommended_port;
  const alternates = result.result?.alternates || [];
  const dataGaps = result.result?.data_gaps || [];
  const confidence = Math.round((result.confidence || 0) * 100);

  const ACTION_CONFIG = {
    PROCEED: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '✓', label: 'PROCEED' },
    SUGGEST_REROUTE: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '⚠', label: 'REROUTE SUGGESTED' },
    AUTO_REROUTE: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '⛔', label: 'MANDATORY REROUTE' },
    UNKNOWN: { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10', icon: '?', label: 'UNKNOWN' },
  };
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.UNKNOWN;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Action Banner */}
      <div className={`p-5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-2xl ${cfg.color}`}>{cfg.icon}</span>
          <div>
            <p className={`font-display font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
            {mandatory && (
              <p className="text-xs text-red-300 mt-0.5">
                Cyclone Red Alert — Mandatory automatic reroute applied
              </p>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: cfg.color.replace('text-', '#').includes('#') ? '#10b981' : 'currentColor' }}
            />
          </div>
          <span className="text-xs font-mono text-gray-400">{confidence}% model confidence</span>
        </div>
      </div>

      {/* Reroute info */}
      {(recommended || alternates.length > 0) && (
        <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Rerouting Information</p>
          {recommended && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <p className="text-sm text-white">Recommended Port: <span className="text-yellow-400 font-semibold">{recommended}</span></p>
            </div>
          )}
          {alternates.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Alternates:</p>
              <div className="flex flex-wrap gap-2">
                {alternates.map((alt, i) => (
                  <span key={i} className="px-3 py-1 text-xs rounded-full border border-white/10 bg-white/5 text-gray-300">{alt}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts / Reasons */}
      {result.reasons?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Alerts & Explanation</p>
          <div className="space-y-2">
            {result.reasons.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-2 p-3 rounded-lg border border-white/8 bg-white/[0.02]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-gray-300 leading-relaxed">{reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Data Gaps */}
      {dataGaps.length > 0 && (
        <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-xs font-medium text-yellow-400 uppercase tracking-wider mb-2">Data Gaps</p>
          {dataGaps.map((gap, i) => (
            <p key={i} className="text-xs text-yellow-300/70 leading-relaxed">{gap}</p>
          ))}
        </div>
      )}

      {/* Timestamp */}
      {result.data_as_of && (
        <p className="text-[10px] text-gray-700 font-mono">Live data snapshot: {new Date(result.data_as_of).toLocaleString()}</p>
      )}
    </motion.div>
  );
}
