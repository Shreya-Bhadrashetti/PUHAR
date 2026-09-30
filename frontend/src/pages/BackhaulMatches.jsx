import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { matchBackhaul } from '../api/backhaul';
import { isAuthenticated } from '../api/charter';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import AuthModal from '../components/common/AuthModal';

const KNOWN_PORTS = ['Paradip', 'Visakhapatnam', 'Gangavaram', 'Haldia', 'Chennai', 'Ennore'];
const KNOWN_REGIONS = ['India', 'East Asia', 'Southeast Asia', 'Middle East', 'Europe', 'Australia'];

export default function BackhaulMatches() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    cargoSize: '',
    date: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.destination || !form.origin) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitted(true);
    try {
      // Map origin city to region for backend
      const originRegion = KNOWN_REGIONS.find(r => form.origin.toLowerCase().includes(r.toLowerCase())) || form.origin;
      const res = await matchBackhaul(form.destination, originRegion);
      setResult(res);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401) {
        setError('Authentication required. Please sign in.');
        setAuthed(false);
      } else {
        setError(typeof detail === 'string' ? detail : 'Failed to fetch backhaul matches. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); setSubmitted(false); };

  if (!authed) return <AuthModal onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Page Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 20%, rgba(0,201,255,0.05) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Backhaul Matcher</h1>
              <p className="text-xs text-cyan-400 tracking-wider uppercase mt-0.5">Explainability AI</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Find optimal return cargo opportunities. Enter your route details to discover matching backhaul commodities with AI-powered reasoning.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Route Details</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FormField label="Origin Region" id="origin" name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. Australia, India, Indonesia" required />
                <FormField label="Destination Port" id="destination" name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Paradip, Visakhapatnam, Haldia" required />
                <FormField label="Cargo Size (MT)" id="cargoSize" name="cargoSize" value={form.cargoSize} onChange={handleChange} placeholder="e.g. 50000" type="number" />
                <FormField label="Date of Voyage" id="date" name="date" value={form.date} onChange={handleChange} type="date" />

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-cyan-400 spin-ring" />
                        Finding matches...
                      </span>
                    ) : 'Find Matches'}
                  </button>
                  {submitted && (
                    <button type="button" onClick={reset} className="btn-ghost">
                      Reset
                    </button>
                  )}
                </div>
              </form>

              {/* Info callout */}
              <div className="mt-6 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xs text-cyan-400/70 leading-relaxed">
                  The backhaul engine uses documented export commodity data for East Coast Indian ports to find return cargo opportunities that match your origin region.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 min-h-[400px]">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Results & Explainability</h2>

              {!submitted && (
                <EmptyResult />
              )}

              {loading && <Loader message="Analyzing backhaul opportunities..." />}

              {error && !loading && (
                <ErrorState message={error} onRetry={() => handleSubmit({ preventDefault: () => {} })} />
              )}

              {result && !loading && (
                <BackhaulResult result={result} form={form} />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function BackhaulResult({ result, form }) {
  const matches = result.result?.matches || [];
  const hasMatches = matches.length > 0;
  const confidence = Math.round((result.confidence || 0) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Summary */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasMatches ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
          {hasMatches ? (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {hasMatches ? `${matches.length} Backhaul ${matches.length === 1 ? 'Match' : 'Matches'} Found` : 'No Matches Found'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {form.destination} → {form.origin} corridor
          </p>
          {/* Confidence */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: confidence > 70 ? '#10b981' : confidence > 40 ? '#f59e0b' : '#e53e3e' }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400">{confidence}% confidence</span>
          </div>
        </div>
      </div>

      {/* Match Cards */}
      {hasMatches && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Cargo Matches</p>
          {matches.map((match, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl border border-white/8 bg-cyan-500/5 hover:border-cyan-500/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{match.commodity}</span>
                <ConfidenceBadge confidence={match.confidence} />
              </div>
              {match.destination_region && (
                <p className="text-xs text-gray-400">
                  Typical destination: <span className="text-gray-300">{match.destination_region}</span>
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Explainability */}
      {result.reasons?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">AI Reasoning</p>
          <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02] space-y-2">
            {result.reasons.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">{reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Data timestamp */}
      {result.data_as_of && (
        <p className="text-[10px] text-gray-700 font-mono">
          Data as of: {new Date(result.data_as_of).toLocaleString()}
        </p>
      )}
    </motion.div>
  );
}

function ConfidenceBadge({ confidence }) {
  const isHigh = confidence === 'High' || confidence?.includes?.('High');
  const isMed  = confidence === 'Medium' || confidence?.includes?.('Medium');
  const color = isHigh ? 'text-green-400 bg-green-500/10 border-green-500/20' : isMed ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-gray-400 bg-white/5 border-white/10';
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${color}`}>{confidence}</span>
  );
}

function FormField({ label, id, name, value, onChange, placeholder, required, type = 'text' }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-cyan-400">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="puhar-input"
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/[0.02] flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">Fill in the route details to discover backhaul opportunities.</p>
    </div>
  );
}
