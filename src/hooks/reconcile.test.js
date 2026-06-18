// Run with: node --test src/hooks/reconcile.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileSnapshot } from './reconcile.js';

const PK = '2026-06-18|13:00';
const joel = { user: 'Joel', duration: 3 };

test('pending create absent from snapshot: re-applied, NOT confirmed', () => {
  // The exact incident: server snapshot does not yet contain the booking. It
  // must stay on screen and remain pending (not dropped) so it survives the poll.
  const { merged, confirmed } = reconcileSnapshot({}, [[PK, joel]]);
  assert.deepEqual(merged, { '2026-06-18': { '13:00': joel } });
  assert.deepEqual(confirmed, []);
});

test('pending create present in snapshot: confirmed and retired', () => {
  const data = { '2026-06-18': { '13:00': joel } };
  const { merged, confirmed } = reconcileSnapshot(data, [[PK, joel]]);
  assert.deepEqual(merged, data);
  assert.deepEqual(confirmed, [PK]);
});

test('snapshot has slot with a DIFFERENT value: not confirmed, optimistic enforced', () => {
  const data = { '2026-06-18': { '13:00': { user: 'Adam', duration: 1 } } };
  const { merged, confirmed } = reconcileSnapshot(data, [[PK, joel]]);
  assert.deepEqual(merged, { '2026-06-18': { '13:00': joel } });
  assert.deepEqual(confirmed, []);
});

test('pending delete while snapshot still has the slot: enforced, not confirmed', () => {
  const data = { '2026-06-18': { '13:00': joel } };
  const { merged, confirmed } = reconcileSnapshot(data, [[PK, null]]);
  assert.deepEqual(merged, {}); // slot removed, empty date pruned
  assert.deepEqual(confirmed, []);
});

test('pending delete once snapshot no longer has the slot: confirmed', () => {
  const { merged, confirmed } = reconcileSnapshot({}, [[PK, null]]);
  assert.deepEqual(merged, {});
  assert.deepEqual(confirmed, [PK]);
});

test('other users\' bookings in the snapshot are preserved', () => {
  const data = { '2026-06-18': { '12:00': { user: 'Adam', duration: 1 } } };
  const { merged, confirmed } = reconcileSnapshot(data, [[PK, joel]]);
  assert.deepEqual(merged, {
    '2026-06-18': { '12:00': { user: 'Adam', duration: 1 }, '13:00': joel },
  });
  assert.deepEqual(confirmed, []);
});

test('does not mutate the input snapshot', () => {
  const data = { '2026-06-18': { '12:00': { user: 'Adam', duration: 1 } } };
  const snapshot = JSON.parse(JSON.stringify(data));
  reconcileSnapshot(data, [[PK, joel]]);
  assert.deepEqual(data, snapshot);
});

test('null / non-object snapshot is treated as empty', () => {
  assert.deepEqual(reconcileSnapshot(null, [[PK, joel]]).merged, {
    '2026-06-18': { '13:00': joel },
  });
  assert.deepEqual(reconcileSnapshot(undefined, []).merged, {});
});

test('mixed: one confirmed create + one still-pending delete in one pass', () => {
  const other = '2026-06-18|16:00';
  const sixteen = { user: 'Joel', duration: 1 };
  const data = { '2026-06-18': { '13:00': joel, '16:00': sixteen } };
  const { merged, confirmed } = reconcileSnapshot(data, [
    [PK, joel], // confirmed (present)
    [other, null], // pending delete, still present -> enforced
  ]);
  assert.deepEqual(merged, { '2026-06-18': { '13:00': joel } });
  assert.deepEqual(confirmed, [PK]);
});
