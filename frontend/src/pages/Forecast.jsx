import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart
} from 'recharts';
import { getForecast } from '../api/forecast';
import { isAuthenticated } from '../api/charter';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import AuthModal from '../components/common/AuthModal';

const VESSEL_CLASSES = ['Panamax', 'Capesize', 'Supramax', 'Handysize'];

// Known supported route-to-market mappings (from freight_forecaster.py)
const ROUTE_MARKETS = {
  'Australia-Paradip':     { origin: 'Hay Point / Newcastle / Gladstone', dest: 'Paradip' },
  'Australia-Vizag':       { origin: 'Hay Point / Newcastle / Gladstone', dest: 'Visakhapatnam' },
  'Australia-Gangavaram':  { origin: 'Hay Point / Newcastle / Gladstone', dest: 'Gangavaram' },
  'Australia-Haldia':      { origin: 'Hay Point / Newcastle / Gladstone', dest: 'Haldia' },
  'Indonesia-Paradip':     { origin: 'Taboneo', dest: 'Paradip' },
  'Indonesia-Vizag':       { origin: 'Taboneo', dest: 'Visakhapatnam' },
  'Indonesia-Gangavaram':  { origin: 'Taboneo', dest: 'Gangavaram' },
  'Indonesia-Haldia':      { origin: 'Taboneo', dest: 'Haldia' },
  'SouthAfrica-Paradip':   { origin: "Richards Bay", dest: 'Paradip' },
  'SouthAfrica-Vizag':     { origin: "Richards Bay", dest: 'Visakhapatnam' },
  'SouthAfrica-Gangavaram':{ origin: "Richards Bay", dest: 'Gangavaram' },
  'SouthAfrica-Haldia':    { origin: "Richards Bay", dest: 'Haldia' },
};

export default function Forecast() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [form, setForm] = useState({
    route: '',
    vesselClass: 'Panamax',
    cargoSize: '',
    origin: '',
    destination: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.route || !form.vesselClass) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitted(true);
    try {
      const res = await getForecast(form.route, form.vesselClass);
      setResult(res);
    } catch (err) {
      if (err.response?.status === 401) { setError('auth'); setAuthed(false); return; }
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to fetch freight forecast.');
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
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(16,185,129,0.04) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-colors mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Freight Rate Forecasting</h1>
              <p className="text-xs text-emerald-400 tracking-wider uppercase mt-0.5">Rate Intelligence · ML Powered</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Get 7-day freight rate forecasts for East Coast India corridors powered by a trained RandomForest model.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Route Selection</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Market Route <span className="text-emerald-400">*</span>
                  </label>
                  <select name="route" value={form.route} onChange={handleChange} className="puhar-input" required style={{ colorScheme: 'dark' }}>
                    <option value="">Select a market route</option>
                    {Object.entries(ROUTE_MARKETS).map(([key, { origin, dest }]) => (
                      <option key={key} value={key}>{key.replace('-', ' → ')}</option>
                    ))}
                  </select>
                  {form.route && (
                    <p className="text-[10px] text-gray-600 mt-1.5">
                      {ROUTE_MARKETS[form.route]?.origin} → {ROUTE_MARKETS[form.route]?.dest}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Vessel Class <span className="text-emerald-400">*</span>
                  </label>
                  <select name="vesselClass" value={form.vesselClass} onChange={handleChange} className="puhar-input" style={{ colorScheme: 'dark' }}>
                    {VESSEL_CLASSES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Cargo Size (MT)</label>
                  <input name="cargoSize" type="number" value={form.cargoSize} onChange={handleChange} placeholder="e.g. 50000" className="puhar-input" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading || !form.route} className="btn-primary flex-1 justify-center" style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-emerald-400 spin-ring" />
                        Forecasting...
                      </span>
                    ) : 'Get Forecast'}
                  </button>
                  {submitted && <button type="button" onClick={reset} className="btn-ghost">Reset</button>}
                </div>
              </form>

              {/* Available markets */}
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-emerald-400/70 font-medium mb-2">Supported Markets</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Australia', 'Indonesia', 'South Africa'].map(m => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400">{m}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Paradip', 'Vizag', 'Gangavaram', 'Haldia'].map(p => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400/70">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 min-h-[500px]">
              <h2 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Forecast Results</h2>

              {!submitted && <EmptyForecast />}
              {loading && <Loader message="Running freight forecast model..." />}
              {error && !loading && error !== 'auth' && <ErrorState message={error} onRetry={() => handleSubmit({ preventDefault: () => {} })} />}
              {result && !loading && <ForecastResult result={result} form={form} />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ForecastResult({ result, form }) {
  const r = result.result || {};
  const isSuccess = r.status === 'success';
  const isUnavailable = r.status === 'unavailable' || !isSuccess;

  if (isUnavailable) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Market Unavailable</p>
            <p className="text-xs text-yellow-300/70 mt-1 leading-relaxed">
              {result.reasons?.[0] || `No historical freight benchmark available for ${form.route} + ${form.vesselClass}.`}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
          <p className="text-xs text-gray-500 leading-relaxed">
            The PUHAR freight model requires historical data for this route and vessel class combination. 
            Try a different market route or vessel class from the supported combinations.
          </p>
        </div>
      </motion.div>
    );
  }

  const forecastValues = r.forecast_values || [];
  const currentRate = r.latest_historical_rate_usd_per_ton;
  const lowestRate  = r.lowest_forecast_rate_usd_per_ton;
  const lowestDate  = r.lowest_rate_date;
  const latestDate  = r.latest_historical_date;
  const note        = r.forecast_note;
  const confidence  = Math.round((result.confidence || 0) * 100);

  // Chart data
  const chartData = [
    ...(currentRate ? [{ date: latestDate, rate: currentRate, type: 'historical' }] : []),
    ...forecastValues.map(pt => ({ date: pt.date, rate: pt.rate_usd_per_ton, type: 'forecast' })),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4">
        {currentRate && (
          <KPICard label="Latest Historical Rate" value={`$${currentRate?.toFixed(2)}/ton`} sub={latestDate} color="text-white" />
        )}
        {lowestRate && (
          <KPICard label="Lowest Forecast Rate" value={`$${lowestRate?.toFixed(2)}/ton`} sub={lowestDate} color="text-emerald-400" />
        )}
        <KPICard label="Market Route" value={form.route.replace('-', ' → ')} sub={form.vesselClass} color="text-gray-300" />
        <KPICard label="Confidence" value={`${confidence}%`} sub="RandomForest model" color="text-blue-400" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">7-Day Forecast Timeline</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={v => [`$${v?.toFixed(2)}/ton`, 'Freight Rate']}
              />
              {lowestDate && <ReferenceLine x={lowestDate} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'Best', fill: '#10b981', fontSize: 10 }} />}
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fill="url(#rateGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Note */}
      {note && (
        <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Forecast Note</p>
          <p className="text-xs text-emerald-300/80 leading-relaxed">{note}</p>
        </div>
      )}

      {/* Reasons */}
      {result.reasons?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Methodology</p>
          {result.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">{r}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function KPICard({ label, value, sub, color }) {
  return (
    <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-display font-bold text-lg ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyForecast() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/[0.02] flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">Select a market route and vessel class to get a freight forecast.</p>
    </div>
  );
}
