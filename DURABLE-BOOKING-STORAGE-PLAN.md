# Durable Booking Storage — Execution Plan (self-contained)

> **Purpose:** Migrate booking storage from one JSON blob per instance to
> **per-day Redis hashes**, so double-booking is structurally cheap to prevent and
> every write touches one day instead of rewriting the whole dataset. This document
> is written so a **fresh Claude Code session with no prior context** can execute it
> end to end. Work top to bottom.
>
> **Repo (run the session here):**
> `/Users/clintonweekes/Library/Mobile Documents/com~apple~CloudDocs/Documents/Software/cps-calendar-book-form`
>
> **Status when this plan was written (2026-06-15):** the atomic-EVAL hotfix is
> **already shipped and live on `main`** (merge `5c44ec5`). There is **no active data
> loss** today, so this migration is not under time pressure. Roll it out slowly and
> reversibly. Nothing in this plan has been implemented yet.

> ## ✅ ROLLOUT COMPLETE — 2026-06-15
>
> Implemented (PR #1 atomic hotfix already live; per-day work merged via PR #2,
> commit `54b7cf8` on `main`) **and rolled out to all 3 production instances**.
> `BOOKING_MODEL=perday` is set + redeployed on each; per-day mode confirmed active
> in production and client data verified intact (per-day data exact-matches the
> pre-migration blob on every instance):
>
> | Vercel project | slug | data migrated |
> |---|---|---|
> | `booking-insight` | `insight` | 89 days / 208 bookings |
> | `booking-bmo-financial-solutions` | `bmo-financial-solutions` | 13 days / 15 bookings |
> | `booking-eclipse` | `eclipse` | 10 days / 13 bookings |
>
> Verified end to end: ranged-read discriminator (single-day query returns only that
> day = per-day routing live), `readAll` counts == original blob, and a full
> create→read→update→delete smoke test on `booking-eclipse` (incl. the UPDATE_DAY
> JSON-record return auto-parsing correctly). The old `instance:<slug>:bookings`
> blobs are **left intact as the rollback net** (see §11 cleanup — not yet done).
>
> **Rollback** = unset `BOOKING_MODEL` + redeploy (instant); run
> `scripts/rollback-perday.mjs` first if per-day received writes you must preserve.
>
> **Deploy quirk:** `vercel --prod` from this repo fails ("Upload aborted") because
> the repo lives in iCloud Drive. Use `vercel redeploy <prod-url> --scope
> clinton-clintonweekes-projects` (rebuilds from stored source, picks up new env
> vars) or push to `main`. A fresh deploy is **required** after changing the env var
> — `PERDAY` is read at module load.

---

## 0. TL;DR of what you are building

One change, staged behind a per-instance flag (`BOOKING_MODEL=perday`, default off):

1. **Per-day hash storage.** Each day becomes its own Redis hash
   `instance:<slug>:bookings:<date>`, field = `HH:00`, value = JSON `{user, duration}`.
   A booking touches one day's hash, not the universe.
2. **Atomic per-day claim.** A small Lua `EVAL` scoped to **one day-hash** runs the
   exact half-open overlap test the hotfix shipped, then `HSET`s the slot — so a
   multi-hour booking cannot race another into an overlapping slot. Same correctness,
   O(one day ≤ 16 slots) instead of O(whole dataset).
3. **Server-owned range read.** `GET /api/bookings?from=&to=` returns only the days in
   the visible window (the client already navigates by day/week). **No GET-all, no
   index set, no SCAN on the hot path.**
4. **Per-instance flag + idempotent backfill.** A one-time backfill copies the blob
   into per-day hashes. A flag selects old-blob vs per-day at request time. The old
   blob is **never deleted during rollout**, so rollback is a flag flip (plus a
   reverse-backfill script for lossless recovery).

Then test against a **throwaway slug**, ship with the flag **off** (zero behavior
change), and flip **one quiet instance first**.

---

## 1. Background — the decision (so you don't re-investigate)

### Architecture facts (verified, see also `BOOKING-RACE-FIX-PLAN.md` §1)

- Multi-tenant. Three live instances: `insight`, `eclipse`, `bmo-financial-solutions`.
  Each is its own Vercel project from the same template repo, scoped by the
  `INSTANCE_SLUG` env var.
- **All instances share ONE Upstash/Redis database**, namespaced only by key prefix:
  - bookings blob: `instance:<slug>:bookings` (a single JSON string)
  - config: `instance:<slug>:config`
  - audit: `instance:<slug>:audit`
- Booking blob shape: `{ "YYYY-MM-DD": { "HH:00": { user, duration } } }`. Whole-hour
  slots; only the **start hour** is stored; a duration-D booking occupies
  `[startH, startH+D)`. Bookable window is **06:00–22:00** (`src/utils/time.js:2-3`).

### Why per-day hashes + range read (the decision, with evidence)

- **GET-all is not load-bearing.** Every client consumer reads at most one day; the
  week view reads exactly 7 consecutive days (`src/components/WeekView.jsx:79` loops 7
  days; everything else is `bookings[date]`, single day — `useBookings.js:88,229,253,278`).
  There is **no** export, "all my bookings", month grid, or cross-date aggregate
  anywhere. So GET-all can be replaced by a bounded `?from=&to=` range fetch with no
  loss of function.
- **No index set.** The range is dense and bounded (just enumerate the days between
  `from` and `to`), so we never need to *discover* which days exist. This **designs out**
  the empty-day cleanup race that an `instance:<slug>:days` index would carry (SREM on
  the last booking of a day). Redis auto-removes a hash when its last field is deleted,
  and we never enumerate — so drift is impossible.
- **The duration crux.** `HSETNX` alone is wrong: a 3-hour booking occupies 3 fields
  but only the start hour is stored, so two bookings can each win their start slot and
  still overlap on later hours. The fix is the **same half-open interval test already
  shipped** (`api/_lib/booking-scripts.js:33-44`), run as a tiny Lua claim **scoped to
  one day-hash**. Identical correctness, O(one day).
- **Cross-midnight is impossible by construction once we enforce the window
  server-side.** Today the UI blocks `hour+duration > END_HOUR(22)`
  (`src/App.jsx:199,216`) but the **server Lua does not** — a direct API call could
  write a record conceptually past midnight (only the start slot is stored; the tail is
  silently lost). We close this in Step 2 by enforcing `startH >= 6 && startH+duration
  <= 22` server-side. That makes "claim scoped to one day-hash" provably sufficient: no
  booking can ever touch two days.

### Two existing bugs folded into this work

1. **UPDATE conflict check is weaker than CREATE** (`booking-scripts.js:63-69`): when
   extending a duration it only checks whether the tail *slot key exists*, not the
   half-open interval — so extending over the *body* of an existing multi-hour booking
   can slip through. The new per-day UPDATE script (Step 1) uses the full interval test.
2. **Polling downloads the whole dataset every 7s** (`useBookings.js:13,79`). Range
   read fixes this for free — each poll pulls one week.

### What stays out of scope (and why)

- **Rate-limiter RMW race** (`security.js:74-84`, `BOOKING-RACE-FIX-PLAN.md` §11 #3):
  same *class* of bug but a different key (`ratelimit:<ip>`, global, TTL'd), a different
  primitive (`INCR`+`EXPIRE`, no cjson/blob), low severity ("if it ever matters"), and
  zero shared code path. Keep it a separate small follow-up; bundling it widens the
  blast radius of a higher-risk change for no benefit.
- **Deleting the old blobs** — deferred until every instance has run stable on per-day
  for a while (see §11). The blob is the rollback snapshot.

---

## 2. Scope

**In:**
- New per-day Lua scripts (CREATE / UPDATE / DELETE) — keep the old blob scripts intact.
- Server-side bookable-window enforcement.
- `GET /api/bookings` range read + flag-gated per-day write paths.
- Client: send the visible range on fetch + poll; one-line wiring in `App.jsx`.
- Idempotent forward backfill + reverse (rollback) backfill scripts.
- Per-instance feature flag.

**Out:** rate-limiter race; old-blob deletion; any UI redesign; the audit-endpoint gate
(`BOOKING-RACE-FIX-PLAN.md` §11 #2).

---

## 3. PRE-FLIGHT SAFETY RULES (read before touching anything)

1. **Branch fresh off `main`.** `main` already has the shipped hotfix
   (`5c44ec5`). `git checkout main && git pull --ff-only && git checkout -b
   feat/durable-perday-storage`.
2. **Test ONLY with `INSTANCE_SLUG=test-race`.** All tenants share one KV — never point
   tests at `insight`, `eclipse`, or `bmo-financial-solutions`.
3. **Ship with the flag OFF.** `BOOKING_MODEL` unset = old blob behavior = zero change
   in production. No instance flips until §9.
4. **The old blob is sacred during rollout.** Backfill only *reads* it. Do not delete or
   overwrite any `instance:<slug>:bookings` blob until §11 cleanup, long after cutover.
5. **`vercel dev` serves the API (curl works) but breaks the browser UI** (its SPA
   rewrite swallows `/src/main.jsx`). For API/concurrency tests, curl against `vercel
   dev` is fine. For UI testing, run plain `vite` + a temporary `server.proxy`
   `/api → http://localhost:3000`, and **revert before commit**.
6. **Upstash Lua constraints (still apply):** `cjson.decode`/`cjson.encode` work;
   `cjson.encode_empty_table_as_object` does **not** (throws). Per-day hashes avoid the
   empty-object problem entirely (Redis drops an emptied hash). **Signal returns must
   not be valid JSON** (`'OK'`/`'CONFLICT'`/`'NOTFOUND'`/`'BADTIME'`) so the SDK leaves
   them as strings. **Never return numbers** (RESP truncates floats).
7. **KV creds:** read-write creds in `.env.local` (this repo). Deploy/status:
   `cps-admin-app/.env.production` (`VERCEL_TOKEN`, team
   `team_uLYtGnSXxNuRn80kZ0qu0QUX`). **Never print tokens.**

---

## 4. Verified technical reference (you can rely on these)

- **`kv.eval(script, [keys], [argv])`** returns the Lua return value. A returned plain
  string (e.g. `'OK'`) stays a string; a returned **valid-JSON string** (e.g.
  `'{"user":"X","duration":2}'`) is **auto-parsed by the SDK into an object**. We use
  both deliberately (signals = strings, the UPDATE success payload = JSON object).
- **`HGETALL` in Lua** returns a flat array `{field1, val1, field2, val2, ...}`; iterate
  `for i = 1, #arr, 2 do`.
- **`kv.hset(key, { [field]: value })`** JSON-serializes object values;
  **`kv.hgetall(key)`** JSON-deserializes them back. So a value written by Lua as
  `cjson.encode({user=..., duration=...})` round-trips to `{user, duration}` through the
  SDK, and a value written by `kv.hset` round-trips through `cjson.decode` in Lua.
  Consistent both directions. (User strings are pre-sanitized of `<>'"` in
  `security.js:106`, so no quote-escaping surprises.)
- **`HDEL`** returns the count removed (`0` ⇒ field absent ⇒ `NOTFOUND`). Redis removes
  the hash automatically when its last field is deleted.
- **`kv.scan(cursor, { match, count })`** returns `[nextCursor, keys]` — used only in
  the one-off rollback script, never on the hot path.
- **Script KV client** (mirror `scripts/seed-kv.mjs:1-10`): `createClient({ url:
  process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })` after
  `config({ path: '.env.local' })`.
- **Feature flag:** `const PERDAY = process.env.BOOKING_MODEL === 'perday';` Per Vercel
  project, so it flips one instance at a time.

---

## 5. File inventory (what you add / change)

| File | Change |
|---|---|
| `api/_lib/booking-scripts.js` | **Add** `CREATE_BOOKING_DAY_LUA`, `UPDATE_BOOKING_DAY_LUA`, `DELETE_BOOKING_DAY_LUA`. Keep the existing blob scripts. |
| `api/_lib/security.js` | **Add** `isWithinBookableWindow(timeKey, duration)` and export it. |
| `api/_lib/bookings-range.js` | **New** small helper: `enumerateDates(from, to)`, `dayKey(slug, date)`, `readRange(slug, from, to)`, `readAll(slug)` (SCAN fallback). |
| `api/bookings/index.js` | Branch GET (range read vs blob) and POST (per-day claim vs blob) on `PERDAY`; add window check. |
| `api/bookings/update.js` | Branch PUT/DELETE on `PERDAY`; add window check; use the script's returned record (drop the post-EVAL `kv.get`). |
| `src/services/api.js` | `fetchBookings(range)` sends `?from=&to=` when given. |
| `src/hooks/useBookings.js` | Accept `{ currentDate, isWeekView }`, compute range, fetch + poll that range. |
| `src/App.jsx` | One line: `useBookings({ currentDate, isWeekView })`. |
| `scripts/backfill-perday.mjs` | **New** idempotent forward backfill (blob → per-day). |
| `scripts/rollback-perday.mjs` | **New** idempotent reverse backfill (per-day → blob). |

---

## 6. Implementation

### Step 1 — Per-day Lua scripts: append to `api/_lib/booking-scripts.js`

Keep the existing blob scripts. Add these three. They operate on **one day-hash**
(`KEYS[1] = instance:<slug>:bookings:<date>`) and preserve the half-open overlap test
verbatim.

```js
// ---------------------------------------------------------------------------
// PER-DAY HASH MODEL (KEYS[1] = instance:<slug>:bookings:<date>)
// Field = "HH:00", value = JSON {user, duration}. Same overlap correctness as the
// blob scripts above, but scoped to one day so a write is O(one day), not O(all dates).
// ---------------------------------------------------------------------------

// CREATE_DAY: ARGV = [hour, user, duration]
// Returns: 'OK' | 'CONFLICT' | 'BADTIME'
export const CREATE_BOOKING_DAY_LUA = `
local hour = ARGV[1]
local user = ARGV[2]
local duration = tonumber(ARGV[3])
local startH = tonumber(string.sub(hour, 1, 2))
if startH == nil or duration == nil then return 'BADTIME' end
-- half-open overlap test against every existing booking in this day, both directions
local arr = redis.call('HGETALL', KEYS[1])
for i = 1, #arr, 2 do
  local exH = tonumber(string.sub(arr[i], 1, 2))
  local rec = cjson.decode(arr[i + 1])
  local exDur = tonumber(rec.duration) or 1
  if exH ~= nil and exH < (startH + duration) and startH < (exH + exDur) then
    return 'CONFLICT'
  end
end
redis.call('HSET', KEYS[1], hour, cjson.encode({ user = user, duration = duration }))
return 'OK'
`;

// UPDATE_DAY: ARGV = [hour, newUser('' = keep), newDuration('' = keep)]
// Returns: 'NOTFOUND' | 'CONFLICT' | the stored record as JSON (auto-parsed by the SDK)
export const UPDATE_BOOKING_DAY_LUA = `
local hour = ARGV[1]
local raw = redis.call('HGET', KEYS[1], hour)
if not raw then return 'NOTFOUND' end
local cur = cjson.decode(raw)
local startH = tonumber(string.sub(hour, 1, 2))
local curDur = tonumber(cur.duration) or 1
if ARGV[3] ~= '' then
  local newDur = tonumber(ARGV[3])
  if newDur ~= nil and newDur > curDur then
    -- full half-open interval test against OTHER bookings (fixes the weak blob check)
    local arr = redis.call('HGETALL', KEYS[1])
    for i = 1, #arr, 2 do
      if arr[i] ~= hour then
        local exH = tonumber(string.sub(arr[i], 1, 2))
        local rec = cjson.decode(arr[i + 1])
        local exDur = tonumber(rec.duration) or 1
        if exH ~= nil and exH < (startH + newDur) and startH < (exH + exDur) then
          return 'CONFLICT'
        end
      end
    end
  end
  cur.duration = newDur
end
if ARGV[2] ~= '' then cur.user = ARGV[2] end
redis.call('HSET', KEYS[1], hour, cjson.encode(cur))
return cjson.encode(cur)
`;

// DELETE_DAY: ARGV = [hour]
// Returns: 'OK' | 'NOTFOUND'  (Redis auto-removes the hash when its last field goes)
export const DELETE_BOOKING_DAY_LUA = `
local removed = redis.call('HDEL', KEYS[1], ARGV[1])
if removed == 0 then return 'NOTFOUND' end
return 'OK'
`;
```

> **Note on UPDATE return:** success returns the record as a JSON string, which the SDK
> auto-parses into `{user, duration}`. The handler can use it directly, which removes
> the **non-atomic `kv.get` after the EVAL** that the blob path does
> (`api/bookings/update.js:45`). `'NOTFOUND'`/`'CONFLICT'` stay strings, so the handler
> distinguishes them with a simple `=== 'NOTFOUND'` / `=== 'CONFLICT'` check before
> treating the result as the record.

### Step 2 — Server-side bookable-window enforcement: `api/_lib/security.js`

Add and export (keeps the per-day claim provably single-day; closes the cross-midnight
hole at the data layer):

```js
// Bookable window (mirror of src/utils/time.js START_HOUR/END_HOUR). Enforced
// server-side so a direct API call cannot create a booking that runs past 22:00 /
// across midnight — which the per-day model relies on.
const BOOKABLE_START = 6;
const BOOKABLE_END = 22;

export function isWithinBookableWindow(timeKey, duration) {
  const startH = parseInt(String(timeKey).slice(0, 2), 10);
  if (Number.isNaN(startH)) return false;
  return startH >= BOOKABLE_START && (startH + Number(duration)) <= BOOKABLE_END;
}
```

### Step 3 — Range read helper: new `api/_lib/bookings-range.js`

```js
import { kv } from '@vercel/kv';

export const dayKey = (slug, date) => `instance:${slug}:bookings:${date}`;

// Inclusive list of YYYY-MM-DD between from and to. Capped to bound the fan-out
// (week view needs 7; 62 is a generous ceiling). Returns null on bad/oversized input.
export function enumerateDates(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return null;
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const out = [];
  for (let d = start; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
    if (out.length > 62) return null; // too large
  }
  return out;
}

// Hot path: read only the days in [from, to]. One hgetall per day (<= ~7), no SCAN.
export async function readRange(slug, dates) {
  const results = await Promise.all(dates.map((d) => kv.hgetall(dayKey(slug, d))));
  const out = {};
  dates.forEach((d, i) => {
    if (results[i] && Object.keys(results[i]).length) out[d] = results[i];
  });
  return out;
}

// Compatibility fallback only (no range given): SCAN-assemble every day for the slug.
// Not used by the client; guards any unknown caller that still expects GET-all.
export async function readAll(slug) {
  const out = {};
  let cursor = 0;
  do {
    const [next, keys] = await kv.scan(cursor, {
      match: `instance:${slug}:bookings:*`,
      count: 100,
    });
    cursor = Number(next);
    for (const k of keys) {
      const date = k.split(':').pop();
      const day = await kv.hgetall(k);
      if (day && Object.keys(day).length) out[date] = day;
    }
  } while (cursor !== 0);
  return out;
}
```

### Step 4 — `api/bookings/index.js` (GET range + POST claim, flag-gated)

Add imports and the flag at the top:

```js
import { CREATE_BOOKING_LUA, CREATE_BOOKING_DAY_LUA } from '../_lib/booking-scripts.js';
import { withSecurity, sanitizeBookingInput, isWithinBookableWindow } from '../_lib/security.js';
import { dayKey, enumerateDates, readRange, readAll } from '../_lib/bookings-range.js';
// ...
const PERDAY = process.env.BOOKING_MODEL === 'perday';
const slug = process.env.INSTANCE_SLUG || 'cps-software';
const key = `instance:${slug}:bookings`; // blob key (still used when PERDAY is off)
```

**GET** — replace the body:

```js
if (req.method === 'GET') {
  if (!PERDAY) {
    const bookings = await kv.get(key);
    return res.status(200).json(bookings || {});
  }
  const { from, to } = req.query;
  if (from && to) {
    const dates = enumerateDates(String(from), String(to));
    if (!dates) return res.status(400).json({ error: 'Invalid or too-large range' });
    return res.status(200).json(await readRange(slug, dates));
  }
  // no range: compatibility fallback (SCAN-assemble). The client always sends a range.
  return res.status(200).json(await readAll(slug));
}
```

**POST** — after the existing field validation, add the window check, then branch the
write:

```js
if (!isWithinBookableWindow(timeKey, duration)) {
  return res.status(400).json({ error: 'Outside bookable hours (06:00-22:00)' });
}

const result = PERDAY
  ? await kv.eval(CREATE_BOOKING_DAY_LUA, [dayKey(slug, dateKey)], [timeKey, user, String(duration)])
  : await kv.eval(CREATE_BOOKING_LUA, [key], [dateKey, timeKey, user, String(duration)]);

if (result === 'BADTIME') return res.status(400).json({ error: 'Invalid time or duration' });
if (result === 'CONFLICT') {
  await logAudit({ action: 'conflict', dateKey, timeKey, user, duration, ip: getClientIp(req), result: 'conflict' });
  return res.status(409).json({ error: 'Slot already booked' });
}
await logAudit({ action: 'create', dateKey, timeKey, user, duration, ip: getClientIp(req), result: 'ok' });
return res.status(201).json({ success: true, booking: { dateKey, timeKey, user, duration } });
```

### Step 5 — `api/bookings/update.js` (PUT/DELETE, flag-gated)

Add imports + flag (same `PERDAY`, `slug`, `key`, plus `isWithinBookableWindow`,
`dayKey`, and the day scripts). Then:

**PUT** — after field validation, window-check the resulting duration if it changes,
then branch:

```js
if (updates.duration != null && !isWithinBookableWindow(timeKey, updates.duration)) {
  return res.status(400).json({ error: 'Outside bookable hours (06:00-22:00)' });
}

if (PERDAY) {
  const result = await kv.eval(
    UPDATE_BOOKING_DAY_LUA,
    [dayKey(slug, dateKey)],
    [timeKey, updates.user != null ? String(updates.user) : '', updates.duration != null ? String(updates.duration) : '']
  );
  if (result === 'NOTFOUND') return res.status(404).json({ error: 'Booking not found' });
  if (result === 'CONFLICT') {
    await logAudit({ action: 'conflict', dateKey, timeKey, ip: getClientIp(req), result: 'conflict' });
    return res.status(409).json({ error: 'Cannot extend: slot is already booked' });
  }
  // result is the stored record { user, duration } (auto-parsed) - no extra kv.get needed
  await logAudit({ action: 'update', dateKey, timeKey, user: result?.user, duration: result?.duration, ip: getClientIp(req), result: 'ok' });
  return res.status(200).json({ success: true, booking: result });
}
// ...existing blob PUT path unchanged...
```

**DELETE** — branch:

```js
if (PERDAY) {
  const result = await kv.eval(DELETE_BOOKING_DAY_LUA, [dayKey(slug, dateKey)], [timeKey]);
  if (result === 'NOTFOUND') return res.status(404).json({ error: 'Booking not found' });
  await logAudit({ action: 'delete', dateKey, timeKey, ip: getClientIp(req), result: 'ok' });
  return res.status(200).json({ success: true });
}
// ...existing blob DELETE path unchanged...
```

### Step 6 — Client `src/services/api.js`

Make `fetchBookings` accept an optional range (backward compatible: no range ⇒ no query
string, so blob mode still returns everything):

```js
export async function fetchBookings(range) {
  if (!USE_API) {
    return localStorage.getBookings();
  }
  try {
    const qs = range?.from && range?.to ? `?from=${range.from}&to=${range.to}` : '';
    return await apiRequest(`/bookings${qs}`);
  } catch (error) {
    console.warn('API unavailable, falling back to localStorage');
    return localStorage.getBookings();
  }
}
```

### Step 7 — Client `src/hooks/useBookings.js`

The merge logic (`handlePollingUpdate`) **stays as-is** — it already replaces state with
whatever the server returns, merged with in-flight optimistic ops. In blob mode the
server returns everything; in per-day mode it returns the range. Both work unchanged.

Three edits:

1. Import the range helpers:
   ```js
   import { getStartOfWeek, addDays, formatDate, isSlotBlocked } from '../utils/time';
   ```
2. Accept the view, compute the range, keep it in a ref, and have polling read it:
   ```js
   function computeRange(currentDate, isWeekView) {
     const base = currentDate || new Date();
     if (isWeekView) {
       const start = getStartOfWeek(base);
       return { from: formatDate(start), to: formatDate(addDays(start, 6)) };
     }
     const d = formatDate(base);
     return { from: d, to: d };
   }

   export function useBookings({ currentDate, isWeekView } = {}) {
     // ...existing state...
     const rangeRef = useRef(computeRange(currentDate, isWeekView));
     // stable fetcher the poller can call; always reads the current range
     const fetchForRange = useCallback(() => apiFetchBookings(rangeRef.current), []);
   ```
3. Replace the mount-only effect with a range effect (covers mount **and** navigation).
   Apply the snapshot through `handlePollingUpdate` so in-flight optimistic ops survive:
   ```js
   useEffect(() => {
     const r = computeRange(currentDate, isWeekView);
     rangeRef.current = r;
     let cancelled = false;
     (async () => {
       try {
         setLoading(true);
         setError(null);
         const data = await apiFetchBookings(r);
         if (!cancelled) handlePollingUpdate(data || {});
       } catch (err) {
         if (!cancelled) setError(err.message);
       } finally {
         if (!cancelled) setLoading(false);
       }
     })();
     return () => { cancelled = true; };
   }, [currentDate, isWeekView, handlePollingUpdate]);
   ```
   And point the poller at `fetchForRange` instead of the zero-arg `apiFetchBookings`:
   ```js
   const { triggerSync } = usePollingSync(fetchForRange, handlePollingUpdate, {
     interval: POLLING_INTERVAL,
     enabled: isApiEnabled(),
   });
   ```
   > `currentDate` is React state in `App.jsx` (stable identity until `setCurrentDate`),
   > so depending on it directly is safe; navigation creates a new `Date`, which
   > correctly re-runs the effect and refetches the new window.

### Step 8 — `src/App.jsx` (one line)

`currentDate` (line 22) and `isWeekView` (line 23) are declared before the hook call on
line 30. Change line 30:

```js
const { bookings, createBooking, removeBooking, updateBooking, getSlotStatus, canBook, canChangeDuration, notice, dismissNotice } = useBookings({ currentDate, isWeekView });
```

### Step 9 — Forward backfill: new `scripts/backfill-perday.mjs`

Idempotent (re-runnable): `hset` overwrites with identical values. Reads the blob, never
deletes it.

```js
import { createClient } from '@vercel/kv';
import { config } from 'dotenv';

config({ path: '.env.local' });

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const slug = process.env.INSTANCE_SLUG;
if (!slug) {
  console.error('Set INSTANCE_SLUG to the instance you are migrating.');
  process.exit(1);
}

async function run() {
  const blobKey = `instance:${slug}:bookings`;
  const blob = (await kv.get(blobKey)) || {};
  let n = 0;
  for (const [date, day] of Object.entries(blob)) {
    for (const [hour, rec] of Object.entries(day)) {
      await kv.hset(`instance:${slug}:bookings:${date}`, { [hour]: rec });
      n++;
    }
  }
  console.log(`Backfilled ${n} bookings across ${Object.keys(blob).length} days for ${slug}. Blob left intact.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
```

### Step 10 — Reverse backfill (rollback): new `scripts/rollback-perday.mjs`

Reassembles a blob from the per-day hashes (lossless rollback, picks up anything written
under per-day mode). SCAN is acceptable here — one-off ops script.

```js
import { createClient } from '@vercel/kv';
import { config } from 'dotenv';

config({ path: '.env.local' });

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const slug = process.env.INSTANCE_SLUG;
if (!slug) {
  console.error('Set INSTANCE_SLUG to the instance you are rolling back.');
  process.exit(1);
}

async function run() {
  const blob = {};
  let cursor = 0;
  do {
    const [next, keys] = await kv.scan(cursor, { match: `instance:${slug}:bookings:*`, count: 100 });
    cursor = Number(next);
    for (const k of keys) {
      const date = k.split(':').pop();
      const day = await kv.hgetall(k);
      if (day && Object.keys(day).length) blob[date] = day;
    }
  } while (cursor !== 0);
  await kv.set(`instance:${slug}:bookings`, blob);
  console.log(`Rebuilt blob for ${slug} from ${Object.keys(blob).length} per-day hashes.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
```

---

## 7. Local testing (throwaway slug `test-race` only)

Run the API with `INSTANCE_SLUG=test-race BOOKING_MODEL=perday vercel dev` (curl works;
the UI is broken under `vercel dev` — that's expected, see §3.5). Replace `$U` with the
local URL (e.g. `http://localhost:3000`).

**7a. Single booking + range read**
```bash
curl -s -XPOST $U/api/bookings -H 'content-type: application/json' \
  -d '{"dateKey":"2030-01-02","timeKey":"09:00","user":"A","duration":2}'
# expect 201
curl -s "$U/api/bookings?from=2030-01-01&to=2030-01-07"
# expect {"2030-01-02":{"09:00":{"user":"A","duration":2}}}
```

**7b. Multi-hour overlap (the duration crux)**
```bash
# 09:00 dur 2 occupies 09 + 10. A booking at 10:00 must conflict.
curl -s -XPOST $U/api/bookings -H 'content-type: application/json' \
  -d '{"dateKey":"2030-01-02","timeKey":"10:00","user":"B","duration":1}'
# expect 409 Slot already booked
```

**7c. Concurrency (the core proof)** — fire N simultaneous POSTs at one fresh slot;
exactly one must win:
```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" -XPOST $U/api/bookings \
    -H 'content-type: application/json' \
    -d '{"dateKey":"2030-03-03","timeKey":"14:00","user":"U'"$i"'","duration":1}' &
done | sort | uniq -c
# expect: 1x 201, 19x 409
```

**7d. Window enforcement**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -XPOST $U/api/bookings \
  -H 'content-type: application/json' \
  -d '{"dateKey":"2030-01-02","timeKey":"21:00","user":"C","duration":3}'
# expect 400 (21+3=24 > 22) - proves no cross-midnight booking can be created
```

**7e. Update extend-over-body (the fixed bug) + delete**
```bash
# book 11:00 dur1 and 13:00 dur1, then try to extend 11:00 to dur3 (covers 12,13) -> conflict
curl -s -XPOST $U/api/bookings -d '{"dateKey":"2030-04-04","timeKey":"11:00","user":"A","duration":1}' -H 'content-type: application/json'
curl -s -XPOST $U/api/bookings -d '{"dateKey":"2030-04-04","timeKey":"13:00","user":"B","duration":1}' -H 'content-type: application/json'
curl -s -XPUT $U/api/bookings/update -d '{"dateKey":"2030-04-04","timeKey":"11:00","updates":{"duration":3}}' -H 'content-type: application/json'
# expect 409 (the blob path would have WRONGLY allowed this)
curl -s -XDELETE $U/api/bookings/update -d '{"dateKey":"2030-04-04","timeKey":"11:00"}' -H 'content-type: application/json'
# expect {"success":true}; deleting the last field auto-removes the day hash
```

**7f. Backfill round-trip** (prove forward + reverse are lossless)
```bash
# seed a blob under test-race, backfill, read range, rollback, diff
INSTANCE_SLUG=test-race node scripts/backfill-perday.mjs
INSTANCE_SLUG=test-race node scripts/rollback-perday.mjs
```

**7g. Cleanup** — delete every `test-race` key (use the `.env.local` read-write token; a
tiny throwaway node script doing `kv.scan` + `kv.del` over `instance:test-race:*` is
simplest). Confirm zero keys remain before moving on.

---

## 8. Commit (stage ONLY these files)

```bash
git add api/_lib/booking-scripts.js api/_lib/security.js api/_lib/bookings-range.js \
        api/bookings/index.js api/bookings/update.js \
        src/services/api.js src/hooks/useBookings.js src/App.jsx \
        scripts/backfill-perday.mjs scripts/rollback-perday.mjs
git commit -m "feat(bookings): per-day hash storage behind BOOKING_MODEL flag (default off)"
```

Do **not** commit any temporary `vite`/proxy edits (§3.5) or the cleanup script.

---

## 9. Rollout (per instance, flag-gated, quiet instance first)

The code ships with `BOOKING_MODEL` unset everywhere ⇒ **nothing changes**. Then, **one
instance at a time, off-hours**:

1. **Merge to `main`** (auto-deploys all three projects, all still on the blob path —
   verify no behavior change: book/cancel on each still works).
2. **Pick the quietest instance first** — `eclipse` or `bmo-financial-solutions`. **Never
   `insight` first.**
3. **Backfill** that instance:
   `INSTANCE_SLUG=<slug> node scripts/backfill-perday.mjs` (idempotent; blob untouched).
4. **Flip the flag:** set `BOOKING_MODEL=perday` on that instance's Vercel project and
   redeploy. (Use the admin app's `VERCEL_TOKEN` / team id; never print it.)
5. **Verify on that instance:** create / extend / cancel a booking, navigate day↔week,
   confirm the range read returns the right days and the 7s poll no longer pulls the
   whole dataset. Run a live concurrency probe against a **future** slot, then delete it.
6. **Soak**, then repeat 3–5 for the next instance. **`insight` last.**

## 10. Rollback (per instance, lossless)

If an instance misbehaves after the flip:

1. `INSTANCE_SLUG=<slug> node scripts/rollback-perday.mjs` — rebuilds the blob from the
   per-day hashes, **including anything booked under per-day mode** (so no lost bookings).
2. **Unset `BOOKING_MODEL`** on that project and redeploy → back on the blob path.
3. Investigate, fix, re-backfill, re-flip when ready.

Because the blob was never deleted and the reverse-backfill merges new writes back into
it, rollback loses nothing.

---

## 11. Follow-ups (not in this change)

1. **Rate-limiter RMW race** (`security.js:74-84`): convert to an atomic `INCR`+`EXPIRE`
   (or a tiny EVAL). Separate small PR — different key, different primitive, low severity.
2. **Delete the old blobs.** Once every instance has run stable on per-day for a
   comfortable window, delete each `instance:<slug>:bookings` blob (a one-line ops
   script). Until then it is the rollback snapshot — leave it.
3. **Drop the blob code paths.** After the blobs are gone and the flag is `perday`
   everywhere, remove the blob scripts, the `!PERDAY` branches, and the flag itself.
4. **Audit-endpoint gate** (`BOOKING-RACE-FIX-PLAN.md` §11 #2) — unrelated, still open.

---

## 12. Definition of done

- [ ] Three per-day Lua scripts added; blob scripts untouched.
- [ ] Server enforces the 06:00–22:00 window; a past-midnight booking returns 400.
- [ ] `GET ?from=&to=` returns only the requested days; no-range falls back to readAll.
- [ ] POST/PUT/DELETE branch on `BOOKING_MODEL`; per-day claim passes the concurrency,
      multi-hour overlap, and extend-over-body tests (§7b, §7c, §7e).
- [ ] Client sends the visible range on fetch and poll; navigation refetches; merge logic
      unchanged; poll no longer downloads the whole dataset.
- [ ] Forward + reverse backfill scripts proven lossless against `test-race` (§7f).
- [ ] Shipped with the flag **off**; all three instances verified unchanged before any flip.
- [ ] Rollout + rollback runbooks (§9, §10) followed for the pilot instance before
      touching `insight`.
- [ ] `test-race` keys cleaned up; no temporary `vite`/proxy edits committed.
```

*Plan written by exploration session 2026-06-15. All code verified against the files on
`main` at merge `5c44ec5`, not guessed.*
