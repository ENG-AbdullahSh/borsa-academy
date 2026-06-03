import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// This component listens for route changes and scrolls the window to the top.
// It returns null because it does not render any visible UI.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll instantly to the top on every navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
