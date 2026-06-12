import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

const TOKEN_STORAGE_KEY = 'borsa_auth_token';
const USER_STORAGE_KEY = 'borsa_auth_user';

function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
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

    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: apiHeaders(activeToken),
      });
      const data = await readJsonResponse(response);
      const currentUser = data.user;

      if (!currentUser) {
        throw new Error('Authenticated user was not returned.');
      }

      saveAuth(activeToken, currentUser);
      return currentUser;
    } catch (error) {
      clearAuth();
      throw error;
    }
  }, [clearAuth, saveAuth, token]);

  useEffect(() => {
    const activeToken = getStoredToken();
    let isActive = true;

    if (!activeToken) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return undefined;
    }

    fetch(`${API_BASE_URL}/me`, {
      headers: apiHeaders(activeToken),
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

  const register = useCallback(async ({
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  }) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await readJsonResponse(response);

      if (!data.token || !data.user) {
        throw new Error('Registration did not return an authenticated user.');
      }

      saveAuth(data.token, data.user);

      return { token: data.token, user: data.user };
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: apiHeaders(null, true),
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

  const googleLogin = useCallback(async ({ credential }) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ credential }),
      });
      const data = await readJsonResponse(response);

      if (!data.token || !data.user) {
        throw new Error('Google login did not return an authenticated user.');
      }

      saveAuth(data.token, data.user);

      return { token: data.token, user: data.user };
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    const activeToken = token || getStoredToken();

    try {
      if (activeToken) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: apiHeaders(activeToken),
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
