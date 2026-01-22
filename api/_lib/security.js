import { kv } from '@vercel/kv';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cps-calendar-book-form.vercel.app',
  // Add production domain when deployed
];

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 60, // 60 requests per minute
};

/**
 * Set security headers on response
 */
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
}

/**
 * Handle CORS - returns true if request should continue, false if handled
 */
function handleCors(req, res) {
  const origin = req.headers.origin;

  // Allow requests with no origin (same-origin, curl, etc.)
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Still allow for development flexibility, but log
    console.warn(`CORS: Allowing unlisted origin: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  return true;
}

/**
 * Simple rate limiting using KV
 * Returns { allowed: boolean, remaining: number }
 */
async function checkRateLimit(req) {
  try {
    // Get client identifier (IP or forwarded IP)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     'unknown';

    const key = `ratelimit:${clientIp}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;

    // Get current request count
    let data = await kv.get(key);

    if (!data || data.windowStart < windowStart) {
      // New window
      data = { count: 1, windowStart: now };
    } else {
      data.count++;
    }

    // Save with TTL
    await kv.set(key, data, { ex: 120 }); // 2 minute expiry

    const remaining = Math.max(0, RATE_LIMIT.maxRequests - data.count);

    return {
      allowed: data.count <= RATE_LIMIT.maxRequests,
      remaining,
    };
  } catch (error) {
    // If rate limiting fails, allow the request but log
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests };
  }
}

/**
 * Sanitize string input - removes HTML/script tags and trims
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '')   // Remove potential injection chars
    .trim()
    .slice(0, 100); // Limit length
}

/**
 * Sanitize booking input
 */
function sanitizeBookingInput(body) {
  const sanitized = {};

  if (body.dateKey) {
    // dateKey should be YYYY-MM-DD format
    const dateMatch = String(body.dateKey).match(/^\d{4}-\d{2}-\d{2}$/);
    sanitized.dateKey = dateMatch ? body.dateKey : null;
  }

  if (body.timeKey) {
    // timeKey should be HH:00 format
    const timeMatch = String(body.timeKey).match(/^\d{2}:00$/);
    sanitized.timeKey = timeMatch ? body.timeKey : null;
  }

  if (body.user) {
    sanitized.user = sanitizeString(body.user);
  }

  if (body.duration !== undefined) {
    // duration should be 1-8 hours
    const dur = parseInt(body.duration, 10);
    sanitized.duration = (dur >= 1 && dur <= 8) ? dur : null;
  }

  if (body.updates) {
    sanitized.updates = {};
    if (body.updates.user) {
      sanitized.updates.user = sanitizeString(body.updates.user);
    }
    if (body.updates.duration !== undefined) {
      const dur = parseInt(body.updates.duration, 10);
      sanitized.updates.duration = (dur >= 1 && dur <= 8) ? dur : null;
    }
  }

  return sanitized;
}

/**
 * Security wrapper for API handlers
 * Usage: export default withSecurity(handler, { rateLimit: true })
 */
export function withSecurity(handler, options = {}) {
  const { rateLimit = true } = options;

  return async function securedHandler(req, res) {
    // Set security headers
    setSecurityHeaders(res);

    // Handle CORS
    if (!handleCors(req, res)) {
      return; // Was OPTIONS preflight, already handled
    }

    // Check rate limit
    if (rateLimit) {
      const { allowed, remaining } = await checkRateLimit(req);
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      if (!allowed) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.'
        });
      }
    }

    // Call the actual handler
    return handler(req, res);
  };
}

export { sanitizeBookingInput, sanitizeString };
