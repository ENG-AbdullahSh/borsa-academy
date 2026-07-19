import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect if an element is near or in the viewport.
 * Useful for lazy rendering heavy components.
 * 
 * @param {Object} options - Intersection Observer options
 * @param {string} options.rootMargin - Margin around the root (e.g. '100px')
 * @param {number} options.threshold - Threshold for intersection (0.0 to 1.0)
 * @param {boolean} options.once - Whether to stop observing after first intersection
 * @returns {[React.RefObject, boolean]} ref to attach to element, and isNear boolean status
 */
export function useNearScreen({ rootMargin = '100px', threshold = 0, once = true } = {}) {
  const [isNear, setIsNear] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check if IntersectionObserver is supported in browser
    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsNear(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);

    return () => {
      if (once && isNear) return; // Already unsubscribed
      observer.unobserve(el);
    };
  }, [rootMargin, threshold, once, isNear]);

  return [elementRef, isNear];
}
