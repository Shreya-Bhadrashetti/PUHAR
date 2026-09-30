import { motion } from 'framer-motion';

export default function EmptyState({ icon, title = 'No data', message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-2xl">
        {icon || (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-300 mb-1">{title}</p>
        {message && <p className="text-sm text-gray-500 max-w-sm">{message}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
