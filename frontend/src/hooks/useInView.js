import { useEffect, useRef } from 'react';

/**
 * A hook that runs a callback when the element enters the viewport.
 * @param {Function} callback
 * @param {object} options - IntersectionObserver options
 */
export function useInView(callback, options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) callback(entry); },
      { threshold: 0.1, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
}

/**
 * Scroll-progress hook. Returns a ref and a progress value (0–1).
 */
export function useScrollProgress(elementRef) {
  // Implemented via a state-based approach in components using GSAP ScrollTrigger
  // This is a placeholder — actual scroll progress handled by GSAP in components.
}
