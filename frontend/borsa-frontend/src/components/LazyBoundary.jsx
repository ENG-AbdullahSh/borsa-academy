import React from 'react';
import { useNearScreen } from '../hooks/useNearScreen';

/**
 * LazyBoundary component to defer rendering of its children until they are about to
 * enter the viewport. It helps in optimizing load times of heavy components.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component/elements to lazy load
 * @param {React.ReactNode} [props.fallback] - Custom placeholder/skeleton to show before intersecting
 * @param {string} [props.height] - Optional min-height to reserve space and prevent layout shifts (e.g. "300px")
 * @param {string} [props.rootMargin] - Intersection Observer rootMargin (defaults to "200px" to load early)
 * @param {string} [props.className] - CSS classes for the wrapper div
 */
const LazyBoundary = ({ 
  children, 
  fallback = null, 
  height = 'auto', 
  rootMargin = '200px', 
  className = '' 
}) => {
  const [ref, isNear] = useNearScreen({ rootMargin });

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ minHeight: !isNear ? height : undefined }}
    >
      {isNear ? children : fallback}
    </div>
  );
};

export default LazyBoundary;
