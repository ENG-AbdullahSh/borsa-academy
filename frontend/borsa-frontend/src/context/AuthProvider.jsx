import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import axiosClient from '../utils/axiosClient';

const TOKEN_KEY = 'borsa_auth_token';
const USER_KEY  = 'borsa_auth_user';

// ── localStorage helpers ──────────────────────────────────────────────────
function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
export function AuthProvider({ children }) {

  // Restore instantly from localStorage → prevents flash-logout on refresh
  const [token,   setToken]   = useState(() => getStoredToken());
  const [user,    setUser]    = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  // ── Helpers ─────────────────────────────────────────────────────────────
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const saveAuth = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  // ── Listen for 401 events fired by the Axios response interceptor ────────
  // This avoids a circular import (axiosClient → AuthProvider).
  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener('borsa:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('borsa:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  // ── On mount: silently verify the stored token with the server ───────────
  useEffect(() => {
    const activeToken = getStoredToken();
    let isActive = true;

    if (!activeToken) {
      localStorage.removeItem(USER_KEY);
      setLoading(false);
      return undefined;
    }

    // User is already hydrated from localStorage above, so the UI renders
    // immediately while we confirm the token in the background.
    axiosClient.get('/me')
      .then(({ data }) => {
        if (!isActive) return;
        if (data.user) {
          saveAuth(activeToken, data.user); // refresh stored user object
        } else {
          clearAuth();
        }
      })
      .catch((error) => {
        if (!isActive) return;
        // 401/403 → token truly expired → axiosClient already fired clearAuth via event.
        // Any other error (network, 5xx) → keep the user logged in locally.
        const isAuthError = error?.status === 401 || error?.status === 403;
        if (isAuthError) clearAuth();
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => { isActive = false; };
  }, [clearAuth, saveAuth]);

  // ── fetchCurrentUser ─────────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async (overrideToken) => {
    // If an overrideToken is passed (e.g. right after login), temporarily set
    // it in localStorage so the Axios interceptor picks it up.
    const activeToken = overrideToken || getStoredToken();
    if (!activeToken) { clearAuth(); return null; }

    if (overrideToken) {
      localStorage.setItem(TOKEN_KEY, overrideToken);
    }

    try {
      const { data } = await axiosClient.get('/me');
      if (!data.user) throw new Error('Authenticated user was not returned.');
      saveAuth(activeToken, data.user);
      return data.user;
    } catch (error) {
      const isAuthError = error?.status === 401 || error?.status === 403;
      if (isAuthError) clearAuth();
      throw error;
    }
  }, [clearAuth, saveAuth]);

  // ── register ─────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, password_confirmation }) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/register', {
        name, email, password, password_confirmation,
      });

      if (!data.token || !data.user) {
        throw new Error('Registration did not return an authenticated user.');
      }

      saveAuth(data.token, data.user);
      return { token: data.token, user: data.user };
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/login', { email, password });
      const nextToken = data.token;

      if (!nextToken) throw new Error('Login token was not returned.');

      // Save token first so /me request in fetchCurrentUser is authenticated
      const nextUser = data.user || await fetchCurrentUser(nextToken);
      saveAuth(nextToken, nextUser);
      return { token: nextToken, user: nextUser };
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser, saveAuth]);

  // ── googleLogin ───────────────────────────────────────────────────────────
  const googleLogin = useCallback(async ({ credential }) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/auth/google', { credential });

      if (!data.token || !data.user) {
        throw new Error('Google login did not return an authenticated user.');
      }

      saveAuth(data.token, data.user);
      return { token: data.token, user: data.user };
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/logout');
    } catch {
      // Network unavailable — local logout still proceeds.
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    register,
    login,
    googleLogin,
    logout,
    fetchCurrentUser,
  }), [fetchCurrentUser, googleLogin, loading, login, logout, register, token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
