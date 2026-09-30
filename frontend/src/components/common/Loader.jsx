import { motion } from 'framer-motion';

export default function Loader({ message = 'Processing...', size = 'md' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className={`relative ${sizes[size]}`}>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent spin-ring"
          style={{ borderTopColor: 'var(--color-cyan)', borderRightColor: 'rgba(0,201,255,0.3)' }}
        />
        {/* Inner pulse */}
        <motion.div
          className="absolute inset-2 rounded-full bg-cyan-500/20"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {message && (
        <p className="text-sm text-gray-400 font-medium tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
