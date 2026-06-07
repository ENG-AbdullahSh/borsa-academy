import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext({
  settings: {
    academy_name: 'بورصة أكاديمي',
    admin_email: null,
    logo_path: null,
    general_description: null,
  },
  loading: true,
  reloadSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    academy_name: 'بورصة أكاديمي',
    admin_email: null,
    logo_path: null,
    general_description: null,
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/settings');
      if (response.ok) {
        const payload = await response.json();
        if (payload.data) {
          setSettings(payload.data);
        }
      }
    } catch (error) {
      console.error('Failed to load academy settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, reloadSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
