// BEHAVIOR: Instance configuration endpoint - returns instance-specific settings (title, user list)
// WHY: Multiple instances can run from same codebase with different configurations
// DATA_FLOW: GET /api/config -> fetch from Vercel KV -> return config object
// DATA_CONSTRAINT: Config shape: { slug: string, title: string, users: [{ name: string, key: string }] }

import { kv } from '@vercel/kv';
import { withSecurity } from './_lib/security.js';

/**
 * GET /api/config
 * Returns the instance configuration (title, users, etc.)
 *
 * REQUEST:
 *   No body required
 *
 * RESPONSE:
 *   200 {
 *     "slug": "cps-software",
 *     "title": "CPS Software Booking",
 *     "users": [
 *       { "name": "Jack", "key": "j" },
 *       { "name": "Bonnie", "key": "b" },
 *       { "name": "Giuliano", "key": "g" },
 *       { "name": "John", "key": "h" },
 *       { "name": "Rue", "key": "r" },
 *       { "name": "Joel", "key": "l" }
 *     ],
 *     "createdAt": "2026-02-13T10:30:00.000Z"
 *   }
 *
 * DATA_CONSTRAINT: users array - each user has name (display) and key (keyboard shortcut)
 * VALIDATION: key must be unique per instance for keyboard shortcuts to work
 * WHY: Per-instance configuration allows one codebase to serve multiple organizations
 */
async function handler(req, res) {
  // VALIDATION: Only allow GET - configuration is read-only from API
  // WHY: Config changes should be done through admin interface or direct KV manipulation
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // DATA_CONSTRAINT: Instance slug from environment variable determines which config to fetch
    // WHY: Different Vercel deployments can have different INSTANCE_SLUG env vars
    const slug = process.env.INSTANCE_SLUG || 'cps-software';
    const key = `instance:${slug}:config`;

    // DATA_FLOW: Try to get config from Vercel KV
    let config = await kv.get(key);

    // EDGE_CASE: If no config exists in KV (fresh instance), return default config
    // WHY: Instance should work out-of-box with sensible defaults
    // DATA_CONSTRAINT: Default config matches CPS Software team structure
    if (!config) {
      config = {
        slug,
        title: 'CPS Software Booking',
        users: [
          { name: 'Jack', key: 'j' },
          { name: 'Bonnie', key: 'b' },
          { name: 'Giuliano', key: 'g' },
          { name: 'John', key: 'h' },
          { name: 'Rue', key: 'r' },
          { name: 'Joel', key: 'l' },
        ],
        createdAt: new Date().toISOString(),
      };
    }

    res.status(200).json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
}

// BEHAVIOR: Wrap handler with security middleware (CORS, rate limiting, headers)
export default withSecurity(handler);
