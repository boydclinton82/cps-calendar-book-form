import { createContext, useState, useEffect } from 'react';
import { fetchConfig as apiFetchConfig, isApiEnabled } from '../services/api';

// Fallback config when API is disabled or unavailable
const FALLBACK_CONFIG = {
  slug: 'cps-software',
  title: 'CPS Software Booking',
  users: [
    { name: 'Jack', key: 'j' },
    { name: 'Bonnie', key: 'b' },
    { name: 'Giuliano', key: 'g' },
    { name: 'John', key: 'h' },  // 'h' for Jo*h*n (since 'j' is taken)
    { name: 'Rue', key: 'r' },
    { name: 'Joel', key: 'l' },  // 'l' for Joe*l* (since 'j' is taken)
  ],
  createdAt: new Date().toISOString(),
};

export const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API
        const apiConfig = await apiFetchConfig();

        if (apiConfig) {
          // API returned config
          setConfig(apiConfig);
        } else {
          // API disabled or unavailable, use fallback
          setConfig(FALLBACK_CONFIG);
        }
      } catch (err) {
        console.warn('Failed to fetch config from API, using fallback:', err.message);
        // Use fallback on error
        setConfig(FALLBACK_CONFIG);
        // Don't show error to user if we have fallback working
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const value = {
    config,
    loading,
    error,
    // Convenience getters
    title: config?.title || 'Loading...',
    users: config?.users || [],
    slug: config?.slug || '',
    // Whether API is enabled
    apiEnabled: isApiEnabled(),
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}
