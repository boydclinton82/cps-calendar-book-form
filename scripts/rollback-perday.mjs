import { createClient } from '@vercel/kv';

// Load .env.local (read-write KV creds) via Node's built-in loader. If it is
// absent, rely on whatever is already in the environment.
try { process.loadEnvFile('.env.local'); } catch { /* env may be set externally */ }

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
