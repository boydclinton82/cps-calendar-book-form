# Date-key timezone fix (off-by-one day)

**Date:** 2026-06-19
**Status:** Fixed and deployed to all live instances (PR #10)
**Severity:** High — bookings displayed and could be written under the wrong day for ~10h of every day.

## Symptom
x3
Bookings rendered **one calendar day ahead** of where they belonged. On the morning of
Fri 19 Jun 2026 the Insight instance showed:
x3
- The screen labelled **"Friday June 19"** displayed bookings that were actually for **Thursday June 18**.
- The screen labelled **"Saturday June 20"** displayed Joel's bookings that were actually for **Friday June 19**.

Confirmed against live KV: data stored under key `2026-06-18` rendered on the "Friday 19"
column; data under `2026-06-19` rendered on the "Saturday 20" column. Every booking displayed
+1 day from its stored key.

## Root cause

`src/utils/time.js` — `formatDate()` built the day key from `date.toISOString().split('T')[0]`,
which returns the **UTC** calendar date. Every date *label* in the app is rendered in **local**
time (`toLocaleDateString`, `getDate`). The contractors are in Queensland (**UTC+10, no DST**).

For the first 10 hours of every day (00:00–09:59 Brisbane), the UTC date is still *yesterday*:

```
Fri 19 Jun 09:53 Brisbane  ==  Thu 18 Jun 23:53 UTC
formatDate(now) -> "2026-06-18"   (UTC date, the key used to fetch/store)
header label    -> "Friday, June 19"  (local date)
```

So the key and the label disagreed by a day. Because `currentDate` is seeded as `new Date()`
(App.jsx) and navigation preserves the time-of-day, the skew persisted for the whole session
whenever the page was loaded before 10:00 Brisbane.

### Why it was intermittent (and survived earlier fixes)

The bug has a hard daily cliff at **10:00 Brisbane = 00:00 UTC**:

- Page loaded **before 10:00 Brisbane** → UTC date lags local by one → everything +1 day.
- Page loaded **at/after 10:00 Brisbane** → UTC date == local date → correct.

The recent race / UI / disappearance work all happened in the afternoon (e.g. the June-18
snapshot was taken 14:16 Brisbane), so the skew was invisible and never got caught. It also
means morning *writes* could land on the wrong key, so it was a latent data-integrity risk,
not only cosmetic.

## Fix

Make `formatDate()` use the local calendar date so the key matches every label:

```js
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

Reads, writes, `isToday`, Book Now, and the day/week keys all funnel through this one function,
so the single change realigns the whole app. The server (`api/_lib/bookings-range.js`
`enumerateDates`) does pure string-date arithmetic and needs no change.

**No data migration needed:** live storage was already correct (keys held the right calendar
dates); only the read/render was shifted. Fixing the key generation realigned the display.

## Verification

- `src/utils/time.test.js` (added): pins the morning-Brisbane scenario, 4/4 pass under
  `TZ=Australia/Brisbane`.
- `src/hooks/reconcile.test.js`: 9/9 pass (no regression).
- `npm run build`: clean.
- Live snapshot of all three instances (`insight`, `eclipse`, `bmo-financial-solutions`)
  confirmed keys were correct calendar dates before and after.
- Post-deploy: the "Friday June 19" view correctly showed Joel's Friday bookings.

**The real regression test is a load before 10:00 Brisbane** — that is the only window the bug
ever appeared in.

## Guardrail

Do **not** reintroduce `toISOString()` (or any UTC-based formatting) for date *keys*. Any
timezone ahead of UTC will desync the key from the local label. Timestamps are fine in UTC;
calendar-day keys must be local.

## Related work in the same session

- **ESLint flat config (PR #11):** the repo had a `lint` script but no `eslint.config.js`, so
  `npm run lint` failed outright under ESLint 9 (no working lint gate). Added flat config, cleared
  all 7 errors by removing dead code. Now 0 errors.
- **DST label-vs-row "skew" — dismissed as a non-bug.** A prior note in
  `BOOKING-DISAPPEARANCE-FIX-PLAN.md` claimed the NSW-DST `+1h` shift moved the booking block
  label but not its rows. It does not: `TimeSlot.jsx:17` shifts the row labels by the same
  offset, so label and row stay aligned. No fix required. See that file for the full correction.
