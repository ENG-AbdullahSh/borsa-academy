/**
 * vitals.js - Lightweight, zero-dependency Core Web Vitals tracker.
 * Utilizes standard browser PerformanceObserver APIs and sends telemetry
 * using non-blocking beacon methods.
 */

// Metrics repository
const metrics = {
  lcp: null,
  fid: null,
  cls: 0,
  fcp: null,
  ttfb: null,
  url: window.location.pathname,
  userAgent: navigator.userAgent,
};

let hasSent = false;

// 1. Send telemetry data using non-blocking sendBeacon or keepalive fetch
const sendTelemetry = () => {
  if (hasSent) return;
  hasSent = true;

  // Add the final navigation timing (TTFB) if available
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      metrics.ttfb = nav.responseStart - nav.requestStart;
    } else {
      // Legacy fallback
      const timing = performance.timing;
      if (timing) {
        metrics.ttfb = timing.responseStart - timing.navigationStart;
      }
    }
  } catch (e) {
    // Fail silently
  }

  const endpoint = '/api/performance-metrics';
  const payload = JSON.stringify(metrics);

  // Use navigator.sendBeacon if available, otherwise fetch with keepalive
  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
  } else {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Ignore errors, telemetry is non-critical
    });
  }
};

// 2. Initialize browser performance observers
export const initVitals = () => {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }

  try {
    // A. Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // B. First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstEntry = entryList.getEntries()[0];
      if (firstEntry) {
        metrics.fid = firstEntry.processingStart - firstEntry.startTime;
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // C. Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          metrics.cls += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // D. First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((entryList) => {
      const paintEntries = entryList.getEntries();
      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
          break;
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });

  } catch (e) {
    console.warn('PerformanceObserver initialization failed:', e);
  }

  // 3. Dispatch telemetry when user leaves the page or changes tab
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendTelemetry();
    }
  });

  // Safe fallback for browsers not triggering visibilitychange correctly
  window.addEventListener('pagehide', sendTelemetry);
};
