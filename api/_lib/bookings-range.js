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
