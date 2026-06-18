import { kv } from '@vercel/kv';
import { logAudit, getClientIp } from './audit.js';

// Map HTTP method -> audit action, for write-path observability.
const METHOD_ACTION = { POST: 'create', PUT: 'update', DELETE: 'delete', GET: 'read' };

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

// Atomic fixed-window rate limiter. INCR + PEXPIRE inside one EVAL so concurrent
// requests from the same IP can't lose increments (the old kv.get -> mutate ->
// kv.set was a read-modify-write race) and the 429 cutoff is deterministic.
// The window TTL is set only on the first request of a window (count == 1), so
// the key auto-expires after windowMs and the next request starts a fresh window.
// Returns the new count (an integer; INCR is RESP-safe, unlike float returns).
const RATE_LIMIT_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
`;

/**
 * Atomic fixed-window rate limiting using KV (Redis INCR + PEXPIRE via EVAL)
 * Returns { allowed: boolean, remaining: number }
 */
async function checkRateLimit(req) {
  try {
    // Get client identifier (IP or forwarded IP)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     'unknown';

    const key = `ratelimit:${clientIp}`;

    // Atomically bump the window counter and (on the first hit) arm its expiry.
    const count = await kv.eval(RATE_LIMIT_LUA, [key], [String(RATE_LIMIT.windowMs)]);

    const remaining = Math.max(0, RATE_LIMIT.maxRequests - count);

    return {
      allowed: count <= RATE_LIMIT.maxRequests,
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

// Bookable window (mirror of src/utils/time.js START_HOUR/END_HOUR). Enforced
// server-side so a direct API call cannot create a booking that runs past 22:00 /
// across midnight — which the per-day model relies on.
const BOOKABLE_START = 6;
const BOOKABLE_END = 22;

function isWithinBookableWindow(timeKey, duration) {
  const startH = parseInt(String(timeKey).slice(0, 2), 10);
  if (Number.isNaN(startH)) return false;
  return startH >= BOOKABLE_START && (startH + Number(duration)) <= BOOKABLE_END;
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
        await logAudit({
          action: METHOD_ACTION[req.method] || 'read',
          dateKey: req.body?.dateKey,
          timeKey: req.body?.timeKey,
          ip: getClientIp(req),
          result: 'reject_ratelimit',
        });
        return res.status(429).json({
          error: 'Too many requests. Please try again later.'
        });
      }
    }

    // Call the actual handler
    return handler(req, res);
  };
}

export { sanitizeBookingInput, sanitizeString, isWithinBookableWindow, RATE_LIMIT, RATE_LIMIT_LUA };
