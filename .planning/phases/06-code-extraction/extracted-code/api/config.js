import { kv } from '@vercel/kv';
import { withSecurity } from './_lib/security.js';

/**
 * GET /api/config
 * Returns the instance configuration (title, users, etc.)
 */
async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get instance slug from environment variable
    const slug = process.env.INSTANCE_SLUG || 'cps-software';
    const key = `instance:${slug}:config`;

    // Try to get config from KV
    let config = await kv.get(key);

    // If no config exists, return default config
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

export default withSecurity(handler);
