import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const TOKEN_STORAGE_KEY = 'borsa_auth_token';
const USER_STORAGE_KEY = 'borsa_auth_user';

function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getStoredUser() {
  const stored = localStorage.getItem(USER_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function authHeaders(token, includeJson = false) {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

async function readJsonResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const saveAuth = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const fetchCurrentUser = useCallback(async (overrideToken) => {
    const activeToken = overrideToken || token || getStoredToken();

    if (!activeToken) {
      clearAuth();
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: authHeaders(activeToken),
    });
    const data = await readJsonResponse(response);
    const currentUser = data.user;

    if (!currentUser) {
      throw new Error('Authenticated user was not returned.');
    }

    saveAuth(activeToken, currentUser);
    return currentUser;
  }, [clearAuth, saveAuth, token]);

  useEffect(() => {
    const activeToken = getStoredToken();
    let isActive = true;

    if (!activeToken) {
      return undefined;
    }

    fetch(`${API_BASE_URL}/me`, {
      headers: authHeaders(activeToken),
    })
      .then(readJsonResponse)
      .then((data) => {
        if (!isActive) return;

        if (data.user) {
          saveAuth(activeToken, data.user);
        } else {
          clearAuth();
        }
      })
      .catch(() => {
        if (isActive) {
          clearAuth();
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [clearAuth, saveAuth]);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await readJsonResponse(response);
      const nextToken = data.token;

      if (!nextToken) {
        throw new Error('Login token was not returned.');
      }

      const nextUser = data.user || await fetchCurrentUser(nextToken);
      saveAuth(nextToken, nextUser);

      return { token: nextToken, user: nextUser };
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser, saveAuth]);

  const logout = useCallback(async () => {
    const activeToken = token || getStoredToken();

    try {
      if (activeToken) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: authHeaders(activeToken),
        });
      }
    } catch {
      // Local logout should still complete if the API is temporarily unavailable.
    } finally {
      clearAuth();
    }
  }, [clearAuth, token]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token),
    login,
    logout,
    fetchCurrentUser,
  }), [fetchCurrentUser, loading, login, logout, token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

