import { useContext } from 'react';
import { ConfigContext } from '../context/ConfigContext';

/**
 * Hook to access the configuration context.
 *
 * @returns {{
 *   config: object | null,
 *   loading: boolean,
 *   error: string | null,
 *   title: string,
 *   users: Array<{name: string, key: string}>,
 *   slug: string
 * }}
 */
export function useConfig() {
  const context = useContext(ConfigContext);

  if (context === null) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }

  return context;
}
