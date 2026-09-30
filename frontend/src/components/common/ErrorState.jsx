import { motion } from 'framer-motion';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
        <p className="text-sm text-gray-400 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-xs mt-2">
          Try Again
        </button>
      )}
    </motion.div>
  );
}
