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
