// Run with: TZ=Australia/Brisbane node --test src/utils/time.test.js
// These assertions only hold in a UTC+10 (QLD/AEST) timezone, which is where
// the bug lived. Run under TZ=Australia/Brisbane.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, isToday } from './time.js';

test('formatDate returns the LOCAL calendar date, not the UTC date', () => {
  // Fri 19 Jun 2026 09:53 Brisbane === Thu 18 Jun 2026 23:53 UTC.
  // The old toISOString()-based code returned "2026-06-18" here (the bug).
  const morning = new Date('2026-06-18T23:53:00Z');
  assert.equal(formatDate(morning), '2026-06-19');
});

test('formatDate is stable across the 10am Brisbane / 00:00 UTC boundary', () => {
  const before10am = new Date('2026-06-18T23:00:00Z'); // 09:00 Brisbane Fri 19
  const after10am = new Date('2026-06-19T01:00:00Z');  // 11:00 Brisbane Fri 19
  assert.equal(formatDate(before10am), '2026-06-19');
  assert.equal(formatDate(after10am), '2026-06-19');
});

test('formatDate zero-pads month and day', () => {
  const d = new Date('2026-03-05T12:00:00Z'); // 22:00 Brisbane, same day
  assert.equal(formatDate(d), '2026-03-05');
});

test('isToday agrees with formatDate of now', () => {
  const now = new Date();
  assert.equal(isToday(now), true);
});
