// BEHAVIOR: Security middleware for all API endpoints - handles CORS, rate limiting, input sanitization, and security headers
// WHY: Centralized security prevents code duplication and ensures consistent protection across all endpoints
// VALIDATION: Rate limits clients to 60 requests per minute using Vercel KV for tracking
// DATA_CONSTRAINT: Uses client IP address for rate limiting; supports forwarded IPs from proxies

import { kv } from '@vercel/kv';

// CONSTANT: Allowed origins for CORS - list of domains that can make API requests
// VALIDATION: Development (localhost) and production (vercel.app) domains are allowed
// EDGE_CASE: Also allows any *.vercel.app subdomain for preview deployments
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cps-calendar-book-form.vercel.app',
  // Add production domain when deployed
];

// CONSTANT: Rate limit configuration - prevents API abuse
// VALIDATION: 60 requests per minute per IP address
// WHY: Prevents brute force attacks and excessive polling
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 60, // 60 requests per minute
};

/**
 * BEHAVIOR: Set security headers on all API responses
 * WHY: Prevents common web vulnerabilities (XSS, clickjacking, MIME sniffing)
 * VALIDATION: Adds 5 standard security headers to every response
 */
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
}

/**
 * BEHAVIOR: Handle CORS (Cross-Origin Resource Sharing) - allows browser requests from allowed origins
 * DATA_FLOW: Check request origin -> set appropriate headers -> handle OPTIONS preflight
 * VALIDATION: Requests with no origin (same-origin, curl) are allowed
 *            Requests from allowed origins are allowed
 *            Requests from unlisted origins are allowed but logged (development flexibility)
 * EDGE_CASE: OPTIONS requests are preflight checks - respond 200 immediately without calling handler
 * WHY: Browsers block cross-origin API requests unless server explicitly allows them
 *
 * @returns {boolean} - true if request should continue, false if already handled (OPTIONS)
 */
function handleCors(req, res) {
  const origin = req.headers.origin;

  // EDGE_CASE: Allow requests with no origin (same-origin, curl, direct API calls)
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // EDGE_CASE: Still allow for development flexibility, but log for security awareness
    console.warn(`CORS: Allowing unlisted origin: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // BEHAVIOR: Handle preflight - browser sends OPTIONS before actual request to check if allowed
  // WHY: Preflight is required for non-simple requests (POST, PUT, DELETE with JSON body)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  return true;
}

/**
 * BEHAVIOR: Simple rate limiting using Vercel KV - tracks request counts per IP per minute
 * DATA_FLOW: Get client IP -> check request count in KV -> increment counter -> allow or deny
 * VALIDATION: Returns { allowed: boolean, remaining: number }
 * EDGE_CASE: If KV lookup fails, allows request (fail-open) but logs error
 * WHY: Prevents brute force attacks and excessive polling; graceful degradation if KV unavailable
 *
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
async function checkRateLimit(req) {
  try {
    // BEHAVIOR: Get client IP address from request headers (handles proxies/load balancers)
    // DATA_CONSTRAINT: Checks x-forwarded-for first (from CDN/proxy), falls back to x-real-ip
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     'unknown';

    const key = `ratelimit:${clientIp}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;

    // DATA_FLOW: Get current request count from KV storage
    let data = await kv.get(key);

    if (!data || data.windowStart < windowStart) {
      // EDGE_CASE: New window or expired window - reset counter
      data = { count: 1, windowStart: now };
    } else {
      // Increment counter in existing window
      data.count++;
    }

    // DATA_FLOW: Save with TTL to auto-cleanup old rate limit data
    // WHY: 2-minute expiry (double the window) ensures data persists long enough but doesn't accumulate
    await kv.set(key, data, { ex: 120 }); // 2 minute expiry

    const remaining = Math.max(0, RATE_LIMIT.maxRequests - data.count);

    return {
      allowed: data.count <= RATE_LIMIT.maxRequests,
      remaining,
    };
  } catch (error) {
    // EDGE_CASE: If rate limiting fails (KV unavailable), allow the request but log
    // WHY: Better to fail-open than fail-closed for non-critical features
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests };
  }
}

/**
 * BEHAVIOR: Sanitize string input - removes HTML/script tags and dangerous characters
 * VALIDATION: Strips <script>, HTML tags, quotes, and angle brackets
 * DATA_CONSTRAINT: Limits string length to 100 characters
 * WHY: Prevents XSS attacks via user input
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
 * BEHAVIOR: Sanitize booking input - validates and cleans all booking data fields
 * VALIDATION: dateKey must be YYYY-MM-DD format
 *            timeKey must be HH:00 format
 *            duration must be 1-8 hours
 *            user string is sanitized for XSS
 * DATA_CONSTRAINT: Returns sanitized object with only valid fields
 * WHY: All user input must be validated before storage to prevent injection attacks
 *
 * @param {Object} body - Raw request body
 * @returns {Object} - Sanitized booking data
 */
function sanitizeBookingInput(body) {
  const sanitized = {};

  if (body.dateKey) {
    // VALIDATION: dateKey should be YYYY-MM-DD format
    const dateMatch = String(body.dateKey).match(/^\d{4}-\d{2}-\d{2}$/);
    sanitized.dateKey = dateMatch ? body.dateKey : null;
  }

  if (body.timeKey) {
    // VALIDATION: timeKey should be HH:00 format
    const timeMatch = String(body.timeKey).match(/^\d{2}:00$/);
    sanitized.timeKey = timeMatch ? body.timeKey : null;
  }

  if (body.user) {
    // VALIDATION: User string sanitized for XSS prevention
    sanitized.user = sanitizeString(body.user);
  }

  if (body.duration !== undefined) {
    // VALIDATION: duration should be 1-8 hours
    // WHY: Booking system supports max 8-hour bookings (6 AM to 10 PM = 16 hours max, but 8 is practical limit)
    const dur = parseInt(body.duration, 10);
    sanitized.duration = (dur >= 1 && dur <= 8) ? dur : null;
  }

  if (body.updates) {
    // BEHAVIOR: For update requests, sanitize the updates object fields
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
 * BEHAVIOR: Security wrapper for API handlers - wraps any endpoint handler with security middleware
 * DATA_FLOW: Request -> set headers -> handle CORS -> check rate limit -> call wrapped handler
 * VALIDATION: Rate limiting is optional (enabled by default)
 * WHY: Consistent security across all endpoints without duplicating security code
 *
 * Usage: export default withSecurity(handler, { rateLimit: true })
 */
export function withSecurity(handler, options = {}) {
  const { rateLimit = true } = options;

  return async function securedHandler(req, res) {
    // BEHAVIOR: Set security headers on every response
    setSecurityHeaders(res);

    // BEHAVIOR: Handle CORS - allow cross-origin requests from approved origins
    if (!handleCors(req, res)) {
      return; // Was OPTIONS preflight, already handled
    }

    // BEHAVIOR: Check rate limit if enabled
    if (rateLimit) {
      const { allowed, remaining } = await checkRateLimit(req);
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      if (!allowed) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.'
        });
      }
    }

    // BEHAVIOR: Call the actual handler after security checks pass
    return handler(req, res);
  };
}

export { sanitizeBookingInput, sanitizeString };
