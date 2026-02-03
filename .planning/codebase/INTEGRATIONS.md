# External Integrations

**Analysis Date:** 2026-02-04

## APIs & External Services

**Vercel KV (Redis):**
- Service: Vercel KV - Redis-based key-value storage
  - What it's used for: Persistent booking data and instance configuration storage
  - SDK/Client: `@vercel/kv` (v3.0.0)
  - Auth: `KV_REST_API_TOKEN` (REST API), `KV_REDIS_URL` (Redis protocol)
  - Supports both REST API and native Redis protocol connections

## Data Storage

**Databases:**
- Vercel KV (Redis)
  - Connection: Environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN`
  - Client: `@vercel/kv` npm package
  - Direct import: `import { kv } from '@vercel/kv'`
  - Implemented at: `api/_lib/security.js`, `api/bookings/index.js`, `api/bookings/update.js`, `api/config.js`

**Fallback Storage:**
- Browser localStorage (when API disabled or unavailable)
  - Key: "cps-bookings"
  - Implementation: `src/utils/storage.js`
  - Used when `VITE_USE_API` is "false" or API endpoints fail
  - Automatic fallback in `src/services/api.js`

**Data Structure:**
```javascript
// Bookings schema in KV
{
  "instance:{slug}:bookings": {
    "2026-02-04": {
      "09:00": { user: "Jack", duration: 2 },
      "11:00": { user: "Bonnie", duration: 1 }
    }
  },
  "instance:{slug}:config": {
    slug: "cps-software",
    title: "CPS Software Booking",
    users: [{name: "Jack", key: "j"}, ...],
    createdAt: "ISO-timestamp"
  }
}
```

**File Storage:**
- Not used - application is stateless except for KV

**Caching:**
- None - relies on polling for sync (every 7 seconds by default)

## Authentication & Identity

**Auth Provider:**
- None - application is unauthenticated
  - Rate limiting is IP-based via `X-Forwarded-For` or `X-Real-IP` headers
  - No user login required

**Authorization:**
- CORS-based origin checking (permissive for Vercel deployments)
  - Allowed origins: `http://localhost:5173`, `http://localhost:3000`, `https://cps-calendar-book-form.vercel.app`
  - Wildcard allow for `*.vercel.app` domains
  - Development: allows unlisted origins with warning

## Monitoring & Observability

**Error Tracking:**
- None - errors logged to Vercel function logs
  - Console.error() and console.warn() calls logged to Vercel deployment logs

**Logs:**
- Server-side: Vercel function console output (accessible via Vercel dashboard)
- Client-side: Browser console via React development patterns
- No external monitoring service (Sentry, LogRocket, etc.)

## CI/CD & Deployment

**Hosting:**
- Vercel (vercel.com)
  - Automatic deployments from Git commits
  - Default domain: {project}.vercel.app
  - Custom domain support available
  - Environment: Hobby plan (development)

**CI Pipeline:**
- Vercel Git integration (automatic on push to repository)
  - Build command: `npm run build`
  - Output directory: `dist/`
  - Framework detected: Vite
  - Serverless functions auto-detected in `api/` directory

**API Endpoints (Serverless):**
- POST /api/bookings - Create booking
- GET /api/bookings - Fetch all bookings
- PUT /api/bookings/update - Update booking
- DELETE /api/bookings/update - Delete booking
- GET /api/config - Fetch instance configuration

## Environment Configuration

**Required env vars (production):**
- `KV_REST_API_URL` - Vercel KV REST endpoint (e.g., https://nice-buzzard-31325.upstash.io)
- `KV_REST_API_TOKEN` - Auth token for REST API
- `KV_REDIS_URL` - Full Redis connection string (rediss://...)
- `INSTANCE_SLUG` - Tenant identifier (e.g., "cps-software", "eureka-whittaker-macnaught")
- `VITE_USE_API` - Frontend flag to enable API (must be "true" for production)

**Optional env vars:**
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only token (currently unused, provided by Vercel)

**Secrets location:**
- Vercel Environment Variables dashboard (Settings → Environment Variables)
- Local development: `.env.local` (not committed)
- Production: Set via Vercel dashboard or `vercel env pull`

## Webhooks & Callbacks

**Incoming:**
- None - API is request-response only, no webhook ingestion

**Outgoing:**
- None - no external service callbacks

## Rate Limiting

**Implementation:**
- IP-based rate limiting using KV
  - Window: 60 seconds
  - Limit: 60 requests per minute per IP
  - Rate limit header: `X-RateLimit-Remaining` returned with each response
  - Configuration: `api/_lib/security.js` (RATE_LIMIT object)
  - KV key pattern: `ratelimit:{clientIp}`
  - Graceful degradation: allowed if KV check fails

## Security Headers

**Headers Set by withSecurity Middleware:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'`

**CORS Configuration:**
- Applied to all API requests via `handleCors()` function
- Methods allowed: GET, POST, PUT, DELETE, OPTIONS
- Max age: 86400 seconds (24 hours)

## Real-time Sync Pattern

**Polling Strategy:**
- Interval: 7 seconds (configurable via `usePollingSync` hook)
- Enabled: Only when `VITE_USE_API` is "true"
- Implementation: `src/hooks/usePollingSync.js`
- Manual sync available: `refreshBookings()` method on `useBookings` hook
- Error handling: Silent failures with console.warn, does not interrupt user

## Multi-Instance Isolation

**Instance Namespacing:**
- Each instance uses `INSTANCE_SLUG` as namespace prefix
- KV keys follow pattern: `instance:{slug}:{dataType}`
  - Example: `instance:cps-software:bookings`, `instance:eureka-whittaker-macnaught:config`
- Configuration per environment: `INSTANCE_SLUG` environment variable
- All bookings and config are completely isolated by slug
- No cross-instance data sharing

---

*Integration audit: 2026-02-04*
