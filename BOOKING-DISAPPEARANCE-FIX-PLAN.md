# Booking Disappearance Fix — Execution Plan

> **Created:** 2026-06-18 · **Owner:** Clinton · **Instance affected:** `insight` (booking-insight.vercel.app)
> **Status doc.** This file is the single source of truth for this body of work. Each slice
> is designed to be executed in its own fresh Claude Code session. Read "How to use this doc"
> before starting any slice.

---

## How to use this doc (read first, every session)

1. Open this file. Look at the **Slice Index** table below.
2. Pick the next slice whose status is ⬜ and whose dependencies are all ✅.
3. Set its status to 🔄 (in progress) in the index, and work only that slice.
4. Tick each task checkbox `[x]` inside the slice as you complete it.
5. When the slice's acceptance criteria all pass, set status to ✅ and append a dated entry
   to the **Progress Log** at the bottom (date, session id, what changed, verification result).
6. Follow the slice's **CPM** instruction exactly (see legend). Do not push/merge unless the
   slice says to.
7. **Production rollout is separate from CPM.** Merging to `main` does NOT put code on the
   live `insight` instance. See **Rollout & deploy notes** before touching production.

### Status legend
- ⬜ Not started
- 🔄 In progress
- ✅ Done (merged where applicable + verified)
- ⏭️ Skipped / deferred (note why in Progress Log)

### CPM legend
- **CPM: yes** — when the slice is complete and verified, commit, push, open PR, merge (per the
  `cpm` convention: branch off `main`, PR, merge). Scope the commit to that slice only.
- **CPM: no** — do not push/merge. Either it is a read-only diagnostic, or it should be batched
  with another slice (the slice says which).
- **CPM: hold** — commit locally on the branch but wait for explicit go-ahead before merging
  (used where we want to review the diff together first).

---

## Background (context for a cold session)

On 2026-06-18, user **Joel** booked two slots on `insight` (1-4PM = `13:00`/dur 3, and
4-5PM = `16:00`/dur 1). Adam already held 12-1PM (`12:00`/dur 1). Joel's UI showed his
bookings (misaligned, see render bug), he refreshed, and **his bookings were gone** while
Adam's remained. He re-booked and it stuck.

**Forensic finding (proven, read-only, from the Redis audit log + live KV):**
- The audit log (`instance:insight:audit`) shows Joel's FIRST attempt produced **no create,
  no conflict, no delete** — zero server trace. The only June-18 events are Adam's create
  (11:29 AEST) and Joel's RE-booking creates (12:21:14 and 12:21:17 AEST).
- Therefore Joel's first booking **never persisted server-side**. This is NOT the concurrent-write
  race fixed on June 15 (that fix is working: the rebooking persisted atomically, all three
  slots coexist, nothing was overwritten).
- This is a **client-side** failure: a booking shown as successful before the server durably
  confirmed it, dropped silently on refresh, with no error surfaced. Two candidate triggers
  (refresh aborted an in-flight POST, OR a POST resolved without a real persist); both are
  caused by the same root weakness and fixed the same way. The exact trigger is undiagnosable
  because server rejection/error paths don't write to the audit log.

**Key files (current state, pre-fix):**
- `src/hooks/useBookings.js` — optimistic write (117-124), silent success branch `if (b)` with
  no else (129-138), `pendingRef` cleared in `finally` too early (155, mirror 192/243), merge
  reconcile (55-73).
- `src/services/api.js` — `apiRequest` throws on non-2xx (26-34); `fetchBookings` swallows GET
  errors into a localStorage fallback (86-89).
- `api/bookings/index.js` — early returns before `logAudit` (400s at 40-44, 48-50, 59-61; 500
  catch at 77-80); only success (67) and conflict (63) audit.
- `api/bookings/update.js` — same audit gaps on its 400/404/500 paths.
- `api/_lib/security.js` — `isWithinBookableWindow` (clock-independent, exonerated); rate-limit
  429 returns without audit (186-190); rate limiter is a non-atomic read-modify-write (74-84).
- `src/components/BookingBlock.jsx` — hardcoded `SLOT_HEIGHT`/`SLOT_GAP` (6-7), pixel math
  (84, 111-112, 131), double `isSlotPast` derivation (71-79, 88-97).
- `index.html:9` — Google Fonts `&display=swap` (first-paint reflow source).

---

## Slice Index

| ID | Slice | Priority | Status | CPM | Depends on |
|----|-------|----------|--------|-----|-----------|
| S0 | Pull Vercel runtime logs for trigger evidence (time-sensitive) | P3 | ⬜ | no (read-only) | — |
| S1 | Client: confirm-before-commit + surface failures | P1 | ⬜ | yes | — |
| S2 | Server: audit every rejection/error path | P2 | ⬜ | yes | — |
| S3 | Render: fix booking-block misalignment | P4 | ⬜ | yes | — |
| S4 | Server: make the rate limiter atomic (stretch) | P5 | ⬜ | hold | S2 |
| S5 | Production rollout + live verification across instances | P1 | ⬜ | no (deploy) | S1, S2, S3 |

> S0 is independent and **time-sensitive** (log retention is short). Do it first if possible,
> but it does not block any code slice. S1/S2/S3 are independent of each other and can be done
> in any order or parallel sessions. S5 is the rollout gate and runs last.

---

## S0 — Pull Vercel runtime logs for trigger evidence

**Priority:** P3 (time-sensitive: runtime logs expire quickly) · **CPM:** no (read-only)

**Objective:** Confirm which trigger fired for Joel's first attempt (a 500/EVAL-throw, a 429
rate-limit, or no server hit at all). This is diagnostic only; the fix does not depend on it,
but it closes the "exact cause" question.

**Tasks**
- [ ] Identify the live `insight` Vercel project (note: local `.vercel` is linked to the staging
      `cps-calendar-book-form` project, not `insight` — do not assume).
- [ ] Pull runtime logs for `insight` around 2026-06-18 ~11:29-12:21 AEST (01:29-02:21 UTC).
- [ ] Grep for `Error handling bookings:` (index.js:78 → 500/EVAL-throw) and any `429` /
      `X-RateLimit-Remaining: 0`.
- [ ] Record the finding (or "logs already expired / inconclusive") in the Progress Log.

**Acceptance:** A definitive note in the Progress Log of what the logs showed, or that they
were unavailable. No code change.

**Notes:** If logs are gone, that's expected; S2 ensures the NEXT occurrence is fully traceable
from the audit log alone, so this becomes moot going forward.

---

## S1 — Client: confirm-before-commit + surface failures

**Priority:** P1 (this is the actual data-loss bug) · **CPM:** yes

**Objective:** A booking is shown as confirmed ONLY when the server has durably persisted it.
Any unconfirmed/failed save rolls back and shows the user a clear notice, instead of silently
vanishing on the next poll/refresh.

**Files:** `src/hooks/useBookings.js` (primary), `src/services/api.js` (supporting).

**Tasks**
- [ ] In `createBooking` (useBookings.js ~129-138): add the missing `else` — a resolved response
      with no usable `booking` must be treated as a FAILURE (throw or route into the existing
      catch) so it rolls back the slot and calls `setNotice(...)`. No silent success.
- [ ] Stop clearing `pendingRef` in `finally` (line 155). Only remove a pending key once the
      booking is confirmed present in a SERVER snapshot (success path after reconcile) or after
      a rollback (catch path). Mirror the same correction in `removeBooking` (192) and
      `updateBooking` (243).
- [ ] Decide and implement the cross-refresh durability stance: at minimum, ensure an in-flight
      create that gets interrupted cannot leave a "looks booked" state with no confirmation.
      (Optionally persist pending ops so a reload can re-verify; keep it simple — surfacing the
      failure is the must-have.)
- [ ] Review `fetchBookings` localStorage fallback (api.js:86-89): ensure a failed GET does not
      masquerade as authoritative server data in a way that hides a missing booking. At least
      log/flag the fallback so it's observable.
- [ ] Add/adjust tests if a test harness exists (check `package.json`); otherwise document manual
      test steps.

**Acceptance criteria**
- [ ] Simulated failed/empty create response → slot rolls back AND a notice appears (no silent
      retain).
- [ ] A successful create stays put across the next poll and a manual refresh.
- [ ] No regression to the existing 409-conflict toast behaviour.
- [ ] Booking the same slot Joel did (1-4PM + 4-5PM with another user already on 12-1PM) behaves
      correctly locally against `vercel dev`.

**Verification:** Run locally against `vercel dev` (per repo convention; `/run` skill or
`vite` + functions). Reproduce the empty/failed-response case by stubbing the API response.
State exactly what was observed.

**CPM:** yes, after acceptance passes. Branch e.g. `fix/client-confirm-before-commit`.

---

## S2 — Server: audit every rejection/error path

**Priority:** P2 (observability — makes any recurrence diagnosable in seconds) · **CPM:** yes

**Objective:** Every booking write outcome — success, conflict, validation reject, window
reject, bad-time, rate-limit, and unexpected error — leaves an audit event. The 500-catch line
is the single highest-value addition.

**Files:** `api/bookings/index.js`, `api/bookings/update.js`, `api/_lib/security.js`,
`api/_lib/audit.js` (reuse `logAudit`).

**Tasks**
- [ ] index.js: add `logAudit` before each early return — `result:'reject_validation'` (40-44),
      `result:'reject_window'` (48-50), `result:'reject_badtime'` (59-61).
- [ ] index.js: add `logAudit({ action:'create', ..., result:'error', error:String(e?.message) })`
      in the 500 catch (77-80) before responding. (logAudit already never throws.)
- [ ] update.js: mirror audit on its 400/404/500 branches.
- [ ] security.js: audit the 429 rate-limit reject (186-190) as `result:'reject_ratelimit'`
      (import `logAudit`/`getClientIp`, or surface a flag the handler audits).
- [ ] Keep events shape-compatible with the existing reader (`{ ts, action, dateKey, timeKey,
      user?, duration?, ip?, result }`). Confirm `AUDIT_CAP` (1000) is still sane.
- [ ] Add a tiny read affordance for ops (decide: protected `GET /api/bookings/audit` behind the
      admin password, OR keep direct-KV-only). Default: keep direct-KV-only to avoid exposing
      metadata/IPs publicly — note the decision in Progress Log.

**Acceptance criteria**
- [ ] Locally, each failure path produces exactly one audit event with the right `result`.
- [ ] Success and conflict events unchanged.
- [ ] No failure path can throw out of `logAudit` into the request path.

**Verification:** `vercel dev` + curl each branch (bad payload, out-of-window, conflict, force an
error), then read the local audit list and confirm the events. Show the event dump.

**CPM:** yes, after acceptance. Branch e.g. `feat/audit-all-write-paths`. Additive/low-risk.

---

## S3 — Render: fix booking-block misalignment

**Priority:** P4 (cosmetic, but it triggered the premature refresh) · **CPM:** yes

**Objective:** Booking blocks align to their true hour rows on the FIRST paint, including the
"today" view with past-slot filtering, regardless of web-font load timing.

**Files:** `src/components/BookingBlock.jsx`, `src/components/TimeSlot.css`,
`src/components/TimeStrip.{jsx,css}`, `src/components/BookingOverlay.{jsx,css}`, `index.html`.

**Tasks**
- [ ] Pin slot geometry against font swap: `TimeSlot.css` add `flex-shrink: 0;` and a fixed
      line-height so the declared 36px holds before/after font swap. (Or switch `index.html:9`
      to `&display=optional`, or self-host fonts.)
- [ ] Remove the SLOT_HEIGHT/SLOT_GAP magic-constant duplication in `BookingBlock.jsx` (6-7):
      drive block position from a single source of truth (CSS custom props read via
      `getComputedStyle`, or move to CSS Grid `grid-row: start / span duration` and delete the
      pixel math at 84/111-112/131).
- [ ] Compute `firstVisibleHour` / past-slot clipping ONCE (in `App.jsx`/`TimeStrip`) and pass it
      into `BookingOverlay` → `BookingBlock`; delete the independent re-derivation
      (BookingBlock.jsx 71-79, 88-97) so the strip and blocks can't disagree at hour boundaries.
- [ ] (Lower priority, note only) DST label-vs-position parity in `BookingBlock.jsx` 24-28 vs 111
      — out of scope for June (winter), document for later.

**Acceptance criteria**
- [ ] First paint (hard reload, cache disabled, throttled font) renders blocks aligned to rows.
- [ ] Today view filters past slots consistently between rows and blocks.
- [ ] Multi-hour blocks (e.g. Joel 1-4PM) span the correct rows.

**Verification:** Local, DevTools "disable cache" + slow network to force the font-swap window;
screenshot before/after. Compare against the (correct) refreshed-state screenshots from the
incident.

**CPM:** yes, after acceptance. Branch e.g. `fix/booking-block-alignment`.

---

## S4 — Server: make the rate limiter atomic (stretch)

**Priority:** P5 (latent bug; also a possible 429 trigger source) · **CPM:** hold

**Objective:** Replace the non-atomic `kv.get`→mutate→`kv.set` rate limiter (security.js:74-84)
with an atomic fixed-window counter (Redis `INCR` + `EXPIRE`, or a small Lua EVAL), so concurrent
requests from one IP can't lose increments and 429s are deterministic.

**Tasks**
- [ ] Implement atomic INCR/EXPIRE (or Lua) fixed-window limiter.
- [ ] Preserve current limits/window; confirm `RATE_LIMIT` constants unchanged.
- [ ] Ensure it composes with S2's 429 audit.

**Acceptance criteria**
- [ ] Concurrent burst from one IP is counted exactly; limit enforced deterministically.
- [ ] No change to normal single-user behaviour.

**Verification:** Local concurrency test against the limiter.

**CPM:** hold — commit on branch, review diff together before merge (touches a shared security
path used by all instances).

---

## S5 — Production rollout + live verification

**Priority:** P1 (the fix only matters once it's live on `insight`) · **CPM:** no (deploy step)

**Objective:** Get S1+S2 (and S3) onto all live instances safely, `insight` last, and verify the
data-loss path is closed in production.

**Tasks**
- [ ] Confirm HOW instances receive code: are the 3 instances (insight, eclipse,
      bmo-financial-solutions) separate Vercel projects auto-deploying from `main`, or do they
      need manual redeploy? (Last session used `vercel redeploy <id>` because `vercel --prod`
      fails from this iCloud folder.) Record the answer.
- [ ] Roll out in canary order: **eclipse → bmo-financial-solutions → insight** (insight last).
- [ ] After each: smoke test a far-future slot (create → refresh → still there; force a failure →
      notice shown, slot rolls back). Confirm via the audit log that events now cover failures.
- [ ] Verify on `insight` specifically that a booking shown as saved survives refresh, and a
      failed save surfaces a notice.
- [ ] Update `.planning/STATE.md` / `HANDOFF.md` to reflect the shipped fix.

**Acceptance criteria**
- [ ] All three instances on the new build.
- [ ] Live create + refresh persists; live failure shows a notice (no silent vanish).
- [ ] Audit log shows reject/error events on failure paths in production.

**CPM:** no — this is deploy + ops, not a merge. (The merges happen in S1/S2/S3.)

---

## Rollout & deploy notes (important)

- **CPM (merge to `main`) ≠ live on `insight`.** The instances are provisioned by the admin app
  from this template; merging code does not necessarily redeploy them. S5 handles the actual
  rollout. Do not tell anyone "it's fixed" until S5 verifies `insight`.
- **`vercel --prod` fails from this repo** (iCloud Drive chokes the CLI uploader). Use
  `vercel redeploy <deployment-id>` from a prior deployment, per the durable-storage rollout.
- **Canary order is `insight` LAST** every time (eclipse → bmo → insight).
- **Read-only KV forensics** are safe and useful (audit log + day hashes). Never write/delete
  production keys outside a reviewed migration script.
- The shared KV creds live in `.env.local` (all three tenants). Treat as secret.

---

## Progress Log

> Append a dated entry per session. Format:
> `### YYYY-MM-DD HH:MM — Sxx — <session id>` then bullets: what changed, verification result, CPM done?

### 2026-06-18 — Plan created
- Forensic investigation complete (read-only). Root causes identified and split into slices S0-S5.
- No code changed yet. No production data touched.
- Next: execute S0 (time-sensitive) and/or S1 in fresh sessions.
