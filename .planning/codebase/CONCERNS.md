# Codebase Concerns

**Analysis Date:** 2026-02-04

## Known Bugs

**isSlotPast function shows hour as past too early:**
- Symptoms: Current hour appears as "past" in the UI, making it unclickable when it should still be available
- Files: `src/utils/time.js` (lines 49-54)
- Cause: `isSlotPast()` compares `slotDate < now` directly without considering the current minutes. A slot starting at 2:00 PM is marked past at 2:15 PM when it should be available until 3:00 PM
- Current code:
  ```javascript
  export function isSlotPast(date, hour) {
    const now = new Date();
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  }
  ```
- Fix approach: Modify comparison to only mark slot past if the slot END time (hour + 1:00) has passed, or change to use `<=` comparison at hour boundary
- Priority: High - blocks current-hour bookings

**Hardcoded Queensland timezone:**
- Symptoms: Daylight savings changes ignored for NSW/VIC timezones. System always operates in Queensland time (AEST, no DST)
- Files: `src/utils/time.js` (entire file uses local Date objects), `src/context/ConfigContext.jsx` (lines 1-17)
- Impact: Multi-location deployments will have incorrect time calculations when DST transitions occur in other states
- Current approach: Uses JavaScript `new Date()` which respects browser timezone but no explicit timezone handling
- Fix approach:
  1. Add timezone configuration to `ConfigContext.jsx`
  2. Accept `TIMEZONE` environment variable (e.g., "Australia/Sydney", "Australia/Queensland")
  3. Replace bare `new Date()` calls with timezone-aware calculations using a library like `date-fns-tz` or similar
- Priority: High for multi-location use, deferred if single-location only

## Security Considerations

**CORS configuration is overly permissive:**
- Risk: Origins not in whitelist are still allowed and logged as warning, defeating purpose of whitelist
- Files: `api/_lib/security.js` (lines 31-43)
- Current mitigation: Logging warnings but allowing anyway
- Code:
  ```javascript
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Still allow for development flexibility, but log
    console.warn(`CORS: Allowing unlisted origin: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);  // ALLOWS ANYWAY
  }
  ```
- Recommendations:
  1. Reject non-whitelisted origins in production
  2. Move development flexibility to `NODE_ENV === 'development'` check only
  3. Add dynamic origin loading from environment for deployment flexibility

**Rate limiting may fail silently:**
- Risk: If Vercel KV becomes unavailable, rate limiting fails open (all requests allowed) with only a console.error
- Files: `api/_lib/security.js` (lines 92-96)
- Current mitigation: Returns `allowed: true` if KV fails
- Code:
  ```javascript
  catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests };  // ALLOWS ALL
  }
  ```
- Recommendations:
  1. Consider failing closed in production (return 503 if rate limit check fails)
  2. Add metrics/alerting for KV failures
  3. Implement backup in-memory rate limiting with TTL

**Booking input sanitization is incomplete:**
- Risk: Basic HTML tag removal but doesn't validate date/time format stringently enough
- Files: `api/_lib/security.js` (lines 114-151)
- Current state: Uses regex to match `YYYY-MM-DD` and `HH:00` but doesn't validate actual date validity
- Example problem: `"9999-13-45"` passes the dateKey regex but isn't a real date
- Recommendations:
  1. Add `new Date()` validation after regex
  2. For timeKey, validate hour is 0-23
  3. For duration, enforce minimum 1 hour (already done) but test max boundary

**Secrets in `.env.production`:**
- Risk: `.env.production` contains actual KV credentials in plaintext
- Files: `.env.production` (lines 3-7)
- Impact: If repository is leaked, all booking data at risk
- Current state: File is listed in git status as untracked but was created during deployment
- Recommendations:
  1. Ensure `.env.production` is in `.gitignore` (check file)
  2. Use Vercel's environment variable management, not local files
  3. Rotate credentials in `.env.production` to invalidate if exposed

## Tech Debt

**Manual sync required for booking-eureka instance:**
- Issue: Instance uses separate repository with manual synchronization requirement
- Files: Multiple (separate repo context)
- Impact: Changes to core system don't automatically propagate to deployed instances
- Fix approach:
  1. Document sync process clearly in DEPLOY_INSTRUCTIONS.md or automation guide
  2. Consider using git submodules or monorepo approach
  3. Implement CI/CD that auto-deploys core template changes to instances
  4. Create script to track changes between instance and template
- Priority: Medium - affects deployment workflow but not runtime

**API fallback to localStorage creates data inconsistency risk:**
- Issue: When API fails, system falls back to localStorage but doesn't sync back to API when it recovers
- Files: `src/services/api.js` (lines 77-87), `src/hooks/useBookings.js` (lines 46-54)
- Impact: If API is down temporarily, local changes are not persisted to backend once it recovers
- Current code:
  ```javascript
  export async function fetchBookings() {
    if (!USE_API) {
      return localStorage.getBookings();
    }
    try {
      return await apiRequest('/bookings');
    } catch (error) {
      console.warn('API unavailable, falling back to localStorage');
      return localStorage.getBookings();  // Does NOT sync changes back
    }
  }
  ```
- Fix approach:
  1. Track whether fallback is active
  2. Implement retry-sync mechanism when API recovers
  3. Add conflict resolution if data diverged
  4. Display banner indicating offline/fallback mode to user
- Priority: Medium - only affects scenarios with temporary API failures

**Polling interval hardcoded:**
- Issue: 7-second polling interval is hardcoded in two places
- Files: `src/hooks/useBookings.js` (line 13), `src/hooks/usePollingSync.js` (documentation mentions 7000ms default)
- Impact: Inefficient for high-frequency updates, inefficient for low-frequency changes
- Fix approach:
  1. Make configurable via environment variable `VITE_POLL_INTERVAL`
  2. Or accept as prop to usePollingSync with sensible default
  3. Consider adaptive polling based on update frequency
- Priority: Low - works but not optimized

**No input validation on frontend before API call:**
- Issue: Form inputs (user name, duration) are sent to API but validated only on server
- Files: `src/components/BookingPanel.jsx` (booking creation), `src/services/api.js`
- Impact: Bad UX (validation errors from API), wasted requests, potential error states
- Fix approach:
  1. Mirror `sanitizeBookingInput` logic to frontend validation utility
  2. Validate user input before calling API
  3. Show validation errors inline in booking panel
  4. Disable submit until validation passes
- Priority: Low - functional but poor UX

## Performance Bottlenecks

**Polling sync doesn't debounce or batch updates:**
- Problem: Every 7 seconds, full bookings object is fetched and compared, even if nothing changed
- Files: `src/hooks/usePollingSync.js`, `src/services/api.js`
- Impact: Network overhead, unnecessary re-renders on every poll cycle
- Improvement path:
  1. Add response comparison - only update if data actually changed
  2. Consider WebSocket or Server-Sent Events instead of polling for real production use
  3. Add ETag/timestamp comparison to skip processing unchanged data
- Current severity: Low - acceptable for small booking sets

**Full calendar data in state:**
- Problem: All bookings for all dates held in single useState object, re-renders all components when any booking changes
- Files: `src/hooks/useBookings.js` (lines 15-17), `src/App.jsx`
- Impact: As number of bookings grows (especially with multi-month range), state updates will slow down
- Improvement path:
  1. Implement date-based state splitting
  2. Use useReducer with selective updates
  3. Memoize components aggressively to prevent unnecessary re-renders
  4. Consider context splitting (ConfigContext + BookingsContext)
- Current severity: Low - acceptable for current usage, degrades with scale

## Fragile Areas

**Slot blocking calculation in two places:**
- Files: `src/utils/time.js` (lines 85-94), `src/services/api.js` (lines 101-113, 142-150), `src/hooks/useBookings.js` (lines 174-195)
- Why fragile: Same blocking logic duplicated - if duration calculation changes, must update in 3 places
- Safe modification: Create shared utility function in `src/utils/time.js`, import everywhere
- Test coverage: No unit tests visible for blocking logic

**usePollingSync dependency array potential infinite loop:**
- Files: `src/hooks/usePollingSync.js` (lines 30, 49)
- Why fragile: `fetchFn` and `onUpdate` are dependencies passed from parent, if parent recreates them on every render, polling will restart repeatedly
- Safe modification: Document that functions must be stable (wrap parent calls in useCallback)
- Test coverage: No test cases for callback stability

**DateKey format is fragile:**
- Files: Multiple - `YYYY-MM-DD` format expected throughout but validated only in API
- Why fragile: Frontend generates dates via `new Date().toISOString().split('T')[0]` which should be safe, but any date parsing without validation could break
- Safe modification: Add validation utility `isValidDateKey()` to utils, use everywhere
- Test coverage: No unit tests for date key generation

## Missing Critical Features

**No conflict detection on simultaneous bookings:**
- Problem: If two users book the same slot simultaneously from different clients, last write wins and data is lost
- Blocks: Multi-client reliability
- Severity: High for shared system, Low if single-client usage
- Mitigation: Add optimistic locking (version field) or timestamp-based conflict detection

**No audit log or history:**
- Problem: Can't see who changed what booking or when
- Blocks: Dispute resolution, troubleshooting
- Severity: Medium - important for professional use
- Solution: Track all changes in KV with timestamps, add API endpoint to view history

**No bulk operations or batch API support:**
- Problem: Can't cancel multiple bookings at once, can't import/export schedules
- Blocks: Admin operations, batch management
- Severity: Low - nice to have for larger deployments

## Test Coverage Gaps

**No tests for time utility functions:**
- What's not tested: `isSlotPast()`, `isSlotBlocked()`, date formatting functions, time slot generation
- Files: `src/utils/time.js` (entire file)
- Risk: Date/time bugs would go unnoticed, regression testing impossible
- Priority: High - these are core business logic

**No tests for booking conflicts:**
- What's not tested: Multi-hour booking blocking, duration conflicts, edge cases (8-hour booking at end of day)
- Files: `src/hooks/useBookings.js` (canBook, canChangeDuration functions)
- Risk: Overlapping bookings could be created
- Priority: High - data integrity critical

**No tests for API fallback behavior:**
- What's not tested: localStorage fallback triggering, error handling in fetchBookings
- Files: `src/services/api.js`
- Risk: Silent failures if API error handling breaks
- Priority: Medium - fallback mechanism reliability

**No E2E tests for user flows:**
- What's not tested: Book a slot → see it blocked → try to extend → conflict scenario
- Risk: Integration issues between components
- Priority: Medium - would catch component interaction bugs

**No tests for security validation:**
- What's not tested: sanitizeBookingInput() with malicious inputs, rate limiting behavior
- Files: `api/_lib/security.js`
- Risk: Security vulnerabilities would reach production
- Priority: High - security-critical code

## Scaling Limits

**Single Vercel KV store for all instances:**
- Current capacity: Depends on Upstash plan, appears to be standard tier
- Limit: Total booking volume across all deployed instances shares one KV store
- Scaling path:
  1. Check current Upstash plan limits
  2. Add instance-based key prefixing (already done: `ratelimit:${clientIp}`)
  3. Monitor KV usage, plan for database migration if exceeds quota
  4. Consider per-instance KV databases for large deployments

**localStorage-based local development doesn't scale:**
- Current capacity: Browser localStorage typically 5-10MB
- Limit: Year of bookings (365 days × 16 slots × 2KB per booking) = ~12MB
- Scaling path:
  1. For development: Use in-memory mock API instead of localStorage
  2. For testing: Add IndexedDB fallback
  3. Consider local SQLite in production (if electron/desktop version needed)

**No pagination on API responses:**
- Current: All bookings fetched at once every 7 seconds
- Limit: API response grows linearly with booking count
- Scaling path:
  1. Add date-range filtering: `?start=YYYY-MM-DD&end=YYYY-MM-DD`
  2. Implement cursor-based pagination
  3. Cache recent bookings locally

## Dependencies at Risk

**Vercel KV (Upstash Redis):**
- Risk: Service dependency, data locked to Upstash account, pricing could change
- Impact: If service becomes unavailable, all deployed instances lose data persistence
- Migration plan:
  1. Add abstraction layer for KV operations (`api/_lib/kv-adapter.js`)
  2. Implement alternative: Vercel Postgres, or self-hosted Redis
  3. Document data export process for backups

**@vercel/kv package:**
- Risk: Tied to Vercel ecosystem, limited alternatives
- Impact: Changing deployment platforms would require rewrite
- Migration plan:
  1. Use lower-level `@vercel/postgres` or generic `ioredis`
  2. Create adapter pattern to swap implementations
  3. Current code location: `api/_lib/security.js` (line 1), API handlers

**React 18 hooks-only architecture:**
- Risk: No class component escape hatch for error boundaries
- Impact: Crashes in one component can crash entire app
- Mitigation: Add error boundary wrapper component at App level

## Environment Configuration Issues

**Timezone hardcoded implicitly:**
- Issue: No `TIMEZONE` environment variable, assumes Queensland (AEST)
- Impact: Deployments in other timezones show wrong times
- Fix: Add `VITE_TIMEZONE` environment variable, default to 'Australia/Sydney'

**ALLOWED_ORIGINS in security.js is hardcoded:**
- Issue: Must edit code to add new origins, can't use environment variable
- Files: `api/_lib/security.js` (lines 4-9)
- Impact: Every new deployment requires code change and rebuild
- Fix: Load from `process.env.ALLOWED_ORIGINS` (comma-separated list)

**No separate dev/prod configs for API:**
- Issue: Single `api.js` file handles both modes
- Impact: Hard to test API behavior without switching VITE_USE_API
- Fix: Create `api.dev.js` and `api.prod.js`, or use feature flags

---

*Concerns audit: 2026-02-04*
