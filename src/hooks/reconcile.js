/**
 * Pure reconciliation of a server snapshot against in-flight optimistic ops.
 *
 * This is the core of "confirm-before-commit": a just-made booking stays on the
 * booker's screen until the server SNAPSHOT durably confirms it, and only then is
 * its pending key retired. It replaces the old behaviour of clearing pending keys
 * in a `finally` block (which dropped the key before the server had persisted the
 * write, letting the booking vanish on the next poll).
 *
 * @param {Object} data    Server snapshot: { [dateKey]: { [timeKey]: { user, duration } } }
 * @param {Array<[string, (object|null)]>} pending
 *   Entries of `${date}|${time}` -> optimistic booking, or null for a pending delete.
 * @returns {{ merged: Object, confirmed: string[] }}
 *   `merged` is the view to render (snapshot with still-unconfirmed optimistic ops
 *   re-applied on top); `confirmed` is the list of pending keys the snapshot now
 *   durably reflects, so the caller can stop enforcing them.
 */
export function reconcileSnapshot(data, pending) {
  const snapshot = data && typeof data === 'object' ? data : {};

  // A pending op is confirmed when the snapshot already reflects it: a
  // create/update whose value is present, or a delete whose slot is now gone.
  const confirmed = [];
  for (const [pk, optimistic] of pending) {
    const [date, time] = pk.split('|');
    const serverVal = snapshot[date]?.[time];
    if (optimistic === null) {
      if (serverVal === undefined) confirmed.push(pk);
    } else if (
      serverVal &&
      serverVal.user === optimistic.user &&
      serverVal.duration === optimistic.duration
    ) {
      confirmed.push(pk);
    }
  }
  const confirmedSet = new Set(confirmed);

  // Re-apply only the still-unconfirmed optimistic ops on top of the snapshot so
  // an in-flight booking is never wiped before the server confirms it.
  const merged = {};
  for (const date of Object.keys(snapshot)) merged[date] = { ...snapshot[date] };
  for (const [pk, optimistic] of pending) {
    if (confirmedSet.has(pk)) continue;
    const [date, time] = pk.split('|');
    if (optimistic === null) {
      if (merged[date]) {
        delete merged[date][time];
        if (Object.keys(merged[date]).length === 0) delete merged[date];
      }
    } else {
      if (!merged[date]) merged[date] = {};
      merged[date][time] = optimistic;
    }
  }

  return { merged, confirmed };
}
