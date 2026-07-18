/**
 * axiosClient.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Axios instance for the Borsa Academy frontend.
 *
 *  REQUEST  interceptor → automatically injects the Bearer token from
 *                          localStorage into every outgoing request.
 *
 *  RESPONSE interceptor → normalises errors into the same shape used by
 *                          the existing readJsonResponse() helper so all
 *                          existing catch-blocks keep working unchanged.
 *                          On 401 it fires a custom DOM event that
 *                          AuthProvider listens for to clear the session.
 */

import axios from 'axios';

const TOKEN_KEY = 'borsa_auth_token';

// ── Base instance ──────────────────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
  timeout: 15_000, // 15 s — avoids hanging requests that look like auth failures
});

// ── REQUEST interceptor — inject token automatically ──────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── RESPONSE interceptor — normalise errors ───────────────────────────────
axiosClient.interceptors.response.use(
  // ✅ Success: just return the response data directly
  (response) => response,

  // ❌ Error: normalise into the same shape as readJsonResponse() throws
  (error) => {
    const status   = error.response?.status;
    const data     = error.response?.data ?? {};
    const message  = data.message || error.message || `Request failed with status ${status}`;

    // Shape matches what all existing catch-blocks already expect:
    //   error.status   — HTTP status code
    //   error.data     — parsed JSON body
    //   error.message  — human-readable message
    const normalisedError        = new Error(message);
    normalisedError.status       = status;
    normalisedError.data         = data;
    normalisedError.isAxiosError = true;

    // On a definitive "token expired / invalid" response, broadcast an event
    // so AuthProvider can clear the session without a circular import.
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('borsa:unauthorized'));
    }

    return Promise.reject(normalisedError);
  },
);

export default axiosClient;
