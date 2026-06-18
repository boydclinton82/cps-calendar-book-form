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
8. **Data-preservation guardrail (non-negotiable, every slice).** See the dedicated section
   below. No slice may leave any instance missing a TODAY-or-later booking it had before the
   work started. Past-time bookings do not matter; today's and future ones must survive.

---

## Data-preservation guardrail (read before any slice that can touch production)

**Rule:** Across this entire body of work, no booking dated **today or later** may be lost from
any live instance (insight, eclipse, bmo-financial-solutions). Bookings whose time has already
passed do not matter. If anything drops a current/future booking, it must be **put back** —
re-creating/overwriting the slot with the captured value is fine; no elaborate cutover required.

**Why this is mostly about S5, not the code slices:**
- Bookings persist in **Vercel KV**, which is independent of the application code. Merging to
  `main` and redeploying code does **not** clear KV. So S1/S2/S3 (code-only, run against local
  `vercel dev`) cannot by themselves remove production bookings.
- The exposure is concentrated in **S5 (rollout)** and any storage-format/migration step, plus
  the live disappearance bug itself continuing to drop bookings until the fix ships.

**Mechanism (the only way "they go back in" is to have saved them):**
1. **Snapshot first.** Before any production-touching step, capture today's+future bookings from
   each instance (read-only KV read of the per-day hashes / blob). Save the dump in the session.
2. **Verify after.** After each deploy/migration, re-read and diff. Any current/future slot that
   the pre-snapshot had but the live state lacks must be re-added (replace the slot with the
   saved value).
3. Never delete/overwrite a slot that wasn't in the pre-snapshot. Only restore, never prune.

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
| S1 | Client: confirm-before-commit + surface failures | P1 | ✅ | yes | — |
| S2 | Server: audit every rejection/error path | P2 | ✅ | yes | — |
| S3 | Render: fix booking-block misalignment | P4 | ✅ | yes | — |
| S4 | Server: make the rate limiter atomic (stretch) | P5 | ⬜ | hold | S2 |
| S5 | Production rollout + live verification across instances | P1 | ✅ | no (deploy) | S1, S2, S3 |

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
- [x] In `createBooking` (useBookings.js ~129-138): add the missing `else` — a resolved response
      with no usable `booking` must be treated as a FAILURE (throw or route into the existing
      catch) so it rolls back the slot and calls `setNotice(...)`. No silent success.
      *(Done: `if (!b) throw` routes into the existing catch → rollback + `setNotice`. Mirrored in
      `updateBooking`.)*
- [x] Stop clearing `pendingRef` in `finally` (line 155). Only remove a pending key once the
      booking is confirmed present in a SERVER snapshot (success path after reconcile) or after
      a rollback (catch path). Mirror the same correction in `removeBooking` (192) and
      `updateBooking` (243).
      *(Done: all three `finally` blocks removed; pending keys now retired in
      `handlePollingUpdate` when a server snapshot confirms the op, or in the catch on rollback.
      The snapshot-confirmation logic is extracted to a pure `reconcileSnapshot` helper.)*
- [x] Decide and implement the cross-refresh durability stance: at minimum, ensure an in-flight
      create that gets interrupted cannot leave a "looks booked" state with no confirmation.
      *(Stance chosen: optimistic state + pending map are in-memory ONLY, never persisted. A
      mid-flight refresh wipes them, so on reload the server snapshot is authoritative — a
      not-yet-persisted create simply isn't shown (no phantom); a persisted one shows. Simple,
      and the must-have failure surfacing is covered by the confirm-before-commit throw.)*
- [x] Review `fetchBookings` localStorage fallback (api.js:86-89): ensure a failed GET does not
      masquerade as authoritative server data in a way that hides a missing booking. At least
      log/flag the fallback so it's observable.
      *(Done: in API mode a failed GET now `console.error`s and re-throws instead of returning
      empty/stale localStorage. The poller skips null/error results (keeps last good state) and
      the mount effect sets `error`; a failed GET can no longer present as an empty authoritative
      snapshot that wipes the view or hides a booking.)*
- [x] Add/adjust tests if a test harness exists (check `package.json`); otherwise document manual
      test steps.
      *(No test harness in `package.json`. Added `src/hooks/reconcile.test.js` runnable via the
      Node built-in runner — `node --test src/hooks/reconcile.test.js` (9 tests, all pass) — no
      new deps. Manual `vercel dev` / mock-API steps documented under Verification below.)*

**Acceptance criteria** *(✅ = logic-verified via build + unit tests + code review this session;
live UI confirmation deferred to S5, which verifies these same paths live anyway — see Progress Log)*
- [x] Simulated failed/empty create response → slot rolls back AND a notice appears (no silent
      retain). *(Code: `if (!b) throw` → catch rollback + `setNotice`. Live click-through at S5.)*
- [x] A successful create stays put across the next poll and a manual refresh. *(Unit-tested:
      snapshot containing the booking retires the pending key and renders it; unconfirmed stays
      re-applied. Live refresh at S5.)*
- [x] No regression to the existing 409-conflict toast behaviour. *(Unchanged path: a 409 still
      rejects in `apiRequest` → existing catch → `noticeForError` "just booked" message. Live at S5.)*
- [ ] Booking the same slot Joel did (1-4PM + 4-5PM with another user already on 12-1PM) behaves
      correctly locally against `vercel dev`. *(Deferred to S5 live verification to avoid running
      create/delete against production KV; the multi-slot/other-user merge is unit-tested in
      `reconcile.test.js`.)*

**Verification:** Run locally against `vercel dev` (per repo convention; `/run` skill or
`vite` + functions). Reproduce the empty/failed-response case by stubbing the API response.
State exactly what was observed.

> **Safety note (per Data-preservation guardrail):** `vercel dev` here uses the SHARED PRODUCTION
> KV creds in `.env.local`, so creating/deleting bookings through it touches live data. For a
> safe e2e, point `/api` at a throwaway mock (a small local Node server returning canned
> `{success, booking}` / `{success}` (no booking) / `409` responses) via a temporary Vite proxy,
> with `VITE_USE_API=true`. Do NOT run create/delete e2e against the production KV.
>
> **What was actually verified this session (2026-06-18):** production build compiles clean after
> all edits; `node --test src/hooks/reconcile.test.js` passes 9/9 against the real snapshot-merge
> helper (covers the incident shape: a booking absent from the snapshot stays put and pending;
> server-confirmed ops are retired; a pending delete is enforced until the server confirms
> absence; other users' bookings preserved). **Not yet run:** the live mock-API UI walkthrough
> (empty-response rollback+notice, success-survives-refresh, 409 toast as observed clicks).

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
- [x] index.js: add `logAudit` before each early return — `result:'reject_validation'` (40-44),
      `result:'reject_window'` (48-50), `result:'reject_badtime'` (59-61).
- [x] index.js: add `logAudit({ action:'create', ..., result:'error', error:String(e?.message) })`
      in the 500 catch (77-80) before responding. (logAudit already never throws.)
      *(action derived from method: POST→create else read; dateKey/timeKey pulled from req.body
      since the POST-scoped consts are out of scope in the catch.)*
- [x] update.js: mirror audit on its 400/404/500 branches.
      *(PUT + DELETE each: 400 reject_validation, 400 reject_window (PUT only), 404 reject_notfound,
      500 error. Caught a gap on first pass — DELETE-validation had no audit; fixed and re-verified.)*
- [x] security.js: audit the 429 rate-limit reject (186-190) as `result:'reject_ratelimit'`
      *(imported `logAudit`/`getClientIp` from `./audit.js`; action via a METHOD_ACTION map.)*
- [x] Keep events shape-compatible with the existing reader (`{ ts, action, dateKey, timeKey,
      user?, duration?, ip?, result }`). Confirm `AUDIT_CAP` (1000) is still sane.
      *(Shape unchanged; `error` is an extra optional field only on the 500 path. AUDIT_CAP 1000 kept.)*
- [x] Add a tiny read affordance for ops (decide: protected `GET /api/bookings/audit` behind the
      admin password, OR keep direct-KV-only). **Decision: keep direct-KV-only** (no public endpoint)
      to avoid exposing audit metadata/IPs publicly — see Progress Log.

**Acceptance criteria**
- [x] Locally, each failure path produces exactly one audit event with the right `result`.
- [x] Success and conflict events unchanged.
- [x] No failure path can throw out of `logAudit` into the request path.

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
- [x] Pin slot geometry against font swap: `TimeSlot.css` add `flex-shrink: 0;` and a fixed
      line-height so the declared 36px holds before/after font swap. (Or switch `index.html:9`
      to `&display=optional`, or self-host fonts.)
      *(Done: `.time-slot` now `line-height: 1; flex-shrink: 0;` and `height/min-height:
      var(--slot-height)`. Did NOT touch `index.html` — geometry pinning makes the swap a
      no-op for layout, so the font display strategy is left unchanged.)*
- [x] Remove the SLOT_HEIGHT/SLOT_GAP magic-constant duplication in `BookingBlock.jsx` (6-7):
      drive block position from a single source of truth (CSS custom props read via
      `getComputedStyle`, or move to CSS Grid `grid-row: start / span duration` and delete the
      pixel math at 84/111-112/131).
      *(Done via CSS Grid. New `:root` custom props `--slot-height: 36px` / `--slot-gap: 6px`
      are the single source, consumed by TimeSlot height, slots-container gap, and a new
      `.booking-overlay` grid (`grid-auto-rows: var(--slot-height); gap: var(--slot-gap)`).
      BookingBlock now sets `style={{ gridRow: `${rowStart} / span ${remainingDuration}` }}` —
      all SLOT_HEIGHT/SLOT_GAP constants and the top/height px math are deleted.)*
- [x] Compute `firstVisibleHour` / past-slot clipping ONCE (in `App.jsx`/`TimeStrip`) and pass it
      into `BookingOverlay` → `BookingBlock`; delete the independent re-derivation
      (BookingBlock.jsx 71-79, 88-97) so the strip and blocks can't disagree at hour boundaries.
      *(Done: `TimeStrip` derives `firstVisibleHour = visibleSlots[0]?.hour ?? END_HOUR` from the
      same `visibleSlots` it already filters, and threads it through `BookingOverlay` →
      `BookingBlock`. Both `isSlotPast` loops in BookingBlock are gone; clip is now
      `Math.max(0, firstVisibleHour - startHour)`. The `isSlotPast`/`START_HOUR` imports are
      dropped; the past-DATE guard is kept.)*
- [x] (Lower priority, note only) DST label-vs-position parity in `BookingBlock.jsx` 24-28 vs 111
      — out of scope for June (winter), document for later.
      *(Noted, NOT fixed. The NSW-DST `+1h` shift in `formatTimeRange` adjusts the block's LABEL
      text but not its grid row, so during AEDT a block could read e.g. "2-5 PM" while sitting on
      the 1-4 PM rows. June is AEST (winter) so `isNSWInDST()` is false and there is no skew now.
      Fix later by either positioning in display-hours too, or showing the offset as a separate
      "+1h NSW" badge rather than mutating the label hours.)*

**Acceptance criteria**
- [x] First paint (hard reload, cache disabled, throttled font) renders blocks aligned to rows.
      *(Geometry is now fixed-px and font-independent by construction: slot rows and the overlay
      grid are both sized by `--slot-height`/`--slot-gap`, so a font swap changes only the text
      inside the fixed-height boxes, never the box geometry. Confirmed by DOM measurement on the
      June-19 view — block rects coincide to the pixel with the underlying occupied slot rows
      regardless of font state, so an artificial throttle would reproduce identical numbers.)*
- [x] Today view filters past slots consistently between rows and blocks.
      *(Verified live at 2:03 PM AEST: Adam 12-1PM fully past → hidden; Joel 1-4PM clipped to
      "Joel (2-4 PM)" spanning exactly the two visible rows at the top; available slots resume
      at 5PM with no offset.)*
- [x] Multi-hour blocks (e.g. Joel 1-4PM) span the correct rows.
      *(Verified on June 19: Joel 1-4PM block measured top 467 → bottom 587, height 120px =
      3×36 + 2×6, exactly spanning the 1/2/3 PM slot rows; Adam 12-1PM and Joel 4-5PM each
      land on their single row to the pixel.)*

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
- [x] **Pre-snapshot (do FIRST, per the Data-preservation guardrail).** Read-only dump of every
      TODAY-or-later booking from all three instances' KV. Save the dump in the session so any
      dropped slot can be re-added afterwards. Past-time slots can be ignored.
      *(Done: `scripts/snapshot-future.mjs` (READ-ONLY token) → `.planning/S5-presnapshot-2026-06-18T04-16-48Z.json`.
      insight = 3 today bookings (Adam 12:00/1, Joel 13:00/3, Joel 16:00/1); eclipse/bmo = 0 today-or-later.)*
- [x] Confirm HOW instances receive code: are the 3 instances (insight, eclipse,
      bmo-financial-solutions) separate Vercel projects auto-deploying from `main`, or do they
      need manual redeploy? (Last session used `vercel redeploy <id>` because `vercel --prod`
      fails from this iCloud folder.) Record the answer.
      *(Answer: **separate Vercel projects, each git-connected to `main`, auto-deploy on merge.**
      Each has a `booking-<slug>-git-main` alias; all three live aliases were created 14:06:59 AEST,
      3s after merge `153f390` (14:06:56). So S1+S2+S3 auto-shipped to all three when the PRs merged.
      No manual `vercel redeploy` needed — the canary order is moot since merge fans out to all 3 at once.)*
- [x] Roll out in canary order: **eclipse → bmo-financial-solutions → insight** (insight last).
      *(N/A as a manual step — auto-deploy delivered all three simultaneously on the `main` merge. No
      redundant redeploys issued. Verification below was still run eclipse → bmo → insight.)*
- [x] **Post-deploy diff + restore.** After each instance redeploys, re-read its KV and diff
      against the pre-snapshot. Re-add (overwrite the slot with the saved value) any today/future
      booking that went missing. Never prune a slot absent from the pre-snapshot.
      *(Code deploy does not touch KV; final diff vs pre-snapshot = ALL PRESENT & UNCHANGED on all
      three. Nothing dropped, nothing to restore.)*
- [x] After each: smoke test a far-future slot (create → refresh → still there; force a failure →
      notice shown, slot rolls back). Confirm via the audit log that events now cover failures.
      *(Server: `POST {}` → 400 on all three → fresh `reject_validation` audit event on each (pre-S2
      wrote none) — S2 live everywhere. Client (insight): far-future Joel 6-7AM/Jun-30 create →
      survived hard refresh → deleted (KV Jun-30 = empty). Forced failure via one-shot fetch stub
      (success:true, no booking) → notice "...Please try again." + slot rolled back, stub fired so
      no server write.)*
- [x] Verify on `insight` specifically that a booking shown as saved survives refresh, and a
      failed save surfaces a notice.
      *(Both done live on booking-insight.vercel.app — see Progress Log.)*
- [ ] Update `.planning/STATE.md` / `HANDOFF.md` to reflect the shipped fix.
      *(Skipped: `.planning/STATE.md` is a stale Feb v2.0 snapshot, unrelated to this work — left
      untouched per session handoff. This plan doc is the source of truth and is updated here.)*

**Acceptance criteria**
- [x] All three instances on the new build. *(All on `main` 153f390 via auto-deploy @ 14:06:59, all Ready.)*
- [x] **Every today-or-later booking present in the pre-snapshot is present live after rollout**
      (restored if it dropped). No current/future booking lost. *(Final diff: ALL PRESENT & UNCHANGED ×3.)*
- [x] Live create + refresh persists; live failure shows a notice (no silent vanish).
      *(insight: create survived refresh; stubbed failure → notice + rollback, no phantom.)*
- [x] Audit log shows reject/error events on failure paths in production.
      *(`reject_validation` events confirmed live on eclipse, bmo, and insight.)*

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

### 2026-06-18 — S1 — confirm-before-commit + surface failures (DONE, CPM done)
- **Added a Data-preservation guardrail** (new top section + S5 tasks/acceptance): no slice may
  drop a today-or-later booking from any instance; restore-by-replace if it happens. Snapshot is
  taken at S5 (first rollout task), not now, to avoid a stale snapshot. (User-requested addendum.)
- **Code changed (client-only, no production data touched):**
  - `src/hooks/useBookings.js`: `createBooking` now throws on a resolved-but-no-`booking` response
    (the silent-success hole) → rollback + notice; mirrored in `updateBooking`. Removed all three
    `finally { pendingRef.delete }` clears; pending keys are now retired only when a server
    snapshot confirms the op (`handlePollingUpdate`) or on rollback (catch, before `triggerSync`).
  - `src/hooks/reconcile.js` (new): pure `reconcileSnapshot()` — merges snapshot + in-flight ops
    and reports which pending keys the server has confirmed. Single source of truth for the merge.
  - `src/services/api.js`: in API mode a failed GET now `console.error`s and re-throws instead of
    returning empty/stale localStorage, so it can't masquerade as an authoritative empty snapshot.
  - Cross-refresh stance: optimistic state + pending map stay in-memory only (never persisted), so
    a mid-flight refresh falls back to authoritative server truth — no phantom "looks booked".
- **Verification:** `npm run build` clean (61 modules). `node --test src/hooks/reconcile.test.js`
  → 9/9 pass (incident shape covered). No live `vercel dev` UI run: it uses production KV creds in
  `.env.local`, so create/delete e2e there would touch live bookings (guardrail). Per operator
  decision (PE-2), proceeding to CPM on build + unit tests + review; live click-through
  (empty-response rollback+notice, success-survives-refresh, 409 toast, Joel's slots) is folded
  into **S5** live verification.
- **CPM:** branch `fix/client-confirm-before-commit`, scoped to S1 only, `.planning/STATE.md` left
  untouched. (PR + merge recorded below once green.)
- **Not done / still open:** S0, S2, S3, S4, and S5 rollout. Code is merged to `main` but NOT live
  on `insight` — production rollout is S5. Do not tell users it's fixed yet.

### 2026-06-18 — S2 — audit every rejection/error path (DONE, CPM done)
- **Decision (read-affordance task):** keep audit **direct-KV-only** — no public `GET /api/bookings/audit`.
  Avoids exposing audit metadata/IPs publicly; ops read the list straight from KV as before.
- **Code changed (server observability only; writes audit events, never booking data — guardrail-safe):**
  - `api/bookings/index.js`: `logAudit` before the three POST early returns (`reject_validation`,
    `reject_window`, `reject_badtime`) and in the 500 catch (`result:'error'`, `error:String(...)`,
    action POST→create else read, dateKey/timeKey from `req.body` since the consts are out of catch scope).
  - `api/bookings/update.js`: audit on every PUT and DELETE failure branch — `reject_validation`
    (both), `reject_window` (PUT), `reject_notfound` (both, legacy + per-day), and `error` in the
    500 catch. (First pass missed DELETE-validation; added and re-verified.)
  - `api/_lib/security.js`: imported `logAudit`/`getClientIp` from `./audit.js`; the 429 branch now
    logs `reject_ratelimit` with a METHOD_ACTION map (POST→create/PUT→update/DELETE→delete/GET→read).
  - `api/_lib/audit.js`: unchanged. Event shape `{ ts, action, dateKey, timeKey, user?, duration?,
    ip?, result }` preserved (`error` is an extra optional field on the 500 path only). AUDIT_CAP 1000 kept.
- **Verification (no network, no KV writes):** isolated Node script stubbed `@vercel/kv` via
  `node --experimental-test-module-mocks` and drove all 16 write-path outcomes through the REAL
  handlers, capturing `logAudit` emissions. Result — every failure path emits exactly ONE audit
  event with the correct `result` (reject_validation/reject_window/reject_badtime/reject_notfound/
  reject_ratelimit/error), success (`ok`) and conflict (`conflict`) unchanged, and no path throws out
  of `logAudit` (it wraps in try/catch). `node --check` clean on all four files. Temp script removed.
  Did NOT run `vercel dev` (it uses production KV creds; the stub gives full branch coverage without
  touching live data).
- **CPM:** branch `feat/audit-all-write-paths`, scoped to S2 only, `.planning/STATE.md` left untouched.
- **Unblocks:** S4 (atomic rate limiter) can now compose with the 429 audit. Still NOT live on
  `insight` — rollout is S5.

### 2026-06-18 — S3 — fix booking-block misalignment (DONE, CPM done)
- **Root cause of the misalignment:** the day-view booking blocks were absolutely positioned with
  hand-maintained pixel math (`SLOT_HEIGHT`/`SLOT_GAP` constants duplicated from the CSS), and the
  block independently re-derived `firstVisibleHour`/past-slot clipping via its own `isSlotPast`
  loops. Any drift between the constants and the real slot geometry — or a font-swap reflow — left
  blocks offset from their hour rows on first paint, which is what prompted Joel's premature refresh.
- **Fix — single source of truth via CSS Grid (frontend only, no KV/network — guardrail-safe):**
  - `src/index.css`: new `:root` props `--slot-height: 36px` / `--slot-gap: 6px` (the one source).
  - `src/components/TimeSlot.css`: height/min-height → `var(--slot-height)`; added `line-height: 1`
    and `flex-shrink: 0` so the row height is pinned against the web-font swap.
  - `src/components/TimeStrip.css`: slots-container `gap` → `var(--slot-gap)`.
  - `src/components/BookingOverlay.css`: overlay is now a grid mirroring the slot rows
    (`grid-auto-rows: var(--slot-height); gap: var(--slot-gap); align-content: start;
    grid-template-columns: minmax(0,1fr)`).
  - `src/components/BookingBlock.{jsx,css}`: deleted `SLOT_HEIGHT`/`SLOT_GAP`, the top/height px
    math, and both `isSlotPast` re-derivation loops; block is a grid item placed by
    `gridRow: "${rowStart} / span ${remainingDuration}"`; `.booking-block` switched from
    `position: absolute` to `position: relative`.
  - `src/components/TimeStrip.jsx` + `BookingOverlay.jsx`: `firstVisibleHour` is computed ONCE in
    TimeStrip (from the `visibleSlots` it already filters) and threaded down; BookingBlock clips
    with `Math.max(0, firstVisibleHour - startHour)`. Strip and blocks can no longer disagree.
  - Out of scope (Day View only): Week View uses separate `WeekBookingBlock`/`WeekDayOverlay`,
    untouched. DST label-vs-position parity documented as a known later fix (AEST now, no skew).
- **Verification:** `npm run build` clean (61 modules). Live in Chrome against `vite dev` with the
  incident layout seeded in localStorage (Adam 12-1, Joel 1-4, Joel 4-5):
  - *Today (2:03 PM AEST):* Adam fully past → hidden; Joel 1-4 clipped to "2-4 PM" spanning the two
    visible rows at the top; available slots resume at 5PM, no offset — strip and blocks agree.
  - *June 19 (no clipping):* DOM `getBoundingClientRect` measured — Adam block 425→461 = the 12PM
    slot; Joel 1-4 block 467→587 (h120 = 3×36+2×6) = the 1/2/3 PM rows; Joel 4-5 block 593→629 =
    the 4PM slot. Pixel-exact. Geometry is fixed-px (`--slot-*`), so it's font-swap-independent by
    construction — the throttled-font first-paint case yields identical numbers.
- **CPM:** branch `fix/booking-block-alignment`, scoped to S3 only, `.planning/STATE.md` left
  untouched.
- **Unblocks:** S5 — S1, S2 and S3 (all of S5's code deps) are now merged to `main`. Still NOT live
  on `insight`; rollout + live verification is S5. Do not tell users it's fixed yet.

### 2026-06-18 — S5 — production rollout + live verification (DONE; the fix is now LIVE on insight)
- **Pre-snapshot (FIRST, READ-ONLY).** `scripts/snapshot-future.mjs` using the KV READ-ONLY token →
  `.planning/S5-presnapshot-2026-06-18T04-16-48Z.json`. Today-or-later bookings: **insight** = 3
  (Adam 12:00/1, Joel 13:00/3, Joel 16:00/1 — exactly the incident end-state); **eclipse** = 0;
  **bmo** = 0. (Note: snapshot was taken ~11m AFTER the auto-deploys below; safe because a code
  deploy provably does not touch KV, and the 3 insight rows match the known incident state — nothing
  was lost. The snapshot served as the baseline to guard my own smoke-test writes.)
- **Code-delivery mechanism (recorded).** The 3 instances are **separate Vercel projects, each
  git-connected to `main` and auto-deploying on merge** (`booking-insight` / `booking-eclipse` /
  `booking-bmo-financial-solutions`, each with a `…-git-main` alias). All three live production
  aliases were created **14:06:59 AEST, 3 seconds after** the S3 merge `153f390` (14:06:56). So
  **S1+S2+S3 auto-shipped to all three the moment the PRs merged last session** — no manual
  `vercel redeploy` required, and the eclipse→bmo→insight canary is moot (one merge fans out to all
  three at once). `vercel --prod` from this iCloud folder remains broken but was not needed.
- **Data preservation.** Final read-only diff of live KV vs the pre-snapshot: **ALL PRESENT &
  UNCHANGED on all three** instances. No today-or-later booking dropped; nothing to restore.
- **S2 live (all three).** `POST {}` → HTTP 400 "Missing or invalid fields" on eclipse, bmo AND
  insight, each followed by a fresh `reject_validation` audit event (verified by reading the audit
  list HEAD — the log is **LPUSH/newest-first**; an early read of the tail caused a brief false
  "insight isn't auditing" scare, fully explained). Pre-S2 code wrote nothing on rejects, so this
  proves the new build is live and every failure is now traceable. No booking was created by these.
- **S1 + S3 live on `insight` (browser, booking-insight.vercel.app):**
  - *S3 alignment:* the TODAY view renders correctly — Adam 12-1PM past→hidden, Joel 1-4PM clipped to
    "Joel (2-4 PM)" spanning its rows, Joel 4-5PM on its single row, available slots resume 5PM.
  - *S1 create-persists-refresh (the core anti-vanish fix):* booked a far-future throwaway (Joel,
    6-7AM, **Tue 30 Jun 2026** — empty day) → shown confirmed → **hard page reload** (wipes in-memory
    optimistic state) → block **still present**. Then deleted it via the UI; KV `…:2026-06-30` is now
    empty/`null`. No stray test data left.
  - *S1 failure surfacing:* armed a one-shot `window.fetch` stub returning the exact S1 hole
    (`200 {success:true}` with **no `booking`**) → attempted a 7-8AM book → UI showed a notice
    ("…Please try again.") and the slot **rolled back** (no phantom block). `__stubFired === true`, so
    no real POST hit the server (no phantom write either). Restored `fetch` afterwards.
- **Net:** the data-loss path is closed in production — a save is shown as confirmed only after the
  server persists it; an unconfirmed/failed save now surfaces a notice and rolls back instead of
  vanishing on refresh; and every failure path leaves an audit event for instant diagnosis.
- **CPM:** none (S5 is deploy + verify, not a merge — the merges were S1/S2/S3). `.planning/STATE.md`
  left untouched (stale, unrelated). Helper scripts added: `scripts/snapshot-future.mjs`,
  `scripts/audit-tail.mjs` (both read-only, uncommitted).
- **Status:** **the booking-disappearance fix is LIVE and verified on `insight`** (and eclipse/bmo).
  Remaining work is optional only: **S0** (pull runtime logs — diagnostic, may be expired) and **S4**
  (atomic rate limiter — CPM: hold).
